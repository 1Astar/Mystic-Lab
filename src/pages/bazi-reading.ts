import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { buildBaziAnswerPack } from '../bazi/build-pack.ts';
import { castBaziChart } from '../bazi/cast.ts';
import { buildBaziPortrait } from '../bazi/portrait-template.ts';
import { buildEnergyBalance } from '../bazi/sense-energy.ts';
import { buildYearForecast } from '../bazi/sense-forecast.ts';
import { buildRealityInsight } from '../bazi/sense-insight.ts';
import { buildTraditionOrigin } from '../bazi/sense-origin.ts';
import { buildSeasonTone } from '../bazi/sense-season.ts';
import { buildShenShaMarks, markSourceBody } from '../bazi/sense-shensha.ts';
import { openLabConceptPeek } from '../ui/lab-concept-peek.ts';
import { openBaziCodexPopup } from '../ui/bazi-codex-popup.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import {
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
} from '../life/storage.ts';
import { loadRectifyAdoption } from '../bazi/rectify-adoption.ts';
import { draftFromBazi } from '../share/drafts.ts';
import {
  bindAnswerPackGestures,
  renderAnswerPackHtml,
} from '../mystic-engine/render-pack.ts';
import { unlockBaziCodexFromChart } from '../bazi/codex.ts';
import { WUXING_LORE, stemBranchById } from '../bazi/codex-lore.ts';
import { getStarCard } from '../bazi/codex-tags.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { mountLabReadingTopbar } from '../ui/lab-reading-chrome.ts';
import { mountLabFloatActions } from '../ui/lab-float-actions.ts';
import { formatSelectionAskSeed } from '../ui/lab-selection-ask.ts';
import { openLabDeepSheet } from '../ui/lab-deep-sheet.ts';
import { openLabNotesSheet } from '../ui/lab-notes-sheet.ts';
import { answerBaziConcept, recordBaziConceptMiss } from '../bazi/concept-ask.ts';
import { buildBaziPageFaq } from '../bazi/page-faq.ts';
import { applyBaziChartAura, clearBaziChartAura } from '../bazi/page-aura.ts';
import {
  energyBalanceBoardHtml,
  mountEnergyBalanceBoard,
} from '../ui/bazi-energy-balance.ts';
import { learnBadgeHtml, mountWhyBlocks, whyBlockHtml } from '../ui/bazi-why-block.ts';
import { ifSimHtml, mountIfSim } from '../ui/bazi-if-sim.ts';
import { buildIfScenarios } from '../bazi/sense-if.ts';
import {
  buildDomainWhy,
  buildEnergyWhy,
  buildForecastWhy,
  buildInsightWhy,
  buildSeasonWhy,
  buildYijiWhy,
} from '../bazi/learn-why.ts';
import {
  learnStatusLine,
  loadBaziLearn,
  markLearnInteraction,
  resolveBaziLearnTitle,
} from '../bazi/learn-store.ts';

const Q_KEY = 'mystic.bazi.reading.q';

type ReadingPane = 'overview' | 'domains' | 'luck' | 'ask';

const READING_PANES: Array<{ id: ReadingPane; label: string; hint: string }> = [
  { id: 'overview', label: '总览', hint: '气场定调' },
  { id: 'domains', label: '五域', hint: '人生五面' },
  { id: 'luck', label: '运势', hint: '大运流年' },
  { id: 'ask', label: '答问', hint: '此刻确认' },
];

const READING_REFLECT: Record<ReadingPane, { title: string; items: string[] }> = {
  overview: {
    title: '总览 · 对照',
    items: ['今天最对味的一句是…', '想验证的一件小事是…'],
  },
  domains: {
    title: '五域 · 对照',
    items: ['哪一面最像我？', '哪一面我想改？'],
  },
  luck: {
    title: '运势 · 对照',
    items: ['今年宜忌里，我打算先做哪一条？', '哪一条我要刻意避开？'],
  },
  ask: {
    title: '答问 · 对照',
    items: ['这句话里，我最想核对的是…', '下一步我能做的一小步是…'],
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readingPaneTabsHtml(active: ReadingPane): string {
  return `
    <div class="bazi-reading-tabs" role="tablist" aria-label="命盘解读分区">
      ${READING_PANES.map(
        (t) => `
        <button type="button" role="tab" class="bazi-reading-tab${t.id === active ? ' is-on' : ''}" data-reading-pane="${t.id}" aria-selected="${t.id === active}">
          <strong>${t.label}</strong>
          <span>${t.hint}</span>
        </button>`,
      ).join('')}
    </div>`;
}

function loadQuestion(): string {
  try {
    return sessionStorage.getItem(Q_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveQuestion(q: string): void {
  try {
    sessionStorage.setItem(Q_KEY, q);
  } catch {
    /* ignore */
  }
}

export function renderBaziReading(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-reading-page';
  mountEnvBanner(page);

  let question = loadQuestion();
  let readingPane: ReadingPane = 'overview';
  let unlockedOnce = false;
  let disposeFloat: (() => void) | null = null;
  let disposeEnergy: (() => void) | null = null;
  let disposeWhy: (() => void) | null = null;
  let disposeIf: (() => void) | null = null;

  function maybeUnlockCodex(chart: Parameters<typeof unlockBaziCodexFromChart>[0]): void {
    if (unlockedOnce) return;
    unlockedOnce = true;
    const unlocked = unlockBaziCodexFromChart(chart);
    if (unlocked.newly.length === 0) return;
    const first = unlocked.newly[0]!;
    const star = getStarCard(first.id);
    const name =
      first.kind === 'wuxing'
        ? `${WUXING_LORE[first.id as keyof typeof WUXING_LORE]?.title ?? first.id} · ${first.reason ?? '已点亮'}`
        : star
          ? `${star.modern} · ${star.name}`
          : (stemBranchById(first.id)?.title ?? first.id);
    showUnlockToast({
      isFirstTime: true,
      count: unlocked.total,
      cardName: name,
      intoLabel: '已收入八字探索',
    });
  }

  function paint(): void {
    const store = loadLifeStore();
    const person = getActivePerson();
    const ready = hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());

    if (!ready) {
      clearBaziChartAura(page);
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回八字</button>
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <h1 class="page-title">我的命盘</h1>
          <p class="page-subtitle">需要先填写出生年月日</p>
        </header>
        <section class="life-profile-gate">
          <div>
            <p class="life-card-kicker">还不能解读</p>
            <p class="life-gate-brief">回到八字首页填写出生信息。</p>
          </div>
          <button type="button" class="life-btn-primary" data-path="/bazi?edit=1">去填写</button>
        </section>
      `;
      bindNav();
      mountLabReadingTopbar(page, {
        backPath: '/',
        backLabel: '← Lab',
        person: { onChange: () => paint() },
      });
      return;
    }

    const yearNow = new Date().getFullYear();
    const chartResult = castBaziChart(store.profile, yearNow, {
      includeLiunian: true,
      gender: person.gender,
    });
    if ('error' in chartResult) {
      clearBaziChartAura(page);
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回八字</button>
        <header class="life-header">
          <h1 class="page-title">我的命盘</h1>
          <p class="page-subtitle">${escapeHtml(chartResult.error)}</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi?edit=1">回去改出生信息</button>
      `;
      bindNav();
      return;
    }

    applyBaziChartAura(page, chartResult);
    const portrait = buildBaziPortrait(chartResult, {
      gender: person.gender,
    });
    maybeUnlockCodex(chartResult);
    const insight = buildRealityInsight(chartResult);
    const season = buildSeasonTone(chartResult);
    const energy = buildEnergyBalance(chartResult);
    const forecast = buildYearForecast(chartResult, store.profile, {
      gender: person.gender,
      year: yearNow,
    });
    const marks = buildShenShaMarks(chartResult, 5);
    const ifScenarios = buildIfScenarios(chartResult, forecast);
    const origin = buildTraditionOrigin(chartResult, store.profile, marks, {
      gender: person.gender,
      year: yearNow,
    });
    const pack = buildBaziAnswerPack({
      question,
      chart: chartResult,
      gender: person.gender,
    });
    const cards = portrait.domains;
    const packHtml = renderAnswerPackHtml(pack, {
      lead: question.trim() ? `就你的问题「${question.trim()}」` : '',
      hideContextUsed: true,
      question: question.trim(),
    });

    const marksHtml = marks.length
      ? `<section id="bazi-ov-marks" class="bazi-sense-block bazi-sense-marks" aria-label="命盘印记">
        <p class="bazi-sense-kicker">命盘印记</p>
        <p class="bazi-mark-hint">点印记看来源（传统神煞 · 落柱）</p>
        <div class="bazi-mark-row">
          ${marks
            .map(
              (m, i) =>
                `<button type="button" class="bazi-mark-chip${m.needsComfort ? ' is-soft' : ''}" data-mark-i="${i}" aria-label="${escapeHtml(m.label)} · 看来源">${escapeHtml(m.label)}</button>`,
            )
            .join('')}
        </div>
        ${marks
          .filter((m) => m.needsComfort)
          .map((m) => `<p class="bazi-mark-comfort">${escapeHtml(m.comfort)}</p>`)
          .join('')}
        ${marks
          .filter((m) => !m.needsComfort)
          .slice(0, 1)
          .map((m) => `<p class="bazi-mark-comfort is-gentle">${escapeHtml(m.comfort)}</p>`)
          .join('')}
      </section>`
      : '';

    const askLead = question.trim()
      ? `就你的问题，下面是方向 → 转机 → 动作`
      : `没有具体问题时，也可先看「本我」默认答问；有问题再回来更新。`;

    page.innerHTML = `
      <button type="button" class="back-link life-back">← Lab</button>
      ${baziSysTabsHtml('reading')}
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">MY BIRTH CODE</p>
        <h1 class="page-title">我的命盘</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.bazi}</p>
      </header>

      ${(() => {
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
      })()}

      ${readingPaneTabsHtml(readingPane)}

      <div class="bazi-reading-pane${readingPane === 'overview' ? ' is-on' : ''}" data-pane="overview" ${readingPane === 'overview' ? '' : 'hidden'}>
        <nav class="bazi-reading-anchors" aria-label="总览锚点">
          <button type="button" class="bazi-reading-anchor" data-anchor="bazi-ov-insight">感悟</button>
          <button type="button" class="bazi-reading-anchor" data-anchor="bazi-ov-season">定调</button>
          <button type="button" class="bazi-reading-anchor" data-anchor="bazi-ov-energy">能量</button>
          ${marks.length ? '<button type="button" class="bazi-reading-anchor" data-anchor="bazi-ov-marks">印记</button>' : ''}
        </nav>

        <p class="bazi-reading-keyword">${escapeHtml(portrait.keyword)}</p>
        ${learnBadgeHtml()}
        ${
          question.trim()
            ? `<p class="bazi-reading-ask-bridge">此刻问题 · ${escapeHtml(question.trim())} · <button type="button" class="bazi-reading-inline-link" data-reading-pane="ask">去答问 ›</button></p>`
            : `<p class="bazi-reading-ask-bridge">有具体问题想核对？<button type="button" class="bazi-reading-inline-link" data-reading-pane="ask">去答问 ›</button></p>`
        }

        <section id="bazi-ov-insight" class="bazi-sense-block bazi-sense-insight" aria-label="现实感悟">
          <p class="bazi-sense-kicker">✨ 你的现实感悟</p>
          <h2 class="bazi-sense-title">${escapeHtml(insight.title)}</h2>
          <p class="bazi-insight-hook">${escapeHtml(insight.hook)}</p>
          <p class="bazi-sense-body bazi-insight-story">${escapeHtml(insight.story)}</p>
          ${whyBlockHtml(buildInsightWhy(chartResult))}
        </section>

        <section id="bazi-ov-season" class="bazi-sense-block bazi-sense-season" aria-label="季节定调">
          <p class="bazi-sense-kicker">核心定调</p>
          <h2 class="bazi-sense-title">${escapeHtml(season.title)}</h2>
          <p class="bazi-sense-tag">${escapeHtml(season.tagline)}</p>
          <p class="bazi-sense-body">${escapeHtml(season.body)}</p>
          ${whyBlockHtml(buildSeasonWhy(chartResult))}
        </section>

        <section id="bazi-ov-energy" class="bazi-sense-block bazi-sense-energy" aria-label="能量平衡">
          <p class="bazi-sense-kicker">能量状态</p>
          <h2 class="bazi-sense-title">${escapeHtml(energy.headline)}</h2>
          <p class="bazi-sense-tag">你的能量状态犹如一场「${escapeHtml(energy.weatherMeta)}」</p>
          ${energyBalanceBoardHtml(energy)}
          <p class="bazi-sense-body">${escapeHtml(energy.body)}</p>
          <p class="bazi-sense-remedy">${escapeHtml(energy.remedy)}</p>
          ${whyBlockHtml(buildEnergyWhy(chartResult))}
        </section>

        ${marksHtml}

        <nav class="bazi-reading-jumps" aria-label="继续看">
          <button type="button" class="bazi-reading-jump" data-reading-pane="domains">看五域 ›</button>
          <button type="button" class="bazi-reading-jump" data-reading-pane="luck">看今年运势 ›</button>
          <button type="button" class="bazi-reading-jump" data-reading-pane="ask">去答问 ›</button>
          <button type="button" class="bazi-reading-jump" data-path="/bazi/guess">猜命盘盲盒 ›</button>
          <button type="button" class="bazi-reading-jump" data-path="/bazi/week">脑内天气 ›</button>
          <button type="button" class="bazi-reading-jump" data-path="/bazi/learn">知识树 ›</button>
        </nav>

        <details class="bazi-origin-fold">
          <summary>
            <span>传统命理溯源</span>
            <em>点击展开</em>
          </summary>
          <div class="bazi-origin-body">
            ${origin.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
          </div>
        </details>
      </div>

      <div class="bazi-reading-pane${readingPane === 'domains' ? ' is-on' : ''}" data-pane="domains" ${readingPane === 'domains' ? '' : 'hidden'}>
        <header class="bazi-domains-head">
          <p class="bazi-reading-keyword">${escapeHtml(portrait.keyword)}</p>
          <p class="bazi-domains-lead">${escapeHtml(portrait.domainsLead)}</p>
        </header>
        <section class="bazi-reading-cards" aria-label="五域解读">
          ${cards
            .map(
              (c) => `
            <article class="bazi-reading-card" data-domain="${escapeHtml(c.id)}">
              <h2>${escapeHtml(c.title)}</h2>
              <p class="bazi-domain-lead">${escapeHtml(c.lead)}</p>
              <p class="bazi-domain-tip"><span>可以怎么用</span>${escapeHtml(c.tip)}</p>
              <p class="bazi-domain-watch"><span>小心</span>${escapeHtml(c.watch)}</p>
              ${whyBlockHtml(buildDomainWhy(chartResult, c.id, c.title))}
            </article>`,
            )
            .join('')}
        </section>
      </div>

      <div class="bazi-reading-pane${readingPane === 'luck' ? ' is-on' : ''}" data-pane="luck" ${readingPane === 'luck' ? '' : 'hidden'}>
        <header class="bazi-luck-head">
          <p class="bazi-sense-kicker">运势速览</p>
          <p class="bazi-luck-tone">${escapeHtml(forecast.tone)}</p>
        </header>

        <section class="bazi-sense-block bazi-sense-forecast" aria-label="年度天气预报">
          <p class="bazi-sense-kicker">大运与流年</p>
          <h2 class="bazi-sense-title">${escapeHtml(forecast.title)}</h2>
          <p class="bazi-sense-weather">${escapeHtml(forecast.weather)}</p>
          <p class="bazi-sense-body">${escapeHtml(forecast.scene)}</p>
          <p class="bazi-sense-advice"><strong>建议</strong> · ${escapeHtml(forecast.advice)}</p>
          ${whyBlockHtml(
            buildForecastWhy(chartResult, store.profile, {
              gender: person.gender,
              year: yearNow,
            }),
          )}
        </section>

        <section class="bazi-yiji" aria-label="宜忌">
          <div class="bazi-yiji-block is-do">
            <h3>宜</h3>
            <ul>
              ${forecast.dos.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
            </ul>
          </div>
          <div class="bazi-yiji-block is-dont">
            <h3>忌</h3>
            <ul>
              ${forecast.donts.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
            </ul>
          </div>
          ${whyBlockHtml(buildYijiWhy(chartResult))}
        </section>

        ${ifSimHtml(ifScenarios)}

        ${
          forecast.decadeNote
            ? `<section class="bazi-sense-block bazi-sense-decade-block" aria-label="大运气候">
          <p class="bazi-sense-kicker">${escapeHtml(forecast.decadeTitle || '这段大运')}</p>
          <p class="bazi-sense-body">${escapeHtml(forecast.decadeNote)}</p>
        </section>`
            : ''
        }

        <p class="bazi-luck-chart-cta">
          <button type="button" class="bazi-reading-jump" data-path="/bazi/chart">${escapeHtml(forecast.chartCta)}</button>
        </p>
      </div>

      <div class="bazi-reading-pane${readingPane === 'ask' ? ' is-on' : ''}" data-pane="ask" ${readingPane === 'ask' ? '' : 'hidden'}>
        <section class="bazi-reading-ask" aria-label="此刻想问">
          <h2 class="life-route-title">此刻更想确认</h2>
          <p class="bazi-reading-ask-lead">${escapeHtml(askLead)}</p>
          <label class="life-field life-field-full">
            <span>一句话问题（可选）</span>
            <input type="text" id="bazi-reading-q" maxlength="120" placeholder="例如：要不要换工作？" value="${escapeHtml(question)}" />
          </label>
          <button type="button" class="life-btn-ghost" id="bazi-reading-ask-go">更新离线答问</button>
        </section>
        <div class="bazi-pack-host" data-bazi-pack>${packHtml}</div>
      </div>

      <div class="bazi-reading-actions">
        <button type="button" class="life-btn-primary" data-path="/bazi/chart">想看为什么？进入命盘解析 ›</button>
        <button type="button" class="bazi-home-link bazi-home-link-soft" data-path="/bazi/rectify">
          <strong>觉得不准？试试生时校准</strong>
          <span>用大事件反推更贴近的时辰</span>
          <em aria-hidden="true">›</em>
        </button>
        <button type="button" class="life-btn-ghost" data-path="/bazi?edit=1">改出生信息</button>
      </div>
    `;

    bindNav();
    const packHost = page.querySelector<HTMLElement>('[data-bazi-pack]');
    if (packHost) bindAnswerPackGestures(packHost);

    const setReadingPane = (next: ReadingPane): void => {
      readingPane = next;
      page.querySelectorAll<HTMLButtonElement>('[data-reading-pane]').forEach((btn) => {
        const on = btn.dataset.readingPane === next;
        if (btn.classList.contains('bazi-reading-tab')) {
          btn.classList.toggle('is-on', on);
          btn.setAttribute('aria-selected', on ? 'true' : 'false');
        }
      });
      page.querySelectorAll<HTMLElement>('.bazi-reading-pane').forEach((pane) => {
        const on = pane.dataset.pane === next;
        pane.classList.toggle('is-on', on);
        pane.hidden = !on;
      });
      page.querySelector('.bazi-reading-tabs')?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    };

    page.querySelectorAll<HTMLButtonElement>('[data-reading-pane]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.readingPane;
        if (next === 'overview' || next === 'domains' || next === 'luck' || next === 'ask') {
          setReadingPane(next);
        }
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-anchor]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.anchor;
        if (!id) return;
        page.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    page.querySelectorAll<HTMLButtonElement>('[data-mark-i]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.markI);
        const mark = marks[i];
        if (!mark) return;
        openLabConceptPeek({
          term: mark.label,
          initialTab: 'source',
          tabs: [
            { id: 'source', label: '来源', body: markSourceBody(mark) },
            { id: 'plain', label: '白话', body: mark.comfort },
          ],
          sourceHint: '命盘印记 · 落柱',
          onOpenAsk: (term) => {
            openLabDeepSheet({
              system: 'bazi',
              title: `${getActivePerson().nickname || '我'}的命盘`,
              initialTab: 'ask',
              seedQuery: term,
              presets: buildBaziPageFaq(chartResult, { question }),
              answerConcept: answerBaziConcept,
              onMiss: (q) => {
                void recordBaziConceptMiss(q);
              },
              deepHint: '围绕这枚印记继续追问。',
              onDeep: () => navigate('/bazi/chart'),
            });
          },
          onOpenAtlas: () => {
            openBaziCodexPopup({
              term: mark.traditional,
              chart: chartResult,
              onOpenAsk: (term) => {
                openLabDeepSheet({
                  system: 'bazi',
                  title: `${getActivePerson().nickname || '我'}的命盘`,
                  initialTab: 'ask',
                  seedQuery: term,
                  presets: buildBaziPageFaq(chartResult, { question }),
                  answerConcept: answerBaziConcept,
                  onMiss: (q) => {
                    void recordBaziConceptMiss(q);
                  },
                  onDeep: () => navigate('/bazi/chart'),
                });
              },
            });
          },
        });
      });
    });

    mountLabReadingTopbar(page, {
      backPath: '/',
      backLabel: '← Lab',
      person: {
        onChange: () => paint(),
      },
    });

    const shareDraft = () => {
      const pillarsLabel = chartResult.pillars
        .filter((p) => !p.empty)
        .map((p) => `${p.title}${p.stem}${p.branch}`)
        .join(' · ');
      return draftFromBazi({
        dayMaster: chartResult.dayMaster,
        pillarsLabel,
        question: question || '我的命盘解读',
        summary: pack.verdict.headline,
        sections: [{ heading: '定调', body: pack.verdict.headline }],
      });
    };

    disposeFloat?.();
    disposeEnergy?.();
    disposeWhy?.();
    disposeIf?.();
    disposeEnergy = mountEnergyBalanceBoard(page, energy, {
      onLeverCommit: () => {
        markLearnInteraction('lever:energy');
        const badge = page.querySelector<HTMLElement>('.bazi-learn-badge-btn, [data-learn-badge]');
        if (badge) {
          badge.textContent = `${learnStatusLine()} · 知识树 ›`;
          badge.title = resolveBaziLearnTitle(loadBaziLearn()).blurb;
        }
      },
    });
    disposeWhy = mountWhyBlocks(page);
    disposeIf = mountIfSim(page, ifScenarios);
    disposeFloat = mountLabFloatActions(page, {
      system: 'bazi',
      surface: 'reading',
      tujianPath: '/bazi/tujian',
      draftShare: shareDraft,
      notesContext: pack.verdict.headline,
      answerConcept: answerBaziConcept,
      onNotes: () => {
        const paneLabel =
          READING_PANES.find((p) => p.id === readingPane)?.label ?? '解读';
        openLabNotesSheet({
          system: 'bazi',
          surface: 'reading',
          context: `${pack.verdict.headline} · ${paneLabel}`,
          reflect: READING_REFLECT[readingPane],
        });
      },
      onSelectionAsk: (text) => {
        openLabDeepSheet({
          system: 'bazi',
          title: '选区追问',
          initialTab: 'ask',
          seedQuery: formatSelectionAskSeed(text),
          presets: buildBaziPageFaq(chartResult, { question }),
          answerConcept: answerBaziConcept,
          onMiss: (q) => {
            void recordBaziConceptMiss(q);
          },
          deepHint: '由正文选区带入；概念优先本地词库。',
          onDeep: () => navigate('/bazi/chart'),
        });
      },
      onDeep: () => {
        openLabDeepSheet({
          system: 'bazi',
          title: `${getActivePerson().nickname || '我'}的命盘`,
          initialTab: 'ask',
          presets: buildBaziPageFaq(chartResult, { question }),
          answerConcept: answerBaziConcept,
          onMiss: (q) => {
            void recordBaziConceptMiss(q);
          },
          deepHint: '结合你的出生密码与当下问题，做一次更贴合的解读。概念题请用「边看边问」。',
          onDeep: () => navigate('/bazi/chart'),
        });
      },
    });

    const qInput = page.querySelector<HTMLInputElement>('#bazi-reading-q');
    page.querySelector('#bazi-reading-ask-go')?.addEventListener('click', () => {
      question = qInput?.value.trim() ?? '';
      saveQuestion(question);
      readingPane = 'ask';
      paint();
    });
  }

  function bindNav(): void {
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      if (el.classList.contains('life-back') || el.closest('.lab-reading-chrome')) return;
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  paint();
  root.appendChild(page);

  return () => {
    clearBaziChartAura(page);
    stars.remove();
    disposeFloat?.();
    disposeEnergy?.();
    disposeWhy?.();
    disposeIf?.();
    document.querySelector('[data-lab-float-dock]')?.remove();
    document.querySelector('.lab-deep-sheet')?.remove();
    document.querySelector('.lab-notes-sheet')?.remove();
  };
}
