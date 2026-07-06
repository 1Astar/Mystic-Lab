export type DebugState = {
  gesture: string;
  status: string;
  handCount: number;
  fps: number;
  confidence: number;
};

export function isDebugMode(): boolean {
  return new URLSearchParams(location.search).has('debug');
}

export function createDebugPanel(): {
  el: HTMLElement;
  update: (state: Partial<DebugState>) => void;
  setStatus: (status: string) => void;
} {
  const panel = document.createElement('div');
  panel.className = 'debug-panel';
  panel.innerHTML = `
    <div class="debug-header">
      <span>🔍 调试面板</span>
      <button type="button" class="debug-close" aria-label="关闭">✕</button>
    </div>
    <div class="debug-row"><span>手势</span><span data-k="gesture">无</span></div>
    <div class="debug-row"><span>状态</span><span data-k="status">idle</span></div>
    <div class="debug-row"><span>手数</span><span data-k="handCount">0</span></div>
    <div class="debug-row"><span>FPS</span><span data-k="fps">0</span></div>
    <div class="debug-row"><span>置信度</span><span data-k="confidence">0</span></div>
  `;

  panel.querySelector('.debug-close')?.addEventListener('click', () => {
    panel.hidden = true;
  });

  const fields = {
    gesture: panel.querySelector('[data-k="gesture"]'),
    status: panel.querySelector('[data-k="status"]'),
    handCount: panel.querySelector('[data-k="handCount"]'),
    fps: panel.querySelector('[data-k="fps"]'),
    confidence: panel.querySelector('[data-k="confidence"]'),
  };

  return {
    el: panel,
    update(state: Partial<DebugState>) {
      if (state.gesture !== undefined && fields.gesture) {
        fields.gesture.textContent = state.gesture || '无';
      }
      if (state.handCount !== undefined && fields.handCount) {
        fields.handCount.textContent = String(state.handCount);
      }
      if (state.fps !== undefined && fields.fps) {
        fields.fps.textContent = String(state.fps);
      }
      if (state.confidence !== undefined && fields.confidence) {
        fields.confidence.textContent = state.confidence.toFixed(2);
      }
      if (state.status !== undefined && fields.status) {
        fields.status.textContent = state.status;
      }
    },
    setStatus(status: string) {
      if (fields.status) fields.status.textContent = status;
    },
  };
}
