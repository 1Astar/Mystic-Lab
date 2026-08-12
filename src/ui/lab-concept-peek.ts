/**
 * 词条释义弹窗：小 tab 分段（画像/神话/要点…）
 * 用于边看边问常问、盘面字段点开。
 */
import { ICON_SPARK } from './lab-icons.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type LabConceptTab = {
  id: string;
  label: string;
  body: string;
};

export type LabConceptPeekOpts = {
  term: string;
  /** 结构化分段；缺省则用 answerConcept 整段作「释义」 */
  tabs?: LabConceptTab[];
  /** 默认打开的 tab id；缺省为第一项 */
  initialTab?: string;
  answerConcept?: (q: string) => { answer: string; hit: boolean };
  onMiss?: (q: string) => void;
  /** 打开完整边看边问 */
  onOpenAsk?: (term: string) => void;
  /** 打开图鉴完整百科 */
  onOpenAtlas?: (term: string) => void;
  /** 来源提示 */
  sourceHint?: string;
};

const PARA_LABELS = ['要点', '延伸', '用法', '补充'];

/** 多段正文 → 小 tab */
export function tabsFromParagraphs(paras: string[]): LabConceptTab[] {
  return paras
    .map((p) => p.trim())
    .filter(Boolean)
    .map((body, i) => ({
      id: `p${i}`,
      label: PARA_LABELS[i] ?? `补充${i + 1}`,
      body,
    }));
}

function resolveTabs(opts: LabConceptPeekOpts): {
  tabs: LabConceptTab[];
  hit: boolean;
  hint: string;
} {
  if (opts.tabs?.length) {
    return {
      tabs: opts.tabs,
      hit: true,
      hint: opts.sourceHint ?? '本地词条 · 分段释义',
    };
  }
  if (opts.answerConcept) {
    const got = opts.answerConcept(opts.term);
    if (!got.hit) opts.onMiss?.(opts.term);
    const parts = got.answer.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const tabs =
      parts.length > 1
        ? tabsFromParagraphs(parts)
        : [{ id: 'main', label: '释义', body: got.answer }];
    return {
      tabs,
      hit: got.hit,
      hint:
        opts.sourceHint ??
        (got.hit ? '图鉴知识库 · 命盘相关摘要' : '词库暂无精确条 · 已尽量给出通识说明'),
    };
  }
  return {
    tabs: [{ id: 'main', label: '释义', body: '暂无释义。' }],
    hit: false,
    hint: opts.sourceHint ?? '词库暂无',
  };
}

/** 居中释义弹窗：边看边问常问等；盘面点词请用 openBaziCodexPopup */
export function openLabConceptPeek(opts: LabConceptPeekOpts): void {
  document.querySelector('.lab-concept-peek')?.remove();
  const term = opts.term.trim();
  if (!term || term === '—') return;

  const { tabs, hint } = resolveTabs(opts);
  const initialId =
    (opts.initialTab && tabs.some((t) => t.id === opts.initialTab)
      ? opts.initialTab
      : tabs[0]?.id) ?? '';
  const atlasBtn = opts.onOpenAtlas
    ? `<button type="button" class="lab-concept-peek-atlas" data-peek-atlas>看完整百科</button>`
    : '';

  const tabBar =
    tabs.length > 1
      ? `<div class="lab-concept-peek-tabs" role="tablist" aria-label="释义分段">
          ${tabs
            .map(
              (t) => `
            <button type="button" class="lab-concept-peek-tab${t.id === initialId ? ' is-on' : ''}"
              role="tab" aria-selected="${t.id === initialId}" data-peek-tab="${escapeHtml(t.id)}">
              ${escapeHtml(t.label)}
            </button>`,
            )
            .join('')}
        </div>`
      : '';

  const panes = tabs
    .map(
      (t) => `
      <div class="lab-concept-peek-pane" data-peek-pane="${escapeHtml(t.id)}" ${t.id === initialId ? '' : 'hidden'}>
        <p>${escapeHtml(t.body).replace(/\n/g, '<br>')}</p>
      </div>`,
    )
    .join('');

  const modal = document.createElement('div');
  modal.className = 'lab-concept-peek is-open';
  modal.innerHTML = `
    <button type="button" class="lab-concept-peek-backdrop" data-peek-close aria-label="关闭"></button>
    <div class="lab-concept-peek-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(term)}">
      <header class="lab-concept-peek-head">
        <h2>${escapeHtml(term)}</h2>
        <button type="button" class="lab-concept-peek-x" data-peek-close aria-label="关闭">×</button>
      </header>
      ${tabBar}
      <div class="lab-concept-peek-body">
        ${panes}
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

  modal.querySelectorAll<HTMLButtonElement>('[data-peek-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.peekTab ?? '';
      modal.querySelectorAll<HTMLButtonElement>('[data-peek-tab]').forEach((b) => {
        const on = b.dataset.peekTab === id;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      modal.querySelectorAll<HTMLElement>('[data-peek-pane]').forEach((pane) => {
        pane.hidden = pane.dataset.peekPane !== id;
      });
    });
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
