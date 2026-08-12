import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import { getActivePerson } from '../life/storage.ts';
import { loadRectifyAdoption } from '../bazi/rectify-adoption.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { collectUnlockIdsFromPalaces, unlockStarsFromChart } from '../ziwei/codex.ts';
import { getStarLore } from '../ziwei/stars.ts';
import {
  loadZiweiIntent,
  loadZiweiQuestion,
  saveZiweiQuestion,
} from '../ziwei/session.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';
import { bindZiweiLearnHotspots, openZiweiLearnSheet } from '../ui/ziwei-learn-sheet.ts';
import { mountZiweiPlate, type MountZiweiPlateHandle } from '../ui/ziwei-plate.ts';
import {
  mountZiweiTimeLadder,
  type ZiweiTimeLadderHandle,
} from '../ui/ziwei-time-ladder.ts';
import { resolveHoroscopeLimits } from '../ziwei/horoscope-limits.ts';
import { mountLabReadingTopbar } from '../ui/lab-reading-chrome.ts';
import { mountLabFloatActions } from '../ui/lab-float-actions.ts';
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import { formatSelectionAskSeed } from '../ui/lab-selection-ask.ts';
import { openZiweiNotesSheet } from '../ui/ziwei-notes-sheet.ts';
import { openZiweiDeepReadingEntry } from '../ziwei/personalize-deep.ts';
import {
  loadAnnualAskCache,
  personalizeAnnualAsk,
} from '../ziwei/annual-ask.ts';
import { listChartShenshaOverview } from '../ziwei/shensha-policy.ts';
import { answerZiweiConcept, recordZiweiConceptMiss } from '../ziwei/concept-ask.ts';
import {
  mountQuestBannerAndCheckIn,
  type QuestUiHandle,
} from '../ui/quest-banner-checkin.ts';
import { craftAwakenProgressHtml } from '../craft/combo-achievements.ts';
import { draftFromZiwei } from '../share/drafts.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type ViewMode = 'theater' | 'chart';
/** 人生地图内部分区 */
type TheaterTab = 'self' | 'pillars' | 'luck';

function queryMode(): ViewMode {
  try {
    return new URLSearchParams(location.search).get('mode') === 'chart' ? 'chart' : 'theater';
  } catch {
    return 'theater';
  }
}

function queryFocus(): { star?: string; palace?: string; status?: string } {
  try {
    const q = new URLSearchParams(location.search);
    return {
      star: q.get('star')?.trim() || undefined,
      palace: q.get('palace')?.trim() || undefined,
      status: q.get('status')?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

function setModeUrl(mode: ViewMode): void {
  try {
    const q = new URLSearchParams();
    if (mode === 'chart') q.set('mode', 'chart');
    const qs = q.toString();
    history.replaceState({}, '', qs ? `/ziwei/reading?${qs}` : '/ziwei/reading');
  } catch {
    /* ignore */
  }
}

export function renderZiweiReading(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  let person = getActivePerson();
  const intent = loadZiweiIntent();
  let question = loadZiweiQuestion();
  let mode: ViewMode = queryMode();
  let theaterTab: TheaterTab = 'self';
  let openPillar: string | null = 'core';
  let drill: { title: string; body: string } | null = null;
  let unlockedOnce = false;
  let unmountPlate: MountZiweiPlateHandle | null = null;
  let unmountLadder: ZiweiTimeLadderHandle | null = null;
  let unmountWeekQuest: QuestUiHandle | null = null;
  let disposeFloat: (() => void) | null = null;
  let latestView: ZiweiChartView | null = null;

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-reading-page';
  mountEnvBanner(page);
  root.appendChild(page);

  const drillMap = new Map<string, { title: string; body: string }>();

  function maybeUnlock(view: ZiweiChartView): void {
    if (unlockedOnce) return;
    unlockedOnce = true;
    const { ids, palaceByStar } = collectUnlockIdsFromPalaces(view.palaces);
    const unlocked = unlockStarsFromChart(ids, palaceByStar);
    if (unlocked.newly.length > 0) {
      const first = unlocked.newly[0]!;
      const lore = getStarLore(first);
      showUnlockToast({
        isFirstTime: true,
        count: unlocked.total,
        cardName: lore ? `${lore.id} · ${lore.epithet}` : first,
      });
    }
  }

  function modeTabsHtml(active: ViewMode): string {
    return `
      <div class="ziwei-mode-tabs lab-sys-tabs" role="tablist" aria-label="紫微导航">
        <button type="button" class="ziwei-mode-tab lab-sys-tab ${active === 'theater' ? 'is-on' : ''}" data-mode="theater">人生地图</button>
        <button type="button" class="ziwei-mode-tab lab-sys-tab ${active === 'chart' ? 'is-on' : ''}" data-mode="chart">完整命盘</button>
      </div>`;
  }

  function theaterTabsHtml(active: TheaterTab): string {
    const tabs: Array<{ id: TheaterTab; label: string; hint: string }> = [
      { id: 'self', label: '定调', hint: '你是谁' },
      { id: 'pillars', label: '四要素', hint: '事业关系等' },
      { id: 'luck', label: '运限', hint: '大限到流时' },
    ];
    return `
      <div class="ziwei-theater-tabs" role="tablist" aria-label="人生地图分区">
        ${tabs
          .map(
            (t) => `
          <button type="button" role="tab" class="ziwei-theater-tab ${active === t.id ? 'is-on' : ''}" data-theater-tab="${t.id}" aria-selected="${active === t.id}">
            <strong>${t.label}</strong>
            <span>${t.hint}</span>
          </button>`,
          )
          .join('')}
      </div>`;
  }

  function rectifyAdoptBannerHtml(): string {
    const ad = loadRectifyAdoption();
    if (!ad) return '';
    const alts = ad.alternatives
      .slice(0, 2)
      .map((a) => `${a.branch}时 ${a.confidencePct}%`)
      .join(' · ');
    return `<aside class="bazi-rectify-adopt-banner" aria-label="暂定时辰">
          <p><strong>当前采用：${escapeHtml(ad.label)}</strong> · 可信度${escapeHtml(ad.confidenceLabel)}（${ad.confidencePct}%）</p>
          ${alts ? `<p>可选候选：${escapeHtml(alts)}</p>` : ''}
          <p><button type="button" class="life-btn-ghost" data-path="/bazi/rectify">重新校准 ›</button></p>
        </aside>`;
  }

  function readingNavHtml(): string {
    return `
      <nav class="ziwei-reading-nav">
        <button type="button" class="bazi-home-link bazi-home-link-soft" data-path="/bazi/rectify">
          <strong>觉得不准？试试生时校准</strong>
          <span>用大事件反推更贴近的时辰</span>
          <em aria-hidden="true">›</em>
        </button>
        <button type="button" class="bazi-home-link bazi-home-link-soft" data-path="/ziwei?edit=1">
          <strong>出生信息</strong>
          <span>改生辰 · 精度 · 出生地 · 性别</span>
          <em aria-hidden="true">›</em>
        </button>
      </nav>`;
  }

  /** 挂时间梯；地图模式不绑盘面 overlay */
  function attachTimeLadder(
    view: ZiweiChartView,
    opts?: { withPlateOverlay?: boolean },
  ): void {
    const ladderHost = page.querySelector<HTMLElement>('#ziwei-time-ladder-host');
    if (!ladderHost) return;
    const birthYear = Number(person.birthYear) || new Date().getFullYear() - 25;
    const bootYear = view.theater.annual.year ?? new Date().getFullYear();

    function applyOverlay(
      scope: 'decade' | 'year' | 'month' | 'day' | 'hour' = 'year',
      selectPalace = true,
    ): void {
      if (!opts?.withPlateOverlay) return;
      const sel = unmountLadder?.getSelection() ?? { year: bootYear };
      const snap = resolveHoroscopeLimits(person, sel);
      if (!snap) {
        if (sel.decadePalace) unmountPlate?.selectPalace(sel.decadePalace);
        return;
      }
      if (scope !== 'decade') unmountLadder?.syncDecade(snap.decadePalace);
      unmountPlate?.applyLimits(snap, scope, { select: selectPalace });
    }

    unmountLadder = mountZiweiTimeLadder(ladderHost, {
      person,
      view,
      birthYear,
      initial: { year: bootYear },
      onChange: (_sel, scope) => {
        applyOverlay(scope, false);
      },
      onOpenDeep: (ctx) => {
        openZiweiNotesSheet({
          view,
          person: getActivePerson(),
          birthYear,
          selection: ctx.selection,
          level: ctx.level,
          initialTab: 'reason',
          context: view.theater.headline,
          surface: mode === 'chart' ? 'chart' : 'reading',
        });
      },
    });
    if (opts?.withPlateOverlay) applyOverlay('year', false);
  }

  function bind(view?: ZiweiChartView): void {
    if (view) latestView = view;
    mountLabReadingTopbar(page, {
      backPath: '/',
      backLabel: '← Lab',
      tujianPath: '/ziwei/tujian',
      tujianLabel: '图鉴',
      person: {
        onChange: () => paint(),
      },
    });
    disposeFloat?.();
    disposeFloat = mountLabFloatActions(page, {
      system: 'ziwei',
      surface: mode === 'chart' ? 'chart' : 'reading',
      tujianPath: '/ziwei/tujian',
      tujianLabel: '图鉴',
      notesLabel: '笔记',
      deepLabel: '深度解读',
      notesContext: latestView?.theater.headline,
      answerConcept: answerZiweiConcept,
      onSelectionAsk: (text) => {
        openLabDeepSheet({
          system: 'ziwei',
          title: '选区追问',
          initialTab: 'ask',
          seedQuery: formatSelectionAskSeed(text),
          answerConcept: answerZiweiConcept,
          onMiss: (q) => {
            void recordZiweiConceptMiss(q);
          },
          deepHint: '由正文选区带入；概念优先本地词库。',
        });
      },
      onNotes: () => {
        const v = latestView;
        if (!v) return;
        const birthYear = Number(person.birthYear) || new Date().getFullYear() - 25;
        openZiweiNotesSheet({
          view: v,
          person: getActivePerson(),
          birthYear,
          selection: unmountLadder?.getSelection(),
          level: unmountLadder?.getLevel() ?? 'year',
          initialTab: 'reason',
          context: v.theater.headline,
          surface: mode === 'chart' ? 'chart' : 'reading',
        });
      },
      draftShare: () => {
        const v = latestView;
        if (!v) return null;
        const soul = v.soulPalace;
        const spot = soul.majors[0]?.name ?? '空象';
        return draftFromZiwei({
          headline: v.theater.headline.slice(0, 48) || `命宫 · ${spot}`,
          question: question || '紫微命盘',
          summary: `${v.fiveElementsClass} · 命宫${spot} · ${v.theater.headline}`.slice(0, 400),
          sections: [
            { heading: '定调', body: v.theater.headline },
            { heading: '五行局', body: v.fiveElementsClass },
            { heading: '流年', body: String(v.theater.annual.year) },
          ],
        });
      },
      onDeep: () => {
        const v = latestView;
        if (!v) return;
        openZiweiDeepReadingEntry({
          view: v,
          person: getActivePerson(),
          question,
          initialTab: 'deep',
        });
      },
    });
    page.querySelectorAll<HTMLButtonElement>('[data-path]').forEach((btn) => {
      if (btn.closest('.lab-reading-chrome')) return;
      btn.addEventListener('click', () => {
        const path = btn.dataset.path;
        if (path) navigate(path);
      });
    });
    page.querySelector('#ziwei-edit-birth')?.addEventListener('click', () => {
      navigate('/ziwei?edit=1');
    });
    page.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode === 'chart' ? 'chart' : 'theater';
        setModeUrl(mode);
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-theater-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.theaterTab;
        theaterTab =
          next === 'pillars' ? 'pillars' : next === 'luck' ? 'luck' : 'self';
        paint();
        page.querySelector('.ziwei-theater-tabs')?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-pillar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.pillar ?? '';
        openPillar = openPillar === id ? null : id;
        paint();
      });
    });
    page.querySelectorAll<HTMLButtonElement>('[data-drill-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.drillId ?? '';
        drill = drillMap.get(id) ?? null;
        paint();
      });
    });
    page.querySelector('#ziwei-drill-close')?.addEventListener('click', () => {
      drill = null;
      paint();
    });
    page.querySelector('#ziwei-ask')?.addEventListener('click', () => {
      const input = page.querySelector<HTMLInputElement>('#ziwei-q');
      question = input?.value.trim() ?? '';
      saveZiweiQuestion(question);
      paint();
      const v = latestView;
      if (!v || mode !== 'theater') return;
      const adviceEl = page.querySelector<HTMLElement>('[data-annual-advice]');
      const metaEl = page.querySelector<HTMLElement>('[data-annual-ask-meta]');
      const btn = page.querySelector<HTMLButtonElement>('#ziwei-ask');
      if (!adviceEl || !btn) return;

      const q = question.trim() || v.theater.annual.question;
      const cached = loadAnnualAskCache(person.id, v.theater.annual.year, q);
      if (cached) {
        adviceEl.textContent = cached;
        if (metaEl) metaEl.textContent = '规则依据 + 个性化（已缓存）';
        return;
      }

      btn.disabled = true;
      const prevLabel = btn.textContent;
      btn.textContent = '解读中…';
      if (metaEl) metaEl.textContent = '先按盘面规则，再贴合你的问题…';

      void personalizeAnnualAsk({
        view: v,
        person: getActivePerson(),
        question: q,
      }).then((res) => {
        if (!page.isConnected) return;
        const el = page.querySelector<HTMLElement>('[data-annual-advice]');
        const meta = page.querySelector<HTMLElement>('[data-annual-ask-meta]');
        const askBtn = page.querySelector<HTMLButtonElement>('#ziwei-ask');
        if (el) el.textContent = res.text;
        if (meta) {
          if (res.source === 'llm') meta.textContent = '规则依据 + 个性化';
          else if (res.source === 'cache') meta.textContent = '规则依据 + 个性化（已缓存）';
          else meta.textContent = res.message ?? '规则解读';
        }
        if (askBtn) {
          askBtn.disabled = false;
          askBtn.textContent = prevLabel || '占问';
        }
      });
    });
    if (view) {
      bindZiweiLearnHotspots(page, view, {
        onOpenChart: (focus) => {
          mode = 'chart';
          setModeUrl('chart');
          paint();
          window.setTimeout(() => {
            openZiweiLearnSheet({
              view,
              focus,
              onOpenChart: () => undefined,
            });
          }, 50);
        },
      });
    }
  }

  function paintError(msg: string): void {
    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回 Mystic Lab</button>
      <header class="life-header">
        <h1 class="page-title">星盘未就绪</h1>
        <p class="page-subtitle">${escapeHtml(msg)}</p>
      </header>
      <button type="button" class="life-btn-primary" data-path="/ziwei?edit=1">补全出生信息</button>
    `;
    bind();
  }

  /** 流年神煞叠读：可点开同源术语弹窗 */
  function annualShenshaHtml(
    line: string | undefined,
    highlights: ZiweiChartView['theater']['shenshaHighlights'],
  ): string {
    const hooked = highlights.filter((h) => h.annualHook);
    const chips = (hooked.length ? hooked : highlights.slice(0, 4)).map(
      (h) =>
        `<button type="button" class="ziwei-term-hot" data-learn-star="${escapeHtml(h.name)}" data-learn-palace="${escapeHtml(h.palace)}">${escapeHtml(h.name)}</button>`,
    );
    if (!chips.length && !line) return '';
    return `<p class="ziwei-annual-shensha"><strong>神煞叠读</strong> ${
      chips.length ? chips.join(' · ') : escapeHtml(line ?? '')
    }${
      hooked.length
        ? `<span class="ziwei-annual-shensha-note">${escapeHtml(hooked.map((h) => h.annualHook).filter(Boolean).join('；'))}</span>`
        : line && chips.length
          ? `<span class="ziwei-annual-shensha-note">${escapeHtml(line)}</span>`
          : ''
    }</p>`;
  }

  function shenshaOverviewHtml(view: ZiweiChartView): string {
    const rows = listChartShenshaOverview(view);
    if (!rows.length) return '';
    const highlightNames = new Set(view.theater.shenshaHighlights.map((h) => h.name));
    return `
      <details class="ziwei-shensha-overview" id="ziwei-shensha-overview">
        <summary>本盘神煞总览 · ${rows.length} 条</summary>
        <p class="ziwei-codex-hint">排盘精露条目；点名看术语弹窗（与图鉴同源）。重点再筛见上方；完整词库进图鉴。</p>
        <ul class="ziwei-shensha-overview-list">
          ${rows
            .map(
              (r) => `
            <li class="${highlightNames.has(r.name) ? 'is-focus' : ''}">
              <button type="button" class="ziwei-term-hot" data-learn-star="${escapeHtml(r.name)}" data-learn-palace="${escapeHtml(r.palace)}">${escapeHtml(r.name)} · ${escapeHtml(r.epithet)}</button>
              <span>${escapeHtml(r.palace.replace(/宫$/, ''))}</span>
              ${highlightNames.has(r.name) ? '<em>重点</em>' : ''}
            </li>`,
            )
            .join('')}
        </ul>
        <button type="button" class="ziwei-drill-link" data-path="/ziwei/tujian?bucket=shensha">打开图鉴 · 神煞 ›</button>
      </details>`;
  }

  /** 紫微运限共有模块（不属于「人生地图」叙事专属） */
  function decadeSectionHtml(view: ZiweiChartView): string {
    const decade = view.theater.decade;
    return `
      <section class="ziwei-decade" aria-label="十年大限">
        <p class="ziwei-kicker">紫微 · 十年大限${decade.started && decade.ageFrom ? ` · 虚岁 ${decade.ageFrom}–${decade.ageTo}` : ''}</p>
        <p class="ziwei-decade-theme">${escapeHtml(decade.theme)}</p>
        <p class="ziwei-decade-lead">${escapeHtml(decade.lead)}</p>
        <p class="ziwei-mutagen-inline">${escapeHtml(decade.mutagenLine)}</p>
        <details class="ziwei-forecast ziwei-decade-fold">
          <summary>这十年怎么走 · 展开看课题与防坑</summary>
          <pre class="ziwei-forecast-body">${escapeHtml(decade.guide)}</pre>
        </details>
        <button type="button" class="ziwei-drill-link" data-drill-id="decade">大限传统口径 ›</button>
      </section>`;
  }

  function paintTheater(view: ZiweiChartView): void {
    unmountPlate?.destroy();
    unmountPlate = null;
    unmountLadder?.destroy();
    unmountLadder = null;
    unmountWeekQuest?.destroy();
    unmountWeekQuest = null;
    drillMap.clear();
    const t = view.theater;
    drillMap.set('soul', {
      title: '命宫 · 传统',
      body: `命宫主星：${view.soulPalace.majors.map((s) => s.name + (s.mutagen ? `化${s.mutagen}` : '')).join('、') || '空宫'}\n身主：${view.body}\n命主：${view.soul}`,
    });
    drillMap.set('annual', {
      title: '流年 · 传统',
      body: t.annual.traditional,
    });
    drillMap.set('decade', {
      title: '十年大限 · 传统',
      body: t.decade.traditional,
    });

    const pillarsHtml = t.pillars
      .map((p) => {
        const open = openPillar === p.id;
        const drillId = `pillar-${p.id}`;
        drillMap.set(drillId, { title: `${p.title} · 传统`, body: p.traditional });
        return `
        <article class="ziwei-pillar ${open ? 'is-open' : ''}">
          <button type="button" class="ziwei-pillar-head" data-pillar="${p.id}">
            <span>
              <strong>${escapeHtml(p.title)}</strong>
              <em>${escapeHtml(p.subtitle)}</em>
            </span>
            <span aria-hidden="true">${open ? '▾' : '▸'}</span>
          </button>
          ${
            open
              ? `<div class="ziwei-pillar-body">
                  <p>${escapeHtml(p.body).replace(/\n\n/g, '</p><p>')}</p>
                  <button type="button" class="ziwei-drill-link" data-drill-id="${drillId}">查看传统宫星 ›</button>
                </div>`
              : ''
          }
        </article>`;
      })
      .join('');

    const comfortHtml = t.comfort
      .map(
        (c) => `
      <aside class="ziwei-comfort">
        <p class="ziwei-comfort-tag">安心提示 · ${escapeHtml(c.trigger)}</p>
        <p>${escapeHtml(c.line)}</p>
      </aside>`,
      )
      .join('');

    const annual = t.annual;
    const annualAskCached = loadAnnualAskCache(person.id, annual.year, question.trim() || annual.question);
    const annualAdviceShow = annualAskCached ?? annual.advice;
    const annualAskMeta = annualAskCached
      ? '规则依据 + 个性化（已缓存）'
      : '规则解读 · 点占问可个性化';
    const spot = t.spotlightStar;
    const spotLore = getStarLore(spot);
    const spotPalace =
      view.palaces.find((p) => p.majors.some((s) => s.name === spot))?.name ?? '命宫';
    const coStarsHtml = t.soulCombo.coStars
      .map((n) => {
        const pName =
          view.palaces.find((p) => [...p.majors, ...p.minors].some((s) => s.name === n))?.name ??
          '';
        return `<button type="button" class="ziwei-term-hot" data-learn-star="${escapeHtml(n)}"${pName ? ` data-learn-palace="${escapeHtml(pName)}"` : ''}>${escapeHtml(n)}</button>`;
      })
      .join('');

    page.innerHTML = `
      <button type="button" class="back-link life-back">← Lab</button>
      ${modeTabsHtml('theater')}
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">人生地图</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.ziwei} · ${escapeHtml(view.fiveElementsClass)}</p>
        <button type="button" class="ziwei-edit-birth" id="ziwei-edit-birth">改出生信息</button>
      </header>

      ${rectifyAdoptBannerHtml()}

      ${theaterTabsHtml(theaterTab)}

      <div class="ziwei-theater-pane" data-theater-pane="self" ${theaterTab === 'self' ? '' : 'hidden'}>
        <section class="ziwei-combo" aria-label="内核主星组合">
          <p class="ziwei-kicker">核心星曜 · 组合技</p>
          <div class="ziwei-combo-lead">
            <span class="ziwei-combo-glyph" aria-hidden="true">${escapeHtml((spot || '星').slice(0, 1))}</span>
            <div>
              <p class="ziwei-combo-name">
                <button type="button" class="ziwei-term-hot is-lead" data-learn-star="${escapeHtml(spot || '')}" data-learn-palace="${escapeHtml(spotPalace)}">${escapeHtml(spot || '空象')}${spotLore ? ` · ${escapeHtml(spotLore.epithet)}` : ''}</button>
              </p>
              <p class="ziwei-combo-myth">${escapeHtml(spotLore?.myth ?? '内核空象，贵人与流年来点亮。')}</p>
            </div>
          </div>
          ${coStarsHtml ? `<p class="ziwei-combo-costars">同场：${coStarsHtml}</p>` : ''}
          <p class="ziwei-combo-line">${escapeHtml(t.soulCombo.line)}</p>
        </section>

        <section class="ziwei-headline">
          <p class="ziwei-kicker">你是谁 · 核心定调</p>
          <p class="ziwei-headline-text">${escapeHtml(t.headline)}</p>
          <button type="button" class="ziwei-drill-link" data-drill-id="soul">专业口径（传统） ›</button>
        </section>

        ${
          t.shenshaHighlights.length
            ? `<section class="ziwei-shensha-deep" aria-label="神煞重点">
          <p class="ziwei-kicker">神煞重点 · 深度再筛</p>
          <p class="ziwei-codex-hint">全盘神煞很多；这里只挑最值得先看的几条。下方总览可串本盘条目，完整词库在图鉴。</p>
          <ul class="ziwei-shensha-deep-list">
            ${t.shenshaHighlights
              .map(
                (h) => `
              <li>
                <div class="ziwei-shensha-deep-head">
                  <button type="button" class="ziwei-term-hot" data-learn-star="${escapeHtml(h.name)}" data-learn-palace="${escapeHtml(h.palace)}">${escapeHtml(h.name)} · ${escapeHtml(h.epithet)}</button>
                  <span class="ziwei-shensha-deep-tags">${(h.pillarLabels ?? [])
                    .map((lab) => `<em>${escapeHtml(lab)}</em>`)
                    .join('')}${h.annualHook ? '<em class="is-year">流年</em>' : ''}</span>
                </div>
                <p class="ziwei-shensha-deep-line">${escapeHtml(h.line)}</p>
                <p class="ziwei-shensha-deep-body">${escapeHtml(h.body)}</p>
                ${h.annualHook ? `<p class="ziwei-shensha-deep-year">${escapeHtml(h.annualHook)}</p>` : ''}
              </li>`,
              )
              .join('')}
          </ul>
        </section>`
            : ''
        }
        ${shenshaOverviewHtml(view)}

        ${comfortHtml}
      </div>

      <div class="ziwei-theater-pane" data-theater-pane="pillars" ${theaterTab === 'pillars' ? '' : 'hidden'}>
        <section class="ziwei-pillars" aria-label="人生四要素">
          <p class="ziwei-kicker">人生四要素</p>
          <p class="ziwei-codex-hint">点开一条看白话；需要宫星原文再点传统口径。</p>
          ${pillarsHtml}
        </section>
      </div>

      <div class="ziwei-theater-pane" data-theater-pane="luck" ${theaterTab === 'luck' ? '' : 'hidden'}>
        <div id="ziwei-quest-banner-host"></div>
        ${decadeSectionHtml(view)}

        <section class="ziwei-annual" aria-label="当前流年">
          <p class="ziwei-kicker">当前流年 · ${annual.year}</p>
          <label class="ziwei-ask-label" for="ziwei-q">问一句今年的事</label>
          <div class="ziwei-ask-row">
            <input id="ziwei-q" class="ziwei-ask-input" maxlength="80" value="${escapeHtml(question)}" placeholder="例如：我今年适合换工作吗？" />
            <button type="button" class="life-btn-primary" id="ziwei-ask">占问</button>
          </div>
          <p class="ziwei-annual-q">就「${escapeHtml(annual.question)}」</p>
          <p class="ziwei-annual-ask-meta" data-annual-ask-meta>${escapeHtml(annualAskMeta)}</p>
          <p class="ziwei-annual-advice" data-annual-advice>${escapeHtml(annualAdviceShow)}</p>
          ${annualShenshaHtml(annual.shenshaLine, t.shenshaHighlights)}
          <p class="ziwei-mutagen-inline">${escapeHtml(annual.mutagenLine)}</p>
          <button type="button" class="ziwei-drill-link" data-drill-id="annual">流年传统四化 ›</button>
        </section>

        <details class="ziwei-forecast">
          <summary>未来一年的风向标 · 展开看运势与防坑</summary>
          <pre class="ziwei-forecast-body">${escapeHtml(annual.forecastGuide)}</pre>
        </details>

        <section class="ziwei-theater-ladder" aria-label="运限时间梯">
          <p class="ziwei-kicker">时间梯 · 大限到流时</p>
          <p class="ziwei-codex-hint">年看主题 · 月看推进 · 日看当天 · 时看当下。切到「完整命盘」还可叠到十二宫。</p>
          <div id="ziwei-time-ladder-host"></div>
        </section>

        <div id="ziwei-quest-checkin-host"></div>
      </div>

      ${readingNavHtml()}

      ${
        drill
          ? `<div class="ziwei-drill-sheet" role="dialog" aria-modal="true">
              <div class="ziwei-drill-panel">
                <button type="button" class="ziwei-drill-close" id="ziwei-drill-close">关闭</button>
                <h2>${escapeHtml(drill.title)}</h2>
                <pre class="ziwei-drill-body">${escapeHtml(drill.body)}</pre>
              </div>
            </div>`
          : ''
      }
    `;
    bind(view);
    attachTimeLadder(view);
    const bannerHost = page.querySelector<HTMLElement>('#ziwei-quest-banner-host');
    const checkInHost = page.querySelector<HTMLElement>('#ziwei-quest-checkin-host');
    if (bannerHost && checkInHost && theaterTab === 'luck') {
      unmountWeekQuest = mountQuestBannerAndCheckIn({
        bannerHost,
        checkInHost,
        view,
        person: getActivePerson(),
      });
    }
  }

  function paintChart(view: ZiweiChartView): void {
    drillMap.clear();
    unmountPlate?.destroy();
    unmountPlate = null;
    unmountLadder?.destroy();
    unmountLadder = null;
    unmountWeekQuest?.destroy();
    unmountWeekQuest = null;
    const focus = queryFocus();
    page.innerHTML = `
      <button type="button" class="back-link life-back">← Lab</button>
      ${modeTabsHtml('chart')}
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">完整命盘</h1>
        <p class="page-subtitle">年看主题 · 月看推进 · 日看当天 · 时看当下</p>
        ${craftAwakenProgressHtml()}
        <button type="button" class="ziwei-edit-birth" id="ziwei-edit-birth">改出生信息</button>
      </header>

      ${rectifyAdoptBannerHtml()}

      <div id="ziwei-plate-host"></div>
      <div id="ziwei-time-ladder-host"></div>

      ${readingNavHtml()}
    `;
    bind(view);
    const host = page.querySelector<HTMLElement>('#ziwei-plate-host');
    let statusPalace = focus.palace;
    let statusStar = focus.star;
    if (focus.status && !statusStar) {
      const want = focus.status;
      for (const p of view.palaces) {
        const hit = [...p.majors, ...p.minors].find((s) =>
          String(s.brightness || '').includes(want),
        );
        if (hit) {
          statusPalace = p.name;
          statusStar = hit.name;
          break;
        }
      }
    }
    if (host) {
      unmountPlate = mountZiweiPlate(host, view, {
        /* 仅深链带宫位时预选；默认不点宫、不画三方线 */
        initialPalace: statusPalace || undefined,
      });
      if (focus.status) {
        host.querySelectorAll('.ziwei-plate-status-hit').forEach((el) => {
          const btn = el as HTMLElement;
          if (btn.dataset.plateStatus === focus.status) {
            btn.classList.add('is-luoxian-hl');
            btn.closest('.ziwei-plate-star-row')?.classList.add('is-luoxian-hl');
          }
        });
        const banner = document.createElement('p');
        banner.className = 'ziwei-codex-hint ziwei-luoxian-banner';
        banner.textContent = `已高亮「${focus.status}」状态的星 · 点星可看解释`;
        host.prepend(banner);
      }
    }
    attachTimeLadder(view, { withPlateOverlay: true });
    if (statusStar) {
      openZiweiLearnSheet({
        view,
        focus: {
          starName: statusStar,
          palaceName: statusPalace,
          status: focus.status,
        },
        onOpenChart: () => undefined,
      });
    }
  }

  function paint(): void {
    person = getActivePerson();
    const next = castZiweiChart(person, {
      intent,
      year: new Date().getFullYear(),
      question,
    });
    if ('error' in next) {
      paintError(next.error);
      return;
    }
    maybeUnlock(next);
    if (mode === 'chart') paintChart(next);
    else paintTheater(next);
  }

  paint();
  return () => {
    unmountPlate?.destroy();
    unmountLadder?.destroy();
    unmountWeekQuest?.destroy();
    document.querySelector('[data-ziwei-year-deep]')?.remove();
    disposeFloat?.();
    document.querySelector('.ziwei-learn-sheet')?.remove();
    document.querySelector('[data-lab-float-dock]')?.remove();
    document.querySelector('[data-lab-deep-fab]')?.remove();
    document.querySelector('.lab-deep-sheet')?.remove();
    document.querySelector('.lab-notes-sheet')?.remove();
    document.querySelector('.ziwei-wq-sheet')?.remove();
    document.querySelector('[data-ziwei-wq-float]')?.remove();
    stars.remove();
  };
}
