import { navigate } from '../router.ts';
import { renderSixGodIcon, SIX_GODS } from '../xiaoliuren/six-gods.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderXiaoliurenCodex(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page xlr-codex-page xlr-xuan-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回小六壬';
  back.addEventListener('click', () => navigate('/xiaoliuren'));

  page.append(back);

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">六神图鉴</h1>
    <p class="page-subtitle">大安 · 留连 · 速喜 · 赤口 · 小吉 · 空亡</p>
  `;
  page.append(header);

  const grid = document.createElement('div');
  grid.className = 'xlr-codex-grid';

  for (const god of SIX_GODS) {
    const card = document.createElement('article');
    card.className = `xlr-codex-card xlr-codex-${god.tone}`;
    card.innerHTML = `
      ${renderSixGodIcon(god, 'xlr-codex-icon')}
      <h2>${god.name}</h2>
      <p class="xlr-codex-summary">${god.summary}</p>
      <p class="xlr-codex-meaning">${god.meaning}</p>
      <p class="xlr-codex-advice"><strong>行动建议</strong> ${god.advice}</p>
    `;
    grid.appendChild(card);
  }

  const links = document.createElement('div');
  links.className = 'xlr-codex-links';
  links.innerHTML = `
    <button type="button" class="theme-entry-card" data-go="hour">时辰入门 · 十二时辰对照</button>
    <button type="button" class="theme-entry-card" data-go="method">起课方法 · 月 → 日 → 时</button>
  `;
  links.querySelector('[data-go="hour"]')?.addEventListener('click', () => navigate('/xiaoliuren/hour-guide'));
  links.querySelector('[data-go="method"]')?.addEventListener('click', () => navigate('/xiaoliuren/reading'));

  page.append(grid, links);
  root.appendChild(page);
}
