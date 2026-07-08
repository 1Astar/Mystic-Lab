/** 提问引导：开放式 vs 封闭式，含示例与一键填入 */
export type QuestionExample = {
  text: string;
  kind: 'open' | 'closed';
};

export const QUESTION_TYPE_GUIDE = {
  open: {
    title: '开放式问题',
    desc: '不只要「是/否」，而是帮你看清局面、阻碍与下一步。牌更容易读出脉络。',
    examples: [
      '我现在需要看清什么？',
      '这件事的阻碍和机会分别是什么？',
      '我该如何更好地准备这次面试？',
      '我通往财富感的路上，最大的卡点是什么？',
    ] satisfies string[],
  },
  closed: {
    title: '封闭式问题',
    desc: '要一个明确答案，如「会不会」「能不能」。可以直接占问，也可换成开放式角度。',
    examples: [
      '我大概什么时候能找到新工作？',
      '明天面试顺不顺利？',
      '他喜不喜欢我？',
      '我能不能成为一个有钱的人？',
    ] satisfies string[],
  },
} as const;

export const QUESTION_STARTER_EXAMPLES: QuestionExample[] = [
  { text: '我现在需要看清什么？', kind: 'open' },
  { text: '这件事的阻碍和机会分别是什么？', kind: 'open' },
  { text: '我该如何调整当下的节奏？', kind: 'open' },
  { text: '我大概什么时候能找到新工作？', kind: 'closed' },
  { text: '他喜不喜欢我？', kind: 'closed' },
  { text: '明天面试顺不顺利？', kind: 'closed' },
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
