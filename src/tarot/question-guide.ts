/** 提问引导：开放式 vs 封闭式，含示例、对比与背景提示 */
export type QuestionExample = {
  text: string;
  kind: 'open' | 'closed';
};

export type QuestionComparison = {
  closed: string;
  open: string;
  note: string;
};

export const QUESTION_TYPE_GUIDE = {
  open: {
    title: '开放式问题',
    desc: '帮你看清局面、阻碍与下一步，牌更容易读出脉络。',
    pros: [
      '更容易读出局面、阻碍与可行动的方向',
      '不局限于是/否，解读更有层次',
      '适合关系、职业、选择等仍在变化的事',
    ],
    cons: [
      '答案通常不是「一句话定论」',
      '需要你结合牌意自己理解与整合',
    ],
  },
  closed: {
    title: '封闭式问题',
    desc: '要一个明确答案，如「会不会」「能不能」。可以直接占问，也可换成开放式角度。',
    pros: [
      '问题清晰，适合心里已有一个具体疑问',
      '适合「会不会 / 能不能 / 顺不顺」类决断',
      '占问目标明确，容易聚焦',
    ],
    cons: [
      '牌难给出精确时间或绝对结论',
      '容易期待非黑即白，反而更焦虑',
      '复杂局面下信息可能显得「不够用」',
    ],
  },
} as const;

/** 封闭式 → 开放式对比教学 */
export const QUESTION_COMPARISONS: QuestionComparison[] = [
  {
    closed: '他喜不喜欢我？',
    open: '这段关系里，我需要看清什么？',
    note: '感情不只「是/否」，先看局面与卡点',
  },
  {
    closed: '明天面试顺不顺利？',
    open: '我该如何更好地准备这次面试？',
    note: '把「结果」换成「行动与准备」',
  },
  {
    closed: '我大概什么时候能找到新工作？',
    open: '找工作的阻碍和机会分别是什么？',
    note: '时间难断，先看阻碍与机会',
  },
  {
    closed: '我能不能成为一个有钱的人？',
    open: '我通往财富感的路上，最大的卡点是什么？',
    note: '「能不能」换成「卡点在哪、怎么调整」',
  },
];

export const QUESTION_STARTER_EXAMPLES: QuestionExample[] = [
  { text: '我现在需要看清什么？', kind: 'open' },
  { text: '这件事的阻碍和机会分别是什么？', kind: 'open' },
  { text: '我该如何调整当下的节奏？', kind: 'open' },
  { text: '我大概什么时候能找到新工作？', kind: 'closed' },
  { text: '他喜不喜欢我？', kind: 'closed' },
  { text: '明天面试顺不顺利？', kind: 'closed' },
];

/** 提问页背景虚化示例 */
export const QUESTION_BG_HINTS: QuestionExample[] = [
  { text: '我现在需要看清什么？', kind: 'open' },
  { text: '阻碍和机会分别是什么？', kind: 'open' },
  { text: '我该如何更好地准备？', kind: 'open' },
  { text: '最大的卡点是什么？', kind: 'open' },
  { text: '我该如何调整当下的节奏？', kind: 'open' },
  { text: '他喜不喜欢我？', kind: 'closed' },
  { text: '明天面试顺不顺利？', kind: 'closed' },
  { text: '什么时候能找到新工作？', kind: 'closed' },
  { text: '能不能成为有钱的人？', kind: 'closed' },
  { text: '要不要接受这份 offer？', kind: 'closed' },
];

export function isClosedQuestion(text: string): boolean {
  const q = text.trim();
  if (!q) return false;
  return /会不会|能不能|是不是|该不该|顺不顺|喜不喜欢|要不要|可不可以|能否|有没有可能|什么时候|何时|多久|哪一天|吗[？?]?$/.test(q);
}

export function questionKindLabel(text: string): 'open' | 'closed' | null {
  const q = text.trim();
  if (q.length < 2) return null;
  return isClosedQuestion(q) ? 'closed' : 'open';
}
