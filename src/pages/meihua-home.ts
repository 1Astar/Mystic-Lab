import { renderMeihuaHero } from '../ui/meihua-hero.ts';
import { renderThemedModuleHome } from '../ui/themed-module-home.ts';

export function renderMeihuaHome(root: HTMLElement): () => void {
  return renderThemedModuleHome(root, {
    theme: 'meihua',
    backPath: '/',
    backLabel: '← 返回 Mystic Lab',
    heroTitle: '随心而悟',
    moduleName: '梅花易数',
    slogan: '一念成卦，观变化，也观人心。',
    hint: '时间起卦 · 数字起卦 · 卦象解读',
    focusNote:
      '<p class="theme-focus-tag">象与动念</p><p>当下一个念头/一事一象，用八卦取象推演——重<strong>这一念对应什么象</strong>。若要拆六爻叠合、看动爻与世应（我/外界），可改用六爻（变化结构）。</p>',
    sideInscription: '以卦知来意 梅花香自苦寒来 数起一瞬间',
    heroHtml: renderMeihuaHero(),
    primaryCta: { label: '动念起卦', comingSoon: true },
    secondaryLink: '看看如何成卦 ›',
    entries: [
      {
        title: '卦象图鉴',
        desc: '八卦 / 六十四卦 / 体用 / 动爻',
        icon: '☯',
        comingSoon: true,
      },
      {
        title: '梅花手札',
        desc: '每次起卦记录',
        icon: '🌸',
        comingSoon: true,
      },
      {
        title: '起卦方式',
        desc: '时间起卦 / 数字起卦，一步步看懂推演',
        icon: '◈',
        comingSoon: true,
      },
    ],
  });
}
