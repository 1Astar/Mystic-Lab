import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  baziCodexProgress,
  isBaziCodexUnlocked,
  listBaziCodexEntries,
  listMetCodexTags,
  wuxingUnlockHint,
} from '../bazi/codex.ts';
import {
  BRANCH_LORE,
  STEM_LORE,
  WUXING_LORE,
  WUXING_ORDER,
  branchesOfWuxing,
  stemsOfWuxing,
  type StemBranchLore,
} from '../bazi/codex-lore.ts';
import {
  stemBranchArtSvg,
  tengodArtSvg,
  wuxingArtSvg,
} from '../bazi/codex-art.ts';
import { memoryCoverHtml, getCodexCoverSrc, shenshaBadgeArtHtml } from '../bazi/codex-cover.ts';
import { renderRelationsAtlasHtml } from '../bazi/codex-relations-atlas.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import {
  TENGOD_CARDS,
  getStarCard,
  getStarCardByName,
  shenshaCardId,
  staticTagsForBranch,
  staticTagsForStem,
  tengodCardId,
  type CodexTag,
  type StarCardLore,
} from '../bazi/codex-tags.ts';
import { getShenshaVisual } from '../bazi/codex-shensha-visual.ts';
import {
  SHENSHA_FEATURED,
  SHENSHA_TAG,
} from '../bazi/codex-shensha-tiers.ts';
import { renderWuxingShengKeMapHtml } from '../bazi/codex-wuxing-map.ts';
import {
  renderBranchRelationRingHtml,
  type BranchRingMode,
} from '../bazi/codex-branch-ring.ts';
import {
  getBaziEncyclopedia,
  isAtlasLibraryKind,
} from '../bazi/codex-encyclopedia.ts';
import { buildCodexDossier, cardMetaLabels } from '../bazi/codex-dossier.ts';
import {
  buildChartLinkReport,
  chartPresenceLabel,
} from '../bazi/codex-chart-link.ts';
import {
  LUCK_ATLAS,
  NAYIN_ATLAS,
  RELATION_ATLAS,
  SHENSHA_ATLAS,
  SHENSHA_CATEGORIES,
  jiaziId,
  listSixtyJiazi,
  nayinId,
  shenshaAtlasByCategory,
} from '../bazi/codex-atlas-catalog.ts';
import { castBaziChart, type BaziChart } from '../bazi/cast.ts';
import { nayinOf } from '../bazi/pillar-meta.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import { buildEnergyBalance } from '../bazi/sense-energy.ts';
import { wuxingClass, type WuXing } from '../bazi/elements.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import {
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
} from '../life/storage.ts';
import {
  bindBaziCodexDetail,
  renderBaziCodexDetailHtml,
} from '../ui/bazi-codex-detail.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type Tab =
  | 'relation'
  | 'stem'
  | 'branch'
  | 'tengod'
  | 'shensha'
  | 'nayin'
  | 'jiazi'
  | 'luck'
  | 'mine';

const TAB_ORDER: Tab[] = [
  'relation',
  'stem',
  'branch',
  'tengod',
  'shensha',
  'nayin',
  'jiazi',
  'luck',
  'mine',
];

const TAB_GUIDE: Record<Tab, string> = {
  relation: '五行生克 · 地支合冲刑害 · 天干五合',
  stem: '你的核心性格底色',
  branch: '环境、根基与行动方式',
  tengod: '你如何与世界发生关系',
  shensha: '神煞知识库 · 按类浏览（辅助信息，勿单断）',
  nayin: '三十纳音 · 干支组合的气象象意',
  jiazi: '六十甲子 · 每柱干支的完整索引',
  luck: '大运流年基础概念 · 如何触发原局',
  mine: '四柱速读 + 盘上已遇见的星煞',
};

function parseTab(raw: string | undefined): Tab {
  if (raw === 'wuxing' || raw === 'bonds') return 'relation';
  if (raw && (TAB_ORDER as string[]).includes(raw)) return raw as Tab;
  return 'relation';
}

export function renderBaziCodex(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-codex-page';
  mountEnvBanner(page);
  root.appendChild(page);

  let tab: Tab = 'relation';
  let detailId: string | null = null;
  let branchRingMode: BranchRingMode = 'chong';
  /** 生克图聚焦：只亮某一行的相关边 */
  let wuxingFocus: WuXing | null = null;
  try {
    const pending = sessionStorage.getItem('mystic-lab-open-codex-id');
    if (pending) {
      sessionStorage.removeItem('mystic-lab-open-codex-id');
      detailId = pending;
      const enc = getBaziEncyclopedia(pending);
      if (enc?.kind === 'nayin') tab = 'nayin';
      else if (enc?.kind === 'jiazi') tab = 'jiazi';
      else if (enc?.kind === 'relation') tab = 'relation';
      else if (enc?.kind === 'luck') tab = 'luck';
      else if (enc?.kind === 'shensha') tab = 'shensha';
      else if (enc?.kind === 'stem') tab = 'stem';
      else if (enc?.kind === 'branch') tab = 'branch';
      else if (enc?.kind === 'tengod') tab = 'tengod';
      else if (enc?.kind === 'wuxing') {
        tab = 'relation';
        if (WUXING_ORDER.includes(pending as WuXing)) wuxingFocus = pending as WuXing;
      }
    }
  } catch {
    /* ignore */
  }
  const entries = () => new Map(listBaziCodexEntries().map((e) => [e.id, e]));

  function openEntry(id: string): void {
    if (!id) return;
    const enc = getBaziEncyclopedia(id);
    if (enc) {
      if (enc.kind === 'wuxing') tab = 'relation';
      else if (enc.kind === 'stem') tab = 'stem';
      else if (enc.kind === 'branch') tab = 'branch';
      else if (enc.kind === 'tengod') tab = 'tengod';
      else if (enc.kind === 'shensha') tab = 'shensha';
      else if (enc.kind === 'nayin') tab = 'nayin';
      else if (enc.kind === 'jiazi') tab = 'jiazi';
      else if (enc.kind === 'relation') tab = 'relation';
      else if (enc.kind === 'luck') tab = 'luck';
    } else if (WUXING_ORDER.includes(id as WuXing)) {
      tab = 'relation';
    } else if (STEM_LORE.some((s) => s.id === id)) {
      tab = 'stem';
    } else if (BRANCH_LORE.some((b) => b.id === id)) {
      tab = 'branch';
    } else if (id.startsWith('tg:')) {
      tab = 'tengod';
    } else if (id.startsWith('ss:')) {
      tab = 'shensha';
    } else if (id.startsWith('ny:')) {
      tab = 'nayin';
    } else if (id.startsWith('jz:')) {
      tab = 'jiazi';
    } else if (id.startsWith('rel:')) {
      tab = 'relation';
    } else if (id.startsWith('luck:')) {
      tab = 'luck';
    }
    detailId = id;
    paint();
  }

  function paint(): void {
    _chartCtxCache = null;
    const map = entries();
    const all = baziCodexProgress();
    const wxP = baziCodexProgress('wuxing');
    const stemP = baziCodexProgress('stem');
    const branchP = baziCodexProgress('branch');
    const tgP = baziCodexProgress('tengod');
    const ssP = baziCodexProgress('shensha');
    const litCount = Math.max(0, all.collected - wxP.collected);
    const litTotal = Math.max(1, all.total - wxP.total);

    const tabBtn = (id: Tab, label: string, p?: { collected: number; total: number }) => `
      <button type="button" class="bazi-codex-tab ${tab === id ? 'is-on' : ''}" data-tab="${id}">
        ${label}${p ? ` <em>${p.collected}/${p.total}</em>` : ''}
      </button>`;

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回命盘</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <h1 class="page-title">八字探索</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.bazi} · 已点亮 ${litCount}/${litTotal}</p>
      </header>

      ${baziSysTabsHtml('reading')}

      <div class="bazi-codex-tabs" role="tablist">
        ${tabBtn('relation', '生克关系')}
        ${tabBtn('stem', '十天干', stemP)}
        ${tabBtn('branch', '十二地支', branchP)}
        ${tabBtn('tengod', '十神', tgP)}
        ${tabBtn('shensha', `神煞`, { collected: ssP.collected, total: SHENSHA_ATLAS.length })}
        ${tabBtn('nayin', '纳音')}
        ${tabBtn('jiazi', '甲子')}
        ${tabBtn('luck', '运程')}
        ${tabBtn('mine', '我的命盘')}
      </div>

      <p class="bazi-codex-guide">${escapeHtml(TAB_GUIDE[tab])}</p>

      ${
        tab === 'relation'
          ? renderShengKeTab(map, branchRingMode, wuxingFocus)
          : tab === 'stem'
            ? renderStemGrid()
            : tab === 'branch'
              ? renderBranchGrid()
              : tab === 'tengod'
                ? renderTengodGrid()
                : tab === 'shensha'
                  ? renderShenshaAtlas()
                  : tab === 'nayin'
                    ? renderNayinGrid()
                    : tab === 'jiazi'
                      ? renderJiaziGrid()
                      : tab === 'luck'
                          ? renderLuckGrid()
                          : renderMineChartTab()
      }
      ${detailId ? renderDetail(detailId, map) : ''}
    `;

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/bazi/reading'));
    page.querySelectorAll<HTMLElement>('.lab-sys-tabs [data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        tab = parseTab(btn.dataset.tab);
        detailId = null;
        if (tab !== 'relation') wuxingFocus = null;
        paint();
      });
    });
    const openCodexId = (id: string): void => {
      if (!id) return;
      detailId = detailId === id ? null : id;
      paint();
    };

    const onWuxingNodeClick = (id: string): void => {
      if (!WUXING_ORDER.includes(id as WuXing)) return;
      const wx = id as WuXing;
      if (wuxingFocus === wx && detailId === wx) {
        wuxingFocus = null;
        detailId = null;
      } else if (wuxingFocus === wx) {
        detailId = wx;
      } else {
        wuxingFocus = wx;
        detailId = null;
      }
      paint();
    };

    page.querySelectorAll<HTMLElement>('[data-codex-id]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id =
          el.getAttribute('data-codex-id') ??
          (ev.currentTarget as HTMLElement).getAttribute('data-codex-id') ??
          '';
        if (!id) return;
        const onShengKe =
          tab === 'relation' && Boolean(el.closest('[data-shengke-map]'));
        if (onShengKe && WUXING_ORDER.includes(id as WuXing)) {
          onWuxingNodeClick(id);
          return;
        }
        openCodexId(id);
      });
    });
    page.querySelector('[data-sk-clear-focus]')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      wuxingFocus = null;
      detailId = null;
      paint();
    });
    page.querySelectorAll<HTMLButtonElement>('[data-sk-open-detail]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = btn.dataset.skOpenDetail ?? '';
        if (!id) return;
        if (WUXING_ORDER.includes(id as WuXing)) wuxingFocus = id as WuXing;
        detailId = id;
        paint();
      });
    });
    page.querySelectorAll<HTMLElement>('[data-open-entry]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEntry(el.getAttribute('data-open-entry') ?? '');
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-branch-ring-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.branchRingMode as BranchRingMode | undefined;
        if (next && next !== branchRingMode) {
          branchRingMode = next;
          paint();
        }
      });
    });
    page.querySelector('[data-codex-close]')?.addEventListener('click', () => {
      detailId = null;
      // 保留生克聚焦，方便对照图再读
      paint();
    });
    page.querySelectorAll<HTMLButtonElement>('[data-open-star]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEntry(btn.dataset.openStar ?? '');
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-jump-gz]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEntry(btn.dataset.jumpGz ?? '');
      });
    });

    if (detailId) {
      bindBaziCodexDetail(page);
    }
  }

  paint();
  return () => stars.remove();
}

let _chartCtxCache: {
  chart: BaziChart | null;
  luck: ReturnType<typeof buildLuckCycles>;
} | null = null;

function activeChartContext(): {
  chart: BaziChart | null;
  luck: ReturnType<typeof buildLuckCycles>;
} {
  if (_chartCtxCache) return _chartCtxCache;
  const store = loadLifeStore();
  if (!hasBirthInfo(store.profile)) {
    _chartCtxCache = { chart: null, luck: null };
    return _chartCtxCache;
  }
  const year = new Date().getFullYear();
  try {
    const person = getActivePerson();
    const gender =
      person.gender === 'male' || person.gender === 'female' ? person.gender : '';
    const result = castBaziChart(store.profile, year, { gender });
    if ('error' in result) {
      _chartCtxCache = { chart: null, luck: null };
      return _chartCtxCache;
    }
    const luck = buildLuckCycles(store.profile, gender, year);
    _chartCtxCache = { chart: result, luck };
    return _chartCtxCache;
  } catch {
    _chartCtxCache = { chart: null, luck: null };
    return _chartCtxCache;
  }
}

function cardThumbHtml(id: string): string {
  const enc = getBaziEncyclopedia(id);
  const src = getCodexCoverSrc(id);
  if (src) {
    return `<span class="bazi-codex-thumb" aria-hidden="true"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></span>`;
  }
  if (enc?.kind === 'stem' || enc?.kind === 'branch') {
    const lore = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id);
    if (lore) {
      return `<span class="bazi-codex-thumb is-svg" aria-hidden="true">${stemBranchArtSvg(lore, { uid: `card-${id}` })}</span>`;
    }
  }
  if (enc?.kind === 'tengod') {
    const star = getStarCard(id);
    if (star) {
      return `<span class="bazi-codex-thumb is-svg" aria-hidden="true">${tengodArtSvg(star.name, { uid: `card-${id}` })}</span>`;
    }
  }
  if (enc?.kind === 'wuxing') {
    return `<span class="bazi-codex-thumb is-svg" aria-hidden="true">${wuxingArtSvg(id as WuXing, { uid: `card-${id}` })}</span>`;
  }
  const star = getStarCard(id);
  return `<span class="bazi-codex-thumb is-glyph" aria-hidden="true">${escapeHtml(star?.glyph || enc?.title?.charAt(0) || '·')}</span>`;
}

/** 卡片层：图 / 名 / 五行阴阳 / 核心词 / 命盘状态 */
function entryIsLit(id: string): boolean {
  const enc = getBaziEncyclopedia(id);
  if (enc && isAtlasLibraryKind(enc.kind)) return true;
  return isBaziCodexUnlocked(id);
}

function compactEntryHtml(opts: {
  id: string;
  title: string;
  core: string;
  lit?: boolean;
  extraClass?: string;
}): string {
  const { chart } = activeChartContext();
  const enc = getBaziEncyclopedia(opts.id);
  const dossier = buildCodexDossier(opts.id);
  const meta = enc ? cardMetaLabels(enc) : { wuxing: '', yinyang: '' };
  const keyword = dossier?.coreKeyword || opts.core;
  const lit = opts.lit ?? entryIsLit(opts.id);
  const presence = chartPresenceLabel(opts.id, chart, lit);
  return `
    <button type="button" class="bazi-codex-entry is-card ${opts.extraClass ?? ''} ${lit ? 'is-lit' : 'is-soft'}" data-codex-id="${escapeHtml(opts.id)}">
      ${cardThumbHtml(opts.id)}
      <span class="bazi-codex-entry-body">
        <strong>${escapeHtml(opts.title)}</strong>
        <span class="bazi-codex-meta">${escapeHtml([meta.wuxing, meta.yinyang].filter((x) => x && x !== '—').join(' · ') || enc?.tags.category || '')}</span>
        <em>${escapeHtml(keyword)}</em>
        <span class="bazi-codex-presence">${escapeHtml(presence)}</span>
      </span>
    </button>`;
}

/** 生克关系：五行生克 + 地支合冲刑害 + 天干五合 + 词条 */
function renderShengKeTab(
  map: Map<string, { reason?: string }>,
  ringMode: BranchRingMode,
  wxFocus: WuXing | null = null,
): string {
  const statusByWx: Partial<Record<WuXing, string>> = {};
  for (const wx of WUXING_ORDER) {
    const reason = map.get(wx)?.reason;
    if (reason) statusByWx[wx] = reason;
  }
  const gan = RELATION_ATLAS.filter((r) => r.group === '天干关系');
  const zhi = RELATION_ATLAS.filter((r) => r.group === '地支关系');
  const card = (r: (typeof RELATION_ATLAS)[number]) =>
    compactEntryHtml({ id: r.id, title: r.title, core: r.gloss, lit: true });
  return `
    ${renderWuxingShengKeMapHtml({
      title: '五行生克',
      hint: wxFocus
        ? `聚焦「${wxFocus}」· 只亮相关生克 · 再点节点或「看完整释义」`
        : '外环相生 · 内星相克 · 先点节点聚焦，再出释义',
      statusByWx,
      focus: wxFocus,
    })}
    ${renderBranchRelationRingHtml({ mode: ringMode })}
    ${renderRelationsAtlasHtml({ skipWuxingPairs: true, skipBranchPairLists: true })}
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">天干关系词条</h2>
      <div class="bazi-codex-entry-grid">${gan.map(card).join('')}</div>
    </section>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">地支关系词条</h2>
      <div class="bazi-codex-entry-grid">${zhi.map(card).join('')}</div>
    </section>
  `;
}

function renderStemGrid(): string {
  return `
    <div class="bazi-codex-entry-grid">
      ${STEM_LORE.map((s) =>
        compactEntryHtml({
          id: s.id,
          title: s.title,
          core: s.epithet,
          lit: isBaziCodexUnlocked(s.id),
          extraClass: wuxingClass(s.wuxing),
        }),
      ).join('')}
    </div>`;
}

function renderBranchGrid(): string {
  return `
    <div class="bazi-codex-entry-grid">
      ${BRANCH_LORE.map((b) =>
        compactEntryHtml({
          id: b.id,
          title: b.title,
          core: b.epithet,
          lit: isBaziCodexUnlocked(b.id),
          extraClass: wuxingClass(b.wuxing),
        }),
      ).join('')}
    </div>`;
}

function renderTengodGrid(): string {
  return `
    <div class="bazi-codex-entry-grid">
      ${TENGOD_CARDS.map((c) =>
        compactEntryHtml({
          id: c.id,
          title: c.name,
          core: c.modern,
          lit: isBaziCodexUnlocked(c.id),
        }),
      ).join('')}
    </div>`;
}

/** 我的命盘 · 速读 + 已点亮神煞 */
function renderMineChartTab(): string {
  const { chart, luck } = activeChartContext();
  const featuredCards = SHENSHA_FEATURED.map((n) => getStarCardByName('shensha', n)).filter(
    (c): c is StarCardLore => Boolean(c),
  );
  const tagCards = SHENSHA_TAG.map((n) => getStarCardByName('shensha', n)).filter(
    (c): c is StarCardLore => Boolean(c),
  );
  const litFeatured = featuredCards.filter((c) => isBaziCodexUnlocked(c.id));
  const litTags = tagCards.filter((c) => isBaziCodexUnlocked(c.id));

  const litBlock = litFeatured.length
    ? `<div class="bazi-codex-entry-grid is-shensha">${litFeatured.map((c) => featuredBadgeHtml(c)).join('')}</div>`
    : `<p class="bazi-codex-empty">排盘遇见后，精品神煞会点亮在这里。</p>`;

  const tagBlock = litTags.length
    ? `<section class="bazi-gz-section bazi-ss-tier">
        <h2 class="bazi-codex-section-title">🏷 盘上的影响因子</h2>
        <div class="bazi-codex-entry-grid is-ss-atlas">${litTags.map((c) => tagFactorHtml(c)).join('')}</div>
      </section>`
    : '';

  let quick = `<p class="bazi-codex-empty">填写出生信息后，这里会给出四柱速读。</p>`;
  if (chart) {
    const natal = chart.pillars.filter((p) => p.key !== 'liunian' && !p.empty);
    const pillarsLine = natal
      .map((p) => `${p.title}${p.stem}${p.branch}`)
      .join(' · ');
    const dmWx = chart.dayMasterWx || '—';
    const season = chart.season.find((s) => s.label === chart.dayMasterWx);
    const strength = season?.strength ?? '—';
    const energy = buildEnergyBalance(chart);
    const tendency =
      energy.excess && energy.shortage
        ? `偏旺${energy.excess}、偏弱${energy.shortage}`
        : energy.excess
          ? `偏旺${energy.excess}`
          : energy.shortage
            ? `偏弱/缺${energy.shortage}`
            : '相对均衡';
    const rel = chart.relations.slice(0, 4).join('；') || '无明显冲合提示';
    const du = luck?.dayun.find((d) => d.current && !d.empty);
    const ln = luck?.liunian.find((l) => l.current) || luck?.liunian.find((l) => l.selected);
    const duLabel = du
      ? `${du.ganZhi}（约${du.startAge}–${du.endAge}岁）`
      : '—';
    const lnLabel = ln ? `${ln.year}${ln.ganZhi || ''}` : '—';
    quick = `
      <ul class="bazi-enc-list bazi-mine-quick">
        <li><strong>四柱</strong> · ${escapeHtml(pillarsLine)}</li>
        <li><strong>日主</strong> · ${escapeHtml(chart.dayMaster)}${escapeHtml(dmWx)}（月令「${escapeHtml(String(strength))}」）</li>
        <li><strong>旺衰倾向</strong> · ${escapeHtml(tendency)} · ${escapeHtml(energy.headline)}</li>
        <li><strong>盘面关系</strong> · ${escapeHtml(rel)}</li>
        <li><strong>当前大运</strong> · ${escapeHtml(duLabel)}</li>
        <li><strong>当前流年</strong> · ${escapeHtml(lnLabel)}</li>
        <li><strong>读法</strong> · 点开词条「命盘」页看落点；神煞勿脱离日主与格局单断。</li>
      </ul>`;
  }

  return `
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">📖 命盘速读</h2>
      ${quick}
    </section>
    <section class="bazi-gz-section bazi-ss-tier">
      <h2 class="bazi-codex-section-title">✨ 我的命盘出现</h2>
      ${litBlock}
    </section>
    ${tagBlock}`;
}

function renderShenshaAtlas(): string {
  const byCat = shenshaAtlasByCategory();
  const featuredCards = SHENSHA_FEATURED.map((n) => getStarCardByName('shensha', n)).filter(
    (c): c is StarCardLore => Boolean(c),
  );

  const catBlocks = SHENSHA_CATEGORIES.map((cat) => {
    const list = byCat[cat] || [];
    if (!list.length) return '';
    return `
      <section class="bazi-gz-section bazi-ss-tier">
        <h2 class="bazi-codex-section-title">${escapeHtml(cat)} · ${list.length}</h2>
        <div class="bazi-codex-entry-grid is-ss-atlas">
          ${list
            .map((s) => {
              const id = shenshaCardId(s.name);
              const lit = isBaziCodexUnlocked(id);
              return `
                <button type="button" class="bazi-ss-chip ${lit ? 'is-lit' : 'is-soft'}" data-codex-id="${escapeHtml(id)}">
                  <strong>${escapeHtml(s.name)}</strong>
                  <em>${escapeHtml(lit ? s.gloss : '未解锁')}</em>
                </button>`;
            })
            .join('')}
        </div>
      </section>`;
  }).join('');

  return `
    <p class="bazi-codex-hint">共 ${SHENSHA_ATLAS.length} 条神煞骨架 · 辅助信息，勿脱离日主/格局/十神/大运单断</p>
    <section class="bazi-gz-section bazi-ss-tier">
      <h2 class="bazi-codex-section-title">✨ 精品（有图）</h2>
      <div class="bazi-codex-entry-grid is-shensha">${featuredCards.map((c) => featuredBadgeHtml(c)).join('')}</div>
    </section>
    ${catBlocks}`;
}

function renderNayinGrid(): string {
  return `
    <p class="bazi-codex-hint">三十纳音 · 知识库骨架，可点开</p>
    <div class="bazi-codex-entry-grid">
      ${NAYIN_ATLAS.map((n) =>
        compactEntryHtml({
          id: nayinId(n.name),
          title: n.name,
          core: n.gloss,
          lit: true,
          extraClass: wuxingClass(n.wuxing),
        }),
      ).join('')}
    </div>`;
}

function renderJiaziGrid(): string {
  const { chart } = activeChartContext();
  const natalGz = new Set(
    (chart?.pillars || [])
      .filter((p) => !p.empty && p.key !== 'liunian')
      .map((p) => `${p.stem}${p.branch}`),
  );
  const hitTitles = (gz: string): string => {
    if (!chart) return '';
    return chart.pillars
      .filter((p) => !p.empty && p.key !== 'liunian' && `${p.stem}${p.branch}` === gz)
      .map((p) => p.title.replace(/柱/, ''))
      .join('·');
  };
  return `
    <p class="bazi-codex-hint">六十甲子 · ${listSixtyJiazi().length} 柱索引 · 点开看纳音与释义</p>
    <div class="bazi-codex-entry-grid is-jiazi">
      ${listSixtyJiazi()
        .map((gz) => {
          const id = jiaziId(gz);
          const ny = nayinOf(gz);
          const hit = natalGz.has(gz);
          const where = hitTitles(gz);
          return `
            <button type="button" class="bazi-jz-chip ${hit ? 'is-hit' : 'is-soft'}" data-codex-id="${escapeHtml(id)}">
              <strong>${escapeHtml(gz)}</strong>
              <span class="bazi-jz-ny">${escapeHtml(ny)}</span>
              ${hit ? `<span class="bazi-jz-hit">命盘·${escapeHtml(where)}</span>` : ''}
            </button>`;
        })
        .join('')}
    </div>`;
}

function renderLuckGrid(): string {
  return `
    <p class="bazi-codex-hint">大运流年概念 · 看如何触发原局、影响哪些宫位</p>
    <div class="bazi-codex-entry-grid">
      ${LUCK_ATLAS.map((l) =>
        compactEntryHtml({ id: l.id, title: l.title, core: l.gloss, lit: true }),
      ).join('')}
    </div>`;
}

/** 精品：单独条目 = 小徽章 + 名称 + xx之星 */
function featuredBadgeHtml(card: StarCardLore): string {
  const unlocked = isBaziCodexUnlocked(card.id);
  const visual = getShenshaVisual(card.name);
  const warm =
    visual?.light === 'warm' ||
    (!visual && card.zone === 'auspicious');
  const src = getCodexCoverSrc(card.id);
  const art = `<div class="bazi-ss-badge-stage" aria-hidden="true">${
    src
      ? `<div class="bazi-ss-badge-art"><img src="${escapeHtml(src)}" alt="" loading="lazy" /></div>`
      : `<div class="bazi-ss-badge-glyph">${escapeHtml(card.glyph)}</div>`
  }</div>`;

  return `
    <button type="button" class="bazi-ss-row ${warm ? 'is-warm' : 'is-cold'} ${unlocked ? 'is-lit' : 'is-soft'}" data-codex-id="${escapeHtml(card.id)}">
      ${art}
      <span class="bazi-ss-row-text">
        <strong>${escapeHtml(card.name)}</strong>
        <em>${escapeHtml(unlocked ? card.modern : '未解锁 · 排盘遇见后点亮')}</em>
      </span>
    </button>`;
}

/** 普通：名称 + 核心词（紧凑芯片） */
function tagFactorHtml(card: StarCardLore): string {
  const unlocked = isBaziCodexUnlocked(card.id);
  return `
    <button type="button" class="bazi-ss-chip ${unlocked ? 'is-lit' : 'is-soft'}" data-codex-id="${escapeHtml(card.id)}">
      <strong>${escapeHtml(card.name)}</strong>
      <em>${escapeHtml(unlocked ? card.modern : '未解锁')}</em>
    </button>`;
}

function renderTagChips(tags: CodexTag[], locked: boolean): string {
  if (!tags.length) return '';
  const shensha = tags.filter((t) => t.kind === 'shensha');
  const tengods = tags.filter((t) => t.kind === 'tengod');
  const block = (title: string, list: CodexTag[]) => {
    if (!list.length) return '';
    return `
      <section class="bazi-codex-tags">
        <h3>${escapeHtml(title)}</h3>
        <div class="bazi-tag-row">
          ${list
            .map((t) => {
              const openId =
                t.kind === 'shensha' ? shenshaCardId(t.name) : tengodCardId(t.name);
              const cls = [
                'bazi-tag-chip',
                t.kind === 'shensha' ? 'is-shensha' : 'is-tengod',
                t.met ? 'is-met' : '',
                locked ? 'is-teaser' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return `<button type="button" class="${cls}" data-open-star="${escapeHtml(openId)}" ${locked ? 'disabled' : ''}>
                <strong>${escapeHtml(t.modern)}</strong>
                <em>${escapeHtml(t.name)}</em>
                ${t.met ? '<span class="bazi-tag-met">盘中</span>' : ''}
              </button>`;
            })
            .join('')}
        </div>
      </section>`;
  };
  return `${block('常见神煞搭配', shensha)}${block('传统十神', tengods)}`;
}

function detailArt(id: string): string {
  if (WUXING_ORDER.includes(id as WuXing)) {
    return memoryCoverHtml(id, wuxingArtSvg(id as WuXing, { uid: `det-wx-${id}` }));
  }
  const gz = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id);
  if (gz) {
    return memoryCoverHtml(id, stemBranchArtSvg(gz, { uid: `det-gz-${id}` }));
  }
  const star = getStarCard(id);
  if (star) {
    if (star.kind === 'tengod') {
      return memoryCoverHtml(
        id,
        tengodArtSvg(star.name, { uid: `det-tg-${star.name}` }),
      );
    }
    // 神煞：详情只顶小徽章，不做全幅大图
    return shenshaBadgeArtHtml(id, star.glyph);
  }
  return '';
}

function unlockHintFor(id: string, reason?: string): string {
  if (WUXING_ORDER.includes(id as WuXing)) {
    return wuxingUnlockHint(id as WuXing, reason);
  }
  const star = getStarCard(id);
  if (star) return `尚未收集。在命盘中遇见「${star.name}」后点亮。`;
  const gz = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id);
  if (gz) return `尚未点亮。在命盘四柱中遇见「${gz.id}」后解锁。`;
  return '尚未点亮。';
}

function memoryExtra(id: string, lit: boolean): string {
  if (WUXING_ORDER.includes(id as WuXing) && lit) {
    const wx = id as WuXing;
    const lore = WUXING_LORE[wx];
    const kids = [...stemsOfWuxing(wx), ...branchesOfWuxing(wx)];
    const kidsHtml = kids
      .map((k) => {
        const on = isBaziCodexUnlocked(k.id);
        return `<button type="button" class="bazi-wx-child ${on ? 'is-lit' : ''}" data-jump-gz="${k.id}">${escapeHtml(k.title)}${on ? '' : ' · 未亮'}</button>`;
      })
      .join('');
    return `
      <section class="bazi-codex-remedy">
        <h3>你的补${escapeHtml(wx)}方案</h3>
        <ul>
          <li><strong>颜色</strong> · ${escapeHtml(lore.remedy.color)}</li>
          <li><strong>方位</strong> · ${escapeHtml(lore.remedy.direction)}</li>
          <li><strong>饮食</strong> · ${escapeHtml(lore.remedy.food)}</li>
          <li><strong>情绪</strong> · ${escapeHtml(lore.remedy.mood)}</li>
        </ul>
      </section>
      <section class="bazi-codex-children">
        <h3>下属天干地支</h3>
        <div class="bazi-wx-child-row">${kidsHtml}</div>
      </section>`;
  }
  const item = [...STEM_LORE, ...BRANCH_LORE].find((x) => x.id === id) as
    | StemBranchLore
    | undefined;
  if (item) {
    const met = listMetCodexTags();
    const tags =
      item.kind === 'stem'
        ? staticTagsForStem(item.id, met)
        : staticTagsForBranch(item.id, met);
    return renderTagChips(tags, !lit);
  }
  const star = getStarCard(id);
  if (star?.kind === 'shensha') {
    const visual = getShenshaVisual(star.name);
    if (visual) {
      return `<p class="bazi-ss-museum">
        <span>意象提取：${escapeHtml(visual.motif)}</span>
        <span>字面意：${escapeHtml(visual.literal)}</span>
      </p>`;
    }
  }
  return '';
}

function renderDetail(id: string, map: Map<string, { reason?: string }>): string {
  if (!getBaziEncyclopedia(id)) return '';
  const lit = entryIsLit(id);
  const reason = map.get(id)?.reason;
  const { chart, luck } = activeChartContext();
  return renderBaziCodexDetailHtml(id, {
    artHtml: detailArt(id),
    lit,
    unlockHint: unlockHintFor(id, reason),
    memoryExtraHtml: memoryExtra(id, lit),
    chartLink: buildChartLinkReport(id, chart, luck),
  });
}
