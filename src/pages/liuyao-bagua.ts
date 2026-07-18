import { navigate } from '../router.ts';
import { mountLiuyaoModeSwitch, setLiuyaoMode } from '../liuyao/mode.ts';
import { TRIGRAM_ORDER, TRIGRAMS } from '../liuyao/trigrams.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderLiuyaoBagua(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page ly-bagua-page';
  mountEnvBanner(page);

  const top = document.createElement('div');
  top.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 学习模式';
  back.addEventListener('click', () => {
    setLiuyaoMode('learn');
    navigate('/liuyao');
  });
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
  header.className = 'ly-codex-header';
  header.innerHTML = `
    <h1 class="page-title">八卦图鉴</h1>
    <p class="page-subtitle">八个基本象：看清符号长什么样，以及为何取这个自然象</p>
  `;
  page.append(header);

  const grid = document.createElement('div');
  grid.className = 'ly-bagua-grid';

  for (const id of TRIGRAM_ORDER) {
    const t = TRIGRAMS[id];
    const card = document.createElement('article');
    card.className = 'ly-bagua-card';
    card.innerHTML = `
      <header>
        <span class="ly-bagua-symbol">${t.symbol}</span>
        <div>
          <strong>${t.id}</strong>
          <span class="ly-bagua-nature">＝ ${t.nature}</span>
        </div>
      </header>
      <p class="ly-bagua-shape">${t.shapeHint}</p>
      <p class="ly-bagua-why"><em>为什么是${t.nature}？</em>${t.whyImage}</p>
    `;
    grid.appendChild(card);
  }

  const foot = document.createElement('div');
  foot.className = 'ly-learn-foot';
  foot.innerHTML = `
    <button type="button" class="btn btn-ghost" data-path="/liuyao/hexagrams">看六十四卦图鉴</button>
    <button type="button" class="btn ly-btn-gold" data-path="/liuyao/learn">回六爻之旅</button>
  `;
  foot.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.path!));
  });

  page.append(grid, foot);
  root.appendChild(page);
}
