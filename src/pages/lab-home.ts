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
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';

interface LabEntry {
  path: string;
  title: string;
  desc: string;
  note?: string;
  emblem: MysticEmblemKind;
  comingSoon?: boolean;
}

/** 各体系入口常驻 */
const ALL_SYSTEMS: LabEntry[] = [
  {
    path: '/tarot',
    title: '塔罗',
    desc: '人与事：画面、张力、下一步',
    note: '看见画面',
    emblem: 'tarot',
  },
  {
    path: '/liuyao',
    title: '六爻',
    desc: '谈薪、offer、官司等具体事',
    note: '一事细看',
    emblem: 'hex',
  },
  {
    path: '/xiaoliuren',
    title: '小六壬',
    desc: '出门、面试、临时吉凶倾向',
    note: '即时定向',
    emblem: 'star',
  },
  {
    path: '/meihua',
    title: '梅花易数',
    desc: '人品、一事一象，先定大方向',
    note: '象与气机',
    emblem: 'plum',
  },
  {
    path: '/bazi',
    title: '八字',
    desc: '日主、十神、命盘结构',
    note: '命理结构',
    emblem: 'bazi',
  },
  {
    path: '/ziwei',
    title: '紫微',
    desc: '星曜图鉴 · 十年大限 · 人生地图',
    note: SYSTEM_POSITION.ziwei,
    emblem: 'cosmos',
  },
  {
    path: '/life',
    title: '人生宇宙',
    desc: '平行选择 · 人生推演',
    note: '看自己的路',
    emblem: 'cosmos',
  },
];

const GLOBAL_ENTRIES: LabEntry[] = [
  {
    path: '/records',
    title: '我的旅程',
    desc: '各体系记录 · 收藏 · 笔记',
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
    if (entry.comingSoon) return;
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
      <p class="page-subtitle">答案不在牌里，在你心里。</p>
      <button type="button" class="lab-guide-trigger">怎么选体系？</button>
    </header>

    <section class="lab-section" aria-label="体系入口">
      <div class="lab-systems" data-lab-systems></div>
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

  const systemsHost = page.querySelector<HTMLElement>('[data-lab-systems]')!;
  for (const entry of ALL_SYSTEMS) {
    appendEntryCard(systemsHost, entry, true);
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
