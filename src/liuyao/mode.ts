/** 六爻：起卦模式 / 学习模式 */

export type LiuyaoMode = 'cast' | 'learn';

const KEY = 'mystic-lab-liuyao-mode';

export function getLiuyaoMode(): LiuyaoMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'learn' ? 'learn' : 'cast';
  } catch {
    return 'cast';
  }
}

export function setLiuyaoMode(mode: LiuyaoMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}

/** 顶部模式切换：起卦 ↔ 学习 */
export function mountLiuyaoModeSwitch(
  host: HTMLElement,
  opts?: { onChange?: (mode: LiuyaoMode) => void },
): void {
  const wrap = document.createElement('div');
  wrap.className = 'ly-mode-switch';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', '六爻模式');

  const modes: { id: LiuyaoMode; label: string }[] = [
    { id: 'cast', label: '起卦' },
    { id: 'learn', label: '学习' },
  ];

  function paint(): void {
    const current = getLiuyaoMode();
    wrap.innerHTML = modes
      .map(
        (m) => `
      <button type="button" class="ly-mode-btn${m.id === current ? ' is-active' : ''}" data-mode="${m.id}">
        ${m.label}
      </button>
    `,
      )
      .join('');
    wrap.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.mode as LiuyaoMode;
        if (next === getLiuyaoMode()) return;
        setLiuyaoMode(next);
        paint();
        opts?.onChange?.(next);
      });
    });
  }

  paint();
  host.appendChild(wrap);
}
