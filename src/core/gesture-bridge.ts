import type { GestureResultPayload } from './gesture-worker.ts';

export type GestureType =
  | 'Closed_Fist'
  | 'Open_Palm'
  | 'Thumb_Up'
  | 'Victory'
  | 'Pointing_Up'
  | 'ILoveYou'
  | null;

export type GestureEvent = {
  gesture: GestureType;
  recognized: GestureType | null;
  confidence: number;
  handCount: number;
  fps: number;
  landmarks: import('./gesture-detector.ts').Landmark[][] | null;
};

export type GestureBridgeOptions = {
  debounceMs?: number;
  confidenceThreshold?: number;
  targetFps?: number;
  onGesture?: (gesture: GestureType) => void;
  onFrame?: (payload: GestureResultPayload, fps: number) => void;
  onUpdate?: (event: GestureEvent) => void;
  onError?: (message: string, stage?: 'wasm' | 'model' | 'recognizer') => void;
};

export class GestureBridge {
  private worker: Worker | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
  private lastGesture: GestureType = null;
  private lastGestureTime = 0;
  private frameCount = 0;
  private lastFpsTime = 0;
  private fps = 0;
  private ready = false;
  private options: Required<GestureBridgeOptions>;

  constructor(options: GestureBridgeOptions = {}) {
    this.options = {
      debounceMs: options.debounceMs ?? 800,
      confidenceThreshold: options.confidenceThreshold ?? 0.55,
      targetFps: options.targetFps ?? 15,
      onGesture: options.onGesture ?? (() => {}),
      onFrame: options.onFrame ?? (() => {}),
      onUpdate: options.onUpdate ?? (() => {}),
      onError: options.onError ?? (() => {}),
    };
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worker = new Worker(new URL('./gesture-worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<import('./gesture-worker.ts').WorkerOutMessage>) => {
        const msg = event.data;
        if (msg.type === 'ready') {
          this.ready = true;
          resolve();
        } else if (msg.type === 'error') {
          this.options.onError(msg.message, msg.stage);
          reject(new Error(msg.message));
        } else if (msg.type === 'result') {
          this.handleResult(msg.payload);
        }
      };

      this.worker.postMessage({ type: 'init' });
    });
  }

  start(video: HTMLVideoElement): void {
    this.video = video;
    this.lastFpsTime = performance.now();
    this.frameCount = 0;
    const frameInterval = 1000 / this.options.targetFps;
    let lastFrameTime = 0;

    const loop = async (now: number) => {
      if (!this.video || !this.worker || !this.ready) return;

      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now;
        if (this.video.readyState >= 2) {
          try {
            const bitmap = await createImageBitmap(this.video);
            this.worker.postMessage(
              { type: 'frame', bitmap, timestamp: now },
              [bitmap],
            );
          } catch {
            // skip frame
          }
        }
      }

      this.frameCount++;
      if (now - this.lastFpsTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  private handleResult(payload: GestureResultPayload): void {
    const rawGesture = payload.gesture as GestureType;
    const gesture =
      payload.confidence >= this.options.confidenceThreshold ? rawGesture : null;

    this.options.onFrame(payload, this.fps);

    this.options.onUpdate({
      gesture: rawGesture ?? null,
      confidence: payload.confidence,
      handCount: payload.handCount,
      fps: this.fps,
      landmarks: payload.landmarks,
      recognized: gesture,
    });

    if (!gesture) return;

    const now = Date.now();
    if (gesture === this.lastGesture && now - this.lastGestureTime < this.options.debounceMs) {
      return;
    }

    this.lastGesture = gesture;
    this.lastGestureTime = now;
    this.options.onGesture(gesture);
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.video = null;
  }
}
