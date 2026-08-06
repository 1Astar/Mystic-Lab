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
import { buildShenShaMarks } from '../bazi/sense-shensha.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';
import {
  getActivePerson,
  hasBirthInfo,
  loadLifeStore,
} from '../life/storage.ts';
import { draftFromBazi } from '../share/drafts.ts';
import { mountInviteCompanionBar } from '../share/invite-bar.ts';
import {
  bindAnswerPackGestures,
  renderAnswerPackHtml,
} from '../mystic-engine/render-pack.ts';
import { unlockBaziCodexFromChart } from '../bazi/codex.ts';
import { WUXING_LORE, stemBranchById } from '../bazi/codex-lore.ts';
import { getStarCard } from '../bazi/codex-tags.ts';
import { showUnlockToast } from '../ui/unlock-toast.ts';
import { wuxingClass } from '../bazi/elements.ts';

const Q_KEY = 'mystic.bazi.reading.q';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  const store = loadLifeStore();
  const person = getActivePerson();
  const ready = hasBirthInfo(store.profile) && Boolean(store.profile.birthYear.trim());

  const page = document.createElement('div');
  page.className = 'page life-page bazi-reading-page';
  mountEnvBanner(page);

  let question = loadQuestion();
  let unlockedOnce = false;

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
      intoLabel: '已收入八字图鉴',
    });
  }

  function paint(): void {
    if (!ready) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回八字</button>
        <header class="life-header">
          <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
          <h1 class="page-title">我的命盘</h1>
          <p class="page-subtitle">需要先填写出生年月日</p>
        </header>
        <section class="life-profile-gate">
          <div>
            <p class="life-card-kicker">还不能速读</p>
            <p class="life-gate-brief">回到八字首页填写出生信息。</p>
          </div>
          <button type="button" class="life-btn-primary" data-path="/bazi">去填写</button>
        </section>
      `;
      bindNav();
      return;
    }

    const yearNow = new Date().getFullYear();
    const chartResult = castBaziChart(store.profile, yearNow, {
      includeLiunian: true,
    });
    if ('error' in chartResult) {
      page.innerHTML = `
        <button type="button" class="back-link life-back">← 返回八字</button>
        <header class="life-header">
          <h1 class="page-title">我的命盘</h1>
          <p class="page-subtitle">${escapeHtml(chartResult.error)}</p>
        </header>
        <button type="button" class="life-btn-primary" data-path="/bazi">回去改出生信息</button>
      `;
      bindNav();
      return;
    }

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
    const origin = buildTraditionOrigin(chartResult, store.profile, marks, {
      gender: person.gender,
      year: yearNow,
    });
    const pack = buildBaziAnswerPack({
      question,
      chart: chartResult,
      gender: person.gender,
    });
    const cards: Array<{ title: string; body: string }> = [
      { title: '性格底色', body: portrait.personality },
      { title: '事业倾向', body: portrait.career },
      { title: '关系模式', body: portrait.relationship },
      { title: '财富方式', body: portrait.wealth },
      { title: '内在课题', body: portrait.innerWork },
    ];
    const packHtml = renderAnswerPackHtml(pack, {
      lead: question.trim() ? `就你的问题「${question.trim()}」` : '本我 · 命盘速读',
      topicLabel: SYSTEM_POSITION.bazi,
    });

    const energyBars = energy.bars
      .map(
        (b) => `
      <div class="bazi-energy-bar ${wuxingClass(b.wx)}${energy.shortage === b.wx ? ' is-short' : ''}${energy.excess === b.wx ? ' is-hot' : ''}">
        <span class="bazi-energy-label">${escapeHtml(b.wx)}</span>
        <span class="bazi-energy-track"><span class="bazi-energy-fill" style="width:${b.pct}%"></span></span>
      </div>`,
      )
      .join('');

    const marksHtml = marks.length
      ? `<section class="bazi-sense-block bazi-sense-marks" aria-label="命盘印记">
        <p class="bazi-sense-kicker">命盘印记</p>
        <div class="bazi-mark-row">
          ${marks
            .map(
              (m) =>
                `<span class="bazi-mark-chip${m.needsComfort ? ' is-soft' : ''}">${escapeHtml(m.label)}</span>`,
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

    page.innerHTML = `
      <button type="button" class="back-link life-back">← 返回八字</button>
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">MY BIRTH CODE</p>
        <h1 class="page-title">我的命盘</h1>
        <p class="page-subtitle">${SYSTEM_POSITION.bazi}</p>
      </header>

      <section class="bazi-sense-block bazi-sense-insight" aria-label="现实感悟">
        <p class="bazi-sense-kicker">✨ 你的现实感悟</p>
        <h2 class="bazi-sense-title">${escapeHtml(insight.title)}</h2>
        <p class="bazi-insight-hook">${escapeHtml(insight.hook)}</p>
        <p class="bazi-sense-body bazi-insight-story">${escapeHtml(insight.story)}</p>
      </section>

      <section class="bazi-sense-block bazi-sense-season" aria-label="季节定调">
        <p class="bazi-sense-kicker">核心定调</p>
        <h2 class="bazi-sense-title">${escapeHtml(season.title)}</h2>
        <p class="bazi-sense-tag">${escapeHtml(season.tagline)}</p>
        <p class="bazi-sense-body">${escapeHtml(season.body)}</p>
      </section>

      <section class="bazi-sense-block bazi-sense-energy" aria-label="能量平衡">
        <p class="bazi-sense-kicker">能量状态</p>
        <h2 class="bazi-sense-title">${escapeHtml(energy.headline)}</h2>
        <p class="bazi-sense-tag">你的能量状态犹如一场「${escapeHtml(energy.weatherMeta)}」</p>
        <div class="bazi-energy-bars" role="img" aria-label="五行能量柱">${energyBars}</div>
        <p class="bazi-sense-body">${escapeHtml(energy.body)}</p>
        <p class="bazi-sense-remedy">${escapeHtml(energy.remedy)}</p>
      </section>

      <section class="bazi-sense-block bazi-sense-forecast" aria-label="年度天气预报">
        <p class="bazi-sense-kicker">大运与流年</p>
        <h2 class="bazi-sense-title">${escapeHtml(forecast.title)}</h2>
        <p class="bazi-sense-weather">${escapeHtml(forecast.weather)}</p>
        <p class="bazi-sense-body">${escapeHtml(forecast.scene)}</p>
        <p class="bazi-sense-advice"><strong>建议</strong> · ${escapeHtml(forecast.advice)}</p>
        ${forecast.decadeNote ? `<p class="bazi-sense-decade">${escapeHtml(forecast.decadeNote)}</p>` : ''}
      </section>

      ${marksHtml}

      <p class="bazi-reading-keyword">${escapeHtml(portrait.keyword)}</p>

      <section class="bazi-reading-cards" aria-label="五域速读">
        ${cards
          .map(
            (c) => `
          <article class="bazi-reading-card">
            <h2>${escapeHtml(c.title)}</h2>
            <p>${escapeHtml(c.body)}</p>
          </article>`,
          )
          .join('')}
      </section>

      <section class="bazi-reading-ask" aria-label="此刻想问">
        <h2 class="life-route-title">此刻更想确认</h2>
        <label class="life-field life-field-full">
          <span>一句话问题（可选）</span>
          <input type="text" id="bazi-reading-q" maxlength="120" placeholder="例如：要不要换工作？" value="${escapeHtml(question)}" />
        </label>
        <button type="button" class="life-btn-ghost" id="bazi-reading-ask-go">更新离线答问</button>
      </section>

      <div class="bazi-pack-host" data-bazi-pack>${packHtml}</div>

      <details class="bazi-origin-fold">
        <summary>
          <span>📖 传统命理溯源</span>
          <em>点击展开</em>
        </summary>
        <div class="bazi-origin-body">
          ${origin.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
      </details>

      <nav class="bazi-reading-nav" aria-label="图鉴">
        <button type="button" class="bazi-home-link" data-path="/bazi/tujian">
          <strong>八字图鉴</strong>
          <span>偏旺 / 偏弱 / 缺 · 天干地支收集</span>
          <em aria-hidden="true">›</em>
        </button>
      </nav>

      <div class="bazi-reading-actions">
        <button type="button" class="life-btn-primary" data-path="/bazi/chart">想看为什么？进入命盘解析 ›</button>
        <button type="button" class="life-btn-ghost" data-path="/bazi">改出生信息</button>
      </div>
      <div class="ms-invite-host bazi-share" data-bazi-invite></div>
    `;

    bindNav();
    const packHost = page.querySelector<HTMLElement>('[data-bazi-pack]');
    if (packHost) bindAnswerPackGestures(packHost);

    const qInput = page.querySelector<HTMLInputElement>('#bazi-reading-q');
    page.querySelector('#bazi-reading-ask-go')?.addEventListener('click', () => {
      question = qInput?.value.trim() ?? '';
      saveQuestion(question);
      paint();
    });

    const pillarsLabel = chartResult.pillars
      .filter((p) => !p.empty)
      .map((p) => `${p.title}${p.stem}${p.branch}`)
      .join(' · ');
    page.querySelector('[data-bazi-invite]') &&
      mountInviteCompanionBar(page.querySelector('[data-bazi-invite]')!, {
        unitLabel: '这份命盘',
        system: 'bazi',
        draft: () => {
          const p = buildBaziAnswerPack({
            question,
            chart: chartResult,
            gender: person.gender,
          });
          return draftFromBazi({
            dayMaster: chartResult.dayMaster,
            pillarsLabel,
            question: question || '我的命盘速读',
            summary: p.verdict.headline,
            sections: [
              { heading: '定调', body: p.verdict.headline },
              { heading: '结论', body: p.decision },
              {
                heading: '盘面依据',
                body: (p.answers[0]?.evidence ?? [])
                  .map((e) => e.plain)
                  .join('\n'),
              },
              {
                heading: '本周动作',
                body: [p.breakthrough, ...p.checklist]
                  .map((a) => `${a.title}：${a.body}`)
                  .join('\n'),
              },
              ...(p.reassurance
                ? [{ heading: '定心丸', body: p.reassurance }]
                : []),
            ],
          });
        },
      });
  }

  function bindNav(): void {
    page.querySelector('.life-back')?.addEventListener('click', () => navigate('/bazi'));
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
  }

  paint();
  root.appendChild(page);
  return () => {
    stars.remove();
  };
}
