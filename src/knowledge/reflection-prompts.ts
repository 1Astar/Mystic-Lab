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

function isWealthQuestion(q: string): boolean {
  return /有钱|财富|变富|赚钱|财运|富裕|财务自由|发财|经济自由|成为.*富/.test(q);
}

function isObstaclePosition(context: ReadingContext): boolean {
  return context.positionKey === 'obstacle' || context.cardPosition === '阻碍';
}

/**
 * 第三层：引导用户自己判断（固定结构 + 按主题/牌义微调）
 */
export function buildSelfReflectionQuestions(
  context: ReadingContext,
  _knowledge: CardKnowledge,
): string[] {
  if (context.questionPattern === 'love_likes' || /喜欢我|是不是喜欢/.test(context.question)) {
    return [
      '他哪些行为让我觉得被在意，哪些只是礼貌？',
      '如果答案暂时不明，我仍想靠近吗？',
      '我可以用什么轻一点的方式试探关系温度？',
    ];
  }

  if (context.topic === 'work' && isInterviewQuestion(context.question)) {
    return [
      '明天面试前，你最需要讲清楚的一个能力是什么？',
      '你有没有一段能证明它的具体经历？',
      '如果结果不如预期，你仍能从这次经历里带走什么？',
    ];
  }

  if (
    isWealthQuestion(context.question) &&
    isObstaclePosition(context) &&
    context.selectedCardId === 'swords-ten'
  ) {
    return [
      '如果把赚钱看成一场非赢即输的审判，你最先想放下的是哪一句自我批评？',
      '最近哪一次「还没开始就先判自己没戏」，其实拖慢了你？',
      '若允许自己慢慢积累，第一步可以小到什么程度？',
    ];
  }

  if (isWealthQuestion(context.question)) {
    return [
      '我对「有钱」的定义，是来自比较，还是来自自己的安全感？',
      '当前路径里，哪一步其实可以更小、更现实地开始？',
      '如果先结束一种拖慢我的旧模式，我会先改哪一个念头？',
    ];
  }

  const [q1, q2, q3] = TOPIC_FRAMES[context.topic];

  return [q1, q2, q3];
}
