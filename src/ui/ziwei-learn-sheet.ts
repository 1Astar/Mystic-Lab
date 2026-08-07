import {
  buildLearnExplain,
  type LearnFocus,
  type LearnRelated,
} from '../ziwei/learn-explain.ts';
import { TERM_CATEGORY_CLASS } from '../ziwei/term-glossary.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import { navigate } from '../router.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type OpenZiweiLearnSheetOptions = {
  view: ZiweiChartView;
  focus: LearnFocus;
  /** 默认跳到完整命盘并带 focus query */
  onOpenChart?: (focus: LearnFocus) => void;
  /** 抽屉切换词条时同步盘面高亮 */
  onFocusChange?: (focus: LearnFocus) => void;
  /** 关闭抽屉（含点空白） */
  onClose?: () => void;
};

function relatedChip(r: LearnRelated): string {
  const f = r.focus;
  const attrs = [
    `data-learn-kind="${escapeHtml(r.kind)}"`,
    f.starName ? `data-learn-star="${escapeHtml(f.starName)}"` : '',
    f.palaceName ? `data-learn-palace="${escapeHtml(f.palaceName)}"` : '',
    f.status ? `data-learn-status="${escapeHtml(f.status)}"` : '',
    f.term ? `data-learn-term="${escapeHtml(f.term)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<button type="button" class="ziwei-learn-chip ${TERM_CATEGORY_CLASS[r.kind]}" ${attrs}>${escapeHtml(r.label)}</button>`;
}

function focusFromDataset(el: HTMLElement): LearnFocus | null {
  const kind = el.dataset.learnKind as LearnFocus['kind'] | undefined;
  const starName = el.dataset.learnStar;
  const palaceName = el.dataset.learnPalace;
  const status = el.dataset.learnStatus;
  const term = el.dataset.learnTerm;
  if (!starName && !palaceName && !status && !term) return null;
  return { kind, starName, palaceName, status, term };
}

function starPanelHtml(
  model: ReturnType<typeof buildLearnExplain>,
): string {
  const titleLine = model.subtitle
    ? `${escapeHtml(model.title)}｜${escapeHtml(model.subtitle)}`
    : escapeHtml(model.title);
  const statusRow = model.statusLink
    ? `<button type="button" class="ziwei-learn-status-row status-row" data-learn-kind="status" data-learn-status="${escapeHtml(model.statusLink.status)}" ${
        model.statusLink.focus.starName
          ? `data-learn-star="${escapeHtml(model.statusLink.focus.starName)}"`
          : ''
      } ${
        model.statusLink.focus.palaceName
          ? `data-learn-palace="${escapeHtml(model.statusLink.focus.palaceName)}"`
          : ''
      }>
        <span class="ziwei-learn-status-k">星曜状态</span>
        <span class="ziwei-learn-status-v">
          <em class="is-status-${escapeHtml(model.statusLink.status)}">${escapeHtml(model.statusLink.status)}</em>
          <span>${escapeHtml(model.statusLink.product)}</span>
          <i aria-hidden="true">›</i>
        </span>
      </button>`
    : '';

  return `
    <header class="ziwei-learn-head is-star">
      <div>
        <p class="ziwei-kicker ziwei-learn-cat">${escapeHtml(model.categoryLabel)}</p>
        <h2>${titleLine}</h2>
        <p class="ziwei-learn-lead">${escapeHtml(model.oneLiner)}</p>
      </div>
      <button type="button" class="ziwei-learn-close" data-learn-close>关闭</button>
    </header>
    <div class="ziwei-learn-scroll">
      <section class="ziwei-learn-block is-layer-chart">
        <h3>在你的命盘里</h3>
        <pre class="ziwei-learn-body">${escapeHtml(model.inChart)}</pre>
      </section>
      ${statusRow}
      <details class="ziwei-learn-fold">
        <summary>传统含义</summary>
        <pre class="ziwei-learn-body">${escapeHtml(model.traditional || '（暂无）')}</pre>
      </details>
      <section class="ziwei-learn-block is-layer-explore">
        <h3>相关探索</h3>
        <div class="ziwei-learn-chips">${model.related.map(relatedChip).join('') || '<span class="ziwei-learn-term">暂无</span>'}</div>
      </section>
    </div>`;
}

function defaultPanelHtml(
  model: ReturnType<typeof buildLearnExplain>,
): string {
  const relationHtml = model.relationMap
    ? `<div class="ziwei-learn-map" aria-label="关系地图">
        <p class="ziwei-learn-map-row"><span class="is-self">本宫</span>${escapeHtml(model.relationMap.self)}</p>
        <p class="ziwei-learn-map-row"><span class="is-sanhe">三合</span>${escapeHtml(model.relationMap.sanhe.join('、') || '—')}</p>
        <p class="ziwei-learn-map-row"><span class="is-dui">对宫</span>${escapeHtml(model.relationMap.opposite)}</p>
        <p class="ziwei-learn-map-note">${escapeHtml(model.relationMap.note)}</p>
      </div>`
    : '';

  return `
    <header class="ziwei-learn-head">
      <div>
        <p class="ziwei-kicker ziwei-learn-cat">${escapeHtml(model.categoryLabel)}</p>
        <h2>${escapeHtml(model.title)}</h2>
        ${model.subtitle ? `<p class="ziwei-learn-sub">${escapeHtml(model.subtitle)}</p>` : ''}
        <p class="ziwei-learn-lead">${escapeHtml(model.oneLiner)}</p>
      </div>
      <button type="button" class="ziwei-learn-close" data-learn-close>关闭</button>
    </header>
    <div class="ziwei-learn-scroll">
      <section class="ziwei-learn-block is-layer-2">
        <h3>传统含义</h3>
        <pre class="ziwei-learn-body">${escapeHtml(model.traditional || '（本词条暂无展开传统释义）')}</pre>
      </section>
      <section class="ziwei-learn-block is-layer-3">
        <h3>在你的命盘里</h3>
        <pre class="ziwei-learn-body">${escapeHtml(model.inChart)}</pre>
        ${relationHtml}
      </section>
      <section class="ziwei-learn-block is-layer-4">
        <h3>相关探索</h3>
        <div class="ziwei-learn-chips">${model.related.map(relatedChip).join('') || '<span class="ziwei-learn-term">暂无关联词</span>'}</div>
      </section>
    </div>`;
}

/** 底部半屏学习抽屉：点哪里解释从哪里出；抽屉内继续探索 */
export function openZiweiLearnSheet(opts: OpenZiweiLearnSheetOptions): void {
  document.querySelector('.ziwei-learn-sheet')?.remove();

  const model = buildLearnExplain(opts.view, opts.focus);
  opts.onFocusChange?.(opts.focus);

  const sheet = document.createElement('div');
  sheet.className = `ziwei-learn-sheet is-half ${TERM_CATEGORY_CLASS[model.category]}`;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');

  const body =
    model.category === 'star' ? starPanelHtml(model) : defaultPanelHtml(model);

  sheet.innerHTML = `
    <button type="button" class="ziwei-learn-backdrop" data-learn-close aria-label="关闭"></button>
    <aside class="ziwei-learn-panel">
      <div class="ziwei-learn-handle" aria-hidden="true"></div>
      ${body}
      <footer class="ziwei-learn-foot">
        <button type="button" class="life-btn-primary" data-learn-chart>回到盘面看关系 ›</button>
      </footer>
    </aside>
  `;

  document.body.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('is-visible'));

  const close = (): void => {
    sheet.classList.remove('is-visible');
    opts.onClose?.();
    window.setTimeout(() => sheet.remove(), 280);
  };

  const reopen = (focus: LearnFocus): void => {
    // 同抽屉内切换，不闪关；直接重建
    openZiweiLearnSheet({ ...opts, focus });
  };

  sheet.querySelectorAll('[data-learn-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  sheet
    .querySelectorAll<HTMLButtonElement>('.ziwei-learn-chip, .ziwei-learn-status-row')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const focus = focusFromDataset(btn);
        if (focus) reopen(focus);
      });
    });

  sheet.querySelector('[data-learn-chart]')?.addEventListener('click', () => {
    const focus = opts.focus;
    close();
    if (opts.onOpenChart) {
      opts.onOpenChart(focus);
      return;
    }
    const q = new URLSearchParams();
    q.set('mode', 'chart');
    if (focus.starName) q.set('star', focus.starName);
    if (focus.palaceName) q.set('palace', focus.palaceName);
    if (focus.status) q.set('status', focus.status);
    if (focus.term) q.set('term', focus.term);
    navigate(`/ziwei/reading?${q.toString()}`);
  });
}

/** 绑定页面上的 data-learn-star / palace / status / term */
export function bindZiweiLearnHotspots(
  root: HTMLElement,
  view: ZiweiChartView,
  extra?: {
    onOpenChart?: (focus: LearnFocus) => void;
    onFocusChange?: (focus: LearnFocus) => void;
    onClose?: () => void;
  },
): void {
  root
    .querySelectorAll<HTMLElement>(
      '[data-learn-star], [data-learn-palace], [data-learn-status], [data-learn-term]',
    )
    .forEach((el) => {
      if ((el as HTMLButtonElement).disabled) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const focus = focusFromDataset(el);
        if (!focus) return;
        openZiweiLearnSheet({
          view,
          focus,
          onOpenChart: extra?.onOpenChart,
          onFocusChange: extra?.onFocusChange,
          onClose: extra?.onClose,
        });
      });
    });
}
