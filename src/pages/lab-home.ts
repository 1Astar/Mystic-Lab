import { navigate } from '../router.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mysticEmblemHtml, type MysticEmblemKind } from '../ui/mystic-emblem.ts';
import { mountEnvBanner } from '../ui/banner.ts';

interface LabEntry {
  path: string;
  title: string;
  desc: string;
  /** 短定位备注，以小字括号附在描述旁 */
  note?: string;
  emblem: MysticEmblemKind;
  comingSoon?: boolean;
}

const SYSTEMS: LabEntry[] = [
  {
    path: '/tarot',
    title: '塔罗 Tarot',
    desc: '适合关系、内心、选择、长期状态',
    note: '心理探索',
    emblem: 'tarot',
  },
  {
    path: '/xiaoliuren',
    title: '小六壬',
    desc: '适合短期趋势、今天明天、事情顺不顺',
    note: '时间趋势',
    emblem: 'star',
  },
  {
    path: '/meihua',
    title: '梅花易数',
    desc: '适合动念起卦、变化判断、事象推演',
    note: '象与变化',
    emblem: 'plum',
  },
];

const GLOBAL_ENTRIES: LabEntry[] = [
  {
    path: '/records',
    title: '我的旅程',
    desc: '塔罗 · 小六壬 · 收藏 · 进度 · 笔记',
    emblem: 'heart',
  },
  {
    path: '/knowledge',
    title: '知识库',
    desc: '学习不同占问体系',
    emblem: 'tarot',
    comingSoon: true,
  },
];

function appendEntryCard(
  container: HTMLElement,
  entry: LabEntry,
  primary = false,
): void {
  const card = document.createElement(entry.comingSoon ? 'button' : 'a');
  card.className = `entry-card ${primary ? 'entry-card-primary' : ''}`;
  if (entry.comingSoon) {
    (card as HTMLButtonElement).type = 'button';
    card.classList.add('entry-card-soon');
  } else {
    (card as HTMLAnchorElement).href = entry.path;
  }

  const noteHtml = entry.note
    ? ` <span class="entry-note">（${entry.note}）</span>`
    : '';

  card.innerHTML = `
    <div class="entry-emblem-wrap">${mysticEmblemHtml(entry.emblem, primary ? 'md' : 'sm')}</div>
    <h2>${entry.title}</h2>
    <p>${entry.desc}${noteHtml}</p>
    ${entry.comingSoon ? '<span class="tag">即将开放</span>' : ''}
  `;

  card.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(entry.path);
  });

  container.appendChild(card);
}

export function renderLabHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page';
  mountEnvBanner(page);

  page.innerHTML = `
    <header class="home-header">
      <p class="home-eyebrow">MYSTIC LAB</p>
      <h1 class="page-title">Mystic Lab</h1>
      <p class="page-subtitle">选择一种方式，开始一次占问</p>
      <p class="lab-system-hint">问内心与关系 → 塔罗（心理探索）· 问这几天顺不顺 → 小六壬（时间趋势）· 问象与变化 → 梅花（未开放）</p>
    </header>
    <section class="lab-section" aria-label="占问体系">
      <h2 class="lab-section-label">占问体系</h2>
      <div class="lab-systems"></div>
    </section>
    <section class="lab-section" aria-label="全局入口">
      <h2 class="lab-section-label">全局</h2>
      <div class="lab-global"></div>
    </section>
  `;

  const systems = page.querySelector<HTMLElement>('.lab-systems')!;
  for (const entry of SYSTEMS) {
    appendEntryCard(systems, entry, true);
  }

  const global = page.querySelector<HTMLElement>('.lab-global')!;
  for (const entry of GLOBAL_ENTRIES) {
    appendEntryCard(global, entry);
  }

  root.appendChild(page);

  return () => stars.remove();
}
