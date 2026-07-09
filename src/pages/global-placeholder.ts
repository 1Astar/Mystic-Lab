import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderGlobalPlaceholder(
  root: HTMLElement,
  title: string,
  subtitle: string,
): void {
  const page = document.createElement('div');
  page.className = 'page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回 Mystic Lab';
  back.addEventListener('click', () => navigate('/'));

  const content = document.createElement('div');
  content.className = 'coming-soon';
  content.innerHTML = `
    <h1 class="page-title">${title}</h1>
    <p class="page-subtitle">${subtitle}</p>
    <p class="coming-soon-lock">🔒 即将开放</p>
    <p class="coming-soon-note">此功能将聚合各体系的占问记录与学习内容。可先进入具体体系体验。</p>
    <button type="button" class="btn" style="margin-top: 24px">返回 Mystic Lab</button>
  `;

  content.querySelector('button')?.addEventListener('click', () => navigate('/'));

  page.append(back, content);
  root.appendChild(page);
}
