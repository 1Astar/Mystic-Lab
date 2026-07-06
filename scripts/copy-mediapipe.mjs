import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgWasm = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const publicWasm = join(root, 'public/mediapipe/wasm');
const modelPath = join(root, 'public/mediapipe/gesture_recognizer.task');
const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

mkdirSync(publicWasm, { recursive: true });
cpSync(pkgWasm, publicWasm, { recursive: true });

if (!existsSync(modelPath)) {
  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(`Failed to download gesture model: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(modelPath), { recursive: true });
  await import('node:fs/promises').then((fs) => fs.writeFile(modelPath, buf));
  console.log('Downloaded gesture_recognizer.task');
} else {
  console.log('gesture_recognizer.task already exists');
}

console.log('MediaPipe assets ready in public/mediapipe/');
