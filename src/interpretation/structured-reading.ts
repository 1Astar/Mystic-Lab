import type {
  CardKnowledge,
  ContextualSection,
  ElementMapping,
  QuestionAnswer,
  ReadingContext,
} from '../knowledge/types.ts';
import { getVisualHotspots, getVisualOverview } from '../knowledge/registry.ts';
import {
  classifySubQuestion,
  splitUserQuestions,
  type SubQuestionIntent,
} from './question-parts.ts';

/** 结合问题的固定四段结构 */
export const STRUCTURED_SECTION_TITLES = [
  '热点整体解读',
  '情境表现',
  '可操作建议',
  '心理疏导',
] as const;

export type StructuredSectionTitle = (typeof STRUCTURED_SECTION_TITLES)[number];

export function sectionsToPlainText(sections: ContextualSection[]): string {
  return sections.map((s) => `${s.title}\n${s.body}`).join('\n\n');
}

function stripFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fence ? fence[1].trim() : trimmed;
}

export type ParsedStructuredReading = {
  sections: ContextualSection[];
  actionTags: string[];
  elementMappings: ElementMapping[];
  followUps: string[];
  questionAnswers: QuestionAnswer[];
  plainText: string;
};

function parseElementMappings(raw: unknown, deckId?: string): ElementMapping[] {
  if (!Array.isArray(raw)) return [];
  const hotspotMeanings = new Map<string, string>();
  if (deckId) {
    for (const h of getVisualHotspots(deckId)?.hotspots ?? []) {
      hotspotMeanings.set(h.label, h.meaning);
    }
  }
  const out: ElementMapping[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as {
      label?: unknown;
      title?: unknown;
      body?: unknown;
      originalMeaning?: unknown;
      meaning?: unknown;
    };
    const label = String(row.label ?? '').trim();
    const body = String(row.body ?? '').trim();
    if (!label || !body) continue;
    const title =
      String(row.title ?? '').trim() || `现实状况：「${label}」意味着什么？`;
    const originalMeaning =
      String(row.originalMeaning ?? row.meaning ?? '').trim() ||
      hotspotMeanings.get(label) ||
      '';
    out.push({ label, title, originalMeaning, body });
  }
  return out.slice(0, 6);
}

function parseFollowUps(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => String(t).trim())
    .filter((t) => t.length >= 4)
    .slice(0, 3);
}

function parseQuestionAnswers(raw: unknown): QuestionAnswer[] {
  if (!Array.isArray(raw)) return [];
  const out: QuestionAnswer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as {
      question?: unknown;
      insight?: unknown;
      answer?: unknown;
      action?: unknown;
      body?: unknown;
    };
    const question = String(row.question ?? '').trim();
    const insight = String(row.insight ?? row.answer ?? row.body ?? '').trim();
    if (!question || !insight) continue;
    const action = String(row.action ?? '').trim() || undefined;
    out.push({ question, insight, action });
  }
  return out.slice(0, 8);
}

/** 解析 LLM JSON；支持四段 + 元素映射 + 追问 + 逐条问答 */
export function parseStructuredReading(
  raw: string,
  options?: { deckId?: string },
): ParsedStructuredReading {
  const text = stripFence(raw);
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonText = start >= 0 && end > start ? text.slice(start, end + 1) : text;
    const parsed = JSON.parse(jsonText) as {
      conclusion?: unknown;
      overview?: unknown;
      situation?: unknown;
      advice?: unknown;
      comfort?: unknown;
      actionTags?: unknown;
      sections?: unknown;
      elementMappings?: unknown;
      followUps?: unknown;
      questionAnswers?: unknown;
    };

    let sections: ContextualSection[] = [];
    if (Array.isArray(parsed.sections)) {
      for (const item of parsed.sections) {
        if (!item || typeof item !== 'object') continue;
        const row = item as { title?: unknown; body?: unknown };
        const title = String(row.title ?? '').trim();
        const body = String(row.body ?? '').trim();
        if (title && body) sections.push({ title, body });
      }
    }

    const questionAnswers = parseQuestionAnswers(parsed.questionAnswers);

    if (sections.length < 3) {
      const overviewBody = String(parsed.overview ?? parsed.conclusion ?? '').trim();
      const mapped: ContextualSection[] = [
        { title: '热点整体解读', body: overviewBody },
        { title: '情境表现', body: String(parsed.situation ?? '').trim() },
        { title: '可操作建议', body: String(parsed.advice ?? '').trim() },
        { title: '心理疏导', body: String(parsed.comfort ?? '').trim() },
      ].filter((s) => s.body.length > 0);
      if (mapped.length >= 2) sections = mapped;
    }

    // 若只有 questionAnswers，补一条总览式 section 便于旧 UI
    if (sections.length === 0 && questionAnswers.length) {
      sections = questionAnswers.map((a, i) => ({
        title: `【提问 ${i + 1}】${a.question}`,
        body: a.action ? `${a.insight}\n\n行动：${a.action}` : a.insight,
      }));
    }

    const actionTags = Array.isArray(parsed.actionTags)
      ? parsed.actionTags
          .map((t) => String(t).trim())
          .filter((t) => t.length > 0)
          .slice(0, 4)
      : [];

    const elementMappings = parseElementMappings(
      parsed.elementMappings,
      options?.deckId,
    );
    const followUps = parseFollowUps(parsed.followUps);

    if (sections.length >= 2 || questionAnswers.length >= 1) {
      return {
        sections,
        actionTags,
        elementMappings,
        followUps,
        questionAnswers,
        plainText: [
          questionAnswers.length
            ? questionAnswers
                .map(
                  (a, i) =>
                    `【提问 ${i + 1}】${a.question}\n${a.insight}${
                      a.action ? `\n行动：${a.action}` : ''
                    }`,
                )
                .join('\n\n')
            : '',
          sectionsToPlainText(sections),
          ...elementMappings.map(
            (m) =>
              `${m.title}\n牌面原意：${m.originalMeaning || '—'}\n场景映射：${m.body}`,
          ),
        ]
          .filter(Boolean)
          .join('\n\n'),
      };
    }
  } catch {
    /* fall through */
  }

  const plain = text.trim();
  return {
    sections: [{ title: '热点整体解读', body: plain }],
    actionTags: [],
    elementMappings: [],
    followUps: [],
    questionAnswers: [],
    plainText: plain,
  };
}

function sceneMeaning(knowledge: CardKnowledge, topic: ReadingContext['topic']): string {
  if (topic === 'work') return knowledge.workMeaning;
  if (topic === 'love') return knowledge.loveMeaning;
  if (topic === 'study') return knowledge.studyMeaning;
  return knowledge.selfMeaning;
}

function backgroundLine(context: ReadingContext): string {
  const bg = context.background?.trim();
  return bg ? `你补充的背景是：${bg}。` : '';
}

function topicLabel(topic: ReadingContext['topic']): string {
  if (topic === 'work') return '求职/工作';
  if (topic === 'love') return '感情';
  if (topic === 'study') return '学业';
  return '自我';
}

/** 把热点牌意翻译成问题场景里的现实说法（规则版） */
export function buildElementMappings(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): ElementMapping[] {
  const visual = getVisualHotspots(knowledge.deckId);
  if (!visual?.hotspots.length) return [];

  const q = context.question.trim() || '你的问题';
  const topic = context.topic;

  return visual.hotspots.slice(0, 4).map((h) => {
    const title = `现实状况：「${h.label}」意味着什么？`;
    const body = mapHotspotToScene(h.label, h.meaning, q, topic, knowledge.nameCn, reversed);
    return { label: h.label, title, originalMeaning: h.meaning, body };
  });
}

function mapHotspotToScene(
  label: string,
  meaning: string,
  question: string,
  topic: ReadingContext['topic'],
  nameCn: string,
  reversed: boolean,
): string {
  const core = meaning.replace(/[。！？.!?]+$/, '');
  const blob = `${label}${meaning}`;

  if (topic === 'work') {
    let hook: string;
    if (/资源|取舍|拿走|有限|偷走|怀里/.test(blob)) {
      hook =
        '你手里真正拿得稳的机会/条件可能比表面少——面试看着顺、口头承诺却缩水时，要当「筹码有限」来处理：多备选，别押一家。';
    } else if (/窗口|营帐|察觉|时机|尚未/.test(blob)) {
      hook =
        '信息差或窗口期还在：对方没变卦、岗位没关上之前，跟进、确认、挖内推都比干等「哪天一定成」更有用。';
    } else if (/策略|迂回|潜行|路径|光明/.test(blob)) {
      hook =
        '常规海投可能反馈慢——更适合换渠道（内推、猎头、熟人）、换问法，用侧面推进代替死磕同一扇门。';
    } else if (/留下|未用|不必|两把/.test(blob)) {
      hook =
        '你还有没动用的资源：旧人脉、未跟进的投递、可展示却没讲清的能力。别只盯眼前这一条线。';
    } else if (/束缚|蒙眼|困|缝隙|绳/.test(blob)) {
      hook =
        '感觉被卡住时，先分清「真限制」和「想象限制」：简历、渠道、话术里哪一处其实还能松绑。';
    } else {
      hook = `求职里对应留意：${core}——它更像在提示你看清局面，而不是给你一个准日子。`;
    }
    return [
      `对照你的问题「${question}」：`,
      hook,
      reversed ? '逆位时更要警惕绕弯、信息打折或自我设限。' : '',
    ]
      .filter(Boolean)
      .join('');
  }

  if (topic === 'love') {
    let hook: string;
    if (/靠近|回应|热情|意愿/.test(blob)) {
      hook = '看对方是否稳定靠近、愿意回应，而不是一次热情。';
    } else if (/距离|防御|犹豫|回避|隐瞒/.test(blob)) {
      hook = '关系里可能有观望或防御——少脑补，多观察行动是否对得上话。';
    } else {
      hook = `感情里对应留意「${core}」如何出现在相处节奏里。`;
    }
    return `对照「${question}」：${hook}`;
  }

  if (topic === 'study') {
    return `对照「${question}」：${core}——落到复习/方法上，问自己缺的是时间、方法，还是节奏。${
      reversed ? '逆位时优先调整路径，别只加时长。' : ''
    }`;
  }

  return `对照「${question}」：${nameCn}里「${label}」的画面指向「${core}」。问自己：它此刻对应生活里的哪一块？`;
}

export function buildFollowUpSuggestions(
  context: ReadingContext,
  knowledge: CardKnowledge,
): string[] {
  if (context.topic === 'work') {
    return [
      '我想知道面试时要注意什么？',
      '我目前海投还是定点投更好？',
      '接下来一两周我该优先推进哪条线？',
    ];
  }
  if (context.topic === 'love') {
    return [
      '对方近期更可能靠近还是观望？',
      '我该主动一点还是先稳住节奏？',
      '这段关系里最需要看清的信号是什么？',
    ];
  }
  if (context.topic === 'study') {
    return [
      '复习方法上最该先改哪一点？',
      '时间不够时怎么取舍优先级？',
      '心态焦虑时怎么稳住节奏？',
    ];
  }
  return [
    `结合${knowledge.nameCn}，我下一步最小的行动是什么？`,
    '我最容易误判的点是什么？',
    '这周只改一件事的话改什么？',
  ];
}

function buildSubQuestionAnswer(
  intent: SubQuestionIntent,
  subQ: string,
  knowledge: CardKnowledge,
  reversed: boolean,
  context: ReadingContext,
): QuestionAnswer {
  const name = knowledge.nameCn;
  const orient = reversed ? '逆位' : '正位';
  const kw = knowledge.keywords.slice(0, 2).join('、') || name;
  const work = knowledge.workMeaning.replace(/[。！？.!?]+$/, '');
  const pos = context.cardPosition ? `（牌阵位置：${context.cardPosition}）` : '';

  switch (intent) {
    case 'reason':
      return {
        question: subQ,
        insight: reversed
          ? `【${name}${orient}】${pos}更像在说：你想离开/改变的冲动，混杂着阻滞、失衡与自我怀疑——不只是外面有多糟，也是内在能量在报警。关键词偏「${kw}」。`
          : `【${name}${orient}】${pos}指向：真正推动你的，常常是「${kw}」带来的身心状态，而不只是某一条外部条款。${work}。`,
        action: '先写清「我最想摆脱的是什么感觉」——比先写离职理由清单更接近真相。',
      };
    case 'leave_path':
      return {
        question: subQ,
        insight: reversed
          ? `若按「离开」路径走，【${name}${orient}】提醒：过渡期可能有反复、理想化或信息差。别把三个月当成一步登天，先看恢复与核实。`
          : `若按「离开」路径走，【${name}${orient}】更像「探索/释放」而不是立刻落地。前段可能偏松弛或冲动，中后段才进入真实比对。关键词：「${kw}」。`,
        action: '离职前先设底线：现金流能撑多久、最低可接受条件、口头承诺必须书面化。',
      };
    case 'stay_path':
      return {
        question: subQ,
        insight: reversed
          ? `若选择留下，【${name}${orient}】提示：舒适未必等于安全。可能用熟悉感麻痹真实需求，三个月后旧纠结仍在。`
          : `若选择留下，【${name}${orient}】偏「熟悉、温情、可预测」——情绪可能稳住，但成长感未必跟上。关键词：「${kw}」。`,
        action: '留下也要立一个「三个月后可核对的成长指标」，避免温水煮青蛙。',
      };
    case 'risk':
      return {
        question: subQ,
        insight: `结合【${name}${orient}】，最该防的是：情绪化拍板、舒适区幻觉、以及「聊得来≠条件靠谱」的信息差。牌义侧重点：「${kw}」。`,
        action: '重大决定冷却 48 小时；谈薪/职责逐条书面确认；别只凭一场面试感觉下结论。',
      };
    case 'advice':
      return {
        question: subQ,
        insight: reversed
          ? `【${name}${orient}】建议：先减内耗、换路径，再谈去留。身心合一后的选择，才不像逃避。`
          : `【${name}${orient}】建议：先稳住能量（休息/边界），再两边并行——一边看市场反馈，一边评估现团队是否还有可成长的一寸。`,
        action: '未来 1–2 周只做两件事：恢复精力 + 投出可核实的试探（简历/内推），暂不向公司摊牌。',
      };
    default:
      return {
        question: subQ,
        insight: `就「${subQ}」而言，【${name}${orient}】${pos}落在「${kw}」——${work}。`,
        action: '把下一步缩成一个本周可验证的小动作，先验证再加码。',
      };
  }
}

function buildQuestionAnswers(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): QuestionAnswer[] {
  const parts = splitUserQuestions(context.question);
  if (!parts.length) return [];
  // 单句短问题：不拆成多卡，交给 overview 即可
  if (parts.length === 1 && parts[0]!.length < 24) return [];
  return parts.map((p) =>
    buildSubQuestionAnswer(classifySubQuestion(p), p, knowledge, reversed, context),
  );
}

/** 规则解读：热点总览 + 逐条问答 + 元素映射 + 行动（无需外接 AI） */
export function buildStructuredMockReading(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): ParsedStructuredReading {
  const q = context.question.trim() || '（未填写具体问题）';
  const orient = reversed ? '逆位' : '正位';
  const bg = backgroundLine(context);
  const overview =
    getVisualOverview(knowledge.deckId)?.trim() ||
    knowledge.visualOverview?.trim() ||
    knowledge.oneSentence;
  const scene = sceneMeaning(knowledge, context.topic);
  const kw = knowledge.keywords.slice(0, 2).join('、');

  const topicLock =
    context.topic === 'work'
      ? '（本题锁定职场/去留语境，不展开恋爱与原生家庭套话。）'
      : context.topic === 'love'
        ? '（本题锁定关系语境。）'
        : '';

  const directLead =
    context.topic === 'work'
      ? reversed
        ? `直接说：就你问的事而言，${knowledge.nameCn}${orient}不太像在报准日子，而是提醒——路径或策略需要调整；核心纠结常在情绪内耗与节奏，而不只是「钱多钱少」。${topicLock}`
        : `直接说：就你问的事而言，${knowledge.nameCn}${orient}更像在谈「状态、节奏、怎么靠近机会」，关键词偏「${kw}」。${topicLock}`
      : context.topic === 'love'
        ? `直接说：就你问的事而言，${knowledge.nameCn}${orient}更像一面镜子，照见关系里的倾向与信号，而不是替对方下判决。`
        : `直接说：就你问的事而言，${knowledge.nameCn}${orient}指向「${kw || knowledge.oneSentence}」——先看清局面，再谈下一步。`;

  const hotspotOverview = [
    directLead,
    `整幅画面：${overview}`,
    scene ? `放到${topicLabel(context.topic)}语境：${scene}` : '',
    bg,
  ]
    .filter(Boolean)
    .join('');

  const questionAnswers = buildQuestionAnswers(context, knowledge, reversed);
  const elementMappings =
    context.topic === 'love' && context.questionPattern === 'love_likes'
      ? buildElementMappings(context, knowledge, reversed)
      : context.topic === 'work'
        ? buildElementMappings(context, knowledge, reversed).slice(0, 3)
        : buildElementMappings(context, knowledge, reversed);
  const advice = buildAdviceBody(context, knowledge, reversed);
  const comfort = buildComfortBody(context, knowledge, reversed);
  const actionTags = buildActionTags(context, knowledge, reversed);
  const followUps = buildFollowUpSuggestions(context, knowledge);

  const situationFromElements =
    elementMappings.length > 0
      ? `下面把牌面元素翻译成「${q.length > 36 ? '你问的这几件事' : q}」里的现实状况。`
      : `放在${context.cardPosition ? `「${context.cardPosition}」` : '这一'}位置，${knowledge.nameCn}映照的是你眼前的具体处境。`;

  const sections: ContextualSection[] = [
    { title: '热点整体解读', body: hotspotOverview },
    { title: '情境表现', body: situationFromElements },
    { title: '可操作建议', body: advice },
    { title: '心理疏导', body: comfort },
  ];

  return {
    sections,
    actionTags,
    elementMappings,
    followUps,
    questionAnswers,
    plainText: [
      questionAnswers.length
        ? questionAnswers
            .map(
              (a, i) =>
                `【提问 ${i + 1}】${a.question}\n${a.insight}${
                  a.action ? `\n行动：${a.action}` : ''
                }`,
            )
            .join('\n\n')
        : '',
      sectionsToPlainText(sections),
      ...elementMappings.map(
        (m) =>
          `${m.title}\n牌面原意：${m.originalMeaning || '—'}\n场景映射：${m.body}`,
      ),
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
}

function buildAdviceBody(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): string {
  if (context.topic === 'work') {
    return reversed
      ? [
          '别死磕单一出口：同时推进 2–3 条线（海投、内推、猎头），把选择权抓在自己手里。',
          '谈薪资与职责时问细：书面确认结构与试用期条件，防止「画饼」。',
          `结合${knowledge.nameCn}：先调整策略与路径，再谈「哪一天一定成」。`,
        ].join('')
      : [
          '广撒网，不要在一棵树上吊死：保持多线面试与跟进，别只等一家回复。',
          '优先挖非公开渠道：内推、熟人介绍、行业圈，往往比海投更快出声。',
          '信息打八折听：岗位描述、薪资口头承诺都要二次核实。',
        ].join('');
  }
  if (context.topic === 'love') {
    return reversed
      ? '少脑补、多观察：看对方是否稳定回应、愿意解释，而不是一次热情。找一个轻一点的问题试探温度即可。'
      : '把感觉落成可观察的行为：主动、记忆细节、愿意靠近。你也可以问自己：我需要的是确定，还是被看见？';
  }
  return reversed
    ? `围绕「${knowledge.keywords.slice(0, 2).join('、')}」先改一件小事：今天就能动手的那种，比空想大结局更有用。`
    : `把牌义收成一步行动：选「${knowledge.keywords[0] ?? '觉察'}」里你最能动的那一寸，本周只推进这一件。`;
}

function buildComfortBody(
  context: ReadingContext,
  _knowledge: CardKnowledge,
  reversed: boolean,
): string {
  if (context.topic === 'work') {
    return reversed
      ? '别把等待当成自我否定。找工作本是双向选择，这张牌谈的是手段与策略，不是给你盖棺定论。保持节奏，转机往往出现在你还在行动的时候。'
      : '焦虑很正常，但牌在提醒：你缺的不是「再熬一晚」，而是选项与核实。稳住呼吸，把主动权一点一点拿回来——很快会有新的声音进来。';
  }
  return reversed
    ? '不必急着用一个答案安抚自己。看清阻滞，本身就是在往前走；给自己一点耐心。'
    : '你已经在认真面对问题了。牌是提醒不是判决——信任你能把下一步走小、走实。';
}

/** 行动指令标签（展示在牌面关键词位置优先；随牌与主题变化） */
export function buildActionTags(
  context: ReadingContext,
  knowledge: CardKnowledge,
  reversed: boolean,
): string[] {
  const id = knowledge.deckId;
  const isSwords = id.startsWith('swords-') || /宝剑/.test(knowledge.nameCn);
  const isCups = id.startsWith('cups-') || /圣杯/.test(knowledge.nameCn);
  const isPentacles = id.startsWith('pentacles-') || /星币/.test(knowledge.nameCn);
  const isWands = id.startsWith('wands-') || /权杖/.test(knowledge.nameCn);

  if (context.topic === 'work') {
    if (isSwords) {
      return reversed
        ? ['先停内耗', '列事实再决策', '冷却48小时', '换路径试探']
        : ['强制休整', '边界下班', '先恢复再抉择', '少脑补多核实'];
    }
    if (isCups) {
      return reversed
        ? ['防情绪拍板', '别恋舒适区', '感觉打八折', '书面核条件']
        : ['防画饼', '核福利条款', '两边并行看', '别只凭聊得来'];
    }
    if (isPentacles) {
      return reversed
        ? ['重核现金流', '别死磕一家', '谈薪问结构', '多线推进']
        : ['广撒网多面试', '挖内推与人脉', '谈薪问细防画饼', '保持在线跟进'];
    }
    if (isWands) {
      return reversed
        ? ['收束目标', '忌冲动摊牌', '小步验证', '防空转']
        : ['主动试探机会', '设可验证节点', '保持行动节奏', '别空等'];
    }
    return reversed
      ? ['换路径别死磕', '多线推进', '核实口头承诺', '先动再等']
      : ['广撒网多面试', '挖内推与人脉', '谈薪问细防画饼', '保持在线跟进'];
  }
  if (context.topic === 'love') {
    return reversed
      ? ['观察稳定度', '少脑补多核实', '轻量试探']
      : ['看行动不看一次热情', '确认边界', '问清自己想要什么'];
  }
  return knowledge.keywords.slice(0, 3).map((k) => `关注：${k}`);
}

export function topicSceneKeywords(
  knowledge: CardKnowledge,
  topic: ReadingContext['topic'],
): string {
  const scene = sceneMeaning(knowledge, topic);
  return `${knowledge.keywords.slice(0, 4).join('、')}｜场景要点：${scene.slice(0, 80)}`;
}

/** 供 LLM 的牌面元素清单 */
export function formatHotspotsForPrompt(deckId: string): string {
  const visual = getVisualHotspots(deckId);
  const overview = getVisualOverview(deckId);
  if (!visual?.hotspots.length) {
    return overview ? `整牌总览：${overview}` : '（暂无热点明细，请结合标准牌义）';
  }
  const lines = visual.hotspots.map(
    (h, i) => `${i + 1}. ${h.label}：${h.meaning}`,
  );
  return [
    overview ? `整牌总览：${overview}` : '',
    '牌面元素拆解：',
    ...lines,
  ]
    .filter(Boolean)
    .join('\n');
}
