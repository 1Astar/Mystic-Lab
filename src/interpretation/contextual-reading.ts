import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import { detectQuestionTheme } from '../codex/collection.ts';
import { buildAnswerTendency, buildVisualQuestionBridge } from '../knowledge/answer-tendency.ts';
import { buildEncounterRecord } from '../knowledge/encounter.ts';
import { mockAIInterpretation } from '../knowledge/mock-ai.ts';
import { buildSelfReflectionQuestions } from '../knowledge/reflection-prompts.ts';
import {
  getVisualOverview,
  hasVisualHotspots,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import type { ReadingContext, StandardMeaningLayer } from '../knowledge/types.ts';
import type { CardReading, InterpretOptions, ReadingResult } from './types.ts';
import { getPositionMeta } from '../tarot/spreads.ts';
import { analyzeQuestion } from '../tarot/question-coach.ts';
import { buildQuestionThread } from './question-thread.ts';
import {
  buildStructuredMockReading,
  sectionsToPlainText,
} from './structured-reading.ts';
import { sanitizeTopicText } from './topic-sanitize.ts';

function buildStandardLayer(
  knowledge: ReturnType<typeof resolveCardKnowledge>,
  reversed: boolean,
): StandardMeaningLayer {
  const reminder = reversed
    ? `逆位提醒：${knowledge.reversedMeaning}`
    : `正位提醒：${knowledge.uprightMeaning}`;

  return {
    keywords: knowledge.keywords,
    oneSentence: knowledge.oneSentence,
    reminder,
  };
}

function buildReadingContext(
  drawn: DrawnCard,
  question: string,
  spreadType: SpreadType,
  background?: string,
): ReadingContext {
  const topic = detectQuestionTheme(question);
  const coach = analyzeQuestion(question);

  return {
    question,
    spreadType,
    cardPosition: drawn.position ?? '',
    positionKey: drawn.positionKey ?? '',
    topic,
    selectedCardId: drawn.card.id,
    questionPattern: coach?.pattern,
    personName: coach?.personName,
    background: background?.trim() || undefined,
  };
}

function buildCardReading(
  drawn: DrawnCard,
  question: string,
  spreadType: SpreadType,
  background?: string,
): CardReading {
  const reversed = drawn.reversed;
  const knowledge = resolveCardKnowledge(drawn.card);
  const readingContext = buildReadingContext(drawn, question, spreadType, background);
  const meta =
    drawn.positionKey ? getPositionMeta(spreadType, drawn.positionKey) : undefined;
  const positionText =
    meta?.meaning ??
    (drawn.position ? `「${drawn.position}」位置：对照你为这个位置写下的含义来读牌。` : '');

  const standard = buildStandardLayer(knowledge, reversed);
  const structured = buildStructuredMockReading(readingContext, knowledge, reversed);
  const mockResult = mockAIInterpretation(readingContext, knowledge, reversed);

  // 有提问时：以内置「结合问题」结构为主（无需外接 AI）
  // 感情喜欢等专属分段作为补充标题保留，但仍挂上元素映射与追问
  const hasQuestion = Boolean(readingContext.question.trim());
  const contextualSections =
    hasQuestion || !mockResult.sections?.length
      ? structured.sections
      : mockResult.sections;
  const contextualReading =
    hasQuestion || !mockResult.sections?.length
      ? structured.plainText
      : mockResult.text;
  const actionTags = structured.actionTags;
  const elementMappings = structured.elementMappings;
  const followUps = structured.followUps;
  const questionAnswers = structured.questionAnswers.map((a) => ({
    ...a,
    insight: sanitizeTopicText(a.insight, readingContext.topic),
    action: a.action
      ? sanitizeTopicText(a.action, readingContext.topic)
      : undefined,
  }));

  const selfReflection = buildSelfReflectionQuestions(readingContext, knowledge);
  // 有逐条问答时不再叠「一句话答案」——避免把全部子问塞进一句重复展示
  const answerTendency =
    questionAnswers.length >= 2
      ? null
      : buildAnswerTendency(readingContext, knowledge, reversed);
  const visualQuestionBridge = buildVisualQuestionBridge(
    readingContext,
    knowledge,
    reversed,
    getVisualOverview(drawn.card.id),
  );

  const interpretationLayers = {
    standard,
    answerTendency: answerTendency ?? undefined,
    contextualReading: sanitizeTopicText(contextualReading, readingContext.topic),
    contextualSections: contextualSections?.map((s) => ({
      ...s,
      body: sanitizeTopicText(s.body, readingContext.topic),
    })),
    questionAnswers: questionAnswers.length ? questionAnswers : undefined,
    actionTags,
    elementMappings: elementMappings?.map((m) => ({
      ...m,
      body: sanitizeTopicText(m.body, readingContext.topic),
    })),
    followUps,
    visualQuestionBridge,
    selfReflection,
  };

  const cardText = reversed ? knowledge.reversedMeaning : knowledge.uprightMeaning;
  const learnTip = selfReflection.map((q, i) => `${i + 1}. ${q}`).join('\n');

  return {
    position: drawn.position ?? '',
    positionKey: drawn.positionKey ?? '',
    cardName: knowledge.nameCn,
    cardId: drawn.card.id,
    orientation: reversed ? 'reversed' : 'upright',
    keywords: knowledge.keywords,
    positionMeaning: positionText,
    text: cardText,
    baseMeaning: standard.oneSentence,
    inContext: contextualReading,
    learnTip,
    combined: positionText
      ? `【${drawn.position}】${positionText}\n\n【牌义】${cardText}`
      : cardText,
    question,
    spreadType,
    cardPosition: drawn.position ?? '',
    topic: readingContext.topic,
    selectedCardId: drawn.card.id,
    readingContext,
    selectedCard: knowledge,
    interpretationLayers,
    encounterRecord: buildEncounterRecord(drawn.card.id),
    hasVisualHotspots: hasVisualHotspots(drawn.card.id),
    interpretationProvider: 'mock',
  };
}

export function buildReadingResult(
  cards: DrawnCard[],
  question = '',
  spreadType: SpreadType = 'past-present-future',
  options?: InterpretOptions,
): ReadingResult {
  const background = options?.background?.trim() || undefined;
  const readings = cards.map((c) => buildCardReading(c, question, spreadType, background));
  const names = readings.map((c) => c.cardName).join('、');
  const questionThread = buildQuestionThread(readings, question, 'mock') ?? undefined;

  const summary =
    questionThread?.oneLiner ||
    (cards.length === 1
      ? `「${names}」已加入你的图鉴。答案不在牌里，在你心里。`
      : `「${names}」共同描绘这次占问的脉络。新牌已解锁图鉴，可随时回看。`);

  return {
    cards: readings,
    summary,
    questionThread,
    provider: 'mock',
    questionBackground: background,
  };
}

export { detectQuestionTheme, sectionsToPlainText };
export type { QuestionTheme } from '../codex/collection.ts';
