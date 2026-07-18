import {
  isLiuyaoSfxMuted,
  toggleLiuyaoSfxMuted,
} from '../../liuyao/sfx.ts';

function labelFor(muted: boolean): string {
  return muted ? '声音：关' : '声音：开';
}

function titleFor(muted: boolean): string {
  return muted ? '点击开启起卦音效' : '点击关闭起卦音效';
}

/** 右上角静音开关；状态写入 localStorage */
export function mountLiuyaoSfxToggle(parent: HTMLElement): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ly-sfx-toggle';
  btn.setAttribute('aria-pressed', isLiuyaoSfxMuted() ? 'true' : 'false');

  function sync(): void {
    const muted = isLiuyaoSfxMuted();
    btn.textContent = labelFor(muted);
    btn.title = titleFor(muted);
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.classList.toggle('is-muted', muted);
  }

  sync();
  btn.addEventListener('click', () => {
    toggleLiuyaoSfxMuted();
    sync();
  });

  parent.appendChild(btn);
  return btn;
}
