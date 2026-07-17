import { navigate } from '../router.ts';
import { loadLiuyaoJournal } from '../liuyao/journal.ts';
import { getLiuyaoMode, mountLiuyaoModeSwitch, setLiuyaoMode } from '../liuyao/mode.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { renderLiuyaoHero } from '../ui/liuyao-hero.ts';
import { mountLiuyaoSfxToggle } from '../ui/liuyao/sfx-toggle.ts';

export function renderLiuyaoHome(root: HTMLElement): () => void {
  const journalCount = loadLiuyaoJournal().length;

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
    onChange: (mode) => {
      if (mode === 'learn') paintLearn();
      else paintCast();
    },
  });

  function paintCast(): void {
    body.innerHTML = `
      <header class="ly-home-header">
        <p class="ly-home-eyebrow">MYSTIC LAB · I CHING DIVINATION</p>
        <h1 class="ly-home-title">观变化之道</h1>
        <p class="ly-home-module">六爻 · 起卦</p>
        <p class="ly-home-slogan">在天地棋盘上落下一子，观察阴阳如何回应你的问题。</p>
        <aside class="ly-home-focus" aria-label="六爻定位">
          <p class="ly-home-focus-tag">变化结构</p>
          <p class="ly-home-focus-body">六条爻怎么叠、哪条在动、世应（我/外界）怎么对上——重<strong>过程与结构</strong>。若要用「一事一象、八卦取象」看动念，可改用梅花（象与动念）。</p>
        </aside>
      </header>
      <main class="ly-home-main">
        <div class="ly-home-hero-slot"></div>
        <div class="ly-home-cta">
          <button type="button" class="ly-home-primary" data-path="/liuyao/reading">开始起卦</button>
          <button type="button" class="ly-home-secondary" data-switch="learn">切到学习模式 ›</button>
        </div>
        <nav class="ly-home-links" aria-label="模块入口">
          <a href="/liuyao/reading" data-path="/liuyao/reading">立即问卦</a>
          <a href="/liuyao/journal" data-path="/liuyao/journal">我的卦象${journalCount > 0 ? ` · ${journalCount}` : ''}</a>
        </nav>
      </main>
      <footer class="ly-home-footer">
        <p>© Starry Product Lab · Mystic Lab</p>
      </footer>
    `;
    body.querySelector('.ly-home-hero-slot')!.innerHTML = renderLiuyaoHero();
    bindNav();
  }

  function paintLearn(): void {
    body.innerHTML = `
      <header class="ly-home-header">
        <p class="ly-home-eyebrow">MYSTIC LAB · LEARN</p>
        <h1 class="ly-home-title">学习模式</h1>
        <p class="ly-home-module">六爻 · 看懂结构</p>
        <p class="ly-home-slogan">先对照一张卦盘点着学，再回去实战起卦。</p>
      </header>
      <main class="ly-home-main">
        <nav class="ly-learn-hub" aria-label="学习入口">
          <a class="ly-learn-hub-card ly-learn-hub-featured" href="/liuyao/learn/board" data-path="/liuyao/learn/board">
            <span class="ly-learn-hub-kicker">主路径</span>
            <strong>对照读卦</strong>
            <p>和起卦同一套盘面：点爻象、世应、动爻，逐格看解释</p>
          </a>
          <a class="ly-learn-hub-card" href="/liuyao/learn" data-path="/liuyao/learn">
            <span class="ly-learn-hub-kicker">路径</span>
            <strong>六爻之旅</strong>
            <p>从阴阳到动爻，七章文字串讲</p>
          </a>
          <a class="ly-learn-hub-card" href="/liuyao/bagua" data-path="/liuyao/bagua">
            <span class="ly-learn-hub-kicker">图鉴</span>
            <strong>八卦图鉴</strong>
            <p>八个基本象：符号、自然象、为何取此象</p>
          </a>
          <a class="ly-learn-hub-card" href="/liuyao/hexagrams" data-path="/liuyao/hexagrams">
            <span class="ly-learn-hub-kicker">图鉴</span>
            <strong>六十四卦图鉴</strong>
            <p>文王序浏览：上下卦、关键词、卦名由来</p>
          </a>
          <a class="ly-learn-hub-card" href="/liuyao/concepts#shi-ying" data-path="/liuyao/concepts#shi-ying">
            <span class="ly-learn-hub-kicker">速查</span>
            <strong>世应 · 六亲 · 动爻 · 变卦</strong>
            <p>概念卡片，配合对照读卦使用</p>
          </a>
        </nav>
        <div class="ly-home-cta">
          <button type="button" class="ly-home-secondary" data-switch="cast">切到起卦模式 ›</button>
        </div>
      </main>
      <footer class="ly-home-footer">
        <p>© Starry Product Lab · Mystic Lab</p>
      </footer>
    `;
    bindNav();
  }

  function bindNav(): void {
    body.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.path!);
      });
    });
    body.querySelectorAll<HTMLElement>('[data-switch]').forEach((el) => {
      el.addEventListener('click', () => {
        const next = el.dataset.switch === 'learn' ? 'learn' : 'cast';
        setLiuyaoMode(next);
        modeBar.innerHTML = '';
        mountLiuyaoModeSwitch(modeBar, {
          onChange: (mode) => {
            if (mode === 'learn') paintLearn();
            else paintCast();
          },
        });
        if (next === 'learn') paintLearn();
        else paintCast();
      });
    });
  }

  page.querySelector('.ly-home-back')?.addEventListener('click', () => navigate('/'));

  if (getLiuyaoMode() === 'learn') paintLearn();
  else paintCast();

  root.appendChild(page);
  return () => {};
}
