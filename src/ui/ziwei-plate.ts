import { BRANCH_GRID, collectMutagenFlow } from '../ziwei/learn-explain.ts';
import type { LearnFocus } from '../ziwei/learn-explain.ts';
import type { HoroscopeLimitSnap } from '../ziwei/horoscope-limits.ts';
import {
  branchLinksForPalace,
  feixingFromPalace,
  sanfangSizheng,
  type PalaceRelationSet,
} from '../ziwei/palace-relations.ts';
import { normalizeStatus } from '../ziwei/term-glossary.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
import { openZiweiLearnSheet } from './ziwei-learn-sheet.ts';
import {
  buildPlateAwakenCopy,
  classifyPlateStar,
  type PlateStarRef,
} from '../craft/plate-awaken.ts';
import { openPlateAwakenSheet } from '../craft/plate-awaken-sheet.ts';

type LayerMode = 'sanfang' | 'feixing' | 'dizhi';

type Pt = { x: number; y: number };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 宫格四角里，朝向目标点最近的一角（线从角上进出，不占宫心） */
function palaceCornerToward(
  grid: HTMLElement,
  palaceName: string,
  toward: Pt,
  pad = 6,
): Pt | null {
  const cells = grid.querySelectorAll<HTMLElement>('[data-plate-palace]');
  for (const cell of cells) {
    if (cell.dataset.platePalace !== palaceName) continue;
    const gr = grid.getBoundingClientRect();
    const r = cell.getBoundingClientRect();
    const left = r.left - gr.left;
    const top = r.top - gr.top;
    const right = left + r.width;
    const bottom = top + r.height;
    const inset = Math.min(pad, r.width * 0.18, r.height * 0.18);
    const corners: Pt[] = [
      { x: left + inset, y: top + inset },
      { x: right - inset, y: top + inset },
      { x: left + inset, y: bottom - inset },
      { x: right - inset, y: bottom - inset },
    ];
    let best = corners[0]!;
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of corners) {
      const d = (c.x - toward.x) ** 2 + (c.y - toward.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }
  return null;
}

/** 盘心（命主档案中心，否则整盘中心）——选中宫从此朝内角统一出线 */
function plateHub(grid: HTMLElement): Pt {
  const box = centerArchiveBox(grid, 0);
  if (box) {
    return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
  }
  const { width, height } = grid.getBoundingClientRect();
  return { x: width / 2, y: height / 2 };
}

function insetSegment(from: Pt, to: Pt, insetPx: number): { a: Pt; b: Pt; len: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const inset = Math.min(insetPx, len * 0.22);
  const ux = dx / len;
  const uy = dy / len;
  return {
    a: { x: from.x + ux * inset, y: from.y + uy * inset },
    b: { x: to.x - ux * inset, y: to.y - uy * inset },
    len,
  };
}

function mountLinesSvg(grid: HTMLElement, inner: string, extraClass = ''): void {
  grid.querySelectorAll('.ziwei-plate-lines').forEach((n) => n.remove());
  if (!inner) return;
  const { width: w, height: h } = grid.getBoundingClientRect();
  if (w < 2 || h < 2) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `ziwei-plate-lines${extraClass ? ` ${extraClass}` : ''}`);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = inner;
  /* 叠在宫格与命主档案之上，线可穿心而不被裁进格内 */
  grid.appendChild(svg);
}

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

type CellRole = 'self' | 'sanhe' | 'dui' | 'dim' | 'idle';

function cellRole(
  p: PalaceSnap,
  rel: PalaceRelationSet | null,
  layer: LayerMode,
  dizhi: { self: string; targets: Set<string> } | null = null,
): CellRole {
  if (layer === 'dizhi' && dizhi) {
    if (p.name === dizhi.self) return 'self';
    if (dizhi.targets.has(p.name)) return 'dui';
    return 'dim';
  }
  if (!rel || layer !== 'sanfang') {
    if (rel && p.name === rel.self.name) return 'self';
    return 'idle';
  }
  if (p.name === rel.self.name) return 'self';
  if (rel.opposite?.name === p.name) return 'dui';
  if (rel.sanhe.some((s) => s.name === p.name)) return 'sanhe';
  return 'dim';
}

/** 完整宫格：主星+四化+庙旺热区 / 辅星 / 大限·宫名·干支；连续格线无卡片墙 */
function palaceCellHtml(
  p: PalaceSnap,
  role: CellRole,
  limits: HoroscopeLimitSnap | null,
  view: ZiweiChartView,
): string {
  const pos = BRANCH_GRID[p.earthlyBranch];
  const roleCls =
    role === 'self'
      ? 'is-focus'
      : role === 'sanhe'
        ? 'is-sanhe'
        : role === 'dui'
          ? 'is-dui'
          : role === 'dim'
            ? 'is-dim'
            : '';

  const tags: string[] = [];
  if (limits?.decadePalace === p.name) tags.push('限');
  if (limits?.yearPalace === p.name) tags.push('年');
  if (limits?.monthPalace === p.name) tags.push('月');
  if (limits?.dayPalace === p.name) tags.push('日');
  if (limits?.hourPalace === p.name) tags.push('时');
  const marks = tags.length
    ? `<span class="ziwei-plate-marks" aria-hidden="true">${tags.join(' ')}</span>`
    : '';

  const starStateCls = (ref: PlateStarRef) => {
    const kind = classifyPlateStar(ref, view);
    if (kind === 'origin') return 'is-awaken-origin';
    if (kind === 'awakened') return 'is-awaken-lit';
    return 'is-awaken-sealed';
  };

  const majorRows =
    p.majors
      .map((s) => {
        const status = s.brightness ? normalizeStatus(s.brightness) : '';
        const ref: PlateStarRef = { palace: p.name, star: s.name, isMajor: true };
        const state = starStateCls(ref);
        const lock = state === 'is-awaken-sealed' ? '<i class="ziwei-plate-lock" aria-hidden="true">🔒</i>' : '';
        const karma =
          isShaLike(s.name) || s.mutagen === '忌'
            ? ' is-karma-star'
            : '';
        const hua = s.mutagen
          ? (() => {
              const mRef: PlateStarRef = {
                palace: p.name,
                star: s.name,
                mutagenCard: `化${s.mutagen}`,
                isMajor: true,
              };
              const mState = starStateCls(mRef);
              const mLock = mState === 'is-awaken-sealed' ? '<i class="ziwei-plate-lock" aria-hidden="true">🔒</i>' : '';
              const mKarma = s.mutagen === '忌' ? ' is-karma-star' : '';
              return `<button type="button" class="ziwei-plate-hua is-hua-${escapeHtml(s.mutagen)} ${mState}${mKarma}" data-plate-hua="${escapeHtml(s.mutagen)}" data-star-name="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}" aria-label="化${escapeHtml(s.mutagen)}">${mLock}化${escapeHtml(s.mutagen)}</button>`;
            })()
          : '';
        const statusBtn = status
          ? `<button type="button" class="ziwei-plate-status-hit is-status-${status}" data-plate-status="${escapeHtml(status)}" data-star-name="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}" aria-label="星曜状态：${escapeHtml(status)}"><span>${escapeHtml(status)}</span></button>`
          : '';
        return `
          <div class="ziwei-plate-star-row">
            <button type="button" class="ziwei-plate-star is-major ${state}${karma}" data-plate-star="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}">${lock}${escapeHtml(s.name)}</button>
            <span class="ziwei-plate-star-tags">${hua}${statusBtn}</span>
          </div>`;
      })
      .join('') || `<span class="ziwei-plate-empty">空</span>`;

  const minorPool = [...p.minors, ...p.adjectives];
  const showMinors = minorPool.slice(0, 12);
  const more = minorPool.length - showMinors.length;
  const minors =
    showMinors.length > 0
      ? `<div class="ziwei-plate-minors">${showMinors
          .map((s) => {
            const ref: PlateStarRef = {
              palace: p.name,
              star: s.name,
              isMajor: false,
            };
            const state = starStateCls(ref);
            const lock = state === 'is-awaken-sealed' ? '<i class="ziwei-plate-lock" aria-hidden="true">🔒</i>' : '';
            const karma = isShaLike(s.name) ? ' is-karma-star' : '';
            return `<button type="button" class="ziwei-plate-star is-minor ${state}${karma}" data-plate-star="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}">${lock}${escapeHtml(s.name)}</button>`;
          })
          .join('')}${
          more > 0
            ? `<button type="button" class="ziwei-plate-more" data-plate-open-palace="${escapeHtml(p.name)}">+${more}</button>`
            : ''
        }</div>`
      : '';

  const seriesLabels: Record<string, string> = {
    changsheng: '长生',
    boshi: '博士',
    jiangqian: '将前',
    suiqian: '岁前',
  };
  const series =
    p.series && p.series.length
      ? `<div class="ziwei-plate-series" aria-label="十二神">${p.series
          .map(
            (s) =>
              `<button type="button" class="ziwei-plate-star is-series" data-plate-star="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}" title="${escapeHtml(seriesLabels[s.kind] ?? '')}">${escapeHtml(s.name)}</button>`,
          )
          .join('')}</div>`
      : '';

  const dec =
    p.decadalRange != null
      ? `<span class="ziwei-plate-decadal">${p.decadalRange[0]}~${p.decadalRange[1]}</span>`
      : '<span class="ziwei-plate-decadal"></span>';

  return `
    <div class="ziwei-plate-cell ${p.isSoul ? 'is-soul' : ''} ${p.isBody ? 'is-body' : ''} ${roleCls} ${tags.length ? 'is-limit' : ''}"
      data-plate-palace="${escapeHtml(p.name)}"
      style="grid-row:${(pos?.row ?? 0) + 1};grid-column:${(pos?.col ?? 0) + 1}">
      ${marks}
      <div class="ziwei-plate-body">
        ${majorRows}
        ${minors}
        ${series}
      </div>
      <div class="ziwei-plate-foot">
        ${dec}
        <button type="button" class="ziwei-plate-name" data-plate-open-palace="${escapeHtml(p.name)}">${escapeHtml(shortPalace(p.name))}${p.isBody ? '·身' : ''}</button>
        <span class="ziwei-plate-gz">${escapeHtml(p.heavenlyStem)}${escapeHtml(p.earthlyBranch)}</span>
      </div>
    </div>`;
}

function isShaLike(name: string): boolean {
  return ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'].includes(name);
}

function softFlyPath(from: Pt, to: Pt, self: boolean): string {
  if (self) {
    return `M ${from.x - 14} ${from.y} A 16 16 0 1 1 ${from.x + 14} ${from.y}`;
  }
  /* 端点已在宫角，少内缩，避免又缩回宫心 */
  const { a, b } = insetSegment(from, to, 4);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const mx = (a.x + b.x) / 2 - uy * 18;
  const my = (a.y + b.y) / 2 + ux * 18;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

type RectBox = { left: number; top: number; right: number; bottom: number };

function centerArchiveBox(grid: HTMLElement, pad = 8): RectBox | null {
  const center = grid.querySelector<HTMLElement>('.ziwei-plate-center');
  if (!center) return null;
  const gr = grid.getBoundingClientRect();
  const r = center.getBoundingClientRect();
  return {
    left: r.left - gr.left - pad,
    top: r.top - gr.top - pad,
    right: r.right - gr.left + pad,
    bottom: r.bottom - gr.top + pad,
  };
}

function inBox(p: Pt, box: RectBox): boolean {
  return p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom;
}

function pointAlong(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** 线段与矩形边相交的 t∈(0,1) */
function segEdgeIntersectT(a: Pt, b: Pt, c: Pt, d: Pt): number | null {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(den) < 1e-8) return null;
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
  if (t <= 0.001 || t >= 0.999 || u < 0 || u > 1) return null;
  return t;
}

function archiveCrossTs(a: Pt, b: Pt, box: RectBox): number[] {
  const edges: Array<[Pt, Pt]> = [
    [
      { x: box.left, y: box.top },
      { x: box.right, y: box.top },
    ],
    [
      { x: box.right, y: box.top },
      { x: box.right, y: box.bottom },
    ],
    [
      { x: box.right, y: box.bottom },
      { x: box.left, y: box.bottom },
    ],
    [
      { x: box.left, y: box.bottom },
      { x: box.left, y: box.top },
    ],
  ];
  const ts: number[] = [];
  for (const [c, d] of edges) {
    const t = segEdgeIntersectT(a, b, c, d);
    if (t != null) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const out: number[] = [];
  for (const t of ts) {
    if (!out.length || Math.abs(out[out.length - 1]! - t) > 0.01) out.push(t);
  }
  return out;
}

/** 穿过命主档案的线段：档案内淡、外侧保持清晰 */
function pushRelLine(parts: string[], a: Pt, b: Pt, cls: string, box: RectBox | null): void {
  if (!box) {
    parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${cls}" />`);
    return;
  }
  const hits = archiveCrossTs(a, b, box);
  const samplesCross =
    hits.length > 0 ||
    inBox(a, box) ||
    inBox(b, box) ||
    inBox(pointAlong(a, b, 0.5), box);
  if (!samplesCross) {
    parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${cls}" />`);
    return;
  }
  const cuts = [0, ...hits, 1];
  for (let i = 0; i < cuts.length - 1; i++) {
    const t0 = cuts[i]!;
    const t1 = cuts[i + 1]!;
    if (t1 - t0 < 0.008) continue;
    const p0 = pointAlong(a, b, t0);
    const p1 = pointAlong(a, b, t1);
    const mid = pointAlong(a, b, (t0 + t1) / 2);
    const fade = inBox(mid, box) ? ' is-over-archive' : '';
    parts.push(
      `<line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" class="${cls}${fade}" />`,
    );
  }
}

/** 「合/对」放在线段旁（靠近中段），与两端圆点留出距离 */
function relLabelPoint(grid: HTMLElement, a: Pt, b: Pt): Pt {
  const box = centerArchiveBox(grid);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  /** 沿线段比例：避开两端圆点（约 0–0.2 / 0.8–1） */
  const alongTs = [0.45, 0.38, 0.55, 0.32, 0.62, 0.28, 0.68];
  const sideOffsets = [12, 16, 9, 20];
  const candidates: Pt[] = [];
  for (const t of alongTs) {
    const base = pointAlong(a, b, t);
    for (const o of sideOffsets) {
      candidates.push(
        { x: base.x + px * o, y: base.y + py * o },
        { x: base.x - px * o, y: base.y - py * o },
      );
    }
  }
  for (const p of candidates) {
    if (!box || !inBox(p, box)) return p;
  }
  /* 仍落在档案内：退到中段外侧 */
  const mid = pointAlong(a, b, 0.5);
  return { x: mid.x + px * 18, y: mid.y + py * 18 };
}

/** 三方四正：对宫穿心、三合会照；选中宫从一个朝内角统一出线 */
function paintSanfangLines(grid: HTMLElement, rel: PalaceRelationSet): void {
  const hub = plateHub(grid);
  const origin = palaceCornerToward(grid, rel.self.name, hub);
  if (!origin) return;
  const archive = centerArchiveBox(grid, 6);
  const parts: string[] = [
    `<circle cx="${origin.x}" cy="${origin.y}" r="3.8" class="ziwei-plate-rel is-dui is-end is-origin" />`,
  ];
  const draw = (to: PalaceSnap | null | undefined, kind: 'sanhe' | 'dui', label: string) => {
    if (!to) return;
    const b = palaceCornerToward(grid, to.name, origin);
    if (!b) return;
    const cls = `ziwei-plate-rel is-${kind}`;
    const lp = relLabelPoint(grid, origin, b);
    pushRelLine(parts, origin, b, cls, archive);
    parts.push(
      `<circle cx="${b.x}" cy="${b.y}" r="3.5" class="${cls} is-end" />`,
      `<text x="${lp.x}" y="${lp.y}" class="ziwei-plate-rel-label is-${kind}">${label}</text>`,
    );
  };
  for (const s of rel.sanhe) draw(s, 'sanhe', '合');
  draw(rel.opposite, 'dui', '对');
  mountLinesSvg(grid, parts.join(''));
}

function paintFeixingLines(grid: HTMLElement, view: ZiweiChartView, selected: PalaceSnap): void {
  const arrows = feixingFromPalace(view, selected);
  if (!arrows.length) return;
  const hub = plateHub(grid);
  const origin = palaceCornerToward(grid, selected.name, hub);
  if (!origin) return;
  const parts: string[] = [];
  for (const a of arrows) {
    if (a.self) {
      parts.push(
        `<path d="${softFlyPath(origin, origin, true)}" class="ziwei-plate-fly is-hua-${a.kind}" />`,
      );
      continue;
    }
    const pt = palaceCornerToward(grid, a.to.name, origin);
    if (!pt) continue;
    parts.push(
      `<path d="${softFlyPath(origin, pt, false)}" class="ziwei-plate-fly is-hua-${a.kind}" />`,
    );
  }
  mountLinesSvg(grid, parts.join(''), 'is-feixing');
}

function paintDizhiLines(grid: HTMLElement, view: ZiweiChartView, selected: PalaceSnap): void {
  const links = branchLinksForPalace(view, selected);
  if (!links.length) return;
  const hub = plateHub(grid);
  const origin = palaceCornerToward(grid, selected.name, hub);
  if (!origin) return;
  const parts: string[] = [];
  for (const link of links) {
    if (link.from.name === link.to.name) {
      parts.push(
        `<circle cx="${origin.x}" cy="${origin.y}" r="18" class="ziwei-plate-dizhi is-${link.kind}" />`,
      );
      continue;
    }
    const pt = palaceCornerToward(grid, link.to.name, origin);
    if (!pt) continue;
    parts.push(
      `<line x1="${origin.x}" y1="${origin.y}" x2="${pt.x}" y2="${pt.y}" class="ziwei-plate-dizhi is-${link.kind}" />`,
    );
  }
  mountLinesSvg(grid, parts.join(''), 'is-dizhi');
}

/** 中央：固定本命档案（不因选宫被替换） */
function centerHtml(view: ZiweiChartView, limits: HoroscopeLimitSnap | null): string {
  const soulPalace = shortPalace(view.soulPalace.name);
  const bodyPalace = shortPalace(view.bodyPalace.name);
  const flow = collectMutagenFlow(view.palaces);
  const huaPills = flow.length
    ? `<div class="ziwei-plate-center-hua-row" aria-label="生年四化">
        ${flow
          .map(
            (f) =>
              `<button type="button" class="ziwei-plate-center-hua is-hua-${escapeHtml(f.mutagen)}" data-mutagen-star="${escapeHtml(f.star)}" data-plate-hua="${escapeHtml(f.mutagen)}"><em>${escapeHtml(f.star)}</em><span>${escapeHtml(f.mutagen)}</span></button>`,
          )
          .join('')}
      </div>`
    : `<p class="ziwei-plate-center-meta">生年四化暂无</p>`;

  const limitNote = limits
    ? `<p class="ziwei-plate-center-meta is-limit"><span>叠看</span>大限${escapeHtml(shortPalace(limits.decadePalace) || '—')} · 流年命${escapeHtml(shortPalace(limits.yearPalace) || '—')}</p>`
    : '';

  const clock = view.clockLabel || `${view.solarDate} · ${view.timeLabel}`;
  const trueSolar = view.trueSolarLabel || clock;

  return `
    <div class="ziwei-plate-center" aria-label="本命盘档案">
      <p class="ziwei-plate-center-kicker">命主档案</p>
      <p class="ziwei-plate-center-title">${escapeHtml(view.genderLabel)} · <button type="button" class="ziwei-plate-center-ju" data-open-wuxing-ju>${escapeHtml(view.fiveElementsClass)}</button></p>
      <p class="ziwei-plate-center-birth"><span>钟表时间</span>${escapeHtml(clock)}</p>
      <p class="ziwei-plate-center-birth is-true"><span>真太阳时</span>${escapeHtml(trueSolar)}</p>
      ${
        view.placeNote
          ? `<p class="ziwei-plate-center-meta is-place">${escapeHtml(view.placeNote)}</p>`
          : ''
      }
      <p class="ziwei-plate-center-meta"><span>命主</span>${escapeHtml(view.soul || '—')} · <span>身主</span>${escapeHtml(view.body || '—')}</p>
      <p class="ziwei-plate-center-meta"><span>命宫</span>${escapeHtml(soulPalace)} · <span>身宫</span>${escapeHtml(bodyPalace)}</p>
      ${huaPills}
      ${limitNote}
    </div>`;
}

/** 流年四化（仅叠看运限时出现在盘下；生年四化在盘心） */
function mutagenLineHtml(limits: HoroscopeLimitSnap | null): string {
  if (!limits?.yearMutagenLine) return '';
  const parts = limits.yearMutagenLine.split(' · ').filter(Boolean);
  const html = parts
    .map((chunk) => {
      const m = chunk.match(/^(.+)化([禄权科忌])$/);
      if (!m) return escapeHtml(chunk);
      return `<button type="button" class="ziwei-plate-mutagen-item" data-mutagen-star="${escapeHtml(m[1]!)}" data-plate-hua="${escapeHtml(m[2]!)}">${escapeHtml(m[1]!)}化${escapeHtml(m[2]!)}</button>`;
    })
    .join('<span class="ziwei-plate-mutagen-sep"> · </span>');
  return `<p class="ziwei-plate-mutagen" aria-label="流年四化"><span class="ziwei-plate-mutagen-label">流年四化</span>${html}</p>`;
}

function layerExplainTerm(mode: LayerMode): string {
  if (mode === 'feixing') return '四化';
  if (mode === 'dizhi') return '地支关系';
  return '三方四正';
}

export type MountZiweiPlateOptions = {
  initialPalace?: string;
};

export type MountZiweiPlateHandle = {
  destroy: () => void;
  selectPalace: (name: string) => void;
  /** 运限切换：宫位角标 + 流年四化 + 聚焦对应运限命宫 */
  applyLimits: (
    snap: HoroscopeLimitSnap,
    focus?: 'decade' | 'year' | 'month' | 'day' | 'hour',
    opts?: { select?: boolean },
  ) => void;
};

/**
 * 连续式紫微命盘：整体格线、宫内三行、中央摘要、四化单行、轻量图层。
 */
export function mountZiweiPlate(
  host: HTMLElement,
  view: ZiweiChartView,
  opts?: MountZiweiPlateOptions,
): MountZiweiPlateHandle {
  let selected: PalaceSnap | null = opts?.initialPalace
    ? (view.palaces.find(
        (p) =>
          p.name === opts.initialPalace ||
          p.name.replace(/宫$/, '') === opts.initialPalace!.replace(/宫$/, ''),
      ) ?? null)
    : null;

  let layer: LayerMode = 'sanfang';
  /** 三方四正：有选中宫才画线；隐藏连线时清空选中 */
  let showSanfangLines = Boolean(opts?.initialPalace);
  let limits: HoroscopeLimitSnap | null = null;
  let lineResizeObs: ResizeObserver | null = null;

  function findPalace(name: string): PalaceSnap | null {
    return (
      view.palaces.find(
        (p) =>
          p.name === name || p.name.replace(/宫$/, '') === name.replace(/宫$/, ''),
      ) ?? null
    );
  }

  function applyFocusHighlight(focus: LearnFocus): void {
    if (focus.palaceName) {
      selected = findPalace(focus.palaceName) ?? selected;
    } else if (focus.starName) {
      const palace = view.palaces.find((p) =>
        [...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === focus.starName),
      );
      if (palace) selected = palace;
    }
  }

  function openLearn(focus: LearnFocus): void {
    applyFocusHighlight(focus);
    paint();
    openZiweiLearnSheet({
      view,
      focus,
      onOpenChart: () => undefined,
      onFocusChange: (f) => {
        applyFocusHighlight(f);
        paint();
      },
      onClose: () => paint(),
    });
  }

  /** 点一下：只切换宫线；同一宫再点一下：开详细释义（与图层 tab 一致） */
  function selectPalaceOrLearn(name: string): void {
    const next = findPalace(name);
    if (!next) return;
    const same =
      selected != null &&
      (selected.name === next.name ||
        selected.name.replace(/宫$/, '') === next.name.replace(/宫$/, ''));
    if (same) {
      openLearn({ kind: 'palace', palaceName: next.name });
      return;
    }
    selected = next;
    if (layer === 'sanfang') showSanfangLines = true;
    paint();
  }

  function paint(): void {
    const rel = selected ? sanfangSizheng(view, selected) : null;
    const dizhi =
      selected && layer === 'dizhi'
        ? {
            self: selected.name,
            targets: new Set(
              branchLinksForPalace(view, selected).map((l) => l.to.name),
            ),
          }
        : null;
    const byBranch = new Map(view.palaces.map((p) => [p.earthlyBranch, p]));
    const cells = Object.keys(BRANCH_GRID)
      .map((br) => {
        const p = byBranch.get(br);
        if (!p) return '';
        return palaceCellHtml(p, cellRole(p, rel, layer, dizhi), limits, view);
      })
      .join('');

    const selecting =
      selected && layer === 'sanfang'
        ? 'is-selecting'
        : selected && layer === 'dizhi'
          ? 'is-picked is-dizhi-focus'
          : selected
            ? 'is-picked'
            : '';

    const overlayNote = limits
      ? `<p class="ziwei-plate-overlay-note">本命盘固定 · 当前叠看流年（${escapeHtml(limits.yearGZ || '—')}）流年命宫「${escapeHtml(shortPalace(limits.yearPalace) || '—')}」</p>`
      : `<p class="ziwei-plate-overlay-note">本命盘固定 · 点下方年份，叠看那一年的流年信息</p>`;

    lineResizeObs?.disconnect();
    lineResizeObs = null;

    const linesToggle =
      layer === 'sanfang' && selected
        ? `<button type="button" class="ziwei-plate-nav-lines ${showSanfangLines ? 'is-on' : ''}" data-toggle-lines>${
            showSanfangLines ? '隐藏连线' : '显示连线'
          }</button>`
        : '';

    host.innerHTML = `
      <div class="ziwei-plate ${selecting}" aria-label="完整命盘">
        ${overlayNote}
        <nav class="ziwei-plate-nav" aria-label="命盘图层">
          <div class="ziwei-plate-nav-tabs" role="tablist">
            <button type="button" role="tab" class="ziwei-plate-nav-item ${layer === 'sanfang' ? 'is-on' : ''}" data-layer="sanfang" aria-selected="${layer === 'sanfang'}" title="再点一次看解释">三方四正</button>
            <button type="button" role="tab" class="ziwei-plate-nav-item ${layer === 'feixing' ? 'is-on' : ''}" data-layer="feixing" aria-selected="${layer === 'feixing'}" title="再点一次看解释">四化飞星</button>
            <button type="button" role="tab" class="ziwei-plate-nav-item ${layer === 'dizhi' ? 'is-on' : ''}" data-layer="dizhi" aria-selected="${layer === 'dizhi'}" title="再点一次看解释">地支关系</button>
          </div>
          ${linesToggle}
        </nav>

        <div class="ziwei-plate-board">
          <div class="ziwei-plate-grid">
            ${cells}
            ${centerHtml(view, limits)}
          </div>
        </div>

        ${mutagenLineHtml(limits)}
      </div>`;

    const syncLines = () => {
      const grid = host.querySelector<HTMLElement>('.ziwei-plate-grid');
      if (!grid || !selected) return;
      if (layer === 'sanfang' && showSanfangLines && rel) paintSanfangLines(grid, rel);
      else if (layer === 'feixing') paintFeixingLines(grid, view, selected);
      else if (layer === 'dizhi') paintDizhiLines(grid, view, selected);
      else grid.querySelectorAll('.ziwei-plate-lines').forEach((n) => n.remove());
    };
    requestAnimationFrame(syncLines);
    const gridEl = host.querySelector<HTMLElement>('.ziwei-plate-grid');
    if (gridEl && typeof ResizeObserver !== 'undefined') {
      lineResizeObs = new ResizeObserver(() => syncLines());
      lineResizeObs.observe(gridEl);
    }

    host.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.layer as LayerMode;
        if (next === layer) {
          openLearn({
            kind: 'structure',
            term: layerExplainTerm(next),
            palaceName: selected?.name,
          });
          return;
        }
        layer = next;
        if (layer === 'sanfang') {
          /* 切回三方：仅在已选宫时恢复连线，不默认点宫 */
          showSanfangLines = selected != null;
        }
        paint();
      });
    });

    host.querySelector('[data-toggle-lines]')?.addEventListener('click', () => {
      if (showSanfangLines) {
        showSanfangLines = false;
        selected = null;
      } else if (selected) {
        showSanfangLines = true;
      }
      paint();
    });

    host.querySelector('[data-open-wuxing-ju]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openLearn({
        kind: 'structure',
        term: view.fiveElementsClass || '五行局',
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-palace]').forEach((cell) => {
      cell.title = '点一下看连线 · 再点一次看详细释义';
      cell.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        if (
          t.closest(
            '[data-plate-star], [data-plate-status], [data-plate-hua], [data-plate-open-palace], .ziwei-plate-mutagen-item',
          )
        ) {
          return;
        }
        selectPalaceOrLearn(cell.dataset.platePalace ?? '');
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-star]').forEach((el) => {
      const isSeries = el.classList.contains('is-series');
      el.title = isSeries
        ? '点一下亮所在宫连线 · 再点看星曜释义'
        : '点星曜：本源已亮 / 试炼激活';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const palaceName = el.dataset.palaceName ?? '';
        const starName = el.dataset.plateStar ?? '';

        if (isSeries) {
          const samePalace =
            selected != null &&
            !!palaceName &&
            (selected.name === palaceName ||
              selected.name.replace(/宫$/, '') === palaceName.replace(/宫$/, ''));
          if (palaceName && !samePalace) {
            selected = findPalace(palaceName);
            if (layer === 'sanfang') showSanfangLines = true;
            paint();
            return;
          }
          openLearn({
            kind: 'star',
            starName,
            palaceName: palaceName || undefined,
          });
          return;
        }

        if (palaceName) {
          selected = findPalace(palaceName);
          if (layer === 'sanfang') showSanfangLines = true;
        }
        const isMajor = el.classList.contains('is-major');
        const ref: PlateStarRef = {
          palace: palaceName,
          star: starName,
          isMajor,
        };
        const kind = classifyPlateStar(ref, view);
        const copy = buildPlateAwakenCopy(ref, kind);
        paint();
        openPlateAwakenSheet({
          ref,
          copy,
          onDone: (result) => {
            if (result === 'activate') {
              paint();
              return;
            }
            if (result === 'sanfang') {
              selected = findPalace(palaceName) ?? selected;
              layer = 'sanfang';
              showSanfangLines = true;
              paint();
              return;
            }
            if (result === 'learn') {
              openLearn({
                kind: 'star',
                starName,
                palaceName: palaceName || undefined,
              });
              return;
            }
            paint();
          },
        });
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-status]').forEach((el) => {
      el.title = '点一下亮所在宫连线 · 再点看状态释义';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const palaceName = el.dataset.palaceName ?? '';
        const samePalace =
          selected != null &&
          !!palaceName &&
          (selected.name === palaceName ||
            selected.name.replace(/宫$/, '') === palaceName.replace(/宫$/, ''));
        if (palaceName && !samePalace) {
          selected = findPalace(palaceName);
          if (layer === 'sanfang') showSanfangLines = true;
          paint();
          return;
        }
        openLearn({
          kind: 'status',
          status: el.dataset.plateStatus,
          starName: el.dataset.starName,
          palaceName: palaceName || undefined,
        });
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-hua]').forEach((el) => {
      el.title = '点四化：试炼激活或查看本源';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const palaceName = el.dataset.palaceName ?? '';
        const hua = el.dataset.plateHua ?? '';
        const starName = el.dataset.starName || el.dataset.mutagenStar || '';
        if (palaceName) {
          selected = findPalace(palaceName);
          if (layer === 'sanfang') showSanfangLines = true;
        }
        // 底部流年四化行无宫名 → 直接释义
        if (!palaceName) {
          openLearn({
            kind: 'mutagen',
            term: `化${hua}`,
            starName: starName || undefined,
          });
          return;
        }
        const ref: PlateStarRef = {
          palace: palaceName,
          star: starName,
          mutagenCard: `化${hua}`,
          isMajor: true,
        };
        const kind = classifyPlateStar(ref, view);
        const copy = buildPlateAwakenCopy(ref, kind);
        paint();
        openPlateAwakenSheet({
          ref,
          copy,
          onDone: (result) => {
            if (result === 'activate') {
              paint();
              return;
            }
            if (result === 'sanfang') {
              selected = findPalace(palaceName) ?? selected;
              layer = 'sanfang';
              showSanfangLines = true;
              paint();
              return;
            }
            if (result === 'learn') {
              openLearn({
                kind: 'mutagen',
                term: `化${hua}`,
                starName: starName || undefined,
                palaceName,
              });
              return;
            }
            paint();
          },
        });
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-open-palace]').forEach((el) => {
      el.title = '点一下看连线 · 再点一次看详细释义';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPalaceOrLearn(el.dataset.plateOpenPalace ?? '');
      });
    });
  }

  paint();
  return {
    destroy: () => {
      lineResizeObs?.disconnect();
      lineResizeObs = null;
      host.innerHTML = '';
    },
    selectPalace: (name: string) => {
      selected = findPalace(name) ?? selected;
      if (layer === 'sanfang') showSanfangLines = true;
      paint();
    },
    applyLimits: (snap, focus = 'year', opts) => {
      limits = snap;
      if (focus === 'year' || focus === 'decade') layer = 'sanfang';
      if (opts?.select !== false) {
        const map = {
          decade: snap.decadePalace,
          year: snap.yearPalace,
          month: snap.monthPalace,
          day: snap.dayPalace,
          hour: snap.hourPalace,
        } as const;
        const target = map[focus] || snap.yearPalace || snap.decadePalace;
        if (target) {
          selected = findPalace(target) ?? selected;
          if (layer === 'sanfang') showSanfangLines = true;
        }
      }
      paint();
    },
  };
}
