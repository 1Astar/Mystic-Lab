import { navigate } from '../router.ts';
import {
  bindClassicFolder,
  renderClassicLibraryPageHtml,
} from '../liuyao/classic-folder.ts';
import { mountLiuyaoModeSwitch, setLiuyaoMode } from '../liuyao/mode.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderLiuyaoClassic(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page ly-classic-page';
  mountEnvBanner(page);

  const top = document.createElement('div');
  top.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回学习';
  back.addEventListener('click', () => navigate('/liuyao/learn'));
  const modeHost = document.createElement('div');
  modeHost.className = 'ly-topbar-actions';
  top.append(back, modeHost);
  page.append(top);

  setLiuyaoMode('learn');
  mountLiuyaoModeSwitch(modeHost, {
    onChange: (mode) => {
      if (mode === 'cast') navigate('/liuyao');
    },
  });

  const header = document.createElement('header');
  header.className = 'ly-learn-header';
  header.innerHTML = `
    <h1 class="page-title">古文资料夹</h1>
    <p class="page-subtitle">白话优先，卷轴展开卦辞；收藏你见过的卦</p>
  `;
  page.append(header);

  const body = document.createElement('div');
  body.className = 'ly-classic-page-body';
  let filter: 'seen' | 'fav' | 'all' = 'seen';

  const paint = () => {
    body.innerHTML = renderClassicLibraryPageHtml(filter);
    bindClassicFolder(body);
    body.querySelectorAll<HTMLButtonElement>('[data-classic-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.classicFilter as 'seen' | 'fav' | 'all';
        paint();
      });
    });
  };
  paint();
  page.append(body);
  root.appendChild(page);
}
