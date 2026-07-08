import type { CardKnowledge, QuestionTopic, ReadingContext } from './types.ts';

const TOPIC_FRAMES: Record<QuestionTopic, [string, string, string]> = {
  work: [
    '我是在等待机会，还是在逃避其他选择？',
    '这件事有没有让我恢复行动力，还是只是消耗？',
    '就算结果不如预期，我能不能把这段经历转化成下一步？',
  ],
  love: [
    '我真正需要的是联结，还是确认？',
    '这段关系里，我有没有说出真实感受？',
    '如果放下执念，我会更靠近自己吗？',
  ],
  study: [
    '我是在成长，还是在用忙碌证明什么？',
    '当前方法是否可持续，还是只在硬撑？',
    '如果放慢一点，我会更清楚真正想学什么吗？',
  ],
  self: [
    '我此刻的感受，想告诉我什么？',
    '我在害怕什么，又在渴望什么？',
    '如果不再追问标准答案，我会怎么选？',
  ],
};

function isInterviewQuestion(q: string): boolean {
  return /面试|应聘|offer|求职|复试/i.test(q);
}

/**
 * 第三层：引导用户自己判断（固定结构 + 按主题/牌义微调）
 */
export function buildSelfReflectionQuestions(
  context: ReadingContext,
  _knowledge: CardKnowledge,
): string[] {
  if (context.topic === 'work' && isInterviewQuestion(context.question)) {
    return [
      '明天面试前，你最需要讲清楚的一个能力是什么？',
      '你有没有一段能证明它的具体经历？',
      '如果结果不如预期，你仍能从这次经历里带走什么？',
    ];
  }

  const [q1, q2, q3] = TOPIC_FRAMES[context.topic];

  return [q1, q2, q3];
}
