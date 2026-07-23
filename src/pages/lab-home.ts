import { navigate } from '../router.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { mysticEmblemHtml, type MysticEmblemKind } from '../ui/mystic-emblem.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { showLabGuideModal } from '../ui/lab-guide-modal.ts';
import { mountPersonAvatarChrome } from '../ui/person-switcher.ts';
import {
  isAiConfigured,
  loadAiSettings,
  type AiSettings,
} from '../ai/settings.ts';
import { openAiSettingsModal } from '../ui/ai-settings-panel.ts';

interface LabEntry {
  path: string;
  title: string;
  /** 卡片上的一句话用途 */
  desc: string;
  /** 短定位标签 */
  note?: string;
  emblem: MysticEmblemKind;
  comingSoon?: boolean;
}

/** 第一行塔罗 | 六爻；无单独档案卡片（改顶栏头像） */
const SYSTEMS: LabEntry[] = [
  {
    path: '/tarot',
    title: '塔罗',
    desc: '关系、内心、选择',
    note: '心理探索',
    emblem: 'tarot',
  },
  {
    path: '/liuyao',
    title: '六爻',
    desc: '六爻叠合、动爻、世应',
    note: '变化结构',
    emblem: 'hex',
  },
  {
    path: '/xiaoliuren',
    title: '小六壬',
    desc: '今天明天顺不顺',
    note: '时间趋势',
    emblem: 'star',
  },
  {
    path: '/meihua',
    title: '梅花易数',
    desc: '一念一事，八卦取象',
    note: '象与动念',
    emblem: 'plum',
  },
  {
    path: '/bazi',
    title: '八字',
    desc: '四柱排盘 · 日主十神',
    note: '命理结构',
    emblem: 'bazi',
  },
  {
    path: '/life',
    title: '人生宇宙',
    desc: '平行 · 选择模拟 · 预测打卡',
    note: '人生推演',
    emblem: 'cosmos',
  },
];

const GLOBAL_ENTRIES: LabEntry[] = [
  {
    path: '/records',
    title: '我的旅程',
    desc: '塔罗 · 小六壬 · 六爻 · 收藏 · 笔记',
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
  card.className = `entry-card ${primary ? 'entry-card-primary entry-card-compact' : ''}`;
  if (entry.comingSoon) {
    (card as HTMLButtonElement).type = 'button';
    card.classList.add('entry-card-soon');
  } else {
    (card as HTMLAnchorElement).href = entry.path;
  }

  const noteHtml = entry.note
    ? `<span class="entry-pill">${entry.note}</span>`
    : '';

  card.innerHTML = `
    <div class="entry-emblem-wrap">${mysticEmblemHtml(entry.emblem, primary ? 'sm' : 'sm')}</div>
    <h2>${entry.title}</h2>
    ${noteHtml}
    <p>${entry.desc}</p>
    ${entry.comingSoon ? '<span class="tag">即将开放</span>' : ''}
  `;

  card.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(entry.path);
  });

  container.appendChild(card);
}

function mountLabHomeAiButton(host: HTMLElement): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lab-home-ai-btn';
  btn.setAttribute('aria-label', 'AI 配置');

  const paint = (settings: AiSettings) => {
    const on = isAiConfigured(settings);
    btn.classList.toggle('is-on', on);
    btn.innerHTML = `
      <span class="lab-home-ai-dot" aria-hidden="true"></span>
      <span class="lab-home-ai-label">AI</span>
    `;
    btn.title = on ? `AI 已启用 · ${settings.model}` : 'AI 配置';
  };

  paint(loadAiSettings());
  btn.addEventListener('click', () => {
    openAiSettingsModal((s) => paint(s));
  });
  host.appendChild(btn);
}

export function renderLabHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page lab-home-page';
  mountEnvBanner(page);

  page.innerHTML = `
    <div class="lab-home-chrome" aria-label="档案与 AI">
      <div class="lab-home-chrome-left" data-lab-person-host></div>
      <div class="lab-home-chrome-right" data-lab-ai-host></div>
    </div>
    <header class="home-header">
      <p class="home-eyebrow">MYSTIC LAB</p>
      <h1 class="page-title">Mystic Lab</h1>
      <p class="page-subtitle">选择一种方式，开始一次占问</p>
      <button type="button" class="lab-guide-trigger">不知道从哪里开始？</button>
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

  page.querySelector('.lab-guide-trigger')?.addEventListener('click', () => {
    showLabGuideModal();
  });

  const personHost = page.querySelector<HTMLElement>('[data-lab-person-host]')!;
  mountPersonAvatarChrome(personHost);

  const aiHost = page.querySelector<HTMLElement>('[data-lab-ai-host]')!;
  mountLabHomeAiButton(aiHost);

  const systems = page.querySelector<HTMLElement>('.lab-systems')!;
  for (const entry of SYSTEMS) {
    appendEntryCard(systems, entry, true);
  }

  const global = page.querySelector<HTMLElement>('.lab-global')!;
  for (const entry of GLOBAL_ENTRIES) {
    appendEntryCard(global, entry);
  }

  root.appendChild(page);

  return () => {
    stars.remove();
    document.querySelector('.lab-guide-modal')?.remove();
    document.querySelector('.person-switch-sheet')?.remove();
    document.querySelector('.ai-settings-modal')?.remove();
  };
}
