import { isBaziCodexUnlocked } from './codex.ts';
import { WUXING_ORDER } from './codex-lore.ts';
import { wuxingClass, type WuXing } from './elements.ts';
import type { BaziEncyclopediaEntry } from './codex-encyclopedia-types.ts';

const POS: Record<WuXing, { x: number; y: number }> = {
  木: { x: 86, y: 18 },
  火: { x: 148, y: 78 },
  土: { x: 118, y: 152 },
  金: { x: 54, y: 152 },
  水: { x: 24, y: 78 },
};

const WX_GRADIENT: Record<WuXing, { id: string; a: string; b: string; glow: string }> = {
  木: { id: 'sk-g-mu', a: '#1a3d28', b: '#0c1812', glow: '#6ecf88' },
  火: { id: 'sk-g-huo', a: '#4a1c18', b: '#180c0c', glow: '#ff7a6e' },
  土: { id: 'sk-g-tu', a: '#3d3018', b: '#16120a', glow: '#d4b56a' },
  金: { id: 'sk-g-jin', a: '#3a3628', b: '#14120e', glow: '#e8d59a' },
  水: { id: 'sk-g-shui', a: '#143048', b: '#0a121c', glow: '#6eb6ff' },
};

/** 节点内微型意象（字下缘；火/水用双层路径更易辨认） */
function nodeMotif(wx: WuXing, cx: number, cy: number): string {
  const y = cy + 7.5;
  switch (wx) {
    case '木':
      return `<g class="bazi-sk-motif-wrap" aria-hidden="true">
        <path class="bazi-sk-motif" d="M${cx} ${y + 1.5} L${cx} ${y - 5}" />
        <path class="bazi-sk-motif" d="M${cx} ${y - 2.2} L${cx - 4} ${y - 5.2} M${cx} ${y - 1.4} L${cx + 4} ${y - 4.4}" />
      </g>`;
    case '火':
      return `<g class="bazi-sk-motif-wrap" aria-hidden="true">
        <path class="bazi-sk-motif is-fill" d="M${cx} ${y + 1.2} C${cx - 4.2} ${y - 1.5} ${cx - 2.8} ${y - 5.5} ${cx} ${y - 7.2} C${cx + 2.8} ${y - 5.5} ${cx + 4.2} ${y - 1.5} ${cx} ${y + 1.2} Z" />
        <path class="bazi-sk-motif is-inner" d="M${cx} ${y - 0.2} C${cx - 1.8} ${y - 1.8} ${cx - 1.2} ${y - 3.8} ${cx} ${y - 4.8} C${cx + 1.2} ${y - 3.8} ${cx + 1.8} ${y - 1.8} ${cx} ${y - 0.2} Z" />
      </g>`;
    case '土':
      return `<g class="bazi-sk-motif-wrap" aria-hidden="true">
        <path class="bazi-sk-motif is-fill" d="M${cx - 5} ${y + 0.5} L${cx} ${y - 5} L${cx + 5} ${y + 0.5} Z" />
        <path class="bazi-sk-motif" d="M${cx - 3.2} ${y + 0.5} L${cx + 3.2} ${y + 0.5}" />
      </g>`;
    case '金':
      return `<g class="bazi-sk-motif-wrap" aria-hidden="true">
        <circle class="bazi-sk-motif is-ring" cx="${cx}" cy="${y - 2.2}" r="3.2" />
        <circle class="bazi-sk-motif is-ring is-inner" cx="${cx}" cy="${y - 2.2}" r="1.35" />
      </g>`;
    case '水':
      return `<g class="bazi-sk-motif-wrap" aria-hidden="true">
        <path class="bazi-sk-motif" d="M${cx - 5.5} ${y - 3.2} Q${cx - 2.6} ${y - 0.6} ${cx} ${y - 3.2} Q${cx + 2.6} ${y - 5.8} ${cx + 5.5} ${y - 3.2}" />
        <path class="bazi-sk-motif is-inner" d="M${cx - 5.5} ${y - 0.6} Q${cx - 2.6} ${y + 2} ${cx} ${y - 0.6} Q${cx + 2.6} ${y - 3.2} ${cx + 5.5} ${y - 0.6}" />
      </g>`;
  }
}

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

function edgePath(a: WuXing, b: WuXing, kind: 'sheng' | 'ke'): string {
  const x1 = POS[a].x + 14;
  const y1 = POS[a].y + 14;
  const x2 = POS[b].x + 14;
  const y2 = POS[b].y + 14;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // 两端停在圆盘外，箭头才不会被节点盖住
  const pad = 16.5;
  const sx = x1 + ux * pad;
  const sy = y1 + uy * pad;
  const ex = x2 - ux * pad;
  const ey = y2 - uy * pad;
  // 相生略外弓、相克略内凹，方向仍 a→b
  const nx = -uy;
  const ny = ux;
  const bow = kind === 'sheng' ? 11 : -5;
  const mx = (sx + ex) / 2 + nx * bow;
  const my = (sy + ey) / 2 + ny * bow;
  return `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
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
  /** 五行旁注：偏旺 / 偏弱 / 缺 */
  statusByWx?: Partial<Record<WuXing, string>>;
};

/**
 * 五行生克教学图（六爻星图气质：SVG + CSS）
 */
export function renderWuxingShengKeMapHtml(opts: ShengKeMapOpts = {}): string {
  const focus = opts.focus ?? null;
  const nodeAttr = opts.nodeAttr ?? 'data-codex-id';
  const prefix = opts.markerPrefix ?? (opts.compact ? 'bazi-sk-d' : 'bazi-sk');
  const title = opts.title ?? '五行生克';
  const hint =
    opts.hint ??
    (focus
      ? `聚焦「${focus}」· 亮边为相关生克 · 点节点看释义`
      : '外环相生 · 内星相克 · 点节点看释义');
  const statusByWx = opts.statusByWx ?? {};

  const edgeClass = (a: WuXing, b: WuXing, kind: 'sheng' | 'ke') => {
    if (!focus) return { cls: `bazi-sk-edge is-${kind}`, showArrow: true };
    const focused =
      kind === 'sheng'
        ? (a === focus && b === SHENG_OF[focus]) ||
          (a === SHENG_ME[focus] && b === focus)
        : (a === focus && b === KE_OF[focus]) || (a === KE_ME[focus] && b === focus);
    return {
      cls: `bazi-sk-edge is-${kind}${focused ? ' is-focus' : ' is-mute'}`,
      showArrow: focused,
    };
  };

  const sheng = SHENG_EDGES.map(([a, b]) => {
    const { cls, showArrow } = edgeClass(a, b, 'sheng');
    const arrow = showArrow ? ` marker-end="url(#${prefix}-arrow-sheng)"` : '';
    return `<path class="${cls}" d="${edgePath(a, b, 'sheng')}"${arrow} />`;
  }).join('');
  const ke = KE_EDGES.map(([a, b]) => {
    const { cls, showArrow } = edgeClass(a, b, 'ke');
    const arrow = showArrow ? ` marker-end="url(#${prefix}-arrow-ke)"` : '';
    return `<path class="${cls}" d="${edgePath(a, b, 'ke')}"${arrow} />`;
  }).join('');

  const nodes = WUXING_ORDER.map((wx) => {
    const { x, y } = POS[wx];
    const cx = x + 14;
    const cy = y + 14;
    const g = WX_GRADIENT[wx];
    const lit = isBaziCodexUnlocked(wx);
    const isFocus = focus === wx;
    const related =
      !!focus &&
      (wx === SHENG_OF[focus] ||
        wx === SHENG_ME[focus] ||
        wx === KE_OF[focus] ||
        wx === KE_ME[focus]);
    const status = statusByWx[wx];
    const statusCls = status
      ? ` is-status-${status === '偏旺' ? 'strong' : status === '缺' ? 'miss' : 'weak'}`
      : '';
    return `
      <g class="bazi-sk-node ${wuxingClass(wx)} ${lit ? 'is-lit' : 'is-soft'}${isFocus ? ' is-focus' : ''}${related ? ' is-related' : ''}${focus && !isFocus && !related ? ' is-mute' : ''}${statusCls}" ${nodeAttr}="${escapeHtml(wx)}" role="button" tabindex="0" aria-label="${escapeHtml(wx)}">
        <circle class="bazi-sk-aura" cx="${cx}" cy="${cy}" r="18" />
        <circle class="bazi-sk-disk" cx="${cx}" cy="${cy}" r="13.5" fill="url(#${prefix}-${g.id})" filter="url(#${prefix}-glow-${wuxingClass(wx)})" />
        <circle class="bazi-sk-rim" cx="${cx}" cy="${cy}" r="13.5" />
        <text class="bazi-sk-label" x="${cx}" y="${cy - 0.5}" text-anchor="middle">${escapeHtml(wx)}</text>
        ${nodeMotif(wx, cx, cy)}
        <circle class="bazi-sk-hit" cx="${cx}" cy="${cy}" r="22" />
      </g>`;
  }).join('');

  const sideNotes = WUXING_ORDER.map((wx) => {
    const status = statusByWx[wx] ?? '平';
    const tone =
      status === '偏旺' ? 'strong' : status === '缺' ? 'miss' : status === '偏弱' ? 'weak' : 'flat';
    return `<button type="button" class="bazi-sk-note ${wuxingClass(wx)} is-${tone}" ${nodeAttr}="${escapeHtml(wx)}">
      <b>${escapeHtml(wx)}</b>
      <em>${escapeHtml(status)}</em>
    </button>`;
  }).join('');

  const captions = focus
    ? `<div class="bazi-sk-captions" data-sk-focus-panel>
        <p class="bazi-sk-captions-title">聚焦「${escapeHtml(focus)}」的生克</p>
        <p><strong>它生</strong> · ${escapeHtml(SHENG_OF[focus])}（泄秀 / 输出）</p>
        <p><strong>它克</strong> · ${escapeHtml(KE_OF[focus])}（约束 / 改造）</p>
        <p><strong>生它</strong> · ${escapeHtml(SHENG_ME[focus])}（滋养 / 资源）</p>
        <p><strong>克它</strong> · ${escapeHtml(KE_ME[focus])}（压力 / 成器）</p>
        <div class="bazi-sk-captions-actions">
          <button type="button" class="bazi-sk-caption-btn" data-sk-open-detail="${escapeHtml(focus)}">看完整释义</button>
          <button type="button" class="bazi-sk-caption-btn is-ghost" data-sk-clear-focus>清除聚焦</button>
        </div>
        <p class="bazi-sk-captions-hint">再点一次「${escapeHtml(focus)}」节点也可打开释义</p>
      </div>`
    : `<p class="bazi-sk-idle-hint">点五行节点：只亮出它的生克；再点一次或按「看完整释义」才出词条。</p>`;

  const grads = WUXING_ORDER.map((wx) => {
    const g = WX_GRADIENT[wx];
    return `
      <radialGradient id="${prefix}-${g.id}" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="${g.a}"/>
        <stop offset="100%" stop-color="${g.b}"/>
      </radialGradient>
      <filter id="${prefix}-glow-${wuxingClass(wx)}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="${g.glow}" flood-opacity="0.55"/>
      </filter>`;
  }).join('');

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
      <div class="bazi-sk-body">
        <svg class="bazi-sk-svg" viewBox="0 0 200 200" role="img" aria-label="五行相生相克">
          <defs>
            ${grads}
            <marker id="${prefix}-arrow-sheng" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0.5,0.8 L9.2,5 L0.5,9.2 Z" fill="#78d2a0" stroke="none" />
            </marker>
            <marker id="${prefix}-arrow-ke" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0.5,0.8 L9.2,5 L0.5,9.2 Z" fill="#e67864" stroke="none" />
            </marker>
          </defs>
          ${sheng}
          ${ke}
          ${nodes}
        </svg>
        <aside class="bazi-sk-notes" aria-label="五行状态">
          ${sideNotes}
        </aside>
      </div>
      <div class="bazi-sk-legend">
        <span class="is-sheng">→ 相生</span>
        <span class="is-ke">→ 相克</span>
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
