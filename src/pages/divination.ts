import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';

const METHODS = [
  {
    path: '/tarot',
    title: '塔罗抽牌',
    desc: '手势洗牌 · 切牌 · 抽牌 · 解读',
    ready: true,
  },
  {
    path: '/xiao-liu-ren',
    title: '小六壬',
    desc: '指节起课 · 六宫断语',
    ready: false,
  },
  {
    path: '/mei-hua',
    title: '梅花易数',
    desc: '动念成卦 · 时间起卦',
    ready: false,
  },
];

export function renderDivination(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回首页';
  back.addEventListener('click', () => navigate('/'));

  page.append(back);

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">随心占问</h1>
    <p class="page-subtitle">塔罗抽牌 / 小六壬 / 梅花易数</p>
    <p class="tarot-hint">提问 → 占问 → 解读 → 解锁图鉴 → 写下感悟</p>
  `;
  page.appendChild(header);

  const list = document.createElement('div');
  list.className = 'method-list';

  for (const method of METHODS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'entry-card method-card';
    card.innerHTML = `
      <h2>${method.title}</h2>
      <p>${method.desc}</p>
      ${method.ready ? '' : '<span class="tag">即将开放</span>'}
    `;
    card.addEventListener('click', () => {
      if (method.ready) navigate(method.path);
      else navigate(method.path);
    });
    list.appendChild(card);
  }

  page.appendChild(list);
  root.appendChild(page);
}
