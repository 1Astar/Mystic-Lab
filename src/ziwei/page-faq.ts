/** 紫微边看边问：按当前命盘生成常问 */
import type { ZiweiChartView } from './types.ts';
import { getStarLore } from './stars.ts';
import { answerZiweiConcept } from './concept-ask.ts';
import type { LabConceptTab } from '../ui/lab-concept-peek.ts';

export type ZiweiFaqItem = {
  q: string;
  a: string[];
  title?: string;
  tabs?: LabConceptTab[];
};

function starTabs(spot: string): { title: string; tabs: LabConceptTab[]; a: string[] } | null {
  const lore = getStarLore(spot);
  if (!lore) return null;
  const tabs: LabConceptTab[] = [
    { id: 'portrait', label: '画像', body: lore.portrait },
    { id: 'myth', label: '神话', body: lore.myth },
    { id: 'trait', label: '特质', body: lore.trait },
    {
      id: 'mirror',
      label: '镜子',
      body: `工作财运：${lore.mirrorWork}\n感情：${lore.mirrorLove}`,
    },
    { id: 'counsel', label: '醒言', body: lore.counsel },
  ];
  return {
    title: `${lore.id} · ${lore.epithet}`,
    tabs,
    a: [`${lore.id} · ${lore.epithet}`, lore.myth, lore.portrait],
  };
}

export function buildZiweiPageFaq(
  view: ZiweiChartView,
  opts?: { question?: string },
): ZiweiFaqItem[] {
  const soul = view.soulPalace;
  const spot = soul.majors[0]?.name ?? soul.minors[0]?.name ?? '';
  const packed = spot ? starTabs(spot) : null;
  const q = opts?.question?.trim() ?? '';
  const items: ZiweiFaqItem[] = [
    {
      q: `命宫主星「${spot || '空象'}」代表什么？`,
      title: packed?.title ?? (spot ? spot : '空象'),
      a: packed?.a ?? ['命宫主星是「我」出场的底色；空象则更看辅星与大运来点亮。'],
      tabs: packed?.tabs,
    },
    {
      q: `五行局「${view.fiveElementsClass}」怎么读？`,
      title: view.fiveElementsClass,
      a: [
        `五行局描述命盘的气场节奏：${view.fiveElementsClass}。`,
        '它不判决吉凶，而是告诉你推进与修养的节拍偏好。',
      ],
    },
    {
      q: '十二宫我该先看哪几宫？',
      title: '十二宫怎么看',
      a: [
        '先看命宫（我是谁），再看官禄/财帛（外面舞台与资源），最后看夫妻/福德（关系与满足感）。',
        '完整命盘里点一下宫看连线，再点一次看详细释义。',
      ],
    },
  ];

  if (spot) {
    const hit = answerZiweiConcept(spot);
    if (hit.hit) {
      items.push({
        q: `「${spot}」和别的主星有什么不一样？`,
        title: packed?.title ?? spot,
        a: hit.answer.split('\n').filter(Boolean),
        tabs: packed?.tabs,
      });
    }
  }

  items.push({
    q: q ? `就「${q}」我该盯哪一宫？` : '流年不顺时先看什么？',
    title: q ? '问题落宫' : '流年不顺',
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
