import type { SixGod } from './six-gods.ts';

export function buildQuestionReading(question: string, god: SixGod): string {
  const q = question.trim();
  if (!q) {
    return `落在「${god.name}」，${god.summary} 你可以把它当作眼前这一步的提醒。`;
  }

  const hints: { keys: RegExp; text: string }[] = [
    { keys: /工作|事业|项目|面试|offer/i, text: '如果问的是工作相关，' },
    { keys: /感情|关系|喜欢|分手|复合/i, text: '如果问的是关系相关，' },
    { keys: /今天|明天|这周|最近|短期/i, text: '你问的是短期趋势，' },
    { keys: /要不要|该不该|能不能|是否/i, text: '你在做一个选择，' },
  ];

  const prefix = hints.find((h) => h.keys.test(q))?.text ?? '结合你的问题，';
  return `${prefix}「${god.name}」提示：${god.summary} ${god.advice}`;
}

export function buildProcessExplanation(basisLabel: string, godName: string): string {
  return `本次以 ${basisLabel} 起课，按月 → 日 → 时的顺序推演，最终落在「${godName}」。`;
}

export const LESSON_CHECKLIST = [
  '公历如何转农历',
  '当前时间对应哪个时辰',
  '小六壬如何按月、日、时起课',
  '六神的基础含义',
] as const;
