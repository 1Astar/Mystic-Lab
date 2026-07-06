import { installGestureWorkerPolyfills } from './gesture-worker-polyfill.ts';

installGestureWorkerPolyfills();

import {
  FilesetResolver,
  GestureRecognizer,
  type GestureRecognizerResult,
} from '@mediapipe/tasks-vision';
import type { Landmark } from './gesture-detector.ts';

const LOCAL_WASM = `${self.location.origin}/mediapipe/wasm`;
const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const LOCAL_MODEL = `${self.location.origin}/mediapipe/gesture_recognizer.task`;
const CDN_MODEL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

type InitStage = 'wasm' | 'model' | 'recognizer';

class GestureInitError extends Error {
  stage: InitStage;
  causeDetail: string;

  constructor(stage: InitStage, causeDetail: string, cause?: unknown) {
    const prefix =
      stage === 'wasm'
        ? 'WASM 运行库加载失败'
        : stage === 'model'
          ? '手势模型文件加载失败'
          : '手势识别器创建失败';
    super(`${prefix}：${causeDetail}`);
    this.name = 'GestureInitError';
    this.stage = stage;
    this.causeDetail = causeDetail;
    if (cause instanceof Error && cause.stack) {
      this.stack = cause.stack;
    }
  }
}

async function loadWasm(base: string, label: string) {
  try {
    return await FilesetResolver.forVisionTasks(base);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new GestureInitError('wasm', `${label} (${base}) → ${msg}`, err);
  }
}

async function resolveVisionTasks() {
  try {
    return await loadWasm(LOCAL_WASM, '本地');
  } catch (localErr) {
    try {
      return await loadWasm(CDN_WASM, 'CDN 回退');
    } catch {
      throw localErr;
    }
  }
}

async function createRecognizer(vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>) {
  try {
    return await GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetPath: LOCAL_MODEL },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  } catch (localErr) {
    try {
      return await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: CDN_MODEL },
        runningMode: 'VIDEO',
        numHands: 2,
      });
    } catch (cdnErr) {
      const localMsg = localErr instanceof Error ? localErr.message : String(localErr);
      const cdnMsg = cdnErr instanceof Error ? cdnErr.message : String(cdnErr);
      throw new GestureInitError(
        'model',
        `本地模型 ${LOCAL_MODEL} → ${localMsg}；CDN 模型 → ${cdnMsg}`,
        cdnErr,
      );
    }
  }
}

export type WorkerInMessage =
  | { type: 'init' }
  | { type: 'frame'; bitmap: ImageBitmap; timestamp: number };

export type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string; stage?: 'wasm' | 'model' | 'recognizer' }
  | { type: 'result'; payload: GestureResultPayload };

export type GestureResultPayload = {
  gesture: string | null;
  confidence: number;
  handCount: number;
  landmarks: Landmark[][] | null;
};

let recognizer: GestureRecognizer | null = null;

function toLandmarks(result: GestureRecognizerResult): Landmark[][] | null {
  if (!result.landmarks?.length) return null;
  return result.landmarks.map((hand) =>
    hand.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
  );
}

function extractResult(result: GestureRecognizerResult): GestureResultPayload {
  let gesture: string | null = null;
  let confidence = 0;
  const handCount = result.landmarks?.length ?? 0;

  if (result.gestures && result.gestures.length > 0) {
    const top = result.gestures[0]?.[0];
    if (top) {
      gesture = top.categoryName;
      confidence = top.score;
    }
  }

  return {
    gesture,
    confidence,
    handCount,
    landmarks: toLandmarks(result),
  };
}

async function initRecognizer(): Promise<void> {
  const vision = await resolveVisionTasks();
  try {
    recognizer = await createRecognizer(vision);
  } catch (err) {
    if (err instanceof GestureInitError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new GestureInitError('recognizer', msg, err);
  }
}

function formatError(err: unknown): { message: string; stage?: InitStage } {
  if (err instanceof GestureInitError) {
    return { message: err.message, stage: err.stage };
  }
  const msg = err instanceof Error ? err.message : 'Gesture init failed';
  if (msg.includes('ModuleFactory not set')) {
    return {
      stage: 'wasm',
      message:
        'WASM 运行库未正确初始化（ModuleFactory not set）。通常是 Worker 环境不兼容，已尝试自动修复；若仍失败请改用触屏抽牌。',
    };
  }
  return { message: msg };
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    try {
      await initRecognizer();
      self.postMessage({ type: 'ready' } satisfies WorkerOutMessage);
    } catch (err) {
      const { message, stage } = formatError(err);
      self.postMessage({
        type: 'error',
        message,
        stage,
      } satisfies WorkerOutMessage);
    }
    return;
  }

  if (msg.type === 'frame' && recognizer) {
    try {
      const result = recognizer.recognizeForVideo(msg.bitmap, msg.timestamp);
      msg.bitmap.close();
      self.postMessage({
        type: 'result',
        payload: extractResult(result),
      } satisfies WorkerOutMessage);
    } catch (err) {
      msg.bitmap.close();
      const { message, stage } = formatError(err);
      self.postMessage({
        type: 'error',
        message,
        stage,
      } satisfies WorkerOutMessage);
    }
  }
};
