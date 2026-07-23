import { fetchContextualReading } from '../ai/llm-client.ts';
import { isAiConfigured, loadAiSettings } from '../ai/settings.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import type { FollowUpAnswer } from '../knowledge/types.ts';
import {
  buildStructuredMockReading,
  parseStructuredReading,
} from './structured-reading.ts';
import { staticProvider } from './static-provider.ts';
import type {
  CardReading,
  InterpretOptions,
  InterpretationProvider,
  ReadingResult,
} from './types.ts';

function applyParsedToCard(
  card: CardReading,
  parsed: ReturnType<typeof parseStructuredReading>,
  background: string | undefined,
  provider: 'llm' | 'mock',
): CardReading {
  const actionTags =
    parsed.actionTags.length > 0
      ? parsed.actionTags
      : card.interpretationLayers.actionTags;
  const elementMappings =
    parsed.elementMappings.length > 0
      ? parsed.elementMappings
      : card.interpretationLayers.elementMappings;
  const followUps =
    parsed.followUps.length > 0
      ? parsed.followUps
      : card.interpretationLayers.followUps;
  const questionAnswers =
    parsed.questionAnswers.length > 0
      ? parsed.questionAnswers
      : card.interpretationLayers.questionAnswers;

  return {
    ...card,
    inContext: parsed.plainText,
    readingContext: {
      ...card.readingContext,
      background: background || card.readingContext.background,
    },
    interpretationLayers: {
      ...card.interpretationLayers,
      contextualReading: parsed.plainText,
      contextualSections: parsed.sections,
      questionAnswers,
      actionTags,
      elementMappings,
      followUps,
    },
    interpretationProvider: provider,
  };
}

async function enrichWithLlm(
  result: ReadingResult,
  question: string,
  options?: InterpretOptions,
): Promise<ReadingResult> {
  const settings = loadAiSettings();
  const background = options?.background?.trim() || result.questionBackground;
  if (!isAiConfigured(settings)) {
    return { ...result, provider: 'mock', questionBackground: background };
  }

  try {
    const cards = await Promise.all(
      result.cards.map(async (card) => {
        const raw = await fetchContextualReading(
          { question, card, background },
          settings,
        );
        const parsed = parseStructuredReading(raw, {
          deckId: card.selectedCard.deckId,
        });
        return applyParsedToCard(card, parsed, background, 'llm');
      }),
    );
    return {
      ...result,
      cards,
      provider: 'llm',
      questionBackground: background,
    };
  } catch {
    return { ...result, provider: 'mock', questionBackground: background };
  }
}

export class LlmInterpretationProvider implements InterpretationProvider {
  async interpret(
    cards: DrawnCard[],
    question?: string,
    spreadType?: SpreadType,
    options?: InterpretOptions,
  ): Promise<ReadingResult> {
    const base = await staticProvider.interpret(cards, question, spreadType, options);
    return enrichWithLlm(base, question ?? '', options);
  }
}

export function createInterpretationProvider(): InterpretationProvider {
  if (isAiConfigured()) {
    return new LlmInterpretationProvider();
  }
  return staticProvider;
}

/** 末张收下时：已有完整解读则复用（保留 AI 文），避免二次覆盖 */
export function readingCoversDrawn(
  reading: ReadingResult | null | undefined,
  cardIds: string[],
): boolean {
  if (!reading?.cards?.length || reading.cards.length !== cardIds.length) return false;
  return reading.cards.every((c, i) => c.cardId === cardIds[i]);
}

/**
 * 同牌追问：保留主解读，追加 followUpAnswers；可点追问会再调 AI/规则。
 */
export async function interpretCardFollowUp(
  card: CardReading,
  followUpQuestion: string,
): Promise<CardReading> {
  const q = followUpQuestion.trim();
  if (q.length < 2) return card;

  const originalQuestion = card.question || card.readingContext.question;
  const background = card.readingContext.background;
  const settings = loadAiSettings();

  let answer: FollowUpAnswer;

  if (isAiConfigured(settings)) {
    try {
      const raw = await fetchContextualReading(
        {
          question: q,
          card,
          background,
          originalQuestion,
          isFollowUp: true,
        },
        settings,
      );
      const parsed = parseStructuredReading(raw, {
        deckId: card.selectedCard.deckId,
      });
      answer = {
        question: q,
        sections: parsed.sections,
        elementMappings: parsed.elementMappings,
        plainText: parsed.plainText,
        provider: 'llm',
        at: new Date().toISOString(),
      };
    } catch {
      const mock = buildStructuredMockReading(
        { ...card.readingContext, question: q },
        card.selectedCard,
        card.orientation === 'reversed',
      );
      answer = {
        question: q,
        sections: mock.sections,
        elementMappings: mock.elementMappings,
        plainText: mock.plainText,
        provider: 'mock',
        at: new Date().toISOString(),
      };
    }
  } else {
    const mock = buildStructuredMockReading(
      { ...card.readingContext, question: q },
      card.selectedCard,
      card.orientation === 'reversed',
    );
    answer = {
      question: q,
      sections: mock.sections,
      elementMappings: mock.elementMappings,
      plainText: mock.plainText,
      provider: 'mock',
      at: new Date().toISOString(),
    };
  }

  const prev = card.interpretationLayers.followUpAnswers ?? [];
  return {
    ...card,
    interpretationLayers: {
      ...card.interpretationLayers,
      followUpAnswers: [...prev, answer].slice(-5),
    },
  };
}
