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
import { draftLabInvite } from '../share/drafts.ts';
import { openShareSheet } from '../share/sheet.ts';
import { SYSTEM_POSITION } from '../lab/system-positioning.ts';

interface LabEntry {
  path: string;
  title: string;
  desc: string;
  note?: string;
  emblem: MysticEmblemKind;
  comingSoon?: boolean;
}

/** 各体系入口常驻：塔罗 → 六爻 → 八字 → 紫微 → 小六壬 → 梅花 */
const ALL_SYSTEMS: LabEntry[] = [
  {
    path: '/tarot',
    title: '塔罗',
    desc: '人与事：画面、张力、下一步',
    note: SYSTEM_POSITION.tarot,
    emblem: 'tarot',
  },
  {
    path: '/liuyao',
    title: '六爻',
    desc: '谈薪、offer、官司等具体事',
    note: SYSTEM_POSITION.liuyao,
    emblem: 'hex',
  },
  {
    path: '/bazi',
    title: '八字',
    desc: '日主、十神、命盘结构',
    note: SYSTEM_POSITION.bazi,
    emblem: 'bazi',
  },
  {
    path: '/ziwei',
    title: '紫微',
    desc: '星曜探索 · 十年大限 · 人生地图',
    note: SYSTEM_POSITION.ziwei,
    emblem: 'cosmos',
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

/** 顶栏分享图标：打开邀请分享面板 */
function mountLabHomeShareButton(host: HTMLElement): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lab-home-share-btn';
  btn.setAttribute('aria-label', '邀请分享');
  btn.title = '邀请同行';
  btn.innerHTML = `
    <svg class="lab-home-share-ico" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <path d="M8.6 13.5 15.4 17.5"/>
      <path d="M15.4 6.5 8.6 10.5"/>
    </svg>
  `;
  btn.addEventListener('click', () => {
    openShareSheet(draftLabInvite(), { mode: 'invite', autoStart: true });
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
      <div class="lab-home-cta-row">
        <button type="button" class="lab-guide-trigger">怎么选体系？</button>
      </div>
    </header>

    <section class="lab-section" aria-label="体系入口">
      <div class="lab-systems" data-lab-systems></div>
    </section>
  `;

  page.querySelector('.lab-guide-trigger')?.addEventListener('click', () => {
    showLabGuideModal();
  });

  const personHost = page.querySelector<HTMLElement>('[data-lab-person-host]')!;
  mountPersonAvatarChrome(personHost);

  const aiHost = page.querySelector<HTMLElement>('[data-lab-ai-host]')!;
  mountLabHomeAiButton(aiHost);
  mountLabHomeShareButton(aiHost);

  const systemsHost = page.querySelector<HTMLElement>('[data-lab-systems]')!;
  for (const entry of ALL_SYSTEMS) {
    appendEntryCard(systemsHost, entry, true);
  }

  root.appendChild(page);

  return () => {
    stars.remove();
    document.querySelector('.lab-guide-modal')?.remove();
    document.querySelector('.person-switch-sheet')?.remove();
    document.querySelector('[data-lab-me-drawer]')?.remove();
    document.querySelector('.ai-settings-modal')?.remove();
  };
}
