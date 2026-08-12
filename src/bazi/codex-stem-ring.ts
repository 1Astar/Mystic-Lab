/**
 * 十天干关系环图：五合 / 相冲 / 相生 / 相克
 * 交互与样式对齐地支环（复用 bazi-br-*）
 */
import { TIAN_GAN_HE } from './relations.ts';
import { STEM_WUXING, type WuXing } from './elements.ts';
import { SHENG_OF, KE_OF } from './codex-wuxing-map.ts';
import { isBaziCodexUnlocked } from './codex.ts';

export const STEM_RING_ORDER = [
  '甲',
  '乙',
  '丙',
  '丁',
  '戊',
  '己',
  '庚',
  '辛',
  '壬',
  '癸',
] as const;

/** 天干相冲（常见四对） */
export const TIAN_GAN_CHONG: [string, string][] = [
  ['甲', '庚'],
  ['乙', '辛'],
  ['丙', '壬'],
  ['丁', '癸'],
];

export type StemRingMode = 'he' | 'chong' | 'sheng' | 'ke';

export const STEM_RING_MODES: { id: StemRingMode; label: string; hint: string }[] = [
  { id: 'he', label: '五合', hint: '十天干配对 · 合化五行（≠地支六合）' },
  { id: 'chong', label: '相冲', hint: '甲庚乙辛丙壬丁癸 · 力大易震荡' },
  { id: 'sheng', label: '相生', hint: '按天干五行相生 · 滋养泄秀' },
  { id: 'ke', label: '相克', hint: '按天干五行相克 · 压力成器' },
];

const CHONG_COLORS = [
  '#ff8a7a',
  '#ffb86b',
  '#7eb6ff',
  '#c9a0ff',
];

const HE_COLORS = [
  '#c4a574',
  '#e8d59a',
  '#7eb6ff',
  '#7ed0a0',
  '#ff8a7a',
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stemPos(i: number): { x: number; y: number } {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 10;
  const r = 78;
  return { x: 100 + r * Math.cos(a), y: 100 + r * Math.sin(a) };
}

function idx(s: string): number {
  return STEM_RING_ORDER.indexOf(s as (typeof STEM_RING_ORDER)[number]);
}

function insetPoints(
  p: { x: number; y: number },
  q: { x: number; y: number },
  t = 0.14,
): { x1: number; y1: number; x2: number; y2: number; mx: number; my: number } {
  const x1 = p.x + (q.x - p.x) * t;
  const y1 = p.y + (q.y - p.y) * t;
  const x2 = q.x + (p.x - q.x) * t;
  const y2 = q.y + (p.y - q.y) * t;
  return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

function pairLine(
  a: string,
  b: string,
  kind: string,
  opts?: { color?: string; label?: string; pairKey?: string },
): string {
  const ia = idx(a);
  const ib = idx(b);
  if (ia < 0 || ib < 0) return '';
  const p = stemPos(ia);
  const q = stemPos(ib);
  const { x1, y1, x2, y2, mx, my } = insetPoints(p, q);
  const stroke = opts?.color ? ` stroke="${opts.color}"` : '';
  const pairAttr = opts?.pairKey
    ? ` data-br-pair="${escapeHtml(opts.pairKey)}"`
    : '';
  const label = opts?.label
    ? `<text class="bazi-br-edge-label" x="${mx}" y="${my - 2}" text-anchor="middle">${escapeHtml(opts.label)}</text>`
    : '';
  return `<g class="bazi-br-pair" ${pairAttr}>
    <line class="bazi-br-edge is-${escapeHtml(kind)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${stroke} />
    ${label}
  </g>`;
}

function stemsOfWx(wx: WuXing): string[] {
  return STEM_RING_ORDER.filter((s) => STEM_WUXING[s] === wx);
}

/** 相生：木→火→土→金→水→木，各阴阳干各连对方两干（抽主轴：阳→阳、阴→阴，减线） */
function shengEdges(): string {
  const order: WuXing[] = ['木', '火', '土', '金', '水'];
  const colors = ['#7ed0a0', '#ff8a7a', '#c4a574', '#e8d59a', '#7eb6ff'];
  const parts: string[] = [];
  for (let i = 0; i < order.length; i++) {
    const from = order[i]!;
    const to = SHENG_OF[from];
    const fs = stemsOfWx(from);
    const ts = stemsOfWx(to);
    // 阳干→阳干、阴干→阴干
    if (fs[0] && ts[0]) {
      parts.push(
        pairLine(fs[0], ts[0], 'he', {
          color: colors[i],
          label: `生${to}`,
          pairKey: `${fs[0]}${ts[0]}`,
        }),
      );
    }
    if (fs[1] && ts[1]) {
      parts.push(
        pairLine(fs[1], ts[1], 'he', {
          color: colors[i],
          label: `生${to}`,
          pairKey: `${fs[1]}${ts[1]}`,
        }),
      );
    }
  }
  return parts.join('');
}

function keEdges(): string {
  const order: WuXing[] = ['木', '火', '土', '金', '水'];
  const colors = ['#ff8a7a', '#c4a574', '#e8d59a', '#7eb6ff', '#7ed0a0'];
  const parts: string[] = [];
  for (let i = 0; i < order.length; i++) {
    const from = order[i]!;
    const to = KE_OF[from];
    const fs = stemsOfWx(from);
    const ts = stemsOfWx(to);
    if (fs[0] && ts[0]) {
      parts.push(
        pairLine(fs[0], ts[0], 'chong', {
          color: colors[i],
          label: `克${to}`,
          pairKey: `${fs[0]}${ts[0]}`,
        }),
      );
    }
    if (fs[1] && ts[1]) {
      parts.push(
        pairLine(fs[1], ts[1], 'chong', {
          color: colors[i],
          label: `克${to}`,
          pairKey: `${fs[1]}${ts[1]}`,
        }),
      );
    }
  }
  return parts.join('');
}

function edgesForMode(mode: StemRingMode): string {
  if (mode === 'he') {
    return TIAN_GAN_HE.map(([a, b, el], i) =>
      pairLine(a, b, 'he', {
        color: HE_COLORS[i % HE_COLORS.length],
        label: `合${el}`,
        pairKey: `${a}${b}`,
      }),
    ).join('');
  }
  if (mode === 'chong') {
    return TIAN_GAN_CHONG.map(([a, b], i) =>
      pairLine(a, b, 'chong', {
        color: CHONG_COLORS[i % CHONG_COLORS.length],
        label: `${a}${b}`,
        pairKey: `${a}${b}`,
      }),
    ).join('');
  }
  if (mode === 'sheng') return shengEdges();
  return keEdges();
}

function pairCardsHtml(mode: StemRingMode): string {
  if (mode === 'he') {
    return `
      <div class="bazi-br-pairs" aria-label="天干五合对照">
        <p class="bazi-br-pairs-lead">五合 · 十天干配对（合化五行）：</p>
        <div class="bazi-br-pair-grid">
          ${TIAN_GAN_HE.map(
            ([a, b, el], i) => `
            <div class="bazi-br-pair-card is-he" style="--pair:${HE_COLORS[i % HE_COLORS.length]}">
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(a)}">${escapeHtml(a)}</button>
              <span class="bazi-br-pair-verb">合${escapeHtml(el)}</span>
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(b)}">${escapeHtml(b)}</button>
            </div>`,
          ).join('')}
        </div>
      </div>`;
  }
  if (mode === 'chong') {
    return `
      <div class="bazi-br-pairs" aria-label="天干相冲对照">
        <p class="bazi-br-pairs-lead">相冲 · 力大易震荡（常见四对）：</p>
        <div class="bazi-br-pair-grid">
          ${TIAN_GAN_CHONG.map(
            ([a, b], i) => `
            <div class="bazi-br-pair-card" style="--pair:${CHONG_COLORS[i % CHONG_COLORS.length]}">
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(a)}">${escapeHtml(a)}</button>
              <span class="bazi-br-pair-verb">冲</span>
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(b)}">${escapeHtml(b)}</button>
            </div>`,
          ).join('')}
        </div>
      </div>`;
  }
  if (mode === 'sheng') {
    const order: WuXing[] = ['木', '火', '土', '金', '水'];
    return `
      <div class="bazi-br-pairs" aria-label="天干相生对照">
        <p class="bazi-br-pairs-lead">相生 · 环上同色线为阳干→阳干、阴干→阴干：</p>
        <div class="bazi-br-pair-grid is-tri">
          ${order
            .map((from) => {
              const to = SHENG_OF[from];
              const fs = stemsOfWx(from);
              const ts = stemsOfWx(to);
              return `
              <div class="bazi-br-pair-card is-sanhe">
                <span>${escapeHtml(fs.join(''))}${escapeHtml(from)}</span>
                <span class="bazi-br-pair-verb">生→</span>
                <span>${escapeHtml(ts.join(''))}${escapeHtml(to)}</span>
              </div>`;
            })
            .join('')}
        </div>
      </div>`;
  }
  const order: WuXing[] = ['木', '火', '土', '金', '水'];
  return `
    <div class="bazi-br-pairs" aria-label="天干相克对照">
      <p class="bazi-br-pairs-lead">相克 · 环上同色线为阳干→阳干、阴干→阴干：</p>
      <div class="bazi-br-pair-grid is-tri">
        ${order
          .map((from) => {
            const to = KE_OF[from];
            const fs = stemsOfWx(from);
            const ts = stemsOfWx(to);
            return `
            <div class="bazi-br-pair-card is-hai">
              <span>${escapeHtml(fs.join(''))}${escapeHtml(from)}</span>
              <span class="bazi-br-pair-verb">克→</span>
              <span>${escapeHtml(ts.join(''))}${escapeHtml(to)}</span>
            </div>`;
          })
          .join('')}
      </div>
    </div>`;
}

export type StemRingOpts = {
  mode?: StemRingMode;
  focus?: string | null;
  nodeAttr?: 'data-codex-id' | 'data-open-entry';
  title?: string;
  hideModeTabs?: boolean;
};

export function renderStemRelationRingHtml(opts: StemRingOpts = {}): string {
  const mode = opts.mode ?? 'he';
  const focus = opts.focus ?? null;
  const nodeAttr = opts.nodeAttr ?? 'data-codex-id';
  const meta = STEM_RING_MODES.find((m) => m.id === mode) ?? STEM_RING_MODES[0]!;
  const title = opts.title ?? `天干 · ${meta.label}`;

  const peers = new Set<string>();
  if (focus) {
    if (mode === 'he') {
      for (const [a, b] of TIAN_GAN_HE) {
        if (a === focus) peers.add(b);
        if (b === focus) peers.add(a);
      }
    } else if (mode === 'chong') {
      for (const [a, b] of TIAN_GAN_CHONG) {
        if (a === focus) peers.add(b);
        if (b === focus) peers.add(a);
      }
    } else if (mode === 'sheng') {
      const wx = STEM_WUXING[focus];
      if (wx) {
        const to = SHENG_OF[wx];
        const fromWx = (Object.keys(SHENG_OF) as WuXing[]).find(
          (k) => SHENG_OF[k] === wx,
        );
        stemsOfWx(to).forEach((s) => peers.add(s));
        if (fromWx) stemsOfWx(fromWx).forEach((s) => peers.add(s));
      }
    } else {
      const wx = STEM_WUXING[focus];
      if (wx) {
        const to = KE_OF[wx];
        const fromWx = (Object.keys(KE_OF) as WuXing[]).find((k) => KE_OF[k] === wx);
        stemsOfWx(to).forEach((s) => peers.add(s));
        if (fromWx) stemsOfWx(fromWx).forEach((s) => peers.add(s));
      }
    }
    peers.delete(focus);
  }

  const nodes = STEM_RING_ORDER.map((st, i) => {
    const { x, y } = stemPos(i);
    const lit = isBaziCodexUnlocked(st);
    const isFocus = focus === st;
    const related = peers.has(st);
    const mute = focus && !isFocus && !related;
    const wx = STEM_WUXING[st] ?? '';
    return `
      <g class="bazi-br-node ${lit ? 'is-lit' : 'is-soft'}${isFocus ? ' is-focus' : ''}${related ? ' is-related' : ''}${mute ? ' is-mute' : ''}" ${nodeAttr}="${escapeHtml(st)}" role="button" tabindex="0" aria-label="${escapeHtml(st)}${wx ? ` · ${wx}` : ''}">
        <circle class="bazi-br-disk" cx="${x}" cy="${y}" r="12" />
        <text class="bazi-br-label" x="${x}" y="${y + 4}" text-anchor="middle">${escapeHtml(st)}</text>
        <circle class="bazi-br-hit" cx="${x}" cy="${y}" r="16" />
      </g>`;
  }).join('');

  const tabs = opts.hideModeTabs
    ? ''
    : `<div class="bazi-br-modes" role="tablist" aria-label="天干关系类型">
        ${STEM_RING_MODES.map(
          (m) =>
            `<button type="button" class="bazi-br-mode ${m.id === mode ? 'is-on' : ''}" data-stem-ring-mode="${m.id}" role="tab" aria-selected="${m.id === mode}">${escapeHtml(m.label)}</button>`,
        ).join('')}
      </div>`;

  return `
    <section class="bazi-br-map" data-stem-ring aria-label="${escapeHtml(title)}">
      <div class="bazi-br-head">
        <h2 class="bazi-codex-section-title">${escapeHtml(title)}</h2>
        <p class="bazi-codex-hint">${escapeHtml(meta.hint)} · 点天干看词条</p>
      </div>
      ${tabs}
      <svg class="bazi-br-svg" viewBox="0 0 200 200" role="img" aria-label="${escapeHtml(meta.label)}图">
        <circle class="bazi-br-rail" cx="100" cy="100" r="78" />
        ${edgesForMode(mode)}
        ${nodes}
      </svg>
      ${pairCardsHtml(mode)}
    </section>`;
}
