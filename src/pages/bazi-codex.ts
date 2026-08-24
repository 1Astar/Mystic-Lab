import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import {
  baziCodexProgress,
  isBaziCodexUnlocked,
  libraryIdsFromChart,
  listBaziCodexEntries,
  listMetCodexTags,
  unlockBaziCodexFromChart,
  wuxingUnlockHint,
} from '../bazi/codex.ts';
import { getBaziCodexMarks, listBaziCodexMarkedIds } from '../bazi/codex-favorites.ts';
import { takeJustLitIds } from '../bazi/codex-just-lit.ts';
import {
  chartPresenceBriefLine,
} from '../bazi/codex-presence-brief.ts';
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
import { nayinArtSvg } from '../bazi/codex-nayin-art.ts';
import { getCodexCoverSrc, shenshaBadgeArtHtml } from '../bazi/codex-cover.ts';
import { codexDetailArtHtml } from '../bazi/codex-detail-art.ts';
import {
  conceptThumbSvg,
  renderChongHeXingHaiConceptHtml,
} from '../bazi/codex-concept-diagrams.ts';
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
} from '../bazi/codex-shensha-tiers.ts';
import { renderWuxingShengKeMapHtml } from '../bazi/codex-wuxing-map.ts';
import {
  renderBranchRelationRingHtml,
  type BranchRingMode,
} from '../bazi/codex-branch-ring.ts';
import { bindRelationHelpDismiss } from '../bazi/codex-relation-help.ts';
import {
  renderStemRelationRingHtml,
  type StemRingMode,
} from '../bazi/codex-stem-ring.ts';
import {
  getBaziEncyclopedia,
  isAtlasLibraryKind,
} from '../bazi/codex-encyclopedia.ts';
import { buildCodexDossier, cardMetaLabels } from '../bazi/codex-dossier.ts';
import { relatedFootnotesFor } from '../bazi/codex-related-footnote.ts';
import {
  buildChartLinkReport,
  chartPresenceLabel,
} from '../bazi/codex-chart-link.ts';
import {
  NAYIN_ATLAS,
  SHENSHA_CATEGORIES,
  jiaziId,
  listSixtyJiazi,
  nayinId,
  shenshaAtlasByCategory,
  shenshaAtlasGloss,
  type ShenshaCategory,
} from '../bazi/codex-atlas-catalog.ts';
import { castBaziChart, type BaziChart } from '../bazi/cast.ts';
import { nayinOf } from '../bazi/pillar-meta.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import { dayunLoreHint } from '../bazi/codex-jiazi-dayun-lore.ts';
import { buildEnergyBalance } from '../bazi/sense-energy.ts';
import { wuxingClass, type WuXing } from '../bazi/elements.ts';
import {
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
} from '../life/storage.ts';
import {
  bindBaziCodexDetail,
  renderBaziCodexDetailHtml,
} from '../ui/bazi-codex-detail.ts';
import { openCodexCategoryQuiz } from '../ui/bazi-codex-quiz.ts';
import {
  maybeOfferCategoryQuiz,
  recordCodexCategoryBrowse,
} from '../bazi/codex-category-quiz-progress.ts';
import { isCodexQuizCategory } from '../bazi/codex-category-quiz.ts';
import { mountLabFloatActions } from '../ui/lab-float-actions.ts';
import { openLabNotesSheet } from '../ui/lab-notes-sheet.ts';
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import { answerBaziConcept, recordBaziConceptMiss } from '../bazi/concept-ask.ts';
import { BAZI_SHARE_POSTER_PATH } from '../share/cover.ts';
import { draftGeneric } from '../share/drafts.ts';

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
  | 'jiazi';

const TAB_ORDER: Tab[] = [
  'relation',
  'stem',
  'branch',
  'tengod',
  'shensha',
  'jiazi',
  'nayin',
];

/** 甲子 / 纳音共用：柱与气象标签的关系 */
const JIAZI_NAYIN_RELATION = [
  '甲子是柱，纳音是这柱的「气象标签」。',
  '六十甲子 = 天干×地支的 60 种组合（甲子、乙丑…癸亥），排盘里每一柱、每一段大运都是其中一个。',
  '纳音把这 60 柱按传统配成 30 个画面名（海中金、炉中火…）。',
] as const;

/** 甲子页追加：运程入口说明（原「运程」Tab 已并入） */
const JIAZI_LUCK_HINT =
  '真运程看排盘里的大运 / 流年板；某段十年主题，点对应甲子词条的「作大运时」。';

const TAB_GUIDE: Record<Tab, string> = {
  relation: '五行生克 · 地支环图 · 天干环图',
  stem: '你的核心性格底色',
  branch: '环境、根基与行动方式',
  tengod: '你如何与世界发生关系',
  shensha: '神煞按类浏览 · 辅助信息，勿单断',
  jiazi: '六十甲子 · 每柱干支的完整索引',
  nayin: '三十纳音 · 干支组合的气象象意',
};

function tabGuideHtml(tab: Tab): string {
  const lead = `<p class="bazi-codex-guide">${escapeHtml(TAB_GUIDE[tab])}</p>`;
  if (tab !== 'jiazi' && tab !== 'nayin') return lead;
  const blurbs =
    tab === 'jiazi'
      ? [...JIAZI_NAYIN_RELATION, JIAZI_LUCK_HINT]
      : [...JIAZI_NAYIN_RELATION];
  return `<div class="bazi-codex-guide-block">
    ${lead}
    ${blurbs
      .map((line) => `<p class="bazi-codex-guide-blurb">${escapeHtml(line)}</p>`)
      .join('')}
  </div>`;
}

/** 图鉴「我的旅程」· 仿紫微「我的相遇」 */
type JourneyHub = 'lit' | 'chart' | 'marks';
type CodexLayer = 'atlas' | 'journey';

type MarksFilter = 'all' | 'fire' | 'useful';

function parseMarksFilter(raw: string | undefined): MarksFilter {
  if (raw === 'fire' || raw === 'useful') return raw;
  return 'all';
}

function parseJourneyHub(raw: string | undefined): JourneyHub {
  if (raw === 'chart' || raw === 'marks' || raw === 'lit') return raw;
  return 'lit';
}

function parseTab(raw: string | undefined): Tab {
  if (raw === 'wuxing' || raw === 'bonds') return 'relation';
  if (raw === 'marks') return 'relation';
  /** 旧「运程」Tab 已并入甲子 */
  if (raw === 'luck') return 'jiazi';
  if (raw && (TAB_ORDER as string[]).includes(raw)) return raw as Tab;
  return 'relation';
}

function quizCategoryFromEntryId(id: string): Tab | null {
  const enc = getBaziEncyclopedia(id);
  if (enc) {
    if (enc.kind === 'wuxing' || enc.kind === 'relation') return 'relation';
    if (enc.kind === 'stem') return 'stem';
    if (enc.kind === 'branch') return 'branch';
    if (enc.kind === 'tengod') return 'tengod';
    if (enc.kind === 'shensha') return 'shensha';
    if (enc.kind === 'nayin') return 'nayin';
    if (enc.kind === 'jiazi' || enc.kind === 'luck') return 'jiazi';
  }
  if (WUXING_ORDER.includes(id as WuXing)) return 'relation';
  if (id.startsWith('tg:')) return 'tengod';
  if (id.startsWith('ss:')) return 'shensha';
  if (id.startsWith('ny:')) return 'nayin';
  if (id.startsWith('jz:') || id.startsWith('luck:')) return 'jiazi';
  if (id.startsWith('rel:')) return 'relation';
  return null;
}

function noteBrowseAndMaybeQuiz(leavingTab: Tab): void {
  const quiz = maybeOfferCategoryQuiz(leavingTab);
  if (quiz) openCodexCategoryQuiz({ quiz });
}

function trackCodexBrowse(id: string, currentTab: Tab): void {
  const cat = quizCategoryFromEntryId(id) ?? currentTab;
  if (isCodexQuizCategory(cat)) recordCodexCategoryBrowse(cat, id);
}

type ShenshaCatFilter = 'all' | 'featured' | ShenshaCategory;

function parseShenshaCat(raw: string | undefined): ShenshaCatFilter {
  if (raw === 'all' || raw === 'featured') return raw;
  if (raw && (SHENSHA_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as ShenshaCategory;
  }
  return 'all';
}

function scrollChildIntoScroller(scroller: HTMLElement, child: Element | null): void {
  if (!(child instanceof HTMLElement)) return;
  const cRect = scroller.getBoundingClientRect();
  const tRect = child.getBoundingClientRect();
  scroller.scrollLeft += tRect.left - cRect.left - (cRect.width - tRect.width) / 2;
}

/** L1 + 神煞 L2 收成吸顶栈：上级与当前级一起粘住 */
function assembleBaziStickyNav(page: HTMLElement): void {
  const tabs = page.querySelector<HTMLElement>('.bazi-codex-tabs');
  if (!tabs || tabs.closest('.bazi-codex-sticky-stack')) return;

  const stack = document.createElement('div');
  stack.className = 'bazi-codex-sticky-stack';
  stack.setAttribute('role', 'navigation');
  stack.setAttribute('aria-label', '八字图鉴分级导航');
  tabs.replaceWith(stack);
  stack.appendChild(tabs);

  const sub = page.querySelector('.bazi-codex-subtabs');
  if (sub && !sub.closest('.bazi-codex-sticky-stack')) {
    const row = document.createElement('div');
    row.className = 'bazi-codex-sticky-row is-l2';
    sub.replaceWith(row);
    row.appendChild(sub);
    stack.appendChild(row);
  }

  scrollChildIntoScroller(tabs, tabs.querySelector('.bazi-codex-tab.is-on'));
  const subtabs = stack.querySelector<HTMLElement>('.bazi-codex-subtabs');
  if (subtabs) {
    scrollChildIntoScroller(subtabs, subtabs.querySelector('.bazi-codex-subtab.is-on'));
  }
}

export function renderBaziCodex(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-codex-page';
  mountEnvBanner(page);
  root.appendChild(page);

  let tab: Tab = 'relation';
  let shenshaCat: ShenshaCatFilter = 'all';
  let marksFilter: MarksFilter = 'all';
  let layer: CodexLayer = 'atlas';
  let journeyHub: JourneyHub = 'lit';
  let detailId: string | null = null;
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('layer') === 'journey' || q.get('layer') === 'meet') {
      layer = 'journey';
      journeyHub = parseJourneyHub(q.get('hub') ?? undefined);
    }
  } catch {
    /* ignore */
  }
  const disposeFloat = mountLabFloatActions(page, {
    system: 'bazi',
    surface: 'atlas',
    atlasMode: true,
    answerConcept: answerBaziConcept,
    onNotes: () => {
      const enc = detailId ? getBaziEncyclopedia(detailId) : null;
      openLabNotesSheet({
        system: 'bazi',
        surface: 'atlas',
        context: enc ? `图鉴 · ${enc.title}` : '八字图鉴',
      });
    },
    draftShare: () => {
      const enc = detailId ? getBaziEncyclopedia(detailId) : null;
      return draftGeneric({
        system: 'bazi',
        headline: enc ? `图鉴 · ${enc.title}` : '八字图鉴',
        question: '八字图鉴',
        summary: enc
          ? `正在对照词条「${enc.title}」。`
          : '在八字图鉴里对照词条与命盘。',
        invitePosterPath: BAZI_SHARE_POSTER_PATH,
      });
    },
    onDeep: () => {
      const enc = detailId ? getBaziEncyclopedia(detailId) : null;
      openLabDeepSheet({
        system: 'bazi',
        title: enc ? `追问 · ${enc.title}` : '图鉴追问',
        initialTab: 'ask',
        seedQuery: enc?.title,
        answerConcept: answerBaziConcept,
        onMiss: (q) => {
          void recordBaziConceptMiss(q);
        },
        deepHint: '结合图鉴词条追问；概念优先本地词库。',
      });
    },
  });
  let branchRingMode: BranchRingMode = 'chong';
  let stemRingMode: StemRingMode = 'he';
  /** 生克图聚焦：只亮某一行的相关边 */
  let wuxingFocus: WuXing | null = null;
  let unbindHelpDismiss: (() => void) | null = null;
  try {
    const pending = sessionStorage.getItem('mystic-lab-open-codex-id');
    if (pending) {
      sessionStorage.removeItem('mystic-lab-open-codex-id');
      detailId = pending;
      const enc = getBaziEncyclopedia(pending);
      if (enc?.kind === 'nayin') tab = 'nayin';
      else if (enc?.kind === 'jiazi' || enc?.kind === 'luck') tab = 'jiazi';
      else if (enc?.kind === 'relation') tab = 'relation';
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
      else if (enc.kind === 'jiazi' || enc.kind === 'luck') tab = 'jiazi';
      else if (enc.kind === 'relation') tab = 'relation';
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
    } else if (id.startsWith('jz:') || id.startsWith('luck:')) {
      tab = 'jiazi';
    } else if (id.startsWith('rel:')) {
      tab = 'relation';
    }
    detailId = id;
    trackCodexBrowse(id, tab);
    paint();
  }

  function setJourneyUrl(hub: JourneyHub): void {
    try {
      const q = new URLSearchParams();
      q.set('layer', 'journey');
      if (hub !== 'lit') q.set('hub', hub);
      history.replaceState({}, '', `/bazi/tujian?${q.toString()}`);
    } catch {
      /* ignore */
    }
  }

  function clearJourneyUrl(): void {
    try {
      history.replaceState({}, '', '/bazi/tujian');
    } catch {
      /* ignore */
    }
  }

  function paint(): void {
    unbindHelpDismiss?.();
    unbindHelpDismiss = null;
    _chartCtxCache = null;
    const { chart } = activeChartContext();
    const unlocked = chart ? unlockBaziCodexFromChart(chart) : { newly: [], total: 0 };
    _justLitIds = new Set(takeJustLitIds(unlocked.newly.map((e) => e.id)));

    const map = entries();
    const all = baziCodexProgress();
    const stemP = baziCodexProgress('stem');
    const branchP = baziCodexProgress('branch');
    const tgP = baziCodexProgress('tengod');
    const ssP = baziCodexProgress('shensha');
    const nyP = baziCodexProgress('nayin');
    const jzP = baziCodexProgress('jiazi');

    if (layer === 'journey') {
      page.innerHTML = `
        <button type="button" class="back-link" data-back-journey>← 返回图鉴</button>
        <header class="life-header">
          <p class="bazi-journey-kicker">个人收藏</p>
          <h1 class="page-title">我的旅程</h1>
          <p class="page-subtitle">收集对照 · 本盘遇见 · 我的标记</p>
        </header>
        ${baziSysTabsHtml(null)}
        <div class="bazi-journey-page-body">
          ${renderJourneyLayer(journeyHub, marksFilter, all)}
        </div>
        ${detailId ? renderDetail(detailId, map) : ''}
      `;
      page.querySelector('[data-back-journey]')?.addEventListener('click', () => {
        layer = 'atlas';
        detailId = null;
        clearJourneyUrl();
        paint();
      });
      page.querySelectorAll<HTMLElement>('.lab-sys-tabs [data-path]').forEach((el) => {
        el.addEventListener('click', () => {
          const path = el.dataset.path;
          if (path) navigate(path);
        });
      });
      page.querySelectorAll<HTMLButtonElement>('[data-journey-hub]').forEach((btn) => {
        btn.addEventListener('click', () => {
          journeyHub = parseJourneyHub(btn.dataset.journeyHub);
          detailId = null;
          if (journeyHub !== 'marks') marksFilter = 'all';
          setJourneyUrl(journeyHub);
          paint();
        });
      });
      page.querySelectorAll<HTMLButtonElement>('[data-marks-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          marksFilter = parseMarksFilter(btn.dataset.marksFilter);
          detailId = null;
          paint();
        });
      });
      page.querySelectorAll<HTMLButtonElement>('[data-goto-reading]').forEach((btn) => {
        btn.addEventListener('click', () => navigate('/bazi/reading'));
      });
      page.querySelectorAll<HTMLButtonElement>('[data-goto-atlas-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const next = parseTab(btn.dataset.gotoAtlasTab);
          layer = 'atlas';
          if (next !== tab) noteBrowseAndMaybeQuiz(tab);
          tab = next;
          detailId = null;
          if (tab !== 'relation') wuxingFocus = null;
          if (tab !== 'shensha') shenshaCat = 'all';
          clearJourneyUrl();
          paint();
          window.setTimeout(() => {
            page.querySelector('.bazi-codex-tabs')?.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            });
          }, 40);
        });
      });
      bindCodexOpeners();
      return;
    }

    const tabBtn = (id: Tab, label: string, p?: { collected: number; total: number }) => `
      <button type="button" class="bazi-codex-tab ${tab === id ? 'is-on' : ''}" data-tab="${id}">
        ${label}${p ? ` <em>${p.collected}/${p.total}</em>` : ''}
      </button>`;

    const journeyEntry = `
      <button type="button" class="bazi-journey-entry" data-open-journey>
        <span class="bazi-journey-entry-kicker">个人收藏</span>
        <strong class="bazi-journey-entry-title">我的旅程</strong>
        <span class="bazi-journey-entry-desc">已点亮词条 · 命盘印记 · 我的标记 · ${all.collected}/${all.total}</span>
        <span class="bazi-journey-entry-cta" aria-hidden="true">→</span>
      </button>`;

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回八字</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <h1 class="page-title">八字探索</h1>
        <p class="page-subtitle">图鉴分类 · 旅程单独入口 · 全库 ${all.collected}/${all.total}</p>
      </header>

      ${baziSysTabsHtml(null)}
      ${journeyEntry}

      <div class="bazi-codex-tabs" role="tablist">
        ${tabBtn('relation', '生克关系')}
        ${tabBtn('stem', '十天干', stemP)}
        ${tabBtn('branch', '十二地支', branchP)}
        ${tabBtn('tengod', '十神', tgP)}
        ${tabBtn('shensha', `神煞`, ssP)}
        ${tabBtn('jiazi', '甲子', jzP)}
        ${tabBtn('nayin', '纳音', nyP)}
      </div>

      ${tabGuideHtml(tab)}

      ${
        tab === 'relation'
          ? renderShengKeTab(map, branchRingMode, stemRingMode, wuxingFocus)
          : tab === 'stem'
            ? renderStemGrid()
            : tab === 'branch'
              ? renderBranchGrid()
              : tab === 'tengod'
                ? renderTengodGrid()
                : tab === 'shensha'
                  ? renderShenshaAtlas(shenshaCat)
                  : tab === 'jiazi'
                    ? renderJiaziGrid()
                    : renderNayinGrid()
      }
      ${detailId ? renderDetail(detailId, map) : ''}
    `;

    assembleBaziStickyNav(page);

    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/bazi'));
    page.querySelectorAll<HTMLElement>('.lab-sys-tabs [data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelector('[data-open-journey]')?.addEventListener('click', () => {
      layer = 'journey';
      journeyHub = 'lit';
      detailId = null;
      setJourneyUrl('lit');
      paint();
    });
    page.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = parseTab(btn.dataset.tab);
        if (next !== tab) {
          noteBrowseAndMaybeQuiz(tab);
        }
        tab = next;
        detailId = null;
        if (tab !== 'relation') wuxingFocus = null;
        if (tab !== 'shensha') shenshaCat = 'all';
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-ss-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        shenshaCat = parseShenshaCat(btn.dataset.ssCat);
        detailId = null;
        paint();
      });
    });
    bindCodexOpeners();
  }

  function bindCodexOpeners(): void {
    const openCodexId = (id: string): void => {
      if (!id) return;
      const opening = detailId !== id;
      detailId = detailId === id ? null : id;
      if (opening && detailId) trackCodexBrowse(detailId, tab);
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
    page.querySelectorAll<HTMLButtonElement>('[data-stem-ring-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.stemRingMode as StemRingMode | undefined;
        if (next && next !== stemRingMode) {
          stemRingMode = next;
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
      page.addEventListener(
        'bazi-codex-marks-changed',
        () => {
          if (layer === 'journey' && journeyHub === 'marks') paint();
        },
        { once: true },
      );
    }
    unbindHelpDismiss = bindRelationHelpDismiss(page);
  }

  paint();
  return () => {
    unbindHelpDismiss?.();
    disposeFloat();
    stars.remove();
  };
}

let _chartCtxCache: {
  chart: BaziChart | null;
  luck: ReturnType<typeof buildLuckCycles> | null;
} | null = null;
/** 本轮 paint 要播点亮动效的 id */
let _justLitIds = new Set<string>();

function activeChartContext(): {
  chart: BaziChart | null;
  luck: ReturnType<typeof buildLuckCycles> | null;
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
  if (enc?.kind === 'nayin') {
    return `<span class="bazi-codex-thumb is-svg is-nayin" aria-hidden="true">${nayinArtSvg(enc.title, { uid: `card-${id}` })}</span>`;
  }
  if (enc?.kind === 'jiazi' && enc.title.length >= 2) {
    const ny = nayinOf(enc.title);
    return `<span class="bazi-codex-thumb is-svg is-nayin" aria-hidden="true">${nayinArtSvg(ny || '海中金', { uid: `card-${id}` })}</span>`;
  }
  if (enc?.kind === 'shensha' || id.startsWith('ss:')) {
    const badge = shenshaBadgeArtHtml(id, enc?.title?.charAt(0) || '煞', {
      overlayName: false,
    });
    return `<span class="bazi-codex-thumb is-ss-badge" aria-hidden="true">${badge}</span>`;
  }
  if (id.startsWith('luck:') || id.startsWith('rel:')) {
    const thumb = conceptThumbSvg(id, { uid: `card-${id}` });
    if (thumb) {
      return `<span class="bazi-codex-thumb is-svg is-concept" aria-hidden="true">${thumb}</span>`;
    }
  }
  const star = getStarCard(id);
  return `<span class="bazi-codex-thumb is-glyph" aria-hidden="true">${escapeHtml(star?.glyph || enc?.title?.charAt(0) || '·')}</span>`;
}

function listCoreBlurb(title: string, raw: string): string {
  const t = title.trim();
  const text = raw.trim();
  if (!t || !text) return text;
  const prefixes = [`${t} · `, `${t}· `, `${t} ·`, `${t}·`];
  for (const p of prefixes) {
    if (text.startsWith(p)) return text.slice(p.length).trim();
  }
  return text;
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
  const { chart, luck } = activeChartContext();
  const enc = getBaziEncyclopedia(opts.id);
  const dossier = buildCodexDossier(opts.id);
  const meta = enc ? cardMetaLabels(enc) : { wuxing: '', yinyang: '' };
  const keyword = listCoreBlurb(opts.title, dossier?.coreKeyword || opts.core);
  const lit = opts.lit ?? entryIsLit(opts.id);
  const brief = chartPresenceBriefLine(opts.id, chart, luck, 48);
  const presence = brief || chartPresenceLabel(opts.id, chart, lit);
  const marks = getBaziCodexMarks(opts.id);
  const markHtml = marks.length
    ? `<span class="bazi-codex-marks">${marks
        .map((m) => `<i class="bazi-codex-mark-pill is-${m}">${m === 'fire' ? '火' : '有用'}</i>`)
        .join('')}</span>`
    : '';
  const justLit = _justLitIds.has(opts.id) ? ' is-just-lit' : '';
  const related = relatedFootnotesFor(opts.id, 1)[0];
  const relatedHtml = related
    ? `<p class="bazi-codex-related">
        关联：常与
        <button type="button" class="bazi-codex-related-link" data-open-entry="${escapeHtml(related.peerId)}">【${escapeHtml(related.peerLabel)}】</button>
        同现 · ${escapeHtml(related.gloss)}
      </p>`
    : `<p class="bazi-codex-related is-empty" aria-hidden="true"></p>`;
  return `
    <article class="bazi-codex-card">
      <button type="button" class="bazi-codex-entry is-card ${opts.extraClass ?? ''} ${lit ? 'is-lit' : 'is-soft'}${justLit}" data-codex-id="${escapeHtml(opts.id)}">
        <span class="bazi-codex-ripple" aria-hidden="true"></span>
        ${cardThumbHtml(opts.id)}
        <span class="bazi-codex-entry-body">
          <strong>${escapeHtml(opts.title)}</strong>
          <span class="bazi-codex-meta">${escapeHtml([meta.wuxing, meta.yinyang].filter((x) => x && x !== '—').join(' · ') || enc?.tags.category || '')}${markHtml}</span>
          <em>${escapeHtml(keyword)}</em>
          <span class="bazi-codex-presence">${escapeHtml(presence)}</span>
        </span>
      </button>
      ${relatedHtml}
    </article>`;
}

/** 生克关系：五行生克 + 地支合冲刑害 + 天干环图（释义在标题旁 ?） */
function renderShengKeTab(
  map: Map<string, { reason?: string }>,
  ringMode: BranchRingMode,
  stemMode: StemRingMode,
  wxFocus: WuXing | null = null,
): string {
  const statusByWx: Partial<Record<WuXing, string>> = {};
  for (const wx of WUXING_ORDER) {
    const reason = map.get(wx)?.reason;
    if (reason) statusByWx[wx] = reason;
  }
  return `
    <div class="bazi-shengke-stack">
    ${renderWuxingShengKeMapHtml({
      title: '五行生克',
      hint: wxFocus
        ? `聚焦「${wxFocus}」· 只亮相关生克 · 再点节点或「看完整释义」`
        : '外环相生 · 内星相克 · 先点节点聚焦，再出释义',
      statusByWx,
      focus: wxFocus,
    })}
    ${renderChongHeXingHaiConceptHtml()}
    ${renderBranchRelationRingHtml({ mode: ringMode })}
    ${renderStemRelationRingHtml({ mode: stemMode })}
    </div>
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

function renderShenshaAtlas(cat: ShenshaCatFilter = 'all'): string {
  const byCat = shenshaAtlasByCategory();
  const featuredCards = SHENSHA_FEATURED.map((n) => getStarCardByName('shensha', n)).filter(
    (c): c is StarCardLore => Boolean(c),
  );

  const catLabel = (c: ShenshaCategory): string => c.replace(/类$/, '');
  const subtabs = `
    <div class="bazi-codex-subtabs" role="tablist" aria-label="神煞分类">
      <button type="button" class="bazi-codex-subtab ${cat === 'all' ? 'is-on' : ''}" data-ss-cat="all">全部</button>
      <button type="button" class="bazi-codex-subtab ${cat === 'featured' ? 'is-on' : ''}" data-ss-cat="featured">精品</button>
      ${SHENSHA_CATEGORIES.map(
        (c) =>
          `<button type="button" class="bazi-codex-subtab ${cat === c ? 'is-on' : ''}" data-ss-cat="${escapeHtml(c)}">${escapeHtml(catLabel(c))}<em>${(byCat[c] || []).length}</em></button>`,
      ).join('')}
    </div>`;

  const featuredBlock = `
    <section class="bazi-gz-section bazi-ss-tier">
      <h2 class="bazi-codex-section-title">✨ 精品（有图）</h2>
      <div class="bazi-codex-entry-grid is-shensha">${featuredCards.map((c) => featuredBadgeHtml(c)).join('')}</div>
    </section>`;

  const catsToShow =
    cat === 'all' || cat === 'featured'
      ? SHENSHA_CATEGORIES
      : SHENSHA_CATEGORIES.filter((c) => c === cat);

  const catBlocks =
    cat === 'featured'
      ? ''
      : catsToShow
          .map((c) => {
            const list = byCat[c] || [];
            if (!list.length) return '';
            return `
      <section class="bazi-gz-section bazi-ss-tier">
        <h2 class="bazi-codex-section-title">${escapeHtml(c)} · ${list.length}</h2>
        <div class="bazi-codex-entry-grid is-ss-atlas">
          ${list
            .map((s) => {
              const id = shenshaCardId(s.name);
              const lit = isBaziCodexUnlocked(id);
              const art = shenshaBadgeArtHtml(id, s.name.slice(0, 1) || '煞', {
                overlayName: false,
              });
              return `
                <button type="button" class="bazi-ss-chip ${lit ? 'is-lit' : 'is-soft'}" data-codex-id="${escapeHtml(id)}">
                  ${art}
                  <span class="bazi-ss-chip-text">
                    <strong>${escapeHtml(s.name)}</strong>
                    <em>${escapeHtml(s.gloss)}</em>
                  </span>
                </button>`;
            })
            .join('')}
        </div>
      </section>`;
          })
          .join('');

  return `
    ${subtabs}
    ${cat === 'all' || cat === 'featured' ? featuredBlock : ''}
    ${catBlocks}`;
}

function renderNayinGrid(): string {
  return `
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
    <div class="bazi-codex-entry-grid is-jiazi">
      ${listSixtyJiazi()
        .map((gz) => {
          const id = jiaziId(gz);
          const ny = nayinOf(gz);
          const hit = natalGz.has(gz);
          const where = hitTitles(gz);
          return `
            <button type="button" class="bazi-jz-chip ${hit ? 'is-hit' : 'is-soft'}" data-codex-id="${escapeHtml(id)}">
              ${cardThumbHtml(id)}
              <span class="bazi-jz-chip-text">
                <strong>${escapeHtml(gz)}</strong>
                <span class="bazi-jz-ny">${escapeHtml(ny)}</span>
                ${hit ? `<span class="bazi-jz-hit">命盘·${escapeHtml(where)}</span>` : ''}
              </span>
            </button>`;
        })
        .join('')}
    </div>`;
}

function renderJourneyLayer(
  hub: JourneyHub,
  marksFilter: MarksFilter,
  progress: { collected: number; total: number },
): string {
  const hubs: Array<{ id: JourneyHub; label: string; hint: string }> = [
    { id: 'lit', label: '已点亮', hint: '全库收集' },
    { id: 'chart', label: '命盘印记', hint: '仅本盘' },
    { id: 'marks', label: '我的标记', hint: '收藏' },
  ];
  const hubTabs = `
    <div class="bazi-journey-hubs" role="tablist" aria-label="我的旅程">
      ${hubs
        .map(
          (h) => `
        <button type="button" role="tab" class="bazi-journey-hub${hub === h.id ? ' is-on' : ''}" data-journey-hub="${h.id}" aria-selected="${hub === h.id}">
          <strong>${h.label}</strong>
          <span>${h.hint}</span>
        </button>`,
        )
        .join('')}
    </div>`;

  if (hub === 'marks') {
    return `${hubTabs}${renderMarksGrid(marksFilter)}`;
  }
  if (hub === 'chart') {
    return `${hubTabs}${renderJourneyChartHub()}`;
  }
  return `${hubTabs}${renderJourneyLitHub(progress)}`;
}

/** 已点亮 · 全库收集进度，按图鉴分类跳转对照（≠ 命盘印记） */
function renderJourneyLitHub(progress: { collected: number; total: number }): string {
  const litEntries = listBaziCodexEntries().filter((e) => isBaziCodexUnlocked(e.id));
  const countForTab = (t: Tab): number =>
    litEntries.filter((e) => {
      if (t === 'relation') return e.kind === 'relation' || e.kind === 'wuxing';
      return e.kind === t;
    }).length;

  const cats: Array<{ tab: Tab; label: string }> = [
    { tab: 'relation', label: '生克关系' },
    { tab: 'stem', label: '十天干' },
    { tab: 'branch', label: '十二地支' },
    { tab: 'tengod', label: '十神' },
    { tab: 'shensha', label: '神煞' },
    { tab: 'jiazi', label: '甲子' },
    { tab: 'nayin', label: '纳音' },
  ];

  const hero = `
    <header class="bazi-journey-hero">
      <p class="bazi-journey-lit-count"><span aria-hidden="true">✨</span> 已点亮 <strong>${progress.collected}</strong> / ${progress.total}</p>
      <p class="bazi-journey-hero-sub">全库收集进度 · 含逛图鉴与排盘点亮 · 与「命盘印记」不同：这里不限本盘</p>
    </header>`;

  const overview = `
    <section class="bazi-journey-kind-overview" aria-label="图鉴分类总览">
      <p class="bazi-journey-kind-hint">点分类跳回图鉴对应 Tab · 在全库里继续对照</p>
      <div class="bazi-journey-kind-grid" role="group">
        ${cats
          .map((c) => {
            const n = countForTab(c.tab);
            const p = baziCodexProgress(c.tab === 'relation' ? 'relation' : c.tab);
            return `
            <button type="button" class="bazi-journey-kind-card${n ? '' : ' is-empty'}"
              data-goto-atlas-tab="${c.tab}" ${n ? '' : 'disabled'}>
              <strong>${escapeHtml(c.label)}</strong>
              <em>${n}<span>/${p.total}</span></em>
            </button>`;
          })
          .join('')}
      </div>
    </section>`;

  if (!litEntries.length) {
    return `
      ${hero}
      ${overview}
      <p class="bazi-codex-empty">排盘或浏览图鉴后，点亮的词条会出现在对应分类里。</p>
      <p class="bazi-journey-exit">
        <button type="button" class="bazi-inline-link" data-goto-reading>去人生地图排盘 →</button>
      </p>`;
  }

  return `
    ${hero}
    ${overview}
    <p class="bazi-codex-guide">想看「只在我盘上」的词条 → 切到「命盘印记」</p>`;
}

/** 命盘印记 · 仅本盘遇见（≠ 已点亮全库收集） */
function renderJourneyChartHub(): string {
  const { chart, luck } = activeChartContext();

  let quick = `<p class="bazi-codex-empty">填写出生信息后，这里会给出四柱解读。</p>
    <p class="bazi-journey-exit"><button type="button" class="bazi-inline-link" data-goto-reading>去人生地图 →</button></p>`;
  if (chart) {
    const natal = chart.pillars.filter((p) => p.key !== 'liunian' && !p.empty);
    const pillarsLine = natal.map((p) => `${p.title}${p.stem}${p.branch}`).join(' · ');
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
      ? `${du.ganZhi}（约${du.startAge}–${du.endAge}岁）${dayunLoreHint(du.ganZhi) ? ` · ${dayunLoreHint(du.ganZhi)}` : ''}`
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
      </ul>
      <p class="bazi-journey-exit"><button type="button" class="bazi-inline-link" data-goto-reading>在人生地图细读 →</button></p>`;
  }

  const onChart = chart ? libraryIdsFromChart(chart) : [];
  const byKind = {
    stem: onChart.filter((x) => x.kind === 'stem'),
    branch: onChart.filter((x) => x.kind === 'branch'),
    tengod: onChart.filter((x) => x.kind === 'tengod'),
    shensha: onChart.filter((x) => x.kind === 'shensha'),
    nayin: onChart.filter((x) => x.kind === 'nayin'),
    jiazi: onChart.filter((x) => x.kind === 'jiazi'),
    relation: onChart.filter((x) => x.kind === 'relation'),
  };

  const entryCard = (id: string): string => {
    const enc = getBaziEncyclopedia(id);
    const star = getStarCard(id);
    const title = enc?.title ?? star?.name ?? id;
    const core = buildCodexDossier(id)?.coreKeyword || enc?.oneLiner || star?.modern || '';
    return compactEntryHtml({ id, title, core, lit: true });
  };

  const section = (
    title: string,
    ids: Array<{ id: string }>,
    atlasTab: Tab,
    emptyHint: string,
  ): string => {
    const jump = `<button type="button" class="bazi-inline-link bazi-section-atlas-jump" data-goto-atlas-tab="${atlasTab}">在图鉴看全库 →</button>`;
    if (!ids.length) {
      return `
        <section class="bazi-gz-section">
          <div class="bazi-section-head-row">
            <h2 class="bazi-codex-section-title">${escapeHtml(title)}</h2>
            ${jump}
          </div>
          <p class="bazi-codex-empty">${escapeHtml(emptyHint)}</p>
        </section>`;
    }
    return `
      <section class="bazi-gz-section">
        <div class="bazi-section-head-row">
          <h2 class="bazi-codex-section-title">${escapeHtml(title)} · ${ids.length}</h2>
          ${jump}
        </div>
        <div class="bazi-codex-entry-grid">${ids.map((x) => entryCard(x.id)).join('')}</div>
      </section>`;
  };

  const featuredOnChart = byKind.shensha.filter((x) => {
    const card = getStarCard(x.id);
    return card && (SHENSHA_FEATURED as readonly string[]).includes(card.name);
  });
  const otherShensha = byKind.shensha.filter((x) => !featuredOnChart.some((f) => f.id === x.id));

  const featuredBlock = featuredOnChart.length
    ? `<div class="bazi-codex-entry-grid is-shensha">${featuredOnChart
        .map((x) => {
          const card = getStarCard(x.id);
          return card ? featuredBadgeHtml(card) : entryCard(x.id);
        })
        .join('')}</div>`
    : '';

  const otherSsBlock = otherShensha.length
    ? `<div class="bazi-codex-entry-grid is-ss-atlas">${otherShensha
        .map((x) => {
          const card = getStarCard(x.id);
          const enc = getBaziEncyclopedia(x.id);
          const name = card?.name ?? enc?.title ?? x.id;
          const gloss =
            shenshaAtlasGloss(name) || card?.impression || card?.modern || enc?.oneLiner || '盘上神煞';
          return `
            <button type="button" class="bazi-ss-chip is-lit" data-codex-id="${escapeHtml(x.id)}">
              <strong>${escapeHtml(name)}</strong>
              <em>${escapeHtml(gloss)}</em>
            </button>`;
        })
        .join('')}</div>`
    : '';

  const shenshaSection = !chart
    ? `<section class="bazi-gz-section bazi-ss-tier">
        <h2 class="bazi-codex-section-title">✨ 我的命盘出现</h2>
        <p class="bazi-codex-empty">排盘后，盘上神煞、干支、十神都会出现在这里。</p>
      </section>`
    : `<section class="bazi-gz-section bazi-ss-tier">
        <div class="bazi-section-head-row">
          <h2 class="bazi-codex-section-title">✨ 本盘神煞 · ${byKind.shensha.length}</h2>
          <button type="button" class="bazi-inline-link bazi-section-atlas-jump" data-goto-atlas-tab="shensha">在图鉴看全库 →</button>
        </div>
        <p class="bazi-codex-guide">只列落在你盘上的神煞 · 逛图鉴点亮但不在盘上的，请去「已点亮」</p>
        ${
          byKind.shensha.length
            ? `${featuredBlock}${otherSsBlock}`
            : `<p class="bazi-codex-empty">本盘暂无已入库神煞词条。</p>`
        }
      </section>`;

  if (!chart) {
    return `
      <header class="bazi-journey-hero is-compact">
        <p class="bazi-journey-hero-sub">仅本盘遇见 · 不是全库点亮列表</p>
      </header>
      <section class="bazi-gz-section">
        <h2 class="bazi-codex-section-title">📖 命盘解读</h2>
        ${quick}
      </section>
      ${shenshaSection}`;
  }

  return `
    <header class="bazi-journey-hero is-compact">
      <p class="bazi-journey-hero-sub">仅本盘遇见 · 共 ${onChart.length} 条 · 与「已点亮」全库收集分开</p>
    </header>
    <section class="bazi-gz-section">
      <h2 class="bazi-codex-section-title">📖 命盘解读</h2>
      ${quick}
    </section>
    ${shenshaSection}
    ${section('天干', byKind.stem, 'stem', '本盘天干会列在这里')}
    ${section('地支', byKind.branch, 'branch', '本盘地支会列在这里')}
    ${section('十神', byKind.tengod, 'tengod', '本盘十神会列在这里')}
    ${section('甲子', byKind.jiazi, 'jiazi', '四柱甲子会列在这里')}
    ${section('纳音', byKind.nayin, 'nayin', '四柱纳音会列在这里')}
    ${section('生克关系', byKind.relation, 'relation', '盘面冲合刑害等关系会列在这里')}`;
}

function renderMarksGrid(filter: MarksFilter): string {
  const ids = listBaziCodexMarkedIds(filter === 'all' ? undefined : filter);
  const sub = `
    <div class="bazi-codex-subtabs" role="tablist" aria-label="标记筛选">
      ${(['all', 'fire', 'useful'] as const)
        .map((f) => {
          const label = f === 'all' ? '全部' : f === 'fire' ? '火' : '对我有用';
          const n = listBaziCodexMarkedIds(f === 'all' ? undefined : f).length;
          return `<button type="button" class="bazi-codex-subtab${filter === f ? ' is-on' : ''}" data-marks-filter="${f}">${label} · ${n}</button>`;
        })
        .join('')}
    </div>`;

  if (!ids.length) {
    return `
      ${sub}
      <div class="bazi-codex-empty">
        <p>还没有标记。打开任意词条，在右上角点「火」或「对我有用」。</p>
      </div>`;
  }

  const cards = ids
    .map((id) => {
      const enc = getBaziEncyclopedia(id);
      if (!enc) return '';
      const marks = getBaziCodexMarks(id);
      const dossier = buildCodexDossier(id);
      return compactEntryHtml({
        id,
        title: enc.title,
        core: dossier?.coreKeyword || enc.oneLiner || enc.title,
        lit: entryIsLit(id),
        extraClass: marks.includes('fire') ? 'is-mark-fire' : '',
      });
    })
    .filter(Boolean)
    .join('');

  return `${sub}<div class="bazi-codex-entry-grid">${cards}</div>`;
}

/** 精品：缩略图纯画面 + 名称 + 含义（未解锁也显示内容，只灰图） */
function featuredBadgeHtml(card: StarCardLore): string {
  const unlocked = isBaziCodexUnlocked(card.id);
  const visual = getShenshaVisual(card.name);
  const warm =
    visual?.light === 'warm' ||
    (!visual && card.zone === 'auspicious');
  const art = shenshaBadgeArtHtml(card.id, card.glyph, { overlayName: false });
  const blurb =
    shenshaAtlasGloss(card.name) || card.impression || card.modern;
  return `
    <button type="button" class="bazi-ss-row ${warm ? 'is-warm' : 'is-cold'} ${unlocked ? 'is-lit' : 'is-soft'}" data-codex-id="${escapeHtml(card.id)}">
      ${art}
      <span class="bazi-ss-row-text">
        <strong>${escapeHtml(card.name)}</strong>
        <em>${escapeHtml(blurb)}</em>
      </span>
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
  return codexDetailArtHtml(id);
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
    chart,
    luck,
  });
}
