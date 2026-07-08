import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import { detectQuestionTheme } from '../codex/collection.ts';
import { buildEncounterRecord } from '../knowledge/encounter.ts';
import { mockAIInterpretation } from '../knowledge/mock-ai.ts';
import { buildSelfReflectionQuestions } from '../knowledge/reflection-prompts.ts';
import {
  hasVisualHotspots,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import type { ReadingContext, StandardMeaningLayer } from '../knowledge/types.ts';
import type { CardReading, ReadingResult } from './types.ts';
import { getPositionMeta } from '../tarot/spreads.ts';
import { analyzeQuestion } from '../tarot/question-coach.ts';

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
  };
}

function buildCardReading(
  drawn: DrawnCard,
  question: string,
  spreadType: SpreadType,
): CardReading {
  const reversed = drawn.reversed;
  const knowledge = resolveCardKnowledge(drawn.card);
  const readingContext = buildReadingContext(drawn, question, spreadType);
  const meta =
    drawn.positionKey ? getPositionMeta(spreadType, drawn.positionKey) : undefined;
  const positionText = meta?.meaning ?? '';

  const standard = buildStandardLayer(knowledge, reversed);
  const mockResult = mockAIInterpretation(readingContext, knowledge, reversed);
  const selfReflection = buildSelfReflectionQuestions(readingContext, knowledge);

  const interpretationLayers = {
    standard,
    contextualReading: mockResult.text,
    contextualSections: mockResult.sections,
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
    inContext: mockResult.text,
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
  };
}

export function buildReadingResult(
  cards: DrawnCard[],
  question = '',
  spreadType: SpreadType = 'past-present-future',
): ReadingResult {
  const readings = cards.map((c) => buildCardReading(c, question, spreadType));
  const names = readings.map((c) => c.cardName).join('、');

  const summary =
    cards.length === 1
      ? `「${names}」已加入你的图鉴。答案不在牌里，在你心里。`
      : `「${names}」共同描绘这次占问的脉络。新牌已解锁图鉴，可随时回看。`;

  return { cards: readings, summary, provider: 'mock' };
}

export { detectQuestionTheme };
export type { QuestionTheme } from '../codex/collection.ts';