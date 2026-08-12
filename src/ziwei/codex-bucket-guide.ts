/**
 * 图鉴星曜分类小问号：白话说明，嵌进笔记抽屉引导手记。
 */
import type { StarBucket } from './codex-taxonomy.ts';
import { STAR_BUCKET_META } from './codex-taxonomy.ts';

export type BucketGuidePack = {
  /** 笔记 context */
  context: string;
  title: string;
  /** 分段说明 */
  sections: Array<{ h: string; p: string }>;
  /** 点一句写入笔记 */
  reflect: string[];
};

const OVERVIEW_SECTIONS: Array<{ h: string; p: string }> = [
  {
    h: '主星是什么？',
    p: '十四主星是盘面的「主角」。命宫、官禄、夫妻等宫里先看主星，才定人格主调与人生戏份。读盘时：主星先，其它后。',
  },
  {
    h: '神煞和主星差在哪？',
    p: '神煞不是第二套主角，而是叠在宫上的「字幕 / 色调」。图鉴里用「盘中有 / 全部」看相遇，再按人生议题筛选，并用护持/中性/提醒色区分气氛——不要拿神煞单独判吉凶。',
  },
  {
    h: '为什么还分杂曜？',
    p: '杂曜多是常见的细部色调，词条短、好扫读。神煞桶按议题收全量（含十二神名目），方便对照；两边会有重名，以「落哪宫 + 同宫主星」为准。',
  },
  {
    h: '吉星 · 煞星 · 辅曜呢？',
    p: '六吉 / 六煞 / 重要辅曜是主星身边的「常驻配角」：加重、牵制或带动主戏，比一般杂曜更常入读。仍服从：主星定戏，辅曜改气氛。',
  },
];

const PER_BUCKET: Record<
  StarBucket,
  { lead: string; extra?: string; reflect: string[] }
> = {
  major: {
    lead: '主星十四颗，是性格与宫职的主戏。点开一张海报，先读「是谁 / 性格 / 生活」，再回命盘看它落在哪宫。',
    reflect: [
      '我盘里最显眼的主星是…',
      '这颗主星最像我的一句是…',
      '还想对照的主星：',
    ],
  },
  lucky: {
    lead: '六吉星是常驻贵人与助力色：左辅右弼、昌曲、魁钺。读时看它帮哪颗主星、落哪宫，不单独当「好运开关」。',
    reflect: ['我盘里最有感的吉星是…', '它像在帮哪件事：'],
  },
  sha: {
    lead: '六煞星是摩擦、急躁、空耗一类的提醒色。见煞先问「哪里容易绷」——不是判死刑，是提醒节奏与边界。',
    reflect: ['这颗煞星提醒我留意…', '我想试的一个小调整：'],
  },
  aux: {
    lead: '重要辅曜（如天马、禄存等）偏「功能键」：动、蓄、禄位。叠在主星与三方四正上读，力轻于主星。',
    reflect: ['这颗辅曜落在我生活里像…'],
  },
  minor: {
    lead:
      '杂曜是细部色调：喜庆、清高、孤独、桃花等小品星。为什么单独一栏？因为它们词条多、力轻，适合扫读；主戏仍看同宫主星。',
    extra:
      '和「神煞」百科的关系：神煞桶更全（十二神、流派差异也会收）；杂曜栏先给你日常最常遇见的一批。重名时对照落宫即可。',
    reflect: [
      '这颗杂曜叠在我哪段关系/工作上…',
      '主星 vs 这层色调：我更想记…',
    ],
  },
  shensha: {
    lead:
      '神煞在这里按「盘中有 / 全部」看相遇，再按人生议题（贵人、桃花、耗散…）筛选；卡片有护持/中性/提醒色，只作气氛，不当吉凶判决。',
    extra:
      '和主星的差别：主星演主角，神煞只加字幕。不再用长生/将前等系别当导航；流派对照仍在底部可选。',
    reflect: [
      '我盘里最想搞清的神煞是…',
      '这个议题色调叠在主星上像在说…',
      '对照他书时，我卡住的名字：',
    ],
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 总览：主星 / 神煞 / 杂曜怎么分 */
export function starTaxonomyOverviewGuide(): BucketGuidePack {
  return {
    context: '图鉴 · 星曜分类说明',
    title: '主星、神煞、杂曜怎么分？',
    sections: OVERVIEW_SECTIONS,
    reflect: [
      '一句话：主星是主角，神煞/杂曜是色调。',
      '我盘里最想先搞清的是…',
      '今天记下的疑问：',
    ],
  };
}

export function starBucketGuide(bucket: StarBucket): BucketGuidePack {
  const meta = STAR_BUCKET_META[bucket];
  const row = PER_BUCKET[bucket];
  const sections: Array<{ h: string; p: string }> = [
    { h: `${meta.title} · 怎么读`, p: row.lead },
  ];
  if (row.extra) sections.push({ h: '和别的分类差在哪', p: row.extra });
  sections.push(
    ...OVERVIEW_SECTIONS.filter((s) => {
      if (bucket === 'major') return s.h.startsWith('主星') || s.h.startsWith('神煞');
      if (bucket === 'minor') return s.h.includes('杂曜') || s.h.startsWith('神煞');
      if (bucket === 'shensha') return s.h.startsWith('神煞') || s.h.includes('杂曜');
      return s.h.startsWith('吉星') || s.h.startsWith('主星');
    }),
  );
  // de-dupe by h
  const seen = new Set<string>();
  const unique = sections.filter((s) => {
    if (seen.has(s.h)) return false;
    seen.add(s.h);
    return true;
  });
  return {
    context: `图鉴 · ${meta.title} · 分类说明`,
    title: `${meta.title}是什么？`,
    sections: unique,
    reflect: row.reflect,
  };
}

export function renderBucketGuidePrimerHtml(pack: BucketGuidePack): string {
  const blocks = pack.sections
    .map(
      (s) => `
      <section class="ziwei-bucket-guide-block">
        <h3>${escapeHtml(s.h)}</h3>
        <p>${escapeHtml(s.p)}</p>
      </section>`,
    )
    .join('');
  return `
    <aside class="ziwei-bucket-guide" aria-label="${escapeHtml(pack.title)}">
      <p class="ziwei-bucket-guide-kicker">分类说明</p>
      <h3 class="ziwei-bucket-guide-title">${escapeHtml(pack.title)}</h3>
      <p class="ziwei-bucket-guide-lead">读完可切到「笔记」Tab 随手记一句。</p>
      ${blocks}
    </aside>`;
}
