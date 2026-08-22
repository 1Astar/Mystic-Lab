import type { QuestionAnswer, QuestionTopic } from '../knowledge/types.ts';
import { intentActionsPlain } from '../mystic-engine/intent-actions.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import { isFreeArrangeSpread } from '../tarot/spread-layout.ts';
import type { CardReading } from './types.ts';
import {
  resolveReadingLens,
} from './card-psychology.ts';
import {
  buildAdviceLines,
  buildNarrativeCardInsight,
  buildSpreadSynthesis,
  empathyNarrativeLead,
} from './tarot-narrative.ts';
import {
  classifySubQuestion,
  splitUserQuestions,
  type SubQuestionIntent,
} from './question-parts.ts';
import { sanitizeTopicText } from './topic-sanitize.ts';
import {
  mockAdviceInsight,
  mockLeavePhasedInsight,
  mockReasonInsight,
  mockRiskInsight,
  mockStayPhasedInsight,
  mockWorkEmpathy,
  mockWorkOneLiner,
  mockWorkOverview,
} from './work-thread-gold.ts';

export type ThreadAnswer = {
  question: string;
  intent: SubQuestionIntent;
  /** 绑定的牌下标 */
  cardIndexes: number[];
  /** 如 【宝剑四】的真相 */
  heading: string;
  /** 牌意映射 / 意象·共振 */
  meaningMap?: string;
  /** 深度剖析 / 走势 */
  insight: string;
  /** 可执行行动（1–2 点） */
  action?: string;
  /** 按张解读（自由摆放 / 多牌单问） */
  perCard?: boolean;
};

export type QuestionThread = {
  /** 开场共情一句 */
  empathyLead: string;
  /** 整盘结论（短） */
  overall: string;
  answers: ThreadAnswer[];
  /** 一句话破局 */
  oneLiner: string;
  provider: 'mock' | 'llm';
  /** 每张各一段 */
  perCardMode?: boolean;
  /** 多牌综合结论 */
  synthesis?: string;
  /** 边界 / 行动建议列表 */
  adviceLines?: string[];
};

export type BuildQuestionThreadOptions = {
  spreadType?: SpreadType | string;
  userIntuition?: string;
};

const INTENT_HEAD: Record<SubQuestionIntent, string> = {
  reason: '的真相',
  leave_path: '的试探与寻觅',
  stay_path: '的温情与停滞',
  risk: '的暗礁',
  advice: '的行动策略',
  general: '的提示',
};

function cardNames(cards: CardReading[], indexes: number[]): string {
  return indexes
    .map((i) => cards[i]?.cardName)
    .filter(Boolean)
    .join(' + ');
}

function meaningOneLiner(card: CardReading): string {
  const orient = card.orientation === 'reversed' ? '逆位' : '正位';
  const kw =
    card.keywords.slice(0, 4).join('、') ||
    card.interpretationLayers.standard.oneSentence;
  const axis =
    card.orientation === 'reversed'
      ? (card.selectedCard.reversedMeaning?.trim() ||
          card.interpretationLayers.standard.reminder ||
          kw)
      : (card.selectedCard.uprightMeaning?.trim() || kw);
  const short = axis.length > 64 ? `${axis.slice(0, 64)}…` : axis;
  return `${card.cardName}（${orient}）是一张「${kw}」的牌——${short}`;
}

function meaningForCards(cards: CardReading[], indexes: number[]): string {
  if (indexes.length === 1) {
    const c = cards[indexes[0]!];
    return c ? meaningOneLiner(c) : '';
  }
  return indexes
    .map((i) => {
      const c = cards[i];
      if (!c) return '';
      const orient = c.orientation === 'reversed' ? '逆位' : '正位';
      const kw = c.keywords.slice(0, 3).join('、') || c.cardName;
      return `${c.cardName}（${orient}）：「${kw}」`;
    })
    .filter(Boolean)
    .join('；');
}

/** 自由摆放 / 多牌单问：每张各出一段 */
export function shouldUsePerCardThread(
  cards: CardReading[],
  question: string,
  spreadType?: SpreadType | string,
): boolean {
  if (cards.length <= 1) return false;
  const st = spreadType ?? cards[0]?.spreadType;
  if (st && isFreeArrangeSpread(st as SpreadType)) return true;
  const parts = splitUserQuestions(question);
  return parts.length === 1;
}

/** 多牌单问 / 自定义牌阵：是否走整盘 LLM */
export function shouldUseSpreadThreadLlm(cards: CardReading[], question: string): boolean {
  if (cards.length <= 1) return false;
  const parts = splitUserQuestions(question);
  return parts.length >= 2 || parts.length === 1;
}

/** 位次对齐：前 N 个路径/事实问 ↔ 牌；风险/建议用多牌合成 */
export function assignCardsToQuestions(
  intents: SubQuestionIntent[],
  cardCount: number,
): number[][] {
  if (cardCount <= 0) return intents.map(() => []);
  const pathSlots = intents.map((intent, i) => ({ intent, i })).filter(({ intent }) =>
    intent === 'reason' ||
    intent === 'leave_path' ||
    intent === 'stay_path' ||
    intent === 'general',
  );

  const map: number[][] = intents.map(() => []);
  let cursor = 0;
  for (const { i } of pathSlots) {
    map[i] = [Math.min(cursor, cardCount - 1)];
    cursor += 1;
  }

  const all = Array.from({ length: cardCount }, (_, i) => i);
  const pathIndexes = pathSlots.map(({ i }) => map[i]![0]!).filter((n) => n != null);
  const pathPair =
    pathIndexes.length >= 2
      ? pathIndexes.slice(-2)
      : all.slice(Math.max(0, cardCount - 2));

  intents.forEach((intent, i) => {
    if (map[i]!.length) return;
    if (intent === 'risk') map[i] = pathPair.length ? pathPair : all;
    else if (intent === 'advice') map[i] = all;
    else map[i] = [Math.min(i, cardCount - 1)];
  });

  return map;
}

function buildMockInsight(
  intent: SubQuestionIntent,
  cards: CardReading[],
  indexes: number[],
  topic: QuestionTopic,
): { meaningMap?: string; insight: string; action?: string } {
  const primary = cards[indexes[0]!];
  if (!primary) {
    return { insight: '结合牌阵看，先把问题拆小，再决定下一步。' };
  }
  const names = cardNames(cards, indexes);
  const meaningMap = meaningForCards(cards, indexes) || undefined;
  const work = topic === 'work';
  const anyRev = indexes.some((i) => cards[i]?.orientation === 'reversed');
  const revNote = anyRev
    ? '其中有逆位：更偏阻滞、失衡或需调整，勿按正位「能量通畅」读。'
    : '';

  switch (intent) {
    case 'reason':
      return {
        meaningMap,
        insight: work
          ? `${mockReasonInsight(names)}${revNote ? ` ${revNote}` : ''}`
          : `结合【${names}】做深度剖析：推动你想改变的，首先是内在状态，而不只是外部某一条条款。${revNote ? ` ${revNote}` : ''}`,
        action: '『先写清「我最想摆脱的是什么感觉」』——比先写理由清单更接近真相。',
      };
    case 'leave_path':
      return {
        meaningMap,
        insight: work
          ? `${mockLeavePhasedInsight(names)}${revNote ? ` ${revNote}` : ''}`
          : `若选择离开/转向，【${names}】提醒：过渡期重在恢复与核实，别把期望一次拉满。`,
        action: '『设底线：现金流能撑多久、最低可接受条件；口头承诺务必书面化。』',
      };
    case 'stay_path':
      return {
        meaningMap,
        insight: work
          ? `${mockStayPhasedInsight(names)}${revNote ? ` ${revNote}` : ''}`
          : `若选择留下/维持，【${names}】提示：舒适不等于安全，三个月后核对是否仍有进步空间。`,
        action: '『留下也要立一个「三个月后可核对的成长指标」，避免温水煮青蛙。』',
      };
    case 'risk':
      return {
        meaningMap:
          indexes.length > 1
            ? `结合【${names}】交叉看「情况 / 阻碍」。`
            : meaningMap,
        insight: work
          ? `${mockRiskInsight(names)}${revNote ? ` ${revNote}` : ''}`
          : `结合【${names}】，标出情况与阻碍：最该防的是情绪化拍板与信息差。`,
        action: '『重大决定冷却 48 小时；关键条款书面确认；别只凭一场感觉下结论。』',
      };
    case 'advice':
      return {
        meaningMap: `整阵（${names}）给出的行动策略：先斩断内耗，再定去留。`,
        insight: work
          ? `${mockAdviceInsight(names)}${revNote ? ` ${revNote}` : ''}`
          : `先稳住状态，再谈大决定。把下一步缩成可验证的小行动。`,
      };
    default:
      return {
        meaningMap,
        insight: `就这一问题，【${names}】落在「${primary.keywords.slice(0, 2).join('、') || primary.cardName}」——先看清局面，再谈下一步。`,
      };
  }
}

/** advice / general / 缺 action：用共享意图→动作库回填 */
function fillActionFromIntent(
  slice: string,
  intent: SubQuestionIntent,
  existing: string | undefined,
  topic: QuestionTopic,
): string | undefined {
  if (intent === 'advice' || intent === 'general' || !existing?.trim()) {
    return sanitizeTopicText(intentActionsPlain(slice, { ctx: null }), topic);
  }
  return sanitizeTopicText(existing, topic);
}

function empathyFor(topic: QuestionTopic, cards: CardReading[]): string {
  const names = cards.map((c) => c.cardName).join('、');
  if (topic === 'work') {
    return mockWorkEmpathy(names);
  }
  return `根据你的牌阵（${names}），我先帮你把问题理清——答案最终仍在你心里。`;
}

/** 每张牌各一段：牌意心理学 + 共时性共振 */
export function buildPerCardQuestionThread(
  cards: CardReading[],
  question: string,
  provider: 'mock' | 'llm' = 'mock',
  options?: BuildQuestionThreadOptions,
): QuestionThread | null {
  const q = question.trim();
  if (!cards.length || !q) return null;

  const topic = cards[0]!.topic;
  const lens = resolveReadingLens(q, topic);
  const userIntuition = options?.userIntuition?.trim();

  const answers: ThreadAnswer[] = cards.map((card, i) => {
    const narrative = buildNarrativeCardInsight(
      card,
      q,
      lens,
      cards,
      i,
      userIntuition,
    );
    const pos = card.position?.trim() || `第 ${i + 1} 张`;
    return {
      question: q,
      intent: 'general',
      cardIndexes: [i],
      heading: `【${card.cardName}】· ${pos}`,
      meaningMap: sanitizeTopicText(narrative.meaningMap, topic),
      insight: sanitizeTopicText(narrative.insight, topic),
      action: narrative.action
        ? sanitizeTopicText(narrative.action, topic)
        : undefined,
      perCard: true,
    };
  });

  const synthesis = sanitizeTopicText(
    buildSpreadSynthesis(cards, q, lens, userIntuition),
    topic,
  );
  const adviceLines = buildAdviceLines(cards, q, lens).map((line) =>
    sanitizeTopicText(line, topic),
  );
  const overall = synthesis || sanitizeTopicText(
    `整盘 ${cards.length} 张牌各照见一层心理——把画面与感受对齐，再谈下一步。`,
    topic,
  );
  const lastAction = answers[answers.length - 1]?.action?.trim();
  const oneLiner = sanitizeTopicText(
    lastAction || adviceLines[0] || '把三张形容词写成一句给自己的话，比死记牌意更接近真相。',
    topic,
  );

  return {
    empathyLead: sanitizeTopicText(empathyNarrativeLead(cards, q, lens), topic),
    overall,
    answers,
    oneLiner,
    provider,
    perCardMode: true,
    synthesis: synthesis || undefined,
    adviceLines: adviceLines.length ? adviceLines : undefined,
  };
}

/**
 * 从多张牌 + 用户问题，构建「按问题串讲」的整盘解读（规则兜底）。
 * 自由摆放 / 多牌单问 → 每张各一段（buildPerCardQuestionThread）。
 */
export function buildQuestionThread(
  cards: CardReading[],
  question: string,
  provider: 'mock' | 'llm' = 'mock',
  options?: BuildQuestionThreadOptions,
): QuestionThread | null {
  const q = question.trim();
  if (!cards.length || !q) return null;

  const spreadType = options?.spreadType ?? cards[0]?.spreadType;
  if (shouldUsePerCardThread(cards, q, spreadType)) {
    return buildPerCardQuestionThread(cards, q, provider, options);
  }

  const parts = splitUserQuestions(q);
  const topic = cards[0]!.topic;
  const intents = parts.map((p) => classifySubQuestion(p));
  const assignment = assignCardsToQuestions(intents, cards.length);

  const seedAnswers = pickSeedAnswers(cards, parts);

  const answers: ThreadAnswer[] = parts.map((part, i) => {
    const intent = intents[i]!;
    const indexes = assignment[i]!.length ? assignment[i]! : [0];
    const names = cardNames(cards, indexes);
    const heading = `【${names}】${INTENT_HEAD[intent]}`;
    const seeded = seedAnswers[i];
    if (seeded) {
      return {
        question: part,
        intent,
        cardIndexes: indexes,
        heading,
        meaningMap: sanitizeTopicText(meaningForCards(cards, indexes), topic) || undefined,
        insight: sanitizeTopicText(seeded.insight, topic),
        action: fillActionFromIntent(part, intent, seeded.action, topic),
      };
    }
    const built = buildMockInsight(intent, cards, indexes, topic);
    return {
      question: part,
      intent,
      cardIndexes: indexes,
      heading,
      meaningMap: built.meaningMap
        ? sanitizeTopicText(built.meaningMap, topic)
        : undefined,
      insight: sanitizeTopicText(built.insight, topic),
      action: fillActionFromIntent(part, intent, built.action, topic),
    };
  });

  const advice = answers.find((a) => a.intent === 'advice');
  const reason = answers.find((a) => a.intent === 'reason');
  const suitHint = (() => {
    const hasPent = cards.some((c) => c.cardId.includes('pentacles') || c.selectedCard.deckId.includes('pentacles'));
    const hasMajor = cards.some((c) => c.selectedCard.arcana === 'major');
    if (!hasPent && !hasMajor) {
      return '牌阵里少见星币与大冲击牌时，纠结更常落在情绪内耗与舒适区留恋，而非「钱多钱少」或天灾人祸。';
    }
    return '';
  })();

  const lens = resolveReadingLens(q, topic);
  const spreadSynth = sanitizeTopicText(
    buildSpreadSynthesis(cards, q, lens, options?.userIntuition),
    topic,
  );

  const overall = spreadSynth
    ? spreadSynth
    : sanitizeTopicText(
        topic === 'work'
          ? mockWorkOverview(suitHint)
          : `先抓住方向，再下钻细节——牌在帮你看清局面，而不是替你做绝对宣判。`,
        topic,
      );

  const adviceLines = buildAdviceLines(cards, q, lens).map((line) =>
    sanitizeTopicText(line, topic),
  );

  const oneLiner = sanitizeTopicText(
    advice?.action?.trim() ||
      reason?.action?.trim() ||
      adviceLines[0] ||
      (topic === 'work' ? mockWorkOneLiner() : '把下一步缩成一件今天就能做的小事。'),
    topic,
  );

  return {
    empathyLead: empathyFor(topic, cards),
    overall,
    answers,
    oneLiner,
    provider,
    synthesis: spreadSynth || undefined,
    adviceLines: adviceLines.length ? adviceLines : undefined,
  };
}

/** 优先用「绑定牌」上的 questionAnswers，避免多牌各答全套造成重复 */
function pickSeedAnswers(
  cards: CardReading[],
  parts: string[],
): Array<QuestionAnswer | undefined> {
  if (parts.length <= 1 && cards.length === 1) {
    const qa = cards[0]!.interpretationLayers.questionAnswers;
    return parts.map((_, i) => qa?.[i]);
  }

  const intents = parts.map((p) => classifySubQuestion(p));
  const assignment = assignCardsToQuestions(intents, cards.length);

  return parts.map((part, i) => {
    const idx = assignment[i]?.[0] ?? 0;
    const card = cards[idx];
    const list = card?.interpretationLayers.questionAnswers;
    if (!list?.length) return undefined;
    const hit =
      list.find((a) => a.question.includes(part.slice(0, 8)) || part.includes(a.question.slice(0, 8))) ??
      list[i] ??
      list[0];
    return hit;
  });
}

/** 把 thread 写回 ReadingResult 时用的摘要 */
export function threadSummaryLine(thread: QuestionThread): string {
  return thread.oneLiner;
}
