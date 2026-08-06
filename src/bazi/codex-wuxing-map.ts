import { isBaziCodexUnlocked } from './codex.ts';
import { WUXING_ORDER } from './codex-lore.ts';
import { wuxingClass, type WuXing } from './elements.ts';
import type { BaziEncyclopediaEntry } from './codex-encyclopedia-types.ts';

const POS: Record<WuXing, { x: number; y: number }> = {
  木: { x: 48, y: 28 },
  火: { x: 118, y: 78 },
  土: { x: 88, y: 148 },
  金: { x: 28, y: 148 },
  水: { x: 8, y: 78 },
};

/** 相生环：木→火→土→金→水→木 */
export const SHENG_EDGES: [WuXing, WuXing][] = [
  ['木', '火'],
  ['火', '土'],
  ['土', '金'],
  ['金', '水'],
  ['水', '木'],
];

/** 相克星：木→土→水→火→金→木 */
export const KE_EDGES: [WuXing, WuXing][] = [
  ['木', '土'],
  ['土', '水'],
  ['水', '火'],
  ['火', '金'],
  ['金', '木'],
];

export const SHENG_OF: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

export const KE_OF: Record<WuXing, WuXing> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

export const SHENG_ME: Record<WuXing, WuXing> = {
  火: '木',
  土: '火',
  金: '土',
  水: '金',
  木: '水',
};

/** 克我者 */
export const KE_ME: Record<WuXing, WuXing> = {
  土: '木',
  金: '火',
  水: '土',
  木: '金',
  火: '水',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function edgePath(a: WuXing, b: WuXing): string {
  const p = POS[a];
  const q = POS[b];
  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2 - 6;
  return `M${p.x + 14} ${p.y + 14} Q${mx} ${my} ${q.x + 14} ${q.y + 14}`;
}

function isWuXing(s: string | undefined): s is WuXing {
  return !!s && (WUXING_ORDER as string[]).includes(s);
}

/** 从百科词条推断聚焦五行 */
export function focusWuxingFromEntry(entry: BaziEncyclopediaEntry): WuXing | null {
  if (entry.kind === 'wuxing' && isWuXing(entry.id)) return entry.id;
  if (isWuXing(entry.tags.wuxing)) return entry.tags.wuxing;
  for (const link of [
    ...entry.relations.generates,
    ...entry.relations.controls,
    ...entry.relations.helpedBy,
    ...entry.relations.drainedBy,
  ]) {
    if (isWuXing(link.id)) return link.id;
  }
  return null;
}

export type ShengKeMapOpts = {
  focus?: WuXing | null;
  title?: string;
  hint?: string;
  nodeAttr?: 'data-codex-id' | 'data-open-entry';
  compact?: boolean;
  markerPrefix?: string;
};

/**
 * 五行生克教学图（六爻星图气质：SVG + CSS）
 */
export function renderWuxingShengKeMapHtml(opts: ShengKeMapOpts = {}): string {
  const focus = opts.focus ?? null;
  const nodeAttr = opts.nodeAttr ?? 'data-codex-id';
  const prefix = opts.markerPrefix ?? (opts.compact ? 'bazi-sk-d' : 'bazi-sk');
  const title = opts.title ?? '五行关系 · 生克图';
  const hint =
    opts.hint ??
    (focus
      ? `聚焦「${focus}」· 亮边为相关生克 · 点节点跳转`
      : '外环相生 · 内星相克 · 点节点看百科');

  const edgeClass = (a: WuXing, b: WuXing, kind: 'sheng' | 'ke') => {
    if (!focus) return `bazi-sk-edge is-${kind}`;
    const focused =
      kind === 'sheng'
        ? (a === focus && b === SHENG_OF[focus]) ||
          (a === SHENG_ME[focus] && b === focus)
        : (a === focus && b === KE_OF[focus]) || (a === KE_ME[focus] && b === focus);
    return `bazi-sk-edge is-${kind}${focused ? ' is-focus' : ' is-mute'}`;
  };

  const sheng = SHENG_EDGES.map(
    ([a, b]) =>
      `<path class="${edgeClass(a, b, 'sheng')}" d="${edgePath(a, b)}" marker-end="url(#${prefix}-arrow-sheng)" />`,
  ).join('');
  const ke = KE_EDGES.map(
    ([a, b]) =>
      `<path class="${edgeClass(a, b, 'ke')}" d="${edgePath(a, b)}" marker-end="url(#${prefix}-arrow-ke)" />`,
  ).join('');

  const nodes = WUXING_ORDER.map((wx) => {
    const { x, y } = POS[wx];
    const lit = isBaziCodexUnlocked(wx);
    const isFocus = focus === wx;
    const related =
      !!focus &&
      (wx === SHENG_OF[focus] ||
        wx === SHENG_ME[focus] ||
        wx === KE_OF[focus] ||
        wx === KE_ME[focus]);
    return `
      <g class="bazi-sk-node ${wuxingClass(wx)} ${lit ? 'is-lit' : 'is-dim'}${isFocus ? ' is-focus' : ''}${related ? ' is-related' : ''}${focus && !isFocus && !related ? ' is-mute' : ''}">
        <circle class="bazi-sk-hit" cx="${x + 14}" cy="${y + 14}" r="22" ${nodeAttr}="${escapeHtml(wx)}" />
        <circle class="bazi-sk-disk" cx="${x + 14}" cy="${y + 14}" r="16" />
        <text class="bazi-sk-label" x="${x + 14}" y="${y + 18}" text-anchor="middle">${escapeHtml(wx)}</text>
      </g>`;
  }).join('');

  const captions = focus
    ? `<div class="bazi-sk-captions">
        <p><strong>它生</strong> · ${escapeHtml(SHENG_OF[focus])}</p>
        <p><strong>它克</strong> · ${escapeHtml(KE_OF[focus])}</p>
        <p><strong>生它</strong> · ${escapeHtml(SHENG_ME[focus])}</p>
        <p><strong>克它</strong> · ${escapeHtml(KE_ME[focus])}</p>
      </div>`
    : '';

  return `
    <section class="bazi-sk-map${opts.compact ? ' is-compact' : ''}" data-shengke-map aria-label="五行生克图">
      <div class="bazi-sk-head">
        ${
          opts.compact
            ? `<h3 class="bazi-enc-section-title">${escapeHtml(title)}</h3>`
            : `<h2 class="bazi-codex-section-title">${escapeHtml(title)}</h2>`
        }
        <p class="bazi-codex-hint">${escapeHtml(hint)}</p>
      </div>
      <svg class="bazi-sk-svg" viewBox="0 0 160 190" role="img" aria-label="五行相生相克">
        <defs>
          <marker id="${prefix}-arrow-sheng" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" class="bazi-sk-arrow is-sheng" />
          </marker>
          <marker id="${prefix}-arrow-ke" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" class="bazi-sk-arrow is-ke" />
          </marker>
        </defs>
        ${sheng}
        ${ke}
        ${nodes}
      </svg>
      <div class="bazi-sk-legend">
        <span class="is-sheng">相生</span>
        <span class="is-ke">相克</span>
      </div>
      ${captions}
    </section>`;
}

/** 十神等无五行聚焦时：以本卡为中心的四向关系图 */
export function renderRelationStarMapHtml(entry: BaziEncyclopediaEntry): string {
  const groups: { key: string; title: string; links: { id: string; label: string }[] }[] = [
    { key: 'generates', title: '它生', links: entry.relations.generates },
    { key: 'controls', title: '它克', links: entry.relations.controls },
    { key: 'helpedBy', title: '帮它', links: entry.relations.helpedBy },
    { key: 'drainedBy', title: '耗它', links: entry.relations.drainedBy },
  ];

  return `
    <section class="bazi-rel-star" aria-label="关系生克图">
      <p class="bazi-codex-hint">以「${escapeHtml(entry.title)}」为中心 · 点节点跳转</p>
      <div class="bazi-rel-star-grid">
        <div class="bazi-rel-star-center">
          <strong>${escapeHtml(entry.title)}</strong>
        </div>
        ${groups
          .map(
            (g) => `
          <div class="bazi-rel-star-arm is-${escapeHtml(g.key)}">
            <em>${escapeHtml(g.title)}</em>
            <div class="bazi-rel-star-chips">
              ${
                g.links.length
                  ? g.links
                      .map(
                        (l) =>
                          `<button type="button" class="bazi-enc-rel-chip" data-open-entry="${escapeHtml(l.id)}">${escapeHtml(l.label)}</button>`,
                      )
                      .join('')
                  : '<span class="bazi-codex-muted">—</span>'
              }
            </div>
          </div>`,
          )
          .join('')}
      </div>
    </section>`;
}
