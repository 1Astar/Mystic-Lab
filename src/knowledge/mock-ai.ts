import type { CardKnowledge, ContextualSection, ReadingContext } from './types.ts';

export type MockAIResult = {
  text: string;
  sections?: ContextualSection[];
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

function isLoveLikesQuestion(context: ReadingContext): boolean {
  return context.questionPattern === 'love_likes' || /喜欢我|是不是喜欢|爱不爱|有感觉/.test(context.question);
}

function buildPositionLead(context: ReadingContext, knowledge: CardKnowledge): string {
  const pos = context.cardPosition;
  const key = context.positionKey;

  if (key === 'obstacle' || pos === '阻碍') {
    return `放在「阻碍」位置，${knowledge.nameCn}不是在否定你的问题本身，而是在指出：通往目标的路上，此刻真正卡住你的因素——可能是外在现实，也可能是内心的旧模式。`;
  }
  if (key === 'situation' || pos === '情况') {
    return `放在「情况」位置，${knowledge.nameCn}映照的是你眼下所处的核心局面：问题长什么样，压力从哪里来。`;
  }
  if (key === 'advice' || pos === '建议') {
    return `放在「建议」位置，${knowledge.nameCn}指向的不是标准答案，而是你可以尝试调整的方向。`;
  }
  if (key === 'past' || pos === '过去') {
    return `放在「过去」位置，${knowledge.nameCn}帮你看见：这件事是如何走到现在的，哪些惯性仍在影响今天。`;
  }
  if (key === 'present' || pos === '现在') {
    return `放在「现在」位置，${knowledge.nameCn}照见的是此刻正在作用的力量——你现在的状态，比「将来会怎样」更值得先看清楚。`;
  }
  if (key === 'future' || pos === '未来') {
    return `放在「未来」位置，${knowledge.nameCn}提示的是：若保持当下路径，最可能展开的方向——不是定数，而是选择的延伸。`;
  }
  if (pos) {
    return `放在${pos}位置，${knowledge.nameCn}需要在这个语境里理解，而不是孤立地看牌义。`;
  }
  return `${knowledge.nameCn}需要结合你当下的问题来读，而不是只背牌义。`;
}

function buildWealthObstacleSwordsTen(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): MockAIResult {
  const q = context.question.trim();

  if (reversed) {
    const text = [
      `你问的是「${q}」。`,
      buildPositionLead(context, knowledge),
      `放在「阻碍」位置，宝剑十逆位不是在说「你永远赚不到钱」，而是在提示：最消耗你的那段「触底期」可能正在过去，但你仍习惯用失败、比较、压力来审判自己。`,
      `财富感往往先卡在心态：一边渴望变富，一边又很难相信路径还来得及。这张牌在问：你能不能先结束「非赢即输」的旧模式，把赚钱从一场自我处刑，改回可积累、可试错的过程？`,
    ].join('\n\n');
    return { text };
  }

  const text = [
    `你问的是「${q}」。`,
    buildPositionLead(context, knowledge),
    `放在「阻碍」位置，宝剑十不是在否定你会不会有钱，而是在指出：你通往财富感的路上，最大的卡点可能是「过度焦虑 + 自我判死刑」。`,
    `你可能一边渴望变富，一边又很容易被失败、比较、压力拖进一种「我是不是没戏了」的状态。`,
    `这张牌提醒你，财富不是先从一个完美答案开始，而是从停止反复攻击自己开始。你需要先结束一种旧模式：把赚钱看成一场非赢即输的审判。`,
  ].join('\n\n');
  return { text };
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

  if (
    isWealthQuestion(q) &&
    isObstaclePosition(context) &&
    knowledge.deckId === 'swords-ten'
  ) {
    return buildWealthObstacleSwordsTen(context, knowledge, reversed);
  }

  if (!q) {
    const text = [
      buildPositionLead(context, knowledge),
      knowledge.oneSentence,
      reversed
        ? '逆位提醒你：阻滞或失衡的部分也值得正视，不必急着用乐观盖过去。'
        : '它邀请你把牌义落回自己的生活经验里，而不是等待外界给一个确定结论。',
    ].join('\n\n');
    return { text };
  }

  if (context.topic === 'work' && isInterviewQuestion(q)) {
    if (knowledge.deckId === 'pentacles-four' && !reversed) {
      const text = [
        `结论：整体偏稳，不像大翻车，但容易因为保守、紧张、求稳而不够出彩。明天更像是「能守住基本盘」，关键是你会不会因为怕说错，而把自己的优势藏起来。`,
        buildPositionLead(context, knowledge),
        `星币四正位放在「${context.cardPosition || '当下'}」位置，说明你目前的状态偏保守、防御、求稳。用于面试问题，它不太像突发好运，也不太像彻底失败，而像「准备了一些东西，但表达时可能收着、不够松弛」。`,
        `牌面在说：你拥有资源（经验、准备、能力），但可能因为太想稳住，身体和表达都不太流动。能稳住，但要避免太收着——你越怕说错，越容易让面试官看不到你的亮点。`,
        `行动：明天不要只追求不出错。主动把一个核心能力讲清楚，最好准备 1 个具体案例：背景、你做了什么、结果是什么。`,
      ].join('\n\n');
      return { text };
    }

    const lead = reversed
      ? `结论：整体不像彻底失败，但表达、准备或亮点呈现上可能有明显卡点——逆位时，真正影响表现的往往是「没讲清楚」而非「没能力」。`
      : `结论：整体偏稳，不像大崩盘，但表现取决于你能不能把准备转化为清晰、有说服力的表达。`;

    const text = [
      lead,
      buildPositionLead(context, knowledge),
      `${knowledge.nameCn}在工作问题里，常常对应面试、方案表达、沟通、简历亮点、一次新的职业机会。它不是温柔安抚型的牌，更像一把刀：帮你切开混乱。`,
      reversed
        ? '逆位时，别急着自我否定。先列出你最想被看见的一个能力，再找一段能证明它的经历——这比反复猜结果更有用。'
        : `结合${position}，牌在问：你最需要讲清楚的一个能力是什么？你有没有一段能证明它的具体经历？`,
      `行动：准备 1 个案例，用「背景—行动—结果」结构讲清楚；别只求不出错，要主动亮出亮点。`,
    ].join('\n\n');
    return { text };
  }

  if (isWealthQuestion(q)) {
    const text = [
      `你问的是「${q}」。`,
      buildPositionLead(context, knowledge),
      isObstaclePosition(context)
        ? `${knowledge.nameCn}在财富议题里落在「阻碍」，重点不是宣判「能不能有钱」，而是指出：当前拖慢你的，可能是焦虑、比较、对失败的预演，或把赚钱看成一场不能输的审判。`
        : `${knowledge.nameCn}在财富议题里，更像在照见你对金钱、价值与安全感的关系——不是简单给「能」或「不能」，而是帮你看清路径上的关键张力。`,
      knowledge.oneSentence,
      reversed
        ? '逆位时，先辨认：哪些是真正的现实限制，哪些是被放大后的灾难化想象。'
        : '把牌当作提醒：财富感往往先来自结束旧模式，而不只是等待一个完美机会。',
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
    buildPositionLead(context, knowledge),
    knowledge.oneSentence,
    reversed
      ? '逆位提醒你：阻滞或失衡的部分也值得正视。把牌当作提醒，而不是判决。'
      : `结合${position}，把牌义落回具体生活：${knowledge.keywords.slice(0, 3).join('、')}，哪一个此刻最能触动你？`,
  ].join('\n\n');

  return { text };
}
