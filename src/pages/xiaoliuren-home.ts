import { navigate } from '../router.ts';
import { loadXiaoliurenJournal } from '../xiaoliuren/journal.ts';
import {
  getPalmJourneyDoneCount,
  formatPalmJourneyLevel,
  getPalmJourneyLevel,
  isPalmJourneyComplete,
  PALM_JOURNEY_CHAPTERS,
} from '../xiaoliuren/palm-journey.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { renderXiaoliurenHero, mountXiaoliurenHero } from '../ui/xiaoliuren-hero.ts';
import { mountNotifyTryControl } from '../ui/xiaoliuren/notify-try.ts';
import { mountXiaoliurenReviewBanner } from '../ui/xiaoliuren/review-banner.ts';

export function renderXiaoliurenHome(root: HTMLElement): () => void {
  const journalCount = loadXiaoliurenJournal().length;
  const journeyDone = getPalmJourneyDoneCount();
  const journeyLevel = getPalmJourneyLevel();
  const journeyComplete = isPalmJourneyComplete();
  const journeyLabel = journeyComplete
    ? `掌上演算之旅 · ${formatPalmJourneyLevel(6)} 已完成`
    : `掌上演算之旅 · ${formatPalmJourneyLevel(journeyLevel)} · ${journeyDone}/${PALM_JOURNEY_CHAPTERS.length}`;

  const page = document.createElement('div');
  page.className = 'page xlr-home-page xlr-xuan-page';

  mountEnvBanner(page);

  page.innerHTML = `
    <button type="button" class="back-link xlr-home-back">← 返回 Mystic Lab</button>

    <div class="xlr-home-review-host"></div>
    <div class="xlr-home-notify-host"></div>

    <header class="xlr-home-header">
      <p class="xlr-home-eyebrow">MYSTIC LAB</p>
      <h1 class="xlr-home-title">随心速问</h1>
      <p class="xlr-home-module">小六壬</p>
      <p class="xlr-home-slogan">一念起课，先看眼前这一步。</p>
    </header>

    <main class="xlr-home-main">
      <div class="xlr-home-hero-slot"></div>

      <div class="xlr-home-cta">
        <button type="button" class="xlr-home-primary" data-path="/xiaoliuren/reading">开始起课</button>
        <button type="button" class="xlr-home-secondary" data-path="/xiaoliuren/palm-journey">${journeyLabel} ›</button>
      </div>

      <nav class="xlr-home-links" aria-label="模块入口">
        <a href="/xiaoliuren/codex" data-path="/xiaoliuren/codex">六神图鉴</a>
        <a href="/xiaoliuren/depth" data-path="/xiaoliuren/depth">深度理解</a>
        <a href="/xiaoliuren/journal" data-path="/xiaoliuren/journal">手札${journalCount > 0 ? ` · ${journalCount}` : ''}</a>
        <a href="/xiaoliuren/hour-guide" data-path="/xiaoliuren/hour-guide">时辰入门</a>
        <a href="/xiaoliuren/palm-journey" data-path="/xiaoliuren/palm-journey">演算之旅</a>
      </nav>
    </main>
  `;

  const reviewHost = page.querySelector<HTMLElement>('.xlr-home-review-host')!;
  mountXiaoliurenReviewBanner(reviewHost);
  mountNotifyTryControl(page.querySelector<HTMLElement>('.xlr-home-notify-host')!);

  const slot = page.querySelector('.xlr-home-hero-slot')!;
  slot.innerHTML = renderXiaoliurenHero();

  page.querySelector('.xlr-home-back')?.addEventListener('click', () => navigate('/'));
  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.path!);
    });
  });

  root.appendChild(page);
  mountXiaoliurenHero(page);

  return () => {};
}
