import { BRANCH_GRID, collectMutagenFlow } from '../ziwei/learn-explain.ts';
import type { LearnFocus } from '../ziwei/learn-explain.ts';
import type { HoroscopeLimitSnap } from '../ziwei/horoscope-limits.ts';
import { getPalaceLore } from '../ziwei/palace-lore.ts';
import {
  branchLinksForPalace,
  branchPoint,
  feixingFromPalace,
  sanfangSizheng,
  type PalaceRelationSet,
} from '../ziwei/palace-relations.ts';
import { getStarProfile } from '../ziwei/star-profiles.ts';
import { normalizeStatus } from '../ziwei/term-glossary.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
import { openZiweiLearnSheet } from './ziwei-learn-sheet.ts';

type LayerMode = 'sanfang' | 'feixing' | 'dizhi';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

type CellRole = 'self' | 'sanhe' | 'dui' | 'dim' | 'idle';

function cellRole(
  p: PalaceSnap,
  rel: PalaceRelationSet | null,
  layer: LayerMode,
): CellRole {
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

  const majorRows =
    p.majors
      .map((s) => {
        const status = s.brightness ? normalizeStatus(s.brightness) : '';
        const hua = s.mutagen
          ? `<button type="button" class="ziwei-plate-hua is-hua-${escapeHtml(s.mutagen)}" data-plate-hua="${escapeHtml(s.mutagen)}" data-star-name="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}" aria-label="化${escapeHtml(s.mutagen)}">${escapeHtml(s.mutagen)}</button>`
          : '';
        const statusBtn = status
          ? `<button type="button" class="ziwei-plate-status-hit is-status-${status}" data-plate-status="${escapeHtml(status)}" data-star-name="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}" aria-label="星曜状态：${escapeHtml(status)}"><span>${escapeHtml(status)}</span></button>`
          : '';
        return `
          <div class="ziwei-plate-star-row">
            <button type="button" class="ziwei-plate-star is-major" data-plate-star="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}">${escapeHtml(s.name)}</button>
            <span class="ziwei-plate-star-tags">${hua}${statusBtn}</span>
          </div>`;
      })
      .join('') || `<span class="ziwei-plate-empty">空</span>`;

  const minorPool = [...p.minors, ...p.adjectives];
  const showMinors = minorPool.slice(0, 10);
  const more = minorPool.length - showMinors.length;
  const minors =
    showMinors.length > 0
      ? `<div class="ziwei-plate-minors">${showMinors
          .map(
            (s) =>
              `<button type="button" class="ziwei-plate-star is-minor" data-plate-star="${escapeHtml(s.name)}" data-palace-name="${escapeHtml(p.name)}">${escapeHtml(s.name)}</button>`,
          )
          .join('')}${
          more > 0
            ? `<button type="button" class="ziwei-plate-more" data-plate-open-palace="${escapeHtml(p.name)}">+${more}</button>`
            : ''
        }</div>`
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
      </div>
      <div class="ziwei-plate-foot">
        ${dec}
        <button type="button" class="ziwei-plate-name" data-plate-open-palace="${escapeHtml(p.name)}">${escapeHtml(shortPalace(p.name))}${p.isBody ? '·身' : ''}</button>
        <span class="ziwei-plate-gz">${escapeHtml(p.heavenlyStem)}${escapeHtml(p.earthlyBranch)}</span>
      </div>
    </div>`;
}

function sanfangLinesSvg(rel: PalaceRelationSet): string {
  const selfPt = branchPoint(rel.self.earthlyBranch);
  if (!selfPt) return '';
  const parts: string[] = [];
  const draw = (to: PalaceSnap | null | undefined, cls: string) => {
    if (!to) return;
    const pt = branchPoint(to.earthlyBranch);
    if (!pt) return;
    const dx = pt.x - selfPt.x;
    const dy = pt.y - selfPt.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    parts.push(
      `<line x1="${selfPt.x + ux * 0.22}" y1="${selfPt.y + uy * 0.22}" x2="${pt.x - ux * 0.22}" y2="${pt.y - uy * 0.22}" class="${cls}" />`,
    );
  };
  for (const s of rel.sanhe) draw(s, 'ziwei-plate-rel is-sanhe');
  draw(rel.opposite, 'ziwei-plate-rel is-dui');
  return parts.length
    ? `<svg class="ziwei-plate-lines" viewBox="0 0 4 4" preserveAspectRatio="none" aria-hidden="true">${parts.join('')}</svg>`
    : '';
}

function softFlyPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  self: boolean,
): string {
  if (self) {
    return `M ${from.x - 0.12} ${from.y} A 0.14 0.14 0 1 1 ${from.x + 0.12} ${from.y}`;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const x1 = from.x + ux * 0.22;
  const y1 = from.y + uy * 0.22;
  const x2 = to.x - ux * 0.22;
  const y2 = to.y - uy * 0.22;
  const mx = (x1 + x2) / 2 - uy * 0.08;
  const my = (y1 + y2) / 2 + ux * 0.08;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

function feixingLinesSvg(view: ZiweiChartView, selected: PalaceSnap): string {
  const arrows = feixingFromPalace(view, selected);
  if (!arrows.length) return '';
  const parts: string[] = [];
  for (const a of arrows) {
    const pf = branchPoint(a.from.earthlyBranch);
    const pt = branchPoint(a.to.earthlyBranch);
    if (!pf || !pt) continue;
    parts.push(
      `<path d="${softFlyPath(pf, pt, a.self)}" class="ziwei-plate-fly is-hua-${a.kind}" />`,
    );
  }
  return `<svg class="ziwei-plate-lines is-feixing" viewBox="0 0 4 4" preserveAspectRatio="none" aria-hidden="true">${parts.join('')}</svg>`;
}

function dizhiLinesSvg(view: ZiweiChartView, selected: PalaceSnap): string {
  const links = branchLinksForPalace(view, selected);
  if (!links.length) return '';
  const parts: string[] = [];
  for (const link of links) {
    const pf = branchPoint(link.from.earthlyBranch);
    const pt = branchPoint(link.to.earthlyBranch);
    if (!pf || !pt) continue;
    if (link.from.name === link.to.name) {
      parts.push(
        `<circle cx="${pf.x}" cy="${pf.y}" r="0.18" class="ziwei-plate-dizhi is-${link.kind}" />`,
      );
    } else {
      parts.push(
        `<line x1="${pf.x}" y1="${pf.y}" x2="${pt.x}" y2="${pt.y}" class="ziwei-plate-dizhi is-${link.kind}" />`,
      );
    }
  }
  return `<svg class="ziwei-plate-lines is-dizhi" viewBox="0 0 4 4" preserveAspectRatio="none" aria-hidden="true">${parts.join('')}</svg>`;
}

/** 中央：固定本命档案（不因选宫被替换） */
function centerHtml(view: ZiweiChartView, limits: HoroscopeLimitSnap | null): string {
  const birth = `${view.solarDate} · ${view.timeLabel}`;
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

  return `
    <div class="ziwei-plate-center" aria-label="本命盘档案">
      <p class="ziwei-plate-center-kicker">命主档案</p>
      <p class="ziwei-plate-center-title">${escapeHtml(view.genderLabel)} · <button type="button" class="ziwei-plate-center-ju" data-open-wuxing-ju>${escapeHtml(view.fiveElementsClass)}</button></p>
      <p class="ziwei-plate-center-birth">${escapeHtml(birth)}</p>
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

function selectedBlurb(selected: PalaceSnap): string {
  const major = selected.majors[0];
  const lore = getPalaceLore(selected.name);
  const profile = major ? getStarProfile(major.name) : undefined;
  let blurb: string;
  if (major) {
    const sit = `${major.name}坐${shortPalace(selected.name)}`;
    const tip = (profile?.oneLiner ?? lore?.oneLiner ?? '')
      .replace(/^它像/, '')
      .replace(/——.*$/, '')
      .slice(0, 48);
    blurb = tip ? `${sit}，${tip}` : sit;
  } else {
    blurb = lore?.oneLiner ?? `${selected.name}主星空象，重看对宫与三合。`;
  }
  if (blurb.length > 64) blurb = `${blurb.slice(0, 63)}…`;
  return blurb;
}

function detailHtml(
  selected: PalaceSnap | null,
  rel: PalaceRelationSet | null,
  layer: LayerMode,
  showLines: boolean,
  view: ZiweiChartView,
  limits: HoroscopeLimitSnap | null,
): string {
  if (!selected || !rel) {
    return `
      <section class="ziwei-plate-detail">
        <p class="ziwei-plate-detail-hint">点宫位查看三方与对宫；盘心始终是本命档案。</p>
      </section>`;
  }

  const san = rel.sanhe.map((p) => shortPalace(p.name)).join(' · ') || '—';
  const dui = rel.opposite ? shortPalace(rel.opposite.name) : '—';
  const isYearSoul = Boolean(limits?.yearPalace && selected.name === limits.yearPalace);
  const kicker = isYearSoul
    ? `流年命宫｜${escapeHtml(shortPalace(selected.name))}`
    : `正在查看｜${escapeHtml(shortPalace(selected.name))}`;

  const dizhiBlock =
    layer === 'dizhi'
      ? (() => {
          const links = branchLinksForPalace(view, selected);
          const rows = links.length
            ? links
                .map(
                  (l) =>
                    `<p class="ziwei-plate-detail-row is-dizhi"><span>${escapeHtml(l.kind)}</span>${escapeHtml(l.label)} → ${escapeHtml(shortPalace(l.to.name))}</p>`,
                )
                .join('')
            : `<p class="ziwei-plate-detail-hint">本宫地支暂无冲合刑标注。</p>`;
          return `
            <div class="ziwei-plate-dizhi-panel">
              <p class="ziwei-plate-detail-kicker">地支关系 · ${escapeHtml(selected.earthlyBranch)}</p>
              ${rows}
              <div class="ziwei-plate-detail-actions">
                <button type="button" class="ziwei-plate-text-btn" data-open-dizhi-term="六冲">六冲图解</button>
                <button type="button" class="ziwei-plate-text-btn" data-open-dizhi-term="六合">六合图解</button>
              </div>
            </div>`;
        })()
      : '';

  return `
    <section class="ziwei-plate-detail">
      <header class="ziwei-plate-detail-head">
        <p class="ziwei-plate-detail-kicker">${kicker}</p>
        <h2 class="ziwei-plate-detail-title">${escapeHtml(selected.name)}</h2>
        <p class="ziwei-plate-detail-blurb">${escapeHtml(selectedBlurb(selected))}</p>
      </header>
      <p class="ziwei-plate-detail-row"><span>三合</span>${escapeHtml(san)}</p>
      <p class="ziwei-plate-detail-row"><span>对宫</span>${escapeHtml(dui)}</p>
      ${dizhiBlock}
      <div class="ziwei-plate-detail-actions">
        ${
          layer === 'sanfang'
            ? `<button type="button" class="ziwei-plate-text-btn ${showLines ? 'is-on' : ''}" data-toggle-lines>${
                showLines ? '隐藏连线' : '显示连线'
              }</button>`
            : ''
        }
        <button type="button" class="ziwei-plate-text-btn" data-open-palace>宫位详情</button>
        <button type="button" class="ziwei-plate-text-btn" data-open-rel-explain>关系解释</button>
      </div>
    </section>`;
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
  let showSanfangLines = false;
  let limits: HoroscopeLimitSnap | null = null;

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

  function paint(): void {
    const rel = selected ? sanfangSizheng(view, selected) : null;
    const byBranch = new Map(view.palaces.map((p) => [p.earthlyBranch, p]));
    const cells = Object.keys(BRANCH_GRID)
      .map((br) => {
        const p = byBranch.get(br);
        if (!p) return '';
        return palaceCellHtml(p, cellRole(p, rel, layer), limits);
      })
      .join('');

    let lineLayer = '';
    if (selected) {
      if (layer === 'sanfang' && showSanfangLines && rel) lineLayer = sanfangLinesSvg(rel);
      else if (layer === 'feixing') lineLayer = feixingLinesSvg(view, selected);
      else if (layer === 'dizhi') lineLayer = dizhiLinesSvg(view, selected);
    }

    const selecting =
      selected && layer === 'sanfang' ? 'is-selecting' : selected ? 'is-picked' : '';

    const overlayNote = limits
      ? `<p class="ziwei-plate-overlay-note">本命盘固定 · 当前叠看流年（${escapeHtml(limits.yearGZ || '—')}）流年命宫「${escapeHtml(shortPalace(limits.yearPalace) || '—')}」</p>`
      : `<p class="ziwei-plate-overlay-note">本命盘固定 · 点下方年份，叠看那一年的流年信息</p>`;

    host.innerHTML = `
      <div class="ziwei-plate ${selecting}" aria-label="完整命盘">
        ${overlayNote}
        <nav class="ziwei-plate-nav" role="tablist" aria-label="命盘图层">
          <button type="button" role="tab" class="ziwei-plate-nav-item ${layer === 'sanfang' ? 'is-on' : ''}" data-layer="sanfang" aria-selected="${layer === 'sanfang'}">三方四正</button>
          <button type="button" role="tab" class="ziwei-plate-nav-item ${layer === 'feixing' ? 'is-on' : ''}" data-layer="feixing" aria-selected="${layer === 'feixing'}">四化飞星</button>
          <button type="button" role="tab" class="ziwei-plate-nav-item ${layer === 'dizhi' ? 'is-on' : ''}" data-layer="dizhi" aria-selected="${layer === 'dizhi'}">地支关系</button>
        </nav>

        <div class="ziwei-plate-board">
          <div class="ziwei-plate-grid">
            ${lineLayer}
            ${cells}
            ${centerHtml(view, limits)}
          </div>
        </div>

        ${mutagenLineHtml(limits)}
        ${detailHtml(selected, rel, layer, showSanfangLines, view, limits)}
      </div>`;

    host.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.layer as LayerMode;
        layer = next;
        if (layer !== 'sanfang') showSanfangLines = false;
        paint();
      });
    });

    host.querySelector('[data-toggle-lines]')?.addEventListener('click', () => {
      showSanfangLines = !showSanfangLines;
      paint();
    });

    host.querySelector('[data-open-palace]')?.addEventListener('click', () => {
      if (!selected) return;
      openLearn({ kind: 'palace', palaceName: selected.name });
    });

    host.querySelector('[data-open-rel-explain]')?.addEventListener('click', () => {
      openLearn({
        kind: 'structure',
        term: '三方四正',
        palaceName: selected?.name,
      });
    });

    host.querySelector('[data-open-wuxing-ju]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openLearn({
        kind: 'structure',
        term: view.fiveElementsClass || '五行局',
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-open-dizhi-term]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLearn({
          kind: 'structure',
          term: btn.dataset.openDizhiTerm ?? '六冲',
          palaceName: selected?.name,
        });
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-palace]').forEach((cell) => {
      cell.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        if (
          t.closest(
            '[data-plate-star], [data-plate-status], [data-plate-hua], [data-plate-open-palace], .ziwei-plate-mutagen-item',
          )
        ) {
          return;
        }
        selected = findPalace(cell.dataset.platePalace ?? '');
        showSanfangLines = false;
        paint();
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-star]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openLearn({
          kind: 'star',
          starName: el.dataset.plateStar,
          palaceName: el.dataset.palaceName,
        });
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-status]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openLearn({
          kind: 'status',
          status: el.dataset.plateStatus,
          starName: el.dataset.starName,
          palaceName: el.dataset.palaceName,
        });
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-hua]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const hua = el.dataset.plateHua ?? '';
        openLearn({
          kind: 'mutagen',
          term: `化${hua}`,
          starName: el.dataset.starName || el.dataset.mutagenStar,
          palaceName: el.dataset.palaceName,
        });
      });
    });

    host.querySelectorAll<HTMLElement>('[data-plate-open-palace]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = el.dataset.plateOpenPalace ?? '';
        selected = findPalace(name);
        showSanfangLines = false;
        paint();
        openLearn({ kind: 'palace', palaceName: name });
      });
    });
  }

  paint();
  return {
    destroy: () => {
      host.innerHTML = '';
    },
    selectPalace: (name: string) => {
      selected = findPalace(name) ?? selected;
      showSanfangLines = false;
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
        if (target) selected = findPalace(target) ?? selected;
      }
      showSanfangLines = false;
      paint();
    },
  };
}
