import { renderThemedModuleHome } from '../ui/themed-module-home.ts';
import { renderXiaoliurenHero } from '../ui/xiaoliuren-hero.ts';

export function renderXiaoliurenHome(root: HTMLElement): () => void {
  return renderThemedModuleHome(root, {
    theme: 'xiaoliuren',
    backPath: '/',
    backLabel: '← 返回 Mystic Lab',
    heroTitle: '随心速问',
    moduleName: '小六壬',
    slogan: '一念起课，先看眼前这一步。',
    hint: '时辰即气，气即运势',
    sideInscription: '知天地之数 观指掌之微',
    heroHtml: renderXiaoliurenHero(),
    primaryCta: { label: '开始起课', comingSoon: true },
    secondaryLink: '看看怎么算出来 ›',
    entries: [
      {
        title: '六神图鉴',
        desc: '大安 / 留连 / 速喜 / 赤口 / 小吉 / 空亡',
        icon: '☁',
        comingSoon: true,
      },
      {
        title: '小六壬手札',
        desc: '每次起课记录',
        icon: '📜',
        comingSoon: true,
      },
      {
        title: '时辰入门',
        desc: '快速看懂十二时辰',
        icon: '🕐',
        comingSoon: true,
      },
    ],
  });
}
