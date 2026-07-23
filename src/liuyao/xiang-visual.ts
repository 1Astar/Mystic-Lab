import type { Trigram } from './trigrams.ts';

/** 取象可视化：上下卦叠爻图（教学优先，不用模糊氛围图） */
export function renderXiangVisual(upper: Trigram, lower: Trigram): string {
  const key = `${lower.nature}-${upper.nature}`;
  const scene = SCENE[key] ?? {
    title: `${lower.nature}在下 · ${upper.nature}在上`,
    caption: `把「下${lower.nature}」想成你这边的底色，把「上${upper.nature}」想成外面的场。`,
  };

  // 展示自上而下：上卦三爻（从上到下）+ 下卦三爻（从上到下）
  const upperTopFirst = [...upper.bits].reverse();
  const lowerTopFirst = [...lower.bits].reverse();

  return `
    <div class="ly-xiang" data-xiang="${key}">
      <div class="ly-xiang-stage ly-xiang-stage-diagram" aria-hidden="true">
        <div class="ly-xiang-col">
          <p class="ly-xiang-col-label">上${upper.id}·${upper.nature}</p>
          <div class="ly-xiang-lines ly-xiang-lines-upper">
            ${upperTopFirst.map((b) => lineHtml(b, 'upper')).join('')}
          </div>
        </div>
        <div class="ly-xiang-stack-mark" aria-hidden="true">+</div>
        <div class="ly-xiang-col">
          <p class="ly-xiang-col-label">下${lower.id}·${lower.nature}</p>
          <div class="ly-xiang-lines ly-xiang-lines-lower">
            ${lowerTopFirst.map((b) => lineHtml(b, 'lower')).join('')}
          </div>
        </div>
        <div class="ly-xiang-merged">
          <p class="ly-xiang-merged-label">合成本卦</p>
          <div class="ly-xiang-lines ly-xiang-lines-full">
            ${upperTopFirst.map((b) => lineHtml(b, 'full')).join('')}
            <div class="ly-xiang-seam" title="上下卦分界"></div>
            ${lowerTopFirst.map((b) => lineHtml(b, 'full')).join('')}
          </div>
        </div>
      </div>
      <p class="ly-xiang-title">${escapeHtml(scene.title)}</p>
      <p class="ly-xiang-caption">${escapeHtml(scene.caption)}</p>
    </div>
  `;
}

function lineHtml(bit: 0 | 1, tone: 'upper' | 'lower' | 'full'): string {
  const yang = bit === 1;
  return `<span class="ly-xiang-line ${yang ? 'is-yang' : 'is-yin'} is-${tone}" ${
    yang ? '' : 'aria-hidden="true"'
  }>${yang ? '' : '<i></i><i></i>'}</span>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SCENE: Record<string, { title: string; caption: string }> = {
  '雷-火': {
    title: '雷在下 · 火在上',
    caption: '下雷是冲动与启动，上火是照见与裁决——像咬合：先有动作，再被看清对不对。',
  },
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
  '天-地': {
    title: '地天泰',
    caption: '天的能量沉下来、地的承载托上去——上下能通气，适合推进合作。',
  },
  '地-天': {
    title: '天地否',
    caption: '天往上、地往下，中间不通——先别硬冲，等通道再开。',
  },
};
