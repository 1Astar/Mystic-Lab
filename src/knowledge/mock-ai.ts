import type { CardKnowledge, ContextualSection, ReadingContext } from './types.ts';

export type MockAIResult = {
  text: string;
  sections?: ContextualSection[];
};

function isInterviewQuestion(q: string): boolean {
  return /面试|应聘|offer|求职|复试/i.test(q);
}

function isLoveLikesQuestion(context: ReadingContext): boolean {
  return context.questionPattern === 'love_likes' || /喜欢我|是不是喜欢|爱不爱|有感觉/.test(context.question);
}

function buildLoveLikesSections(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): ContextualSection[] {
  const who = context.personName ?? '对方';
  const q = context.question.trim();
  const kw = knowledge.keywords.slice(0, 3).join('、');

  const tendency = reversed
    ? `你问的是「${q}」。${knowledge.nameCn}逆位时，这段关系里更明显的可能是距离感、犹豫或尚未说清的防御——不是「完全没感觉」，而是情感还在摇摆，或${who}自己也还没整理清楚。`
    : `你问的是「${q}」。${knowledge.nameCn}正位显示，${who}对你有靠近的意愿或好奇——可能表现为愿意回应、留下话题、对你的情绪有反应。牌里的关键词是${kw}，这更像情感倾向，而不是非黑即白的判决。`;

  const signals = `如果他喜欢你，常见信号包括：主动延续对话、愿意为你调整时间、对你的细节有记忆、在不舒服时仍愿意解释而不是消失。${knowledge.nameCn}提醒你：别只看一次热情，要看是否稳定、是否愿意靠近。`;

  const unclear = reversed
    ? `关系不明朗，可能因为表达方式克制、现实距离、害怕承担，或者${who}也还没看清自己的感觉。逆位暗示：猜测会越猜越累，观察比脑补更有用。`
    : `关系还没明朗，不一定代表「不喜欢」。有时是节奏不同、怕受伤、或还在观察。${knowledge.oneSentence}`;

  const confirm = `与其一直猜，可以观察他是否稳定、主动、愿意为你调整；或者找一个轻一点的问题试探关系温度。你也可以问自己：就算答案暂时不明，我仍想靠近吗？`;

  return [
    { title: '情感倾向', body: tendency },
    { title: '喜欢的信号', body: signals },
    { title: '不明朗的原因', body: unclear },
    { title: '你可以怎么确认', body: confirm },
  ];
}

/**
 * P1：模拟第二层 AI 解读。P3 替换为真实 LLM 调用，接口保持不变。
 */
export function mockAIInterpretation(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): MockAIResult {
  const q = context.question.trim();
  const position = context.cardPosition ? `「${context.cardPosition}」` : '这一位置';

  if (isLoveLikesQuestion(context)) {
    const sections = buildLoveLikesSections(context, knowledge, reversed);
    return {
      text: sections.map((s) => `${s.title}\n${s.body}`).join('\n\n'),
      sections,
    };
  }

  if (!q) {
    const text = [
      `就${position}而言，${knowledge.nameCn}不像是在给你一个非黑即白的答案。`,
      knowledge.oneSentence,
      reversed
        ? '逆位提醒你：阻滞或失衡的部分也值得正视，不必急着用乐观盖过去。'
        : '它邀请你把牌义落回自己的生活经验里，而不是等待外界给一个确定结论。',
    ].join('\n\n');
    return { text };
  }

  if (context.topic === 'work' && isInterviewQuestion(q)) {
    const lead = reversed
      ? `你问的是「${q}」。这张牌不太像是在说结果一定顺或不顺——逆位时，它更像在提醒你：表达上的卡顿、准备不足，或某个你没讲清楚的亮点，可能比「运气」更影响表现。`
      : `你问的是「${q}」。这张牌不太像是在说结果一定顺或不顺，它更像是在提醒你：明天真正影响表现的，是表达清不清楚、逻辑够不够利落、有没有把自己的判断讲出来。`;

    const text = [
      lead,
      `${knowledge.nameCn}在工作问题里，常常对应面试、方案表达、沟通、简历亮点、一次新的职业机会。它不是温柔安抚型的牌，更像一把刀：帮你切开混乱。`,
      reversed
        ? '逆位时，别急着自我否定。先列出你最想被看见的一个能力，再找一段能证明它的经历——这比反复猜结果更有用。'
        : `结合${position}，牌在问：明天之前，你最需要讲清楚的一个能力是什么？你有没有一段能证明它的具体经历？`,
    ].join('\n\n');
    return { text };
  }

  const topicOpen: Record<ReadingContext['topic'], string> = {
    work: `你问的是「${q}」。就工作方向而言，${knowledge.nameCn}不太像是在宣判结果，而是在指出当下最值得你正视的切口。`,
    love: `你问的是「${q}」。在感情议题里，${knowledge.nameCn}更像一面镜子：照见关系里的倾向、信号和阻碍，而不是替对方做绝对宣判。`,
    study: `你问的是「${q}」。学业上，${knowledge.nameCn}指向方法与心态——不是「能不能」，而是「怎样走得更稳」。`,
    self: `你问的是「${q}」。${knowledge.nameCn}回到你自身：牌在问的不是外界标准，而是你内心真正认同的方向。`,
  };

  const text = [
    topicOpen[context.topic],
    knowledge.oneSentence,
    reversed
      ? '逆位提醒你：阻滞或失衡的部分也值得正视。把牌当作提醒，而不是判决。'
      : `结合${position}，把牌义落回具体生活：${knowledge.keywords.slice(0, 3).join('、')}，哪一个此刻最能触动你？`,
  ].join('\n\n');

  return { text };
}
