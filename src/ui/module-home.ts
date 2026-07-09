import { navigate } from '../router.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mysticEmblemHtml, type MysticEmblemKind } from './mystic-emblem.ts';
import { mountEnvBanner } from './banner.ts';
import { mountAiSettingsPanel } from './ai-settings-panel.ts';

export interface ModuleHomeEntry {
  title: string;
  desc: string;
  path?: string;
  primary?: boolean;
  comingSoon?: boolean;
  cta?: string;
  emblem?: MysticEmblemKind;
  stat?: () => string;
}

export interface ModuleHomeConfig {
  backPath?: string;
  backLabel?: string;
  eyebrow?: string;
  title: string;
  slogan?: string;
  subtitle?: string;
  entries: ModuleHomeEntry[];
  showStars?: boolean;
  showAiSettings?: boolean;
}

export function renderModuleHome(root: HTMLElement, config: ModuleHomeConfig): () => void {
  const stars = config.showStars ? createStarsLayer() : null;
  if (stars) document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page';
  mountEnvBanner(page);

  const header = document.createElement('header');
  header.className = 'home-header';
  header.innerHTML = `
    ${config.eyebrow ? `<p class="home-eyebrow">${config.eyebrow}</p>` : ''}
    <h1 class="page-title">${config.title}</h1>
    ${config.slogan ? `<p class="home-slogan">${config.slogan}</p>` : ''}
    ${config.subtitle ? `<p class="page-subtitle">${config.subtitle}</p>` : ''}
    ${config.showAiSettings ? '<div id="ai-settings-host" class="home-ai-settings"></div>' : ''}
  `;

  const nav = document.createElement('nav');
  nav.className = 'home-nav';
  nav.setAttribute('aria-label', '模块入口');

  if (config.backPath) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'back-link';
    back.textContent = config.backLabel ?? '← 返回';
    back.addEventListener('click', () => navigate(config.backPath!));
    page.append(back);
  }

  page.append(header, nav);

  if (config.showAiSettings) {
    const host = page.querySelector<HTMLElement>('#ai-settings-host');
    if (host) mountAiSettingsPanel(host);
  }

  for (const entry of config.entries) {
    const card = document.createElement(entry.path && !entry.comingSoon ? 'a' : 'button');
    card.className = `entry-card ${entry.primary ? 'entry-card-primary' : ''}`;
    if (entry.comingSoon || !entry.path) {
      (card as HTMLButtonElement).type = 'button';
      card.classList.add('entry-card-soon');
    } else {
      (card as HTMLAnchorElement).href = entry.path;
    }

    const stat = entry.stat?.();
    const emblem = entry.emblem
      ? `<div class="entry-emblem-wrap">${mysticEmblemHtml(entry.emblem, 'md')}</div>`
      : '';

    card.innerHTML = `
      ${emblem}
      <h2>${entry.title}</h2>
      <p>${entry.desc}</p>
      ${stat ? `<span class="entry-stat">${stat}</span>` : ''}
      ${entry.comingSoon ? '<span class="tag">即将开放</span>' : ''}
      ${entry.cta && !entry.comingSoon ? `<span class="entry-cta">${entry.cta}</span>` : ''}
    `;

    if (entry.path && !entry.comingSoon) {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(entry.path!);
      });
    }

    nav.appendChild(card);
  }

  root.appendChild(page);

  return () => stars?.remove();
}
