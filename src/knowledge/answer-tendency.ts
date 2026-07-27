import type { AnswerTendency, CardKnowledge, ReadingContext } from './types.ts';

function questionAnchor(q: string): string {
  const lines = q
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length >= 3 || /^\s*\d+[.、]/.test(q)) return '你问的这几件事';
  if (q.length > 36) return `「${q.slice(0, 36)}…」`;
  return `「${q}」`;
}

function isInterviewQuestion(q: string): boolean {
  return /面试|应聘|offer|求职|复试/i.test(q);
}

function isTomorrowInterview(q: string): boolean {
  return /明天.*面试|面试.*明天/i.test(q);
}

function isPresentPosition(context: ReadingContext): boolean {
  return (
    context.positionKey === 'present' ||
    context.cardPosition === '现在' ||
    context.cardPosition === '当下'
  );
}

function buildPentaclesFourInterview(
  context: ReadingContext,
  reversed: boolean,
): AnswerTendency {
  if (reversed) {
    return {
      overall: '偏卡，需要调整',
      tendency: '中性偏负',
      oneLiner:
        '明天面试不太像完全失控，但容易因为紧张、过度防守或怕说错，而把自己的优势藏起来。',
      actionTip:
        '别只想着「别出错」。提前写好 1 个最能代表你的案例，练习用「背景—行动—结果」讲清楚。',
    };
  }

  const tomorrow = isTomorrowInterview(context.question);
  const oneLiner = tomorrow
    ? '明天面试大概率不会很糟，但能不能留下好印象，取决于你能不能把准备好的能力讲出来，而不是藏在心里。'
    : '这次面试整体偏稳，不像大翻车，但容易因为保守、紧张、求稳而不够出彩。关键是主动展示亮点。';

  return {
    overall: '偏稳，但偏保守',
    tendency: '中性偏正',
    oneLiner,
    actionTip:
      '明天不要只追求不出错。主动把一个核心能力讲清楚，最好准备 1 个具体案例：背景、你做了什么、结果是什么。',
  };
}

function buildGenericTendency(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): AnswerTendency {
  const kw = knowledge.keywords.slice(0, 2).join('、');
  const overall = reversed ? '偏卡，需要调整' : '有机会，但需看清';
  const tendency = reversed ? '中性偏负' : '中性偏正';

  return {
    overall,
    tendency,
    oneLiner: reversed
      ? `就${questionAnchor(context.question.trim())}而言，${knowledge.nameCn}逆位提示：当前阻滞或失衡的部分值得正视，别急着要一个非黑即白的答案。`
      : `就${questionAnchor(context.question.trim())}而言，${knowledge.nameCn}指向${kw}——牌在帮你看清局面，而不是替你做绝对宣判。`,
    actionTip: reversed
      ? '先辨认：哪些是真实限制，哪些是放大的焦虑。把下一步缩到一个你能今天就开始的小行动。'
      : '把牌当作提醒而非判决。问自己：若只调整一件事，什么最能改变当下局面？',
  };
}

/** 生成「你的答案倾向」模块；无提问时返回 null */
export function buildAnswerTendency(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): AnswerTendency | null {
  const q = context.question.trim();
  if (!q) return null;

  if (knowledge.deckId === 'pentacles-four' && isInterviewQuestion(q)) {
    return buildPentaclesFourInterview(context, reversed);
  }

  if (isInterviewQuestion(q)) {
    return {
      overall: reversed ? '偏卡，表达需补强' : '偏稳，关键在表达',
      tendency: reversed ? '中性偏负' : '中性偏正',
      oneLiner: reversed
        ? `就${questionAnchor(q)}而言，整体不像彻底失败，但表达、准备或亮点呈现上可能有明显卡点。`
        : `就${questionAnchor(q)}而言，整体偏稳，不像大崩盘，但表现取决于你能不能把准备转化为清晰的表达。`,
      actionTip:
        '准备 1 个最能代表你的案例，用「背景—你做了什么—结果」讲清楚；别只求不出错，要主动亮出亮点。',
    };
  }

  return buildGenericTendency(context, knowledge, reversed);
}

export function buildVisualQuestionBridge(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
  visualOverview?: string,
): string | undefined {
  const q = context.question.trim();
  if (!q) return undefined;

  if (knowledge.deckId === 'pentacles-four' && isInterviewQuestion(q)) {
    if (reversed) {
      return `星币四逆位提醒：你可能不是没准备，而是太怕失控，反而把优势收得太紧，面试官未必看得见。`;
    }
    const posHint = isPresentPosition(context)
      ? '放在「当下」位置，说明你目前的状态偏保守、防御、求稳。'
      : '';
    return `${posHint}星币四提醒：你不是没准备，而是可能太想稳住，导致表达不够放开。这张牌不是「冲刺爆发型」，而是「守住基本盘型」——能稳住，但要避免太收着。`;
  }

  const orient = reversed ? '逆位' : '正位';
  const overview =
    visualOverview?.trim() ||
    knowledge.visualOverview?.trim() ||
    knowledge.oneSentence.trim();

  const pos = context.cardPosition?.trim();
  const isObstacle =
    context.positionKey === 'obstacle' || pos === '阻碍' || (pos?.includes('阻碍') ?? false);

  if (isObstacle) {
    const workHint =
      context.topic === 'work'
        ? reversed
          ? `阻碍位上，${knowledge.nameCn}${orient}更像提醒：理想化/情绪决策的副作用，或「感觉对了」却未核实的风险。`
          : `阻碍位上，${knowledge.nameCn}${orient}要读成卡点：跟着感觉走、理想化机会、被聊得来吸引——『务必核实，别只凭感觉。』`
        : `阻碍位上，${knowledge.nameCn}${orient}指出真正卡住你的模式，勿按顺风好牌读。`;
    return [
      workHint,
      `画面对照：${overview}`,
    ].join('');
  }

  const topicHint = topicBridgeHint(context, knowledge, reversed);
  const posLead = pos
    ? `放在「${pos}」位读【${knowledge.nameCn}${orient}】。`
    : `【${knowledge.nameCn}${orient}】`;

  return [
    posLead,
    `整体画面：${overview}`,
    topicHint,
  ]
    .filter(Boolean)
    .join('');
}

function isTimingQuestion(q: string): boolean {
  return /什么时候|何时|哪天|多久|还要等多久|日期|几点/i.test(q);
}

function topicBridgeHint(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): string {
  const q = context.question.trim();
  const topic = context.topic;
  const anchors = knowledge.keywords.slice(0, 2).join('、') || knowledge.nameCn;
  const gist = knowledge.oneSentence.trim().replace(/[。！？.!?]+$/, '');
  const timingNote = isTimingQuestion(q)
    ? '塔罗很少给出准确日历日期，更值得看的是当下局面与可改的一步。'
    : '';

  if (topic === 'work') {
    if (reversed) {
      return [
        `放到求职/工作语境里：这张${knowledge.nameCn}逆位更贴「${anchors}」——`,
        gist ? `核心提醒偏「${gist}」。` : '',
        '先检视方法与节奏是否在绕弯或透支，再决定下一步。',
        timingNote,
      ]
        .filter(Boolean)
        .join('');
    }
    return [
      `放到求职/工作语境里：这张${knowledge.nameCn}正位带着「${anchors}」——`,
      gist ? `牌义落点是「${gist}」。` : '',
      '对照你的提问，更该问自己：眼前局面缺的是什么、你能动的那一寸在哪。',
      timingNote,
    ]
      .filter(Boolean)
      .join('');
  }

  if (topic === 'love') {
    return reversed
      ? `放到感情语境里：结合「${anchors}」，留意回避、隐瞒或迂回——真诚比「赢一招」更重要。`
      : `放到感情语境里：结合「${anchors}」，留意接近与保留的部分——意图与时机往往藏在画面细节里。`;
  }

  if (topic === 'study') {
    return reversed
      ? `放到学业语境里：围绕「${anchors}」看方法与节奏是否需要调整，别只靠走捷径。`
      : `放到学业语境里：围绕「${anchors}」辨认你带走的是真正有用的准备，还是只在搬走焦虑。`;
  }

  return reversed
    ? `整幅热点合起来读：阻滞往往落在「${anchors}」——先辨认你在回避什么。`
    : `整幅热点合起来读：它们共同指向「${anchors}」——你正在选择什么路径、留下什么。`;
}
