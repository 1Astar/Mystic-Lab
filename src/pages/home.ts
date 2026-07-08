import { navigate } from '../router.ts';
import { createStarsLayer } from '../tarot/animations.ts';
import { getCollectedCount } from '../codex/collection.ts';
import { loadJournalEntries } from '../journal/records.ts';
import { mysticEmblemHtml } from '../ui/mystic-emblem.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountAiSettingsPanel } from '../ui/ai-settings-panel.ts';

const MODULES = [
  {
    path: '/divination',
    title: '随心占问',
    desc: '塔罗抽牌 / 小六壬 / 梅花易数',
    primary: true,
    cta: '开始一次占问',
    emblem: 'heart' as const,
  },
  {
    path: '/codex',
    title: '随心图鉴',
    desc: '收集你遇见的牌与卦 · 慢慢看懂它们的意思',
    stat: () => `${getCollectedCount()} 张已收集`,
  },
  {
    path: '/journal',
    title: '随心手札',
    desc: '记录每一次提问、结果与后来的感悟',
    stat: () => `${loadJournalEntries().length} 条记录`,
  },
];

export function renderHome(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page';
  mountEnvBanner(page);

  page.innerHTML = `
    <header class="home-header">
      <p class="home-eyebrow">Mystic Lab</p>
      <h1 class="page-title">随心而行</h1>
      <p class="home-slogan">答案不在牌里，在你心里。</p>
      <p class="page-subtitle">
        提问 → 占问 → 解读 → 解锁图鉴 → 写下感悟
      </p>
    </header>
    <div id="ai-settings-host"></div>
    <nav class="home-nav" aria-label="模块入口"></nav>
  `;

  const nav = page.querySelector('.home-nav')!;

  mountAiSettingsPanel(page.querySelector('#ai-settings-host')!);

  for (const mod of MODULES) {
    const card = document.createElement('a');
    card.className = `entry-card ${mod.primary ? 'entry-card-primary' : ''}`;
    card.href = mod.path;
    const stat = mod.stat?.();
    const emblem = mod.emblem
      ? `<div class="entry-emblem-wrap">${mysticEmblemHtml(mod.emblem, 'md')}</div>`
      : '';
    card.innerHTML = `
      ${emblem}
      <h2>${mod.title}</h2>
      <p>${mod.desc}</p>
      ${stat ? `<span class="entry-stat">${stat}</span>` : ''}
      ${mod.cta ? `<span class="entry-cta">${mod.cta}</span>` : ''}
    `;
    card.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(mod.path);
    });
    nav.appendChild(card);
  }

  root.appendChild(page);

  return () => stars.remove();
}
