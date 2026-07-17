import type { Trigram } from './trigrams.ts';

/** 取象小动画：让小白「看见」上下卦关系 */
export function renderXiangVisual(upper: Trigram, lower: Trigram): string {
  const key = `${lower.nature}-${upper.nature}`;
  const scene = SCENE[key] ?? {
    title: `${lower.nature}在下 · ${upper.nature}在上`,
    caption: `把「下${lower.nature}」想成你这边的底色，把「上${upper.nature}」想成外面的场。`,
  };

  return `
    <div class="ly-xiang" data-xiang="${key}">
      <div class="ly-xiang-stage" aria-hidden="true">
        <div class="ly-xiang-sky ly-xiang-${upper.nature}"></div>
        <div class="ly-xiang-ground ly-xiang-${lower.nature}"></div>
        <div class="ly-xiang-fx ly-xiang-fx-${lower.nature}-${upper.nature}"></div>
      </div>
      <p class="ly-xiang-title">${scene.title}</p>
      <p class="ly-xiang-caption">${scene.caption}</p>
    </div>
  `;
}

const SCENE: Record<string, { title: string; caption: string }> = {
  '雷-山': {
    title: '山下有雷',
    caption: '雷想往上冲，山却挡在顶上——动能有了，出口还没开。',
  },
  '火-山': {
    title: '山下有火',
    caption: '火在山里亮着：想被看见，但场面仍被「山」框住。',
  },
  '山-地': {
    title: '山附于地',
    caption: '高处的东西往下剥落——该收的要收，硬撑会更碎。',
  },
  '地-雷': {
    title: '地雷复',
    caption: '一阳在底下悄悄回来：转机刚冒头，别急着满仓。',
  },
  '水-山': {
    title: '山上有水',
    caption: '路不好走：前面有险，脚下又像被山卡住。',
  },
  '泽-天': {
    title: '天边有泽',
    caption: '开口谈条件的阶段：话要说清，分寸比速度重要。',
  },
  '火-泽': {
    title: '泽中有火',
    caption: '水面下在烧——变革已经在酝酿，旧秩序撑不住了。',
  },
  '风-山': {
    title: '山上有风',
    caption: '风在山间绕：事要渐进，急推会被地形挡回。',
  },
};
