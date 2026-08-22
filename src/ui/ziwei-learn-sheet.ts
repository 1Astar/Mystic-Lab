import {
  buildLearnExplain,
  type LearnFocus,
  type LearnRelated,
} from '../ziwei/learn-explain.ts';
import { TERM_CATEGORY_CLASS } from '../ziwei/term-glossary.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import { navigate } from '../router.ts';

/** 当前释义弹窗的 Escape 监听，切换词条时 abort 防泄漏 */
let learnSheetEsc: AbortController | null = null;

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

/** 解读抽屉只浅带学；深度进图鉴（可查） */
function resolveAtlasHint(
  focus: LearnFocus,
  model: ReturnType<typeof buildLearnExplain>,
): { path: string; label: string } {
  if (model.atlasHint) return model.atlasHint;
  const q = new URLSearchParams();
  if (focus.starName) {
    q.set('star', focus.starName);
    return { path: `/ziwei/tujian?${q.toString()}`, label: '图鉴查深度' };
  }
  if (focus.palaceName) {
    q.set('layer', 'palaces');
    q.set('palace', focus.palaceName);
    return { path: `/ziwei/tujian?${q.toString()}`, label: '图鉴查深度' };
  }
  if (focus.term) {
    q.set('term', focus.term);
    return { path: `/ziwei/tujian?${q.toString()}`, label: '图鉴查深度' };
  }
  if (focus.status) {
    q.set('layer', 'structure');
    q.set('bucket', 'brightness');
    return { path: `/ziwei/tujian?${q.toString()}`, label: '图鉴查深度' };
  }
  return { path: '/ziwei/tujian', label: '打开紫微图鉴' };
}

function atlasTeaseHtml(hint: { path: string; label: string }): string {
  return `
    <section class="ziwei-learn-block is-atlas-tease">
      <h3>可查 · 图鉴</h3>
      <p class="ziwei-learn-tease">传统含义与展开说明放在图鉴，这里只带你看盘上这一处。</p>
      <button type="button" class="ziwei-learn-atlas-cta" data-learn-atlas data-atlas-path="${escapeHtml(hint.path)}">${escapeHtml(hint.label)} ›</button>
    </section>`;
}

function starPanelHtml(
  model: ReturnType<typeof buildLearnExplain>,
  atlas: { path: string; label: string },
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
      ${atlasTeaseHtml(atlas)}
      <section class="ziwei-learn-block is-layer-explore">
        <h3>相关探索</h3>
        <div class="ziwei-learn-chips">${model.related.map(relatedChip).join('') || '<span class="ziwei-learn-term">暂无</span>'}</div>
      </section>
    </div>`;
}

function defaultPanelHtml(
  model: ReturnType<typeof buildLearnExplain>,
  atlas: { path: string; label: string },
): string {
  const relationHtml = model.relationMap
    ? `<div class="ziwei-learn-map" aria-label="关系地图">
        <p class="ziwei-learn-map-row"><span class="is-self">本宫</span>${escapeHtml(model.relationMap.self)}</p>
        <p class="ziwei-learn-map-row"><span class="is-sanhe">三合</span>${escapeHtml(model.relationMap.sanhe.join('、') || '—')}</p>
        <p class="ziwei-learn-map-row"><span class="is-dui">对宫</span>${escapeHtml(model.relationMap.opposite)}</p>
        <p class="ziwei-learn-map-note">${escapeHtml(model.relationMap.note)}</p>
      </div>`
    : '';

  const mutagenHtml = model.mutagenMap?.length
    ? `<ul class="ziwei-learn-mutagen-map" aria-label="本盘四化对照">
        ${model.mutagenMap
          .map((row) => {
            const starFocus = `data-learn-kind="star" data-learn-star="${escapeHtml(row.star)}"`;
            return `<li class="ziwei-learn-mutagen-row">
              <button type="button" class="ziwei-learn-mutagen-label is-${escapeHtml(row.label)}" data-learn-kind="mutagen" data-learn-term="${escapeHtml(row.label)}">${escapeHtml(row.label)}</button>
              <div class="ziwei-learn-mutagen-meta">
                <button type="button" class="ziwei-learn-mutagen-star" ${starFocus}>${escapeHtml(row.star)}</button>
                <span class="ziwei-learn-mutagen-palace">${escapeHtml(row.palace)}</span>
              </div>
              <p class="ziwei-learn-mutagen-effect">${escapeHtml(row.effect)}</p>
            </li>`;
          })
          .join('')}
      </ul>`
    : '';

  const branchHtml = model.branchMap?.length
    ? `<ul class="ziwei-learn-mutagen-map ziwei-learn-branch-map" aria-label="本宫地支关系对照">
        ${model.branchMap
          .map((row) => {
            const kindTerm =
              row.kind === '冲' ? '六冲' : row.kind === '合' ? '六合' : '刑';
            return `<li class="ziwei-learn-mutagen-row">
              <button type="button" class="ziwei-learn-mutagen-label is-branch-${escapeHtml(row.kind)}" data-learn-kind="structure" data-learn-term="${escapeHtml(kindTerm)}" data-learn-palace="${escapeHtml(row.fromPalace)}">${escapeHtml(row.label)}</button>
              <div class="ziwei-learn-mutagen-meta">
                <button type="button" class="ziwei-learn-mutagen-star" data-learn-kind="palace" data-learn-palace="${escapeHtml(row.fromPalace)}">${escapeHtml(row.from)}</button>
                <span class="ziwei-learn-mutagen-palace">→</span>
                <button type="button" class="ziwei-learn-mutagen-star" data-learn-kind="palace" data-learn-palace="${escapeHtml(row.toPalace)}">${escapeHtml(row.to)}</button>
              </div>
              <p class="ziwei-learn-mutagen-effect">${escapeHtml(row.effect)}</p>
            </li>`;
          })
          .join('')}
      </ul>`
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
      <section class="ziwei-learn-block is-layer-3">
        <h3>在你的命盘里</h3>
        <pre class="ziwei-learn-body">${escapeHtml(model.inChart)}</pre>
        ${mutagenHtml}
        ${branchHtml}
        ${relationHtml}
      </section>
      ${atlasTeaseHtml(atlas)}
      <section class="ziwei-learn-block is-layer-4">
        <h3>相关探索</h3>
        <div class="ziwei-learn-chips">${model.related.map(relatedChip).join('') || '<span class="ziwei-learn-term">暂无关联词</span>'}</div>
      </section>
    </div>`;
}

/** 底部半屏学习抽屉：点哪里解释从哪里出；浅带学，深度进图鉴 */
export function openZiweiLearnSheet(opts: OpenZiweiLearnSheetOptions): void {
  document.querySelector('.ziwei-learn-sheet')?.remove();
  learnSheetEsc?.abort();
  learnSheetEsc = new AbortController();

  const model = buildLearnExplain(opts.view, opts.focus);
  const atlas = resolveAtlasHint(opts.focus, model);
  opts.onFocusChange?.(opts.focus);

  const sheet = document.createElement('div');
  sheet.className = `ziwei-learn-sheet is-modal ${TERM_CATEGORY_CLASS[model.category]}`;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', model.title);

  const body =
    model.category === 'star' ? starPanelHtml(model, atlas) : defaultPanelHtml(model, atlas);

  sheet.innerHTML = `
    <button type="button" class="ziwei-learn-backdrop" data-learn-close aria-label="关闭"></button>
    <aside class="ziwei-learn-panel">
      ${body}
      <footer class="ziwei-learn-foot">
        <button type="button" class="life-btn-ghost" data-learn-close>关闭</button>
        <button type="button" class="life-btn-ghost" data-learn-atlas data-atlas-path="${escapeHtml(atlas.path)}">${escapeHtml(atlas.label)} ›</button>
        <button type="button" class="life-btn-primary" data-learn-chart>回到盘面看关系 ›</button>
      </footer>
    </aside>
  `;

  document.body.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('is-visible'));

  const close = (): void => {
    sheet.classList.remove('is-visible');
    learnSheetEsc?.abort();
    learnSheetEsc = null;
    opts.onClose?.();
    window.setTimeout(() => sheet.remove(), 240);
  };

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') close();
    },
    { signal: learnSheetEsc.signal },
  );

  const reopen = (focus: LearnFocus): void => {
    openZiweiLearnSheet({ ...opts, focus });
  };

  sheet.querySelectorAll('[data-learn-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  sheet.querySelectorAll('[data-learn-atlas]').forEach((el) => {
    el.addEventListener('click', () => {
      const path =
        (el as HTMLElement).dataset.atlasPath || atlas.path || model.atlasHint?.path;
      if (!path) return;
      close();
      navigate(path);
    });
  });

  sheet
    .querySelectorAll<HTMLButtonElement>(
      '.ziwei-learn-chip, .ziwei-learn-status-row, .ziwei-learn-mutagen-label, .ziwei-learn-mutagen-star',
    )
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
