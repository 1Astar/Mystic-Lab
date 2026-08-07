/** 紫微边看边问：按当前命盘生成常问 */
import type { ZiweiChartView } from './types.ts';
import { getStarLore } from './stars.ts';
import { answerZiweiConcept } from './concept-ask.ts';

export type ZiweiFaqItem = { q: string; a: string[] };

export function buildZiweiPageFaq(
  view: ZiweiChartView,
  opts?: { question?: string },
): ZiweiFaqItem[] {
  const soul = view.soulPalace;
  const spot = soul.majors[0]?.name ?? soul.minors[0]?.name ?? '';
  const lore = spot ? getStarLore(spot) : undefined;
  const q = opts?.question?.trim() ?? '';
  const items: ZiweiFaqItem[] = [
    {
      q: `命宫主星「${spot || '空象'}」代表什么？`,
      a: lore
        ? [`${lore.id} · ${lore.epithet}`, lore.myth, lore.portrait]
        : ['命宫主星是「我」出场的底色；空象则更看辅星与大运来点亮。'],
    },
    {
      q: `五行局「${view.fiveElementsClass}」怎么读？`,
      a: [
        `五行局描述命盘的气场节奏：${view.fiveElementsClass}。`,
        '它不判决吉凶，而是告诉你推进与修养的节拍偏好。',
      ],
    },
    {
      q: '十二宫我该先看哪几宫？',
      a: [
        '先看命宫（我是谁），再看官禄/财帛（外面舞台与资源），最后看夫妻/福德（关系与满足感）。',
        '完整命盘里点宫名可看三方四正。',
      ],
    },
  ];

  if (spot) {
    const hit = answerZiweiConcept(spot);
    if (hit.hit) {
      items.push({
        q: `「${spot}」和别的主星有什么不一样？`,
        a: hit.answer.split('\n').filter(Boolean),
      });
    }
  }

  items.push({
    q: q ? `就「${q}」我该盯哪一宫？` : '流年不顺时先看什么？',
    a: q
      ? [
          '把问题映射到宫位：工作看官禄，钱看财帛，关系看夫妻，身心看疾厄/福德。',
          '再对照流年四化，看是在推你、还是在考你。',
        ]
      : [
          '先看流年四化落在哪几宫，再回看命宫主星是否被照。',
          '不必一次扫完十二宫——先解决「此刻最烫」的那一宫。',
        ],
  });

  return items;
}
