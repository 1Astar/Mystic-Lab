/**
 * 洞见 / 运势嵌入的「半真半假盘」猜题：学习对照，非真人鉴定。
 */
import { guessDayKey } from './guess-pack.ts';

export type InsightGuessOption = {
  id: string;
  label: string;
};

export type InsightGuessSurface = 'insight' | 'luck';

export type InsightGuessCard = {
  id: string;
  /** 盲盒称呼 */
  sealedLabel: string;
  /** 半真半假盘面线索（像摘录，非完整排盘） */
  fakeChart: string[];
  question: string;
  options: InsightGuessOption[];
  answerId: string;
  explainCorrect: string;
  explainWrong: string;
  surfaces: InsightGuessSurface[];
};

export const INSIGHT_GUESS_CARDS: InsightGuessCard[] = [
  {
    id: 'ig-yinshen-move',
    sealedLabel: '匿名盘 · 一位「今年想换场域」的人',
    fakeChart: ['日主乙木', '原局月支见寅', '今年流年支申', '十神：偏财透干'],
    question: '按你刚在图鉴/运限里学的，他今年更宜怎么安排？',
    options: [
      { id: 'a', label: '把寅申冲当行程窗：合同与地点变动留缓冲，主业先守一个出口' },
      { id: 'b', label: '认定必破大财，全年停摆不出门' },
      { id: 'c', label: '忽略地支，只看偏财透干就全面铺开创业' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。这是「半真半假盘」复习：寅申冲偏场域/文书节奏，财透只是议题显眼——先守出口，再谈移动。',
    explainWrong:
      '不是停摆恐吓，也不能只盯财透梭哈。冲是换轨窗，透是照亮：合在一起更要有缓冲与主线。',
    surfaces: ['insight', 'luck'],
  },
  {
    id: 'ig-cai-tou',
    sealedLabel: '匿名盘 · 一位「账上话题特别响」的人',
    fakeChart: ['日主庚金', '正财透出天干', '月令偏弱', '流年食神泄秀'],
    question: '财星透出时，他更像哪种状态？',
    options: [
      { id: 'a', label: '求财议题被照亮：宜报价、止损、小单试窗口，忌只谈机会不交付' },
      { id: 'b', label: '必然暴富，无需风控' },
      { id: 'c', label: '财透等于破财，必须拒接一切单' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。透出＝议题可见。财要结果也要锚：止损与交付，比神话暴富或全面拒单更贴近用法。',
    explainWrong:
      '财透不是暴富开关，也不是必破标签。先记「照亮 + 要锚」。',
    surfaces: ['insight', 'luck'],
  },
  {
    id: 'ig-bi-jie',
    sealedLabel: '匿名盘 · 一位「身边总有并肩者」的人',
    fakeChart: ['日主甲木', '年时多见比肩', '大运劫财', '问：要不要跟所有人一起冲'],
    question: '比劫气场偏显时，更稳的一步是？',
    options: [
      { id: 'a', label: '分清队友与赛道：并肩成事，少把精力耗在全面比较' },
      { id: 'b', label: '跟所有人硬刚，证明自己最强' },
      { id: 'c', label: '切断一切协作，只剩自己' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。比劫是同气：能助力也能内耗。分赛道比「全刚」或「全断」更可用。',
    explainWrong:
      '不是全刚神话，也不是必须切断所有人。抓住「分清队友与赛道」。',
    surfaces: ['insight'],
  },
  {
    id: 'ig-yueling-root',
    sealedLabel: '匿名盘 · 一位被说「定调像春天」的人',
    fakeChart: ['日主丙火', '月令寅木', '年支亥水', '问：为什么老觉得气场外放'],
    question: '读他的「定调」，优先抓住哪一层？',
    options: [
      { id: 'a', label: '月令寅木当令：生火有根，外放感常从这里起读' },
      { id: 'b', label: '只看日主丙火，月令可以忽略' },
      { id: 'c', label: '年支亥水单独决定一切，其它柱无效' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。半真半假盘也守同一原则：月令是当令锚。丙火外放，常要先看是否得令得生。',
    explainWrong:
      '不是只看日主，也不是一柱包打。先抓月令，再叠年支与透干。',
    surfaces: ['insight', 'luck'],
  },
  {
    id: 'ig-luck-trigger',
    sealedLabel: '匿名盘 · 一位「原局有华盖、今年被流年碰到」的人',
    fakeChart: ['原局时支见华盖', '流年冲起该支', '十神仍以印星为多', '问：今年是不是「玄学暴击年」'],
    question: '更贴近产品口径的理解是？',
    options: [
      { id: 'a', label: '运程在触发原局某层：适合把独处/钻研当节奏，勿单凭神煞恐吓' },
      { id: 'b', label: '华盖一冲必定出家或灾祸' },
      { id: 'c', label: '流年与原局无关，神煞不会被触发' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。运限是触发器：神煞要嵌回十神与行程看。华盖被碰，更像钻研/抽离节奏，不是宿命暴击。',
    explainWrong:
      '既不要神煞恐吓，也不要否认触发。记住「触发原局 + 软用法」。',
    surfaces: ['luck'],
  },
];

function dayHash(dayKey: string): number {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * 偶尔：每天最多嵌一个表面（洞见或运势），约 2/3 天会出现。
 */
export function shouldShowInsightGuess(
  surface: InsightGuessSurface,
  dayKey = guessDayKey(),
): boolean {
  const slot = dayHash(dayKey) % 3;
  if (surface === 'insight') return slot === 0;
  return slot === 1;
}

export function pickInsightGuessCard(
  surface: InsightGuessSurface,
  dayKey = guessDayKey(),
): InsightGuessCard | null {
  if (!shouldShowInsightGuess(surface, dayKey)) return null;
  const pool = INSIGHT_GUESS_CARDS.filter((c) => c.surfaces.includes(surface));
  if (!pool.length) return null;
  return pool[dayHash(`${dayKey}:${surface}`) % pool.length]!;
}
