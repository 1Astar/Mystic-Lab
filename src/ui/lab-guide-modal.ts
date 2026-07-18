export interface LabGuideItem {
  focus: string;
  why: string;
  system: string;
}

/** 怎么选：侧重 → 解释 → 体系 */
export const LAB_SYSTEM_GUIDE: LabGuideItem[] = [
  {
    focus: '心理探索',
    why: '用牌面叙事看关系场、内心动力与选择张力。',
    system: '塔罗',
  },
  {
    focus: '时间趋势',
    why: '看短时顺逆，先辨眼前这一步怎么走。',
    system: '小六壬',
  },
  {
    focus: '变化结构',
    why: '六条爻怎么叠、哪条在动、世应（我/外界）怎么对上——重「过程与结构」。',
    system: '六爻',
  },
  {
    focus: '象与动念',
    why: '当下一个念头/一事一象，用八卦取象推演——重「这一念对应什么象」。',
    system: '梅花',
  },
];

/** 不知道从哪里开始：体系侧重弹窗 */
export function showLabGuideModal(items: LabGuideItem[] = LAB_SYSTEM_GUIDE): void {
  document.querySelector('.lab-guide-modal')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'lab-guide-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'lab-guide-modal-title');

  const list = items
    .map(
      (g) => `
    <li>
      <div class="lab-guide-row">
        <span class="lab-guide-q">${g.focus}</span>
        <span class="lab-guide-a">${g.system}</span>
      </div>
      <p class="lab-guide-why">${g.why}</p>
    </li>
  `,
    )
    .join('');

  overlay.innerHTML = `
    <div class="lab-guide-modal-backdrop"></div>
    <div class="lab-guide-modal-card">
      <header class="lab-guide-modal-header">
        <div>
          <h2 id="lab-guide-modal-title" class="lab-guide-modal-title">不知道从哪里开始？</h2>
          <p class="lab-guide-modal-desc">先看你更在意什么，再选对应体系。</p>
        </div>
        <button type="button" class="lab-guide-modal-close" aria-label="关闭">×</button>
      </header>
      <ul class="lab-guide lab-guide-in-modal" aria-label="各体系侧重">${list}</ul>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const close = (): void => {
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 280);
  };

  overlay.querySelector('.lab-guide-modal-close')?.addEventListener('click', close);
  overlay.querySelector('.lab-guide-modal-backdrop')?.addEventListener('click', close);
}
