import type { CardKnowledge, ReadingContext } from './types.ts';

function isInterviewQuestion(q: string): boolean {
  return /面试|应聘|offer|求职|复试/i.test(q);
}

function isRelationshipQuestion(q: string): boolean {
  return /喜欢|在一起|分手|复合|表白|暗恋|他|她|感情|恋爱/i.test(q);
}

/**
 * P1：模拟第二层 AI 解读。P3 替换为真实 LLM 调用，接口保持不变。
 */
export function mockAIInterpretation(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): string {
  const q = context.question.trim();
  const position = context.cardPosition ? `「${context.cardPosition}」` : '这一位置';

  if (!q) {
    return [
      `就${position}而言，${knowledge.nameCn}不像是在给你一个非黑即白的答案。`,
      knowledge.oneSentence,
      reversed
        ? '逆位提醒你：阻滞或失衡的部分也值得正视，不必急着用乐观盖过去。'
        : '它邀请你把牌义落回自己的生活经验里，而不是等待外界给一个确定结论。',
    ].join('\n\n');
  }

  if (context.topic === 'work' && isInterviewQuestion(q)) {
    const lead = reversed
      ? `你问的是「${q}」。这张牌不太像是在说结果一定顺或不顺——逆位时，它更像在提醒你：表达上的卡顿、准备不足，或某个你没讲清楚的亮点，可能比「运气」更影响表现。`
      : `你问的是「${q}」。这张牌不太像是在说结果一定顺或不顺，它更像是在提醒你：明天真正影响表现的，是表达清不清楚、逻辑够不够利落、有没有把自己的判断讲出来。`;

    return [
      lead,
      `${knowledge.nameCn}在工作问题里，常常对应面试、方案表达、沟通、简历亮点、一次新的职业机会。它不是温柔安抚型的牌，更像一把刀：帮你切开混乱。`,
      reversed
        ? '逆位时，别急着自我否定。先列出你最想被看见的一个能力，再找一段能证明它的经历——这比反复猜结果更有用。'
        : `结合${position}，牌在问：明天之前，你最需要讲清楚的一个能力是什么？你有没有一段能证明它的具体经历？`,
    ].join('\n\n');
  }

  if (context.topic === 'love' && isRelationshipQuestion(q)) {
    return [
      `你问的是「${q}」。${knowledge.nameCn}在感情里很少给「成」或「不成」的判决，它更像在照见你此刻的真实需要。`,
      knowledge.oneSentence,
      reversed
        ? '逆位暗示：你可能在回避某个感受，或用猜测代替沟通。诚实不一定立刻改变结果，但会让你更靠近自己。'
        : '正位邀请你：先分辨你想靠近的是人，还是想得到确认。弄清这一点，比急着要答案更重要。',
    ].join('\n\n');
  }

  const topicOpen: Record<ReadingContext['topic'], string> = {
    work: `你问的是「${q}」。就工作方向而言，${knowledge.nameCn}不太像是在宣判结果，而是在指出当下最值得你正视的切口。`,
    love: `你问的是「${q}」。在感情议题里，${knowledge.nameCn}更像一面镜子：照见你的需要、犹豫，或还没说出口的部分。`,
    study: `你问的是「${q}」。学业上，${knowledge.nameCn}指向方法与心态——不是「能不能」，而是「怎样走得更稳」。`,
    self: `你问的是「${q}」。${knowledge.nameCn}回到你自身：牌在问的不是外界标准，而是你内心真正认同的方向。`,
  };

  return [
    topicOpen[context.topic],
    knowledge.oneSentence,
    reversed
      ? '逆位提醒你：阻滞或失衡的部分也值得正视。把牌当作提醒，而不是判决。'
      : `结合${position}，把牌义落回具体生活：${knowledge.keywords.slice(0, 3).join('、')}，哪一个此刻最能触动你？`,
  ].join('\n\n');
}
