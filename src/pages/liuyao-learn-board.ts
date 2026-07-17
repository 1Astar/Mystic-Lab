import { navigate } from '../router.ts';
import { bindGuideInteractions, renderComposeTeach } from '../liuyao/compose-teach.ts';
import { buildLearnSampleCast } from '../liuyao/learn-sample.ts';
import { mountLiuyaoModeSwitch, setLiuyaoMode } from '../liuyao/mode.ts';
import { renderYaoKindLegend } from '../liuyao/yao-kind-guide.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderLiuyaoLearnBoard(root: HTMLElement): void {
  const question = '这份工作要不要推进？';
  const cast = buildLearnSampleCast();
  const page = document.createElement('div');
  page.className = 'page ly-learn-board-page';
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

  const main = document.createElement('div');
  main.className = 'ly-learn-board-main';
  main.innerHTML = `
    <header class="ly-codex-header">
      <h1 class="page-title">对照读卦</h1>
      <p class="page-subtitle">示例问题：${question} —— 按五步点开，逐格学</p>
    </header>
    ${renderYaoKindLegend({ interactive: false })}
    ${renderComposeTeach({ cast, question, activeStep: 1 })}
    <nav class="ly-learn-quick ly-learn-board-links">
      <a href="/liuyao/bagua" data-path="/liuyao/bagua">八卦图鉴</a>
      <a href="/liuyao/hexagrams" data-path="/liuyao/hexagrams">六十四卦</a>
      <a href="/liuyao/concepts#shi-ying" data-path="/liuyao/concepts#shi-ying">概念速查</a>
      <a href="/liuyao/reading" data-path="/liuyao/reading">去实战起卦</a>
    </nav>
  `;
  page.append(main);

  const guideRoot = main.querySelector<HTMLElement>('[data-guide-root]');
  if (guideRoot) bindGuideInteractions(guideRoot, cast, question);

  main.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const path = el.dataset.path!;
      if (path.includes('/reading')) setLiuyaoMode('cast');
      navigate(path);
    });
  });

  root.appendChild(page);
}
