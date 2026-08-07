/**
 * 盘面字段轻量释义浮层（点干支/十神/神煞等）
 * 正文应来自图鉴实体；本层只做「命盘相关摘要」展示。
 */
import { ICON_SPARK } from './lab-icons.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type LabConceptPeekOpts = {
  term: string;
  answerConcept: (q: string) => { answer: string; hit: boolean };
  onMiss?: (q: string) => void;
  /** 打开完整边看边问 */
  onOpenAsk?: (term: string) => void;
  /** 打开图鉴完整百科 */
  onOpenAtlas?: (term: string) => void;
  /** 来源提示 */
  sourceHint?: string;
};

/** 底部轻量释义卡：点盘面字段时用，不占完整深度窗 */
export function openLabConceptPeek(opts: LabConceptPeekOpts): void {
  document.querySelector('.lab-concept-peek')?.remove();
  const term = opts.term.trim();
  if (!term || term === '—') return;

  const got = opts.answerConcept(term);
  if (!got.hit) opts.onMiss?.(term);

  const hint =
    opts.sourceHint ??
    (got.hit ? '图鉴知识库 · 命盘相关摘要' : '词库暂无精确条 · 已尽量给出通识说明');

  const atlasBtn = opts.onOpenAtlas
    ? `<button type="button" class="lab-concept-peek-atlas" data-peek-atlas>看完整百科</button>`
    : '';

  const modal = document.createElement('div');
  modal.className = 'lab-concept-peek is-open';
  modal.innerHTML = `
    <button type="button" class="lab-concept-peek-backdrop" data-peek-close aria-label="关闭"></button>
    <div class="lab-concept-peek-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(term)}">
      <header class="lab-concept-peek-head">
        <h2>${escapeHtml(term)}</h2>
        <button type="button" class="lab-concept-peek-x" data-peek-close aria-label="关闭">×</button>
      </header>
      <div class="lab-concept-peek-body">
        <p>${escapeHtml(got.answer).replace(/\n/g, '<br>')}</p>
        <p class="lab-concept-peek-hint">${escapeHtml(hint)}</p>
      </div>
      <footer class="lab-concept-peek-foot">
        ${atlasBtn}
        <button type="button" class="lab-concept-peek-more" data-peek-more>
          ${ICON_SPARK}
          <span>继续追问</span>
        </button>
      </footer>
    </div>
  `;

  const close = () => {
    modal.classList.remove('is-open');
    setTimeout(() => modal.remove(), 200);
  };

  modal.querySelectorAll('[data-peek-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  modal.querySelector('[data-peek-more]')?.addEventListener('click', () => {
    close();
    opts.onOpenAsk?.(term);
  });
  modal.querySelector('[data-peek-atlas]')?.addEventListener('click', () => {
    close();
    opts.onOpenAtlas?.(term);
  });

  document.body.appendChild(modal);
}
