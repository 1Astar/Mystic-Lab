import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import { detectQuestionTheme } from '../codex/collection.ts';
import { buildEncounterRecord } from '../knowledge/encounter.ts';
import { mockAIInterpretation } from '../knowledge/mock-ai.ts';
import { buildSelfReflectionQuestions } from '../knowledge/reflection-prompts.ts';
import {
  getVisualHotspots,
  hasKnowledgeEntry,
  resolveCardKnowledge,
} from '../knowledge/registry.ts';
import type { ReadingContext } from '../knowledge/types.ts';
import type { CardReading, ReadingResult } from './types.ts';
import { getPositionMeta } from '../tarot/spreads.ts';

function buildStandardMeaning(
  knowledge: ReturnType<typeof resolveCardKnowledge>,
  reversed: boolean,
): string {
  const meaning = reversed ? knowledge.reversedMeaning : knowledge.uprightMeaning;
  return [
    `${knowledge.nameCn} ${knowledge.nameEn}`,
    `关键词：${knowledge.keywords.join('、')}`,
    knowledge.oneSentence,
    meaning,
  ].join('\n');
}

function buildReadingContext(
  drawn: DrawnCard,
  question: string,
  spreadType: SpreadType,
): ReadingContext {
  const topic = detectQuestionTheme(question);
  return {
    question,
    spreadType,
    cardPosition: drawn.position ?? '',
    topic,
    selectedCardId: drawn.card.id,
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

  const standardMeaning = buildStandardMeaning(knowledge, reversed);
  const contextualReading = mockAIInterpretation(readingContext, knowledge, reversed);
  const selfReflection = buildSelfReflectionQuestions(readingContext, knowledge);

  const interpretationLayers = {
    standardMeaning,
    contextualReading,
    selfReflection,
  };

  const cardText = reversed ? drawn.card.reversed : drawn.card.upright;
  const learnTip = selfReflection.map((q, i) => `${i + 1}. ${q}`).join('\n');

  return {
    position: drawn.position ?? '',
    positionKey: drawn.positionKey ?? '',
    cardName: drawn.card.nameZh,
    cardId: drawn.card.id,
    orientation: reversed ? 'reversed' : 'upright',
    keywords: knowledge.keywords,
    positionMeaning: positionText,
    text: cardText,
    baseMeaning: standardMeaning,
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
    hasVisualHotspots: hasKnowledgeEntry(drawn.card.id) && !!getVisualHotspots(drawn.card.id)?.hotspots.length,
  };
}

export function buildReadingResult(
  cards: DrawnCard[],
  question = '',
  spreadType: SpreadType = 'past-present-future',
): ReadingResult {
  const readings = cards.map((c) => buildCardReading(c, question, spreadType));
  const names = cards.map((c) => c.card.nameZh).join('、');

  const summary =
    cards.length === 1
      ? `「${names}」已加入你的图鉴。答案不在牌里，在你心里。`
      : `「${names}」共同描绘这次占问的脉络。新牌已解锁图鉴，可随时回看。`;

  return { cards: readings, summary, provider: 'mock' };
}

export { detectQuestionTheme };
export type { QuestionTheme } from '../codex/collection.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatParagraph(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

/** 仪式中「细读」步骤的简版展示 */
export function readingBlockHtml(r: CardReading): string {
  const layers = r.interpretationLayers;
  return `
    <div class="reading-blocks">
      <section class="reading-block">
        <h4>标准牌义</h4>
        <p class="reading-block-text">${formatParagraph(layers.standardMeaning)}</p>
      </section>
      <section class="reading-block">
        <h4>结合你的问题</h4>
        <p class="reading-block-text">${formatParagraph(layers.contextualReading)}</p>
      </section>
    </div>`;
}
