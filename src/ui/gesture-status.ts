import { GESTURE_LABELS } from '../core/gesture-detector.ts';

export function createGestureStatusBar(): {
  el: HTMLElement;
  update: (handCount: number, gesture: string | null, confidence: number, active: boolean) => void;
  setMessage: (msg: string) => void;
} {
  const bar = document.createElement('div');
  bar.className = 'gesture-status-bar';
  bar.hidden = true;
  bar.innerHTML = `
    <span class="gesture-status-dot"></span>
    <span class="gesture-status-text">手势识别准备中…</span>
  `;

  const text = bar.querySelector('.gesture-status-text')!;

  return {
    el: bar,
    update(handCount, gesture, confidence, active) {
      bar.hidden = false;
      bar.classList.toggle('is-active', active && handCount > 0);
      if (!active) {
        text.textContent = '手势模型未加载，请用下方触控按钮';
        return;
      }
      if (handCount === 0) {
        text.textContent = '请将手放入摄像头画面';
        return;
      }
      const label = gesture ? (GESTURE_LABELS[gesture] ?? gesture) : '无';
      text.textContent = `已检测 ${handCount} 只手 · ${label}（${Math.round(confidence * 100)}%）`;
    },
    setMessage(msg: string) {
      bar.hidden = false;
      text.textContent = msg;
    },
  };
}
