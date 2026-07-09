import { navigate } from '../router.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mountEnvBanner } from './banner.ts';

export interface ThemedEntry {
  title: string;
  desc: string;
  icon?: string;
  path?: string;
  comingSoon?: boolean;
}

export interface ThemedModuleConfig {
  theme: 'xiaoliuren' | 'meihua';
  backPath?: string;
  backLabel?: string;
  heroTitle: string;
  moduleName: string;
  slogan: string;
  hint?: string;
  sideInscription: string;
  heroHtml: string;
  primaryCta: { label: string; comingSoon?: boolean };
  secondaryLink?: string;
  entries: ThemedEntry[];
}

function diamond(): string {
  return '<span class="theme-diamond" aria-hidden="true">◆</span>';
}

function primaryBtnDecor(theme: ThemedModuleConfig['theme']): string {
  if (theme === 'xiaoliuren') {
    return '<span class="theme-btn-decor theme-btn-tassel" aria-hidden="true"></span>';
  }
  return '<span class="theme-btn-decor theme-btn-blossom" aria-hidden="true">✿</span>';
}

export function renderThemedModuleHome(root: HTMLElement, config: ThemedModuleConfig): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = `page theme-module theme-${config.theme}`;
  mountEnvBanner(page);

  if (config.backPath) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'back-link theme-back';
    back.textContent = config.backLabel ?? '← 返回';
    back.addEventListener('click', () => navigate(config.backPath!));
    page.append(back);
  }

  const body = document.createElement('div');
  body.className = 'theme-body';
  body.innerHTML = `
    <div class="theme-ambient" aria-hidden="true"></div>
    <div class="theme-texture" aria-hidden="true"></div>
    <p class="theme-side-inscription">${config.sideInscription}</p>
    <div class="theme-scroll-frame">
      <span class="theme-scroll-roll theme-scroll-roll-left" aria-hidden="true"></span>
      <header class="theme-header">
        <p class="home-eyebrow">MYSTIC LAB</p>
        <h1 class="theme-hero-title">${config.heroTitle}</h1>
        <p class="theme-module-name">${diamond()}<span>${config.moduleName}</span>${diamond()}</p>
        <p class="theme-slogan">${config.slogan}</p>
        ${config.hint ? `<p class="theme-hint">${config.hint}</p>` : ''}
      </header>
      <span class="theme-scroll-roll theme-scroll-roll-right" aria-hidden="true"></span>
    </div>
    <div class="theme-hero-slot">${config.heroHtml}</div>
    <div class="theme-primary-wrap">
      <button type="button" class="theme-primary-btn${config.primaryCta.comingSoon ? ' is-soon' : ''}" ${config.primaryCta.comingSoon ? 'disabled' : ''}>
        ${primaryBtnDecor(config.theme)}
        <span class="theme-primary-label">${config.primaryCta.label}</span>
        ${config.primaryCta.comingSoon ? '<span class="tag">即将开放</span>' : ''}
      </button>
      ${config.secondaryLink ? `<p class="theme-secondary-link">${config.secondaryLink}</p>` : ''}
    </div>
    <nav class="theme-entries" aria-label="模块入口"></nav>
    <footer class="theme-footer">
      <span class="theme-footer-mark" aria-hidden="true">${config.theme === 'meihua' ? '✿' : '☁'}</span>
      <p>© Starry Product Lab · Mystic Lab</p>
    </footer>
  `;

  const nav = body.querySelector('.theme-entries')!;
  for (const entry of config.entries) {
    const card = document.createElement(entry.path && !entry.comingSoon ? 'a' : 'button');
    card.className = `theme-entry-card${entry.comingSoon ? ' is-soon' : ''}`;
    if (entry.comingSoon || !entry.path) {
      (card as HTMLButtonElement).type = 'button';
    } else {
      (card as HTMLAnchorElement).href = entry.path;
    }

    card.innerHTML = `
      ${entry.icon ? `<span class="theme-entry-icon">${entry.icon}</span>` : ''}
      <span class="theme-entry-text">
        <strong>${entry.title}</strong>
        <span>${entry.desc}</span>
        ${entry.comingSoon ? '<em class="tag">即将开放</em>' : ''}
      </span>
      <span class="theme-entry-chevron" aria-hidden="true">›</span>
    `;

    if (entry.path && !entry.comingSoon) {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(entry.path!);
      });
    }

    nav.appendChild(card);
  }

  page.append(body);
  root.appendChild(page);

  return () => stars.remove();
}
