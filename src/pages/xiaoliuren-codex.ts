import { navigate } from '../router.ts';
import { renderSixGodIcon, SIX_GODS } from '../xiaoliuren/six-gods.ts';
import { mountEnvBanner } from '../ui/banner.ts';

function listLine(items: string[]): string {
  return items.join(' · ');
}

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
    <p class="page-subtitle">会用 · 为什么 · 多场景案例</p>
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
      <p class="xlr-codex-keywords">${god.keywords.map((k) => `<span>${k}</span>`).join('')}</p>
      <p class="xlr-codex-oneliner">${god.oneLiner}</p>
      <dl class="xlr-codex-fields">
        <div><dt>为什么叫</dt><dd>${god.whyName}</dd></div>
        <div><dt>为什么代表</dt><dd>${god.whyMeaning}</dd></div>
        <div><dt>故事象征</dt><dd>${god.story}</dd></div>
        <div><dt>象征</dt><dd>${god.symbolism}</dd></div>
        <div><dt>适合</dt><dd>${listLine(god.positive)}</dd></div>
        <div><dt>提醒</dt><dd>${listLine(god.warning)}</dd></div>
        <div><dt>感情</dt><dd>${god.emotion}</dd></div>
        <div><dt>工作</dt><dd>${god.career}</dd></div>
        <div><dt>旅行</dt><dd>${god.travel}</dd></div>
        <div><dt>财富</dt><dd>${god.wealth}</dd></div>
        <div><dt>自我</dt><dd>${god.self}</dd></div>
        <div><dt>容易误读</dt><dd>${god.misread}</dd></div>
        <div><dt>对应行动</dt><dd>${god.action}</dd></div>
      </dl>
    `;
    grid.appendChild(card);
  }

  const links = document.createElement('div');
  links.className = 'xlr-codex-links';
  links.innerHTML = `
    <button type="button" class="theme-entry-card" data-go="depth">深度理解 · 五层从会用到案例</button>
    <button type="button" class="theme-entry-card" data-go="hour">时辰入门 · 十二时辰对照</button>
    <button type="button" class="theme-entry-card" data-go="method">起课方法 · 月 → 日 → 时</button>
    <button type="button" class="theme-entry-card" data-go="journey">掌上演算之旅 · 六章通关</button>
  `;
  links.querySelector('[data-go="depth"]')?.addEventListener('click', () => navigate('/xiaoliuren/depth'));
  links.querySelector('[data-go="hour"]')?.addEventListener('click', () => navigate('/xiaoliuren/hour-guide'));
  links.querySelector('[data-go="method"]')?.addEventListener('click', () => navigate('/xiaoliuren/reading'));
  links.querySelector('[data-go="journey"]')?.addEventListener('click', () => navigate('/xiaoliuren/palm-journey'));

  page.append(grid, links);
  root.appendChild(page);
}
