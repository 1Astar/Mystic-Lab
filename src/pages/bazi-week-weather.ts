/**
 * 周度脑内天气预报：心态短记 × 流日对照
 */
import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { baziSysTabsHtml } from '../ui/lab-sys-tabs.ts';
import { castBaziChart } from '../bazi/cast.ts';
import {
  hasBirthInfo,
  loadLifeStore,
} from '../life/storage.ts';
import { isoWeekKey } from '../craft/quests.ts';
import { buildLiuriDay, weekDates } from '../bazi/sense-liuri.ts';
import {
  countFilledDays,
  countHits,
  loadWeekDoc,
  markWeekReconciled,
  saveDayMood,
  type WeekWeatherDoc,
} from '../bazi/week-weather-store.ts';
import { learnStatusLine, markLearnInteraction } from '../bazi/learn-store.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBaziWeekWeather(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page bazi-week-page';
  mountEnvBanner(page);

  const store = loadLifeStore();
  const weekKey = isoWeekKey();
  const dates = weekDates();

  if (!hasBirthInfo(store.profile)) {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi/reading">← 命盘解读</button>
      <p class="life-status">需要出生信息才能对照流日。</p>
      <button type="button" class="life-btn-primary" data-path="/bazi?edit=1">去填写</button>
    `;
    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });
    root.appendChild(page);
    return () => stars.remove();
  }

  const chart = castBaziChart(store.profile, new Date().getFullYear(), {
    includeLiunian: false,
  });
  if ('error' in chart) {
    page.innerHTML = `<p class="life-status">${escapeHtml(chart.error)}</p>`;
    root.appendChild(page);
    return () => stars.remove();
  }

  let doc = loadWeekDoc(weekKey);
  const days = dates.map((d) => buildLiuriDay(chart, d));

  function summaryHtml(d: WeekWeatherDoc): string {
    const filled = countFilledDays(d);
    const hits = countHits(d);
    if (filled < 3) {
      return `已记 ${filled} 天。先写满至少 3 天心态，再点「本周对账」。`;
    }
    if (!d.reconciled) {
      return `已记 ${filled} 天，自评对上 ${hits} 天。点下方对账，收束本周复盘。`;
    }
    const rate = filled ? Math.round((hits / filled) * 100) : 0;
    return `本周对账完成：记了 ${filled} 天，你觉得对上 ${hits} 天（约 ${rate}%）。对号入座不是算命审判，是练手感。`;
  }

  function paint(): void {
    page.innerHTML = `
      <button type="button" class="back-link life-back" data-path="/bazi/reading">← 命盘解读</button>
      ${baziSysTabsHtml('reading')}
      <header class="life-header">
        <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
        <p class="home-eyebrow">WEEKLY MIND WEATHER</p>
        <h1 class="page-title">脑内天气预报</h1>
        <p class="page-subtitle">${escapeHtml(weekKey)} · 心态 × 流日对照</p>
        <p class="bazi-learn-badge">
          <button type="button" class="bazi-learn-badge-btn" data-path="/bazi/learn">${escapeHtml(learnStatusLine())} · 知识树 ›</button>
        </p>
      </header>

      <p class="bazi-week-lead">每天写一句心态（如「极度想躺平」「想搞大事」），对照流日气候看是否对上比肩、食伤等色——大白话为主，学名可点开知识树复习。</p>

      <section class="bazi-week-days" aria-label="本周七天">
        ${days
          .map((liuri) => {
            const mood = doc.days[liuri.dateKey] ?? { text: '' };
            const match = mood.match ?? '';
            return `
            <article class="bazi-week-day" data-day="${escapeHtml(liuri.dateKey)}">
              <header>
                <strong>周${escapeHtml(liuri.weekday)}</strong>
                <em>${escapeHtml(liuri.dateKey.slice(5))} · ${escapeHtml(liuri.ganZhi)}</em>
              </header>
              <p class="bazi-week-climate">${escapeHtml(liuri.climate)}</p>
              <p class="bazi-week-hint">${escapeHtml(liuri.moodHint)}</p>
              <label class="bazi-week-label">
                <span>我的心态</span>
                <input type="text" maxlength="80" data-mood-input value="${escapeHtml(mood.text)}" placeholder="例如：周一极度想躺平" />
              </label>
              <p class="bazi-week-match-hint">${escapeHtml(liuri.matchHint)}</p>
              <div class="bazi-week-match" role="group" aria-label="是否对上">
                <button type="button" class="bazi-week-match-btn${match === 'hit' ? ' is-on' : ''}" data-match="hit">对上了</button>
                <button type="button" class="bazi-week-match-btn${match === 'miss' ? ' is-on' : ''}" data-match="miss">没感觉</button>
                <button type="button" class="bazi-week-match-btn${match === 'skip' ? ' is-on' : ''}" data-match="skip">跳过</button>
              </div>
            </article>`;
          })
          .join('')}
      </section>

      <section class="bazi-week-summary" aria-label="本周对账">
        <p class="bazi-sense-kicker">本周对账</p>
        <p class="bazi-week-summary-body" data-week-summary>${escapeHtml(summaryHtml(doc))}</p>
        <button type="button" class="life-btn-primary" data-reconcile ${doc.reconciled ? 'disabled' : ''}>
          ${doc.reconciled ? '本周已对账' : '完成本周对账 · 记入复盘'}
        </button>
      </section>

      <div class="bazi-reading-actions">
        <button type="button" class="life-btn-ghost" data-path="/bazi/reading">回解读 ›</button>
        <button type="button" class="life-btn-ghost" data-path="/bazi/learn">知识树 ›</button>
      </div>
    `;

    page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        if (path) navigate(path);
      });
    });

    page.querySelectorAll<HTMLElement>('[data-day]').forEach((card) => {
      const dateKey = card.dataset.day || '';
      const input = card.querySelector<HTMLInputElement>('[data-mood-input]');
      input?.addEventListener('change', () => {
        doc = saveDayMood(dateKey, { text: input.value.trim() }, weekKey);
        const sum = page.querySelector('[data-week-summary]');
        if (sum) sum.textContent = summaryHtml(doc);
      });
      card.querySelectorAll<HTMLButtonElement>('[data-match]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = btn.dataset.match as 'hit' | 'miss' | 'skip';
          doc = saveDayMood(dateKey, { match: m }, weekKey);
          paint();
        });
      });
    });

    page.querySelector('[data-reconcile]')?.addEventListener('click', () => {
      if (countFilledDays(doc) < 3) {
        const sum = page.querySelector('[data-week-summary]');
        if (sum) sum.textContent = '至少先记 3 天心态，再对账。';
        return;
      }
      doc = markWeekReconciled(weekKey);
      markLearnInteraction(`review:week:${weekKey}`);
      paint();
    });
  }

  paint();
  root.appendChild(page);
  return () => stars.remove();
}
