import { navigate } from '../router.ts';
import { preloadLiuyaoCoins, preloadLiuyaoHero } from '../liuyao/assets.ts';
import { loadLiuyaoJournal } from '../liuyao/journal.ts';
import {
  getLiuyaoMode,
  mountLiuyaoModeSwitch,
  type LiuyaoMode,
} from '../liuyao/mode.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { liuyaoPageBgStyle, renderLiuyaoHero } from '../ui/liuyao-hero.ts';
import { mountLiuyaoSfxToggle } from '../ui/liuyao/sfx-toggle.ts';

export function renderLiuyaoHome(root: HTMLElement): () => void {
  const journalCount = loadLiuyaoJournal().length;
  preloadLiuyaoCoins();
  preloadLiuyaoHero();

  const page = document.createElement('div');
  page.className = 'page ly-home-page';
  mountEnvBanner(page);

  page.innerHTML = `
    <div class="ly-topbar">
      <button type="button" class="back-link ly-home-back">← 返回 Mystic Lab</button>
      <div class="ly-topbar-actions"></div>
    </div>
    <div class="ly-mode-bar"></div>
    <div class="ly-home-body"></div>
  `;

  const body = page.querySelector<HTMLElement>('.ly-home-body')!;
  const modeBar = page.querySelector<HTMLElement>('.ly-mode-bar')!;
  const actions = page.querySelector<HTMLElement>('.ly-topbar-actions')!;

  mountLiuyaoSfxToggle(actions);
  mountLiuyaoModeSwitch(modeBar, {
    onChange: (mode) => paint(mode),
  });

  function paint(mode: LiuyaoMode = getLiuyaoMode()): void {
    page.setAttribute('style', liuyaoPageBgStyle(mode === 'learn' ? 'learn' : 'cast'));
    const isLearn = mode === 'learn';

    body.innerHTML = `
      <header class="ly-home-header">
        <p class="ly-home-eyebrow">MYSTIC LAB · I CHING DIVINATION</p>
        <h1 class="ly-home-title">
          <span>观变化之道</span>
          <button type="button" class="ly-home-info-r" data-focus-toggle aria-expanded="false" aria-controls="ly-home-focus-pop" title="六爻定位说明">R</button>
        </h1>
        <div id="ly-home-focus-pop" class="ly-home-focus-pop" hidden role="note">
          <p class="ly-home-focus-tag">变化结构</p>
          <p class="ly-home-focus-body">六条爻怎么叠、哪条在动、世应（我/外界）怎么对上——重<strong>过程与结构</strong>。若要用「一事一象、八卦取象」看动念，可改用梅花（象与动念）。</p>
        </div>
        <p class="ly-home-module">${isLearn ? '六爻 · 学习起卦' : '六爻 · 起卦'}</p>
        <p class="ly-home-slogan">${
          isLearn
            ? '同一套起卦仪式；<br>标注会渗进摇钱、成爻与解卦的每一步。'
            : '在天地棋盘上落下一子，<br>观察阴阳如何回应你的问题。'
        }</p>
      </header>
      <main class="ly-home-main">
        <div class="ly-home-hero-slot"></div>
        <div class="ly-home-actions" aria-label="主要入口">
          <button type="button" class="ly-home-action is-primary" data-path="/liuyao/reading">
            ${isLearn ? '开始学习起卦' : '开始起卦'}
          </button>
          <button type="button" class="ly-home-action is-ghost" data-path="/liuyao/vault">
            <span class="ly-home-action-title">我的卦库</span>
            <span class="ly-home-action-sub">64卦图鉴 · 384爻学习 · 成长档案</span>
          </button>
          <button type="button" class="ly-home-action is-ghost" data-path="/liuyao/journal">
            <span class="ly-home-action-title">我的卦象${
              journalCount > 0 ? ` · ${journalCount}` : ''
            }</span>
            <span class="ly-home-action-sub">每次起卦记录</span>
          </button>
        </div>
      </main>
      <footer class="ly-home-footer">
        <p>© Starry Product Lab · Mystic Lab</p>
      </footer>
    `;

    body.querySelector('.ly-home-hero-slot')!.innerHTML = renderLiuyaoHero({
      mode: isLearn ? 'learn' : 'cast',
    });

    const btn = body.querySelector<HTMLButtonElement>('[data-focus-toggle]');
    const pop = body.querySelector<HTMLElement>('#ly-home-focus-pop');
    btn?.addEventListener('click', () => {
      if (!pop || !btn) return;
      const open = Boolean(pop.hidden);
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.classList.toggle('is-on', open);
    });

    body.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.path!);
      });
    });
  }

  page.querySelector('.ly-home-back')?.addEventListener('click', () => navigate('/'));
  paint();
  root.appendChild(page);
  return () => {};
}
