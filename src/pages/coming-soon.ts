import { navigate } from '../router.ts';
import type { MysticEmblemKind } from '../ui/mystic-emblem.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';

export function renderComingSoon(
  root: HTMLElement,
  title: string,
  subtitle: string,
  emblem: MysticEmblemKind = 'star',
): void {
  const page = document.createElement('div');
  page.className = 'page';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回占问';
  back.addEventListener('click', () => navigate('/divination'));

  page.append(back);

  const content = document.createElement('div');
  content.className = 'coming-soon';
  content.innerHTML = `
    <div class="coming-soon-emblem">${mysticEmblemHtml(emblem, 'lg')}</div>
    <h1 class="page-title">${title}</h1>
    <p class="page-subtitle">${subtitle}</p>
    <p class="coming-soon-lock">🔒 即将开放</p>
    <p class="coming-soon-note">此模块正在筹备中。可先体验塔罗抽牌，完成一次完整的占问流程。</p>
    <button type="button" class="btn" style="margin-top: 24px">前往塔罗抽牌 →</button>
  `;

  content.querySelector('button')?.addEventListener('click', () => navigate('/tarot'));
  page.appendChild(content);
  root.appendChild(page);
}
