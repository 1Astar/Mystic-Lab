/**
 * 跨体系图鉴详情共用骨架：
 * 是什么 → 在你身上/这次怎么显 → 相关可跳 →（可选）练一题 / 记一句
 */
export type CodexSkeletonSlot = 'what' | 'yours' | 'related' | 'practice';

export const CODEX_SKELETON_ORDER: CodexSkeletonSlot[] = [
  'what',
  'yours',
  'related',
  'practice',
];

export const CODEX_SKELETON_LABEL: Record<CodexSkeletonSlot, string> = {
  what: '是什么',
  yours: '在你身上',
  related: '相关可跳',
  practice: '练一题',
};

export type CodexSkeletonChromeOpts = {
  /** 高亮当前步（可选） */
  active?: CodexSkeletonSlot | null;
  /** 练习槽自定义名，如「记一句」 */
  practiceLabel?: string;
  /** yours 槽自定义，如「这次怎么显」 */
  yoursLabel?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 详情顶栏读法条：换体系也认同一顺序 */
export function codexSkeletonChromeHtml(opts: CodexSkeletonChromeOpts = {}): string {
  const yours = opts.yoursLabel ?? CODEX_SKELETON_LABEL.yours;
  const practice = opts.practiceLabel ?? CODEX_SKELETON_LABEL.practice;
  const labels: Record<CodexSkeletonSlot, string> = {
    what: CODEX_SKELETON_LABEL.what,
    yours,
    related: CODEX_SKELETON_LABEL.related,
    practice,
  };
  const items = CODEX_SKELETON_ORDER.map((id, i) => {
    const on = opts.active === id ? ' is-on' : '';
    const arrow =
      i < CODEX_SKELETON_ORDER.length - 1
        ? `<span class="lab-codex-skel-arrow" aria-hidden="true">→</span>`
        : '';
    return `<li class="lab-codex-skel-step${on}" data-skel-step="${id}"><span>${escapeHtml(labels[id])}</span>${arrow}</li>`;
  }).join('');
  return `
    <nav class="lab-codex-skel" aria-label="图鉴读法">
      <p class="lab-codex-skel-lead">读法</p>
      <ol class="lab-codex-skel-track">${items}</ol>
    </nav>`;
}

export type CodexSkeletonSlotOpts = {
  slot: CodexSkeletonSlot;
  /** 覆盖默认标题 */
  title?: string;
  bodyHtml: string;
  /** 隐藏空槽 */
  hideIfEmpty?: boolean;
};

/** 槽位包裹：统一 kicker，正文仍用各体系自己的内容 */
export function codexSkeletonSlotHtml(opts: CodexSkeletonSlotOpts): string {
  const body = opts.bodyHtml.trim();
  if (opts.hideIfEmpty && !body) return '';
  const title = opts.title ?? CODEX_SKELETON_LABEL[opts.slot];
  return `
    <section class="lab-codex-skel-slot is-${opts.slot}" data-skel-slot="${opts.slot}" aria-label="${escapeHtml(title)}">
      <p class="lab-codex-skel-slot-kicker">${escapeHtml(title)}</p>
      <div class="lab-codex-skel-slot-body">${body}</div>
    </section>`;
}

/** 练习 CTA 一行（猜盘 / 手札） */
export function codexSkeletonPracticeCtaHtml(links: Array<{ href: string; label: string }>): string {
  if (!links.length) return '';
  return `<p class="lab-codex-skel-practice-ctas">${links
    .map(
      (l) =>
        `<a class="lab-codex-skel-practice-link" href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`,
    )
    .join('<span class="lab-codex-skel-practice-sep" aria-hidden="true">·</span>')}</p>`;
}
