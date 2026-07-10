import { navigate } from '../router.ts';
import { loadXiaoliurenJournal } from '../xiaoliuren/journal.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { renderXiaoliurenHero, mountXiaoliurenHero } from '../ui/xiaoliuren-hero.ts';

export function renderXiaoliurenHome(root: HTMLElement): () => void {
  const journalCount = loadXiaoliurenJournal().length;

  const page = document.createElement('div');
  page.className = 'page xlr-home-page xlr-xuan-page';

  mountEnvBanner(page);

  page.innerHTML = `
    <button type="button" class="back-link xlr-home-back">← 返回 Mystic Lab</button>

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
        <button type="button" class="xlr-home-secondary" data-path="/xiaoliuren/reading">看看怎么算出来 ›</button>
      </div>

      <nav class="xlr-home-links" aria-label="模块入口">
        <a href="/xiaoliuren/codex" data-path="/xiaoliuren/codex">六神图鉴</a>
        <a href="/xiaoliuren/journal" data-path="/xiaoliuren/journal">手札${journalCount > 0 ? ` · ${journalCount}` : ''}</a>
        <a href="/xiaoliuren/hour-guide" data-path="/xiaoliuren/hour-guide">时辰入门</a>
      </nav>
    </main>
  `;

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
