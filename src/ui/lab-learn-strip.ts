/**
 * 解读页「带学」浅条：一句话 + 进图鉴补深度 + 可选练一题
 * 图鉴负责厚百科；解读页只留浅路径。
 */
import { navigate } from '../router.ts';

export type LabLearnStripLink = {
  href: string;
  label: string;
};

export type LabLearnStripOpts = {
  /** 主提示一句 */
  tip: string;
  /** 进图鉴 / 加深 */
  deepen: LabLearnStripLink;
  /** 可选练一题 */
  practice?: LabLearnStripLink | null;
  /** 覆盖默认 kicker */
  kicker?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function labLearnStripHtml(opts: LabLearnStripOpts): string {
  const tip = opts.tip.trim();
  if (!tip) return '';
  const kicker = opts.kicker ?? '带学';
  const practice = opts.practice
    ? `<button type="button" class="lab-learn-strip-btn is-practice" data-learn-strip-go data-path="${escapeHtml(opts.practice.href)}">${escapeHtml(opts.practice.label)}</button>`
    : '';
  return `
    <aside class="lab-learn-strip" aria-label="带学">
      <p class="lab-learn-strip-kicker">${escapeHtml(kicker)}</p>
      <p class="lab-learn-strip-tip">${escapeHtml(tip)}</p>
      <div class="lab-learn-strip-actions">
        <button type="button" class="lab-learn-strip-btn is-deepen" data-learn-strip-go data-path="${escapeHtml(opts.deepen.href)}">${escapeHtml(opts.deepen.label)}</button>
        ${practice}
      </div>
    </aside>`;
}

/** 绑定 strip 内跳转（在父节点 paint 后调用） */
export function bindLabLearnStrip(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>('[data-learn-strip-go]').forEach((el) => {
    if (el.dataset.learnStripBound === '1') return;
    el.dataset.learnStripBound = '1';
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (path) navigate(path);
    });
  });
}
