/**
 * 十二地支关系环图：六冲 / 六合 / 六害 / 刑 / 三合
 * 六冲为直径对穿，线交于圆心难辨——用分色 + 下方配对表兜底。
 */
import {
  LIU_CHONG,
  LIU_HAI,
  LIU_HE,
  SAN_HE,
  SAN_XING,
  ZI_XING,
} from './relations.ts';
import { isBaziCodexUnlocked } from './codex.ts';

export const BRANCH_RING_ORDER = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const;

export type BranchRingMode = 'chong' | 'he' | 'hai' | 'xing' | 'sanhe';

export const BRANCH_RING_MODES: { id: BranchRingMode; label: string; hint: string }[] = [
  { id: 'chong', label: '六冲', hint: '对面相冲 · 直径两端是一对' },
  { id: 'he', label: '六合', hint: '牵绊成局 · 合化五行' },
  { id: 'hai', label: '六害', hint: '隐性摩擦 · 不顺眼' },
  { id: 'xing', label: '刑', hint: '别扭内耗 · 含自刑' },
  { id: 'sanhe', label: '三合', hint: '三支合局 · 成势' },
];

/** 六冲分色，避免六线同色糊成一团 */
const CHONG_COLORS = [
  '#ff8a7a',
  '#ffb86b',
  '#e8d59a',
  '#7ed0a0',
  '#7eb6ff',
  '#c9a0ff',
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function branchPos(i: number): { x: number; y: number } {
  const a = -Math.PI / 2 + (i * Math.PI) / 6;
  const r = 78;
  return { x: 100 + r * Math.cos(a), y: 100 + r * Math.sin(a) };
}

function idx(b: string): number {
  return BRANCH_RING_ORDER.indexOf(b as (typeof BRANCH_RING_ORDER)[number]);
}

/** 向圆心内缩，避免盖住节点；六冲直径仍过圆心但线更细可辨 */
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
  const p = branchPos(ia);
  const q = branchPos(ib);
  if (a === b) {
    return `<circle class="bazi-br-edge is-${escapeHtml(kind)} is-self" cx="${p.x}" cy="${p.y}" r="14" />`;
  }
  const { x1, y1, x2, y2, mx, my } = insetPoints(p, q);
  const stroke = opts?.color ? ` stroke="${opts.color}"` : '';
  const pairAttr = opts?.pairKey
    ? ` data-br-pair="${escapeHtml(opts.pairKey)}"`
    : '';
  const label =
    opts?.label && kind !== 'chong'
      ? `<text class="bazi-br-edge-label" x="${mx}" y="${my - 2}" text-anchor="middle">${escapeHtml(opts.label)}</text>`
      : '';
  // 六冲：在靠「a」端外侧标短注，避免全堆圆心
  const nearA =
    opts?.label && kind === 'chong'
      ? (() => {
          const lx = p.x + (q.x - p.x) * 0.28;
          const ly = p.y + (q.y - p.y) * 0.28;
          return `<text class="bazi-br-edge-label is-chong" x="${lx}" y="${ly}" text-anchor="middle" fill="${opts.color ?? '#ff8a7a'}">${escapeHtml(opts.label)}</text>`;
        })()
      : '';
  return `<g class="bazi-br-pair" ${pairAttr}>
    <line class="bazi-br-edge is-${escapeHtml(kind)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${stroke} />
    ${label}${nearA}
  </g>`;
}

function trianglePath(members: string[], kind: string, color?: string): string {
  const pts = members
    .map((m) => {
      const i = idx(m);
      if (i < 0) return null;
      return branchPos(i);
    })
    .filter(Boolean) as { x: number; y: number }[];
  if (pts.length < 3) return '';
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ') + ' Z';
  const stroke = color ? ` style="stroke:${color}"` : '';
  return `<path class="bazi-br-edge is-${escapeHtml(kind)} is-fill" d="${d}"${stroke} />`;
}

function edgesForMode(mode: BranchRingMode): string {
  if (mode === 'chong') {
    return LIU_CHONG.map(([a, b], i) =>
      pairLine(a, b, 'chong', {
        color: CHONG_COLORS[i % CHONG_COLORS.length],
        label: `${a}${b}`,
        pairKey: `${a}${b}`,
      }),
    ).join('');
  }
  if (mode === 'he') {
    return LIU_HE.map(([a, b, el]) =>
      pairLine(a, b, 'he', { label: `合${el}`, pairKey: `${a}${b}` }),
    ).join('');
  }
  if (mode === 'hai') {
    return LIU_HAI.map(([a, b]) =>
      pairLine(a, b, 'hai', { label: '害', pairKey: `${a}${b}` }),
    ).join('');
  }
  if (mode === 'xing') {
    const colors = ['#e8a0a0', '#d4b56a', '#9ec4ff', '#c9a0ff'];
    const parts = [
      ...SAN_XING.map((g, i) => trianglePath(g, 'xing', colors[i])),
      pairLine('子', '卯', 'xing', { label: '刑', pairKey: '子卯' }),
      ...[...ZI_XING].map((z) => pairLine(z, z, 'xing')),
    ];
    return parts.join('');
  }
  const sanColors = ['#7eb6ff', '#ff8a7a', '#e8d59a', '#7ed0a0'];
  return SAN_HE.map((g, i) => trianglePath(g.members, 'sanhe', sanColors[i])).join('');
}

/** 当前模式下的「谁对谁」卡片表 */
function pairCardsHtml(mode: BranchRingMode): string {
  if (mode === 'chong') {
    return `
      <div class="bazi-br-pairs" aria-label="六冲对照">
        <p class="bazi-br-pairs-lead">六冲 = 对面相撞。环上<strong>直径两端</strong>是一对；下表一一对应：</p>
        <div class="bazi-br-pair-grid">
          ${LIU_CHONG.map(
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
  if (mode === 'he') {
    return `
      <div class="bazi-br-pairs" aria-label="六合对照">
        <p class="bazi-br-pairs-lead">六合 · 牵绊成局（合化五行）：</p>
        <div class="bazi-br-pair-grid">
          ${LIU_HE.map(
            ([a, b, el]) => `
            <div class="bazi-br-pair-card is-he">
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(a)}">${escapeHtml(a)}</button>
              <span class="bazi-br-pair-verb">合${escapeHtml(el)}</span>
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(b)}">${escapeHtml(b)}</button>
            </div>`,
          ).join('')}
        </div>
      </div>`;
  }
  if (mode === 'hai') {
    return `
      <div class="bazi-br-pairs" aria-label="六害对照">
        <p class="bazi-br-pairs-lead">六害 · 隐性摩擦：</p>
        <div class="bazi-br-pair-grid">
          ${LIU_HAI.map(
            ([a, b]) => `
            <div class="bazi-br-pair-card is-hai">
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(a)}">${escapeHtml(a)}</button>
              <span class="bazi-br-pair-verb">害</span>
              <button type="button" class="bazi-br-pair-node" data-codex-id="${escapeHtml(b)}">${escapeHtml(b)}</button>
            </div>`,
          ).join('')}
        </div>
      </div>`;
  }
  if (mode === 'xing') {
    return `
      <div class="bazi-br-pairs" aria-label="相刑对照">
        <p class="bazi-br-pairs-lead">刑 · 别扭内耗（含自刑）：</p>
        <ul class="bazi-br-pair-list">
          <li>寅巳申 三刑</li>
          <li>丑戌未 三刑</li>
          <li>子卯 相刑</li>
          <li>辰午酉亥 自刑</li>
        </ul>
      </div>`;
  }
  return `
    <div class="bazi-br-pairs" aria-label="三合对照">
      <p class="bazi-br-pairs-lead">三合 · 三支成局：</p>
      <div class="bazi-br-pair-grid is-tri">
        ${SAN_HE.map(
          (g) => `
          <div class="bazi-br-pair-card is-sanhe">
            <span>${escapeHtml(g.members.join(''))}</span>
            <span class="bazi-br-pair-verb">→${escapeHtml(g.result)}</span>
          </div>`,
        ).join('')}
      </div>
    </div>`;
}

export type BranchRingOpts = {
  mode?: BranchRingMode;
  focus?: string | null;
  nodeAttr?: 'data-codex-id' | 'data-open-entry';
  title?: string;
  hideModeTabs?: boolean;
};

export function renderBranchRelationRingHtml(opts: BranchRingOpts = {}): string {
  const mode = opts.mode ?? 'chong';
  const focus = opts.focus ?? null;
  const nodeAttr = opts.nodeAttr ?? 'data-codex-id';
  const meta = BRANCH_RING_MODES.find((m) => m.id === mode) ?? BRANCH_RING_MODES[0]!;
  const title = opts.title ?? `地支 · ${meta.label}`;

  const peers = new Set<string>();
  if (focus) {
    if (mode === 'chong') {
      for (const [a, b] of LIU_CHONG) {
        if (a === focus) peers.add(b);
        if (b === focus) peers.add(a);
      }
    } else if (mode === 'he') {
      for (const [a, b] of LIU_HE) {
        if (a === focus) peers.add(b);
        if (b === focus) peers.add(a);
      }
    } else if (mode === 'hai') {
      for (const [a, b] of LIU_HAI) {
        if (a === focus) peers.add(b);
        if (b === focus) peers.add(a);
      }
    } else if (mode === 'xing') {
      for (const g of SAN_XING) {
        if (g.includes(focus)) g.forEach((x) => peers.add(x));
      }
      if (focus === '子') peers.add('卯');
      if (focus === '卯') peers.add('子');
      if (ZI_XING.has(focus)) peers.add(focus);
    } else {
      for (const g of SAN_HE) {
        if (g.members.includes(focus)) g.members.forEach((x) => peers.add(x));
      }
    }
    peers.delete(focus);
  }

  const nodes = BRANCH_RING_ORDER.map((br, i) => {
    const { x, y } = branchPos(i);
    const lit = isBaziCodexUnlocked(br);
    const isFocus = focus === br;
    const related = peers.has(br);
    const mute = focus && !isFocus && !related;
    return `
      <g class="bazi-br-node ${lit ? 'is-lit' : 'is-soft'}${isFocus ? ' is-focus' : ''}${related ? ' is-related' : ''}${mute ? ' is-mute' : ''}" ${nodeAttr}="${escapeHtml(br)}" role="button" tabindex="0" aria-label="${escapeHtml(br)}">
        <circle class="bazi-br-disk" cx="${x}" cy="${y}" r="12" />
        <text class="bazi-br-label" x="${x}" y="${y + 4}" text-anchor="middle">${escapeHtml(br)}</text>
        <circle class="bazi-br-hit" cx="${x}" cy="${y}" r="16" />
      </g>`;
  }).join('');

  const tabs = opts.hideModeTabs
    ? ''
    : `<div class="bazi-br-modes" role="tablist" aria-label="地支关系类型">
        ${BRANCH_RING_MODES.map(
          (m) =>
            `<button type="button" class="bazi-br-mode ${m.id === mode ? 'is-on' : ''}" data-branch-ring-mode="${m.id}" role="tab" aria-selected="${m.id === mode}">${escapeHtml(m.label)}</button>`,
        ).join('')}
      </div>`;

  return `
    <section class="bazi-br-map" data-branch-ring aria-label="${escapeHtml(title)}">
      <div class="bazi-br-head">
        <h2 class="bazi-codex-section-title">${escapeHtml(title)}</h2>
        <p class="bazi-codex-hint">${escapeHtml(meta.hint)} · 点地支看词条</p>
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
