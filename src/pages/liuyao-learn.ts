import { navigate } from '../router.ts';
import { LIUYAO_LEARN_CHAPTERS } from '../liuyao/learn-chapters.ts';
import { mountLiuyaoModeSwitch, setLiuyaoMode } from '../liuyao/mode.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderLiuyaoLearn(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page ly-learn-page';
  mountEnvBanner(page);

  const top = document.createElement('div');
  top.className = 'ly-topbar';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回六爻';
  back.addEventListener('click', () => navigate('/liuyao'));
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
    <h1 class="page-title">六爻之旅</h1>
    <p class="page-subtitle">从阴阳到动爻，一步步看懂卦象结构</p>
    <nav class="ly-learn-quick" aria-label="图鉴快捷入口">
      <a href="/liuyao/learn/board" data-path="/liuyao/learn/board">对照读卦</a>
      <a href="/liuyao/classic" data-path="/liuyao/classic">古文资料夹</a>
      <a href="/liuyao/bagua" data-path="/liuyao/bagua">八卦图鉴</a>
      <a href="/liuyao/hexagrams" data-path="/liuyao/hexagrams">六十四卦图鉴</a>
      <a href="/liuyao/concepts#shi-ying" data-path="/liuyao/concepts#shi-ying">世应</a>
      <a href="/liuyao/concepts#liu-qin" data-path="/liuyao/concepts#liu-qin">六亲</a>
      <a href="/liuyao/concepts#dong-yao" data-path="/liuyao/concepts#dong-yao">动爻</a>
      <a href="/liuyao/concepts#bian-gua" data-path="/liuyao/concepts#bian-gua">变卦</a>
      <a href="/liuyao/concepts#hu-gua" data-path="/liuyao/concepts#hu-gua">互卦</a>
      <a href="/liuyao/concepts#cuo-zong" data-path="/liuyao/concepts#cuo-zong">错综</a>
    </nav>
  `;
  page.append(header);

  const list = document.createElement('div');
  list.className = 'ly-learn-list';

  for (const ch of LIUYAO_LEARN_CHAPTERS) {
    const card = document.createElement('article');
    card.className = 'ly-learn-card';
    card.innerHTML = `
      <h2>${ch.title}</h2>
      <p class="ly-learn-sub">${ch.subtitle}</p>
      <div class="ly-learn-body">${ch.body.map((p) => `<p>${p}</p>`).join('')}</div>
    `;
    list.appendChild(card);
  }

  const foot = document.createElement('div');
  foot.className = 'ly-learn-foot';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn ly-btn-gold';
  btn.textContent = '去实战起卦';
  btn.addEventListener('click', () => {
    setLiuyaoMode('cast');
    navigate('/liuyao/reading');
  });
  foot.append(btn);
  page.append(list, foot);

  page.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.path!);
    });
  });

  root.appendChild(page);
}
