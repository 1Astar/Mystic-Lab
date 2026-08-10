import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { attachPersonSwitcherToPage } from '../ui/module-person-chrome.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { createStarsLayer } from '../tarot/animations.ts';

/** 八字衣橱 · 首版占位（幸运色 / 个人风格 / 每日穿搭） */
export function renderWardrobeHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page life-page wardrobe-page';
  mountEnvBanner(page);

  page.innerHTML = `
    <button type="button" class="back-link life-back" data-back>← 返回 Mystic Lab</button>
    <header class="life-header">
      <div class="life-header-emblem">${mysticEmblemHtml('bazi', 'md')}</div>
      <p class="home-eyebrow">WARDROBE</p>
      <h1 class="page-title">八字衣橱</h1>
      <p class="page-subtitle">幸运色、个人风格、每日穿搭</p>
    </header>
    <section class="mirror-gate">
      <p class="coming-soon-lock">即将开放</p>
      <p>会把日主五行与流日能量，翻译成可穿的颜色、材质与风格建议。</p>
      <button type="button" class="life-btn-primary" data-path="/mirror">先看双盘映照 ›</button>
    </section>
  `;

  root.appendChild(page);
  attachPersonSwitcherToPage(page);

  page.querySelector('[data-back]')?.addEventListener('click', () => navigate('/'));
  page.querySelector('[data-path]')?.addEventListener('click', () => navigate('/mirror'));

  return () => {
    stars.remove();
  };
}
