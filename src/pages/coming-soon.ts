import { navigate } from '../router.ts';

export function renderComingSoon(
  root: HTMLElement,
  title: string,
  subtitle: string,
): void {
  const page = document.createElement('div');
  page.className = 'page';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回首页';
  back.addEventListener('click', () => navigate('/'));

  page.append(back);

  const content = document.createElement('div');
  content.className = 'coming-soon';
  content.innerHTML = `
    <div class="coming-soon-icon">✦</div>
    <h1 class="page-title">${title}</h1>
    <p class="page-subtitle">${subtitle}</p>
    <p class="coming-soon-badge">即将开放</p>
    <p class="page-subtitle" style="margin-top: 20px">
      此模块正在筹备中。请先体验 Tarot Gesture 隔空抽牌。
    </p>
    <button type="button" class="btn" style="margin-top: 24px">前往 Tarot Gesture</button>
  `;

  content.querySelector('button')?.addEventListener('click', () => navigate('/tarot'));
  page.appendChild(content);
  root.appendChild(page);
}
