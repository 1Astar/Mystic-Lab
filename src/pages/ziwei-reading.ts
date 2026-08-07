import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import { getActivePerson } from '../life/storage.ts';
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
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import { mountLabFloatActions } from '../ui/lab-float-actions.ts';
import { answerZiweiConcept, recordZiweiConceptMiss } from '../ziwei/concept-ask.ts';
import { buildZiweiPageFaq } from '../ziwei/page-faq.ts';
import { draftFromZiwei } from '../share/drafts.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type ViewMode = 'theater' | 'chart';

function queryMode(): ViewMode {
  try {
    return new URLSearchParams(location.search).get('mode') === 'chart' ? 'chart' : 'theater';
  } catch {
    return 'theater';
  }
}

function queryFocus(): { star?: string; palace?: string } {
  try {
    const q = new URLSearchParams(location.search);
    return {
      star: q.get('star')?.trim() || undefined,
      palace: q.get('palace')?.trim() || undefined,
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

  const person = getActivePerson();
  const intent = loadZiweiIntent();
  let question = loadZiweiQuestion();
  let mode: ViewMode = queryMode();
  let openPillar: string | null = 'core';
  let drill: { title: string; body: string } | null = null;
  let unlockedOnce = false;
  let unmountPlate: MountZiweiPlateHandle | null = null;
  let unmountLadder: ZiweiTimeLadderHandle | null = null;
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

  function bind(view?: ZiweiChartView): void {
    if (view) latestView = view;
    mountLabReadingTopbar(page, {
      backPath: '/',
      backLabel: '← Lab',
      tujianPath: '/ziwei/tujian',
      tujianLabel: '探索',
    });
    disposeFloat?.();
    disposeFloat = mountLabFloatActions(page, {
      tujianPath: '/ziwei/tujian',
      tujianLabel: '星曜探索',
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
        openLabDeepSheet({
          system: 'ziwei',
          title: `${person.nickname || '我'}的命盘`,
          initialTab: 'ask',
          presets: buildZiweiPageFaq(v, { question }),
          answerConcept: answerZiweiConcept,
          onMiss: (q) => {
            void recordZiweiConceptMiss(q);
          },
          deepHint: '结合十二宫与当下问题，做一次更贴合的解读。概念题请用「边看边问」。',
          onDeep: () => {
            mode = 'chart';
            setModeUrl(mode);
            paint();
          },
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

      ${decadeSectionHtml(view)}

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

      <section class="ziwei-pillars" aria-label="人生四要素">
        <p class="ziwei-kicker">人生四要素</p>
        ${pillarsHtml}
      </section>

      <section class="ziwei-annual" aria-label="当前流年">
        <p class="ziwei-kicker">当前流年 · ${annual.year}</p>
        <label class="ziwei-ask-label" for="ziwei-q">问一句今年的事</label>
        <div class="ziwei-ask-row">
          <input id="ziwei-q" class="ziwei-ask-input" maxlength="80" value="${escapeHtml(question)}" placeholder="例如：我今年适合换工作吗？" />
          <button type="button" class="life-btn-primary" id="ziwei-ask">占问</button>
        </div>
        <p class="ziwei-annual-q">就「${escapeHtml(annual.question)}」</p>
        <p class="ziwei-annual-advice">${escapeHtml(annual.advice)}</p>
        <p class="ziwei-mutagen-inline">${escapeHtml(annual.mutagenLine)}</p>
        <button type="button" class="ziwei-drill-link" data-drill-id="annual">流年传统四化 ›</button>
      </section>

      <details class="ziwei-forecast">
        <summary>未来一年的风向标 · 展开看运势与防坑</summary>
        <pre class="ziwei-forecast-body">${escapeHtml(annual.forecastGuide)}</pre>
      </details>

      ${comfortHtml}

      <nav class="ziwei-reading-nav">
        <button type="button" class="bazi-home-link bazi-home-link-soft" data-path="/ziwei?edit=1">
          <strong>出生信息</strong>
          <span>改生辰 · 出生地 · 性别</span>
          <em aria-hidden="true">›</em>
        </button>
      </nav>

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
  }

  function paintChart(view: ZiweiChartView): void {
    drillMap.clear();
    unmountPlate?.destroy();
    unmountPlate = null;
    unmountLadder?.destroy();
    unmountLadder = null;
    const focus = queryFocus();
    const birthYear = Number(person.birthYear) || new Date().getFullYear() - 25;
    const bootYear = view.theater.annual.year ?? new Date().getFullYear();
    page.innerHTML = `
      <button type="button" class="back-link life-back">← Lab</button>
      ${modeTabsHtml('chart')}
      <header class="life-header ziwei-header">
        <div class="life-header-emblem">${mysticEmblemHtml('cosmos', 'md')}</div>
        <h1 class="page-title">完整命盘</h1>
        <p class="page-subtitle">年看主题 · 月看推进 · 日看当天 · 时看当下</p>
        <button type="button" class="ziwei-edit-birth" id="ziwei-edit-birth">改出生信息</button>
      </header>

      <div id="ziwei-plate-host"></div>
      <div id="ziwei-time-ladder-host"></div>
    `;
    bind(view);
    const host = page.querySelector<HTMLElement>('#ziwei-plate-host');
    const ladderHost = page.querySelector<HTMLElement>('#ziwei-time-ladder-host');

    function applyOverlay(
      scope: 'decade' | 'year' | 'month' | 'day' | 'hour' = 'year',
      selectPalace = true,
    ): void {
      const sel = unmountLadder?.getSelection() ?? { year: bootYear };
      const snap = resolveHoroscopeLimits(person, sel);
      if (!snap) {
        if (sel.decadePalace) unmountPlate?.selectPalace(sel.decadePalace);
        return;
      }
      if (scope !== 'decade') unmountLadder?.syncDecade(snap.decadePalace);
      unmountPlate?.applyLimits(snap, scope, { select: selectPalace });
    }

    if (host) {
      unmountPlate = mountZiweiPlate(host, view, {
        initialPalace:
          focus.palace ?? view.theater.decade.palaceName ?? view.soulPalace.name,
      });
    }
    if (ladderHost) {
      unmountLadder = mountZiweiTimeLadder(ladderHost, {
        person,
        view,
        birthYear,
        initial: { year: bootYear },
        onChange: (_sel, scope) => {
          applyOverlay(scope, true);
        },
      });
    }
    // 首屏叠看当前流年：有 URL 宫位时只打角标不抢选中
    applyOverlay('year', !(focus.palace || focus.star));
    if (focus.star) {
      openZiweiLearnSheet({
        view,
        focus: { starName: focus.star, palaceName: focus.palace },
        onOpenChart: () => undefined,
      });
    }
  }

  function paint(): void {
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
    document.querySelector('[data-ziwei-year-deep]')?.remove();
    disposeFloat?.();
    document.querySelector('.ziwei-learn-sheet')?.remove();
    document.querySelector('[data-lab-float-dock]')?.remove();
    document.querySelector('[data-lab-deep-fab]')?.remove();
    document.querySelector('.lab-deep-sheet')?.remove();
    stars.remove();
  };
}
