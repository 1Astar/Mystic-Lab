import { getCollectedCount } from '../codex/collection.ts';
import { loadJournalEntries } from '../journal/records.ts';
import { renderModuleHome } from '../ui/module-home.ts';

export function renderTarotHome(root: HTMLElement): () => void {
  return renderModuleHome(root, {
    backPath: '/',
    backLabel: '← 返回 Mystic Lab',
    eyebrow: 'MYSTIC LAB',
    title: '塔罗 Tarot',
    slogan: '答案不在牌里，在你心里。',
    subtitle: '随心占问 · 随心图鉴 · 随心手札',
    showStars: true,
    showAiSettings: true,
    entries: [
      {
        path: '/tarot/reading',
        title: '随心占问',
        desc: '塔罗抽牌',
        primary: true,
        cta: '开始占卜',
        emblem: 'heart',
      },
      {
        path: '/tarot/tujian',
        title: '随心图鉴',
        desc: '78 张牌 / 愚人之旅 / 牌组×数字',
        stat: () => `${getCollectedCount()} 张已收集`,
      },
      {
        path: '/journal',
        title: '随心手札',
        desc: '塔罗占问记录',
        stat: () => `${loadJournalEntries().length} 条记录`,
      },
    ],
  });
}
