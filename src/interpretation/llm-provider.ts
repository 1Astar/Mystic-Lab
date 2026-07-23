import {
  fetchContextualReading,
  fetchSpreadThreadReading,
  parseSpreadThreadJson,
} from '../ai/llm-client.ts';
import { isAiConfigured, loadAiSettings } from '../ai/settings.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import type { FollowUpAnswer } from '../knowledge/types.ts';
import { buildQuestionThread } from './question-thread.ts';
import { splitUserQuestions } from './question-parts.ts';
import {
  buildStructuredMockReading,
  parseStructuredReading,
} from './structured-reading.ts';
import { sanitizeTopicText } from './topic-sanitize.ts';
import { polishReadingCopy } from './reading-polish.ts';
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
  const topic = card.topic;
  const actionTags =
    parsed.actionTags.length > 0
      ? parsed.actionTags
      : card.interpretationLayers.actionTags;
  const elementMappings =
    parsed.elementMappings.length > 0
      ? parsed.elementMappings.map((m) => ({
          ...m,
          body: sanitizeTopicText(m.body, topic),
        }))
      : card.interpretationLayers.elementMappings;
  const followUps =
    parsed.followUps.length > 0
      ? parsed.followUps
      : card.interpretationLayers.followUps;
  const questionAnswers =
    parsed.questionAnswers.length > 0
      ? parsed.questionAnswers.map((a) => ({
          ...a,
          insight: polishReadingCopy(sanitizeTopicText(a.insight, topic)),
          action: a.action
            ? polishReadingCopy(sanitizeTopicText(a.action, topic))
            : undefined,
        }))
      : card.interpretationLayers.questionAnswers;

  const sections = parsed.sections.map((s) => ({
    ...s,
    body: polishReadingCopy(sanitizeTopicText(s.body, topic)),
  }));

  return {
    ...card,
    inContext: sanitizeTopicText(parsed.plainText, topic),
    readingContext: {
      ...card.readingContext,
      background: background || card.readingContext.background,
    },
    interpretationLayers: {
      ...card.interpretationLayers,
      // 多条问答时去掉机械「答案倾向」，避免与逐条重复
      answerTendency:
        (questionAnswers?.length ?? 0) >= 2
          ? undefined
          : card.interpretationLayers.answerTendency,
      contextualReading: sanitizeTopicText(parsed.plainText, topic),
      contextualSections: sections,
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
    return {
      ...result,
      provider: 'mock',
      questionBackground: background,
      questionThread:
        result.questionThread ??
        buildQuestionThread(result.cards, question, 'mock') ??
        undefined,
    };
  }

  const parts = splitUserQuestions(question);
  const multiCard = result.cards.length > 1 && parts.length >= 2;

  try {
    if (multiCard) {
      // 整盘一次调用，避免每张牌各答全套子问 → 重复+跑题
      const raw = await fetchSpreadThreadReading(
        { question, cards: result.cards, background },
        settings,
      );
      const thread =
        parseSpreadThreadJson(raw, result.cards, question) ??
        buildQuestionThread(result.cards, question, 'mock');

      // 把绑定到该牌的问答回写，便于单牌 Tab 精简展示
      const cards = result.cards.map((card, cardIndex) => {
        const bound = thread?.answers.filter((a) =>
          a.cardIndexes.includes(cardIndex),
        );
        if (!bound?.length) {
          return { ...card, interpretationProvider: 'llm' as const };
        }
        return {
          ...card,
          interpretationProvider: 'llm' as const,
          interpretationLayers: {
            ...card.interpretationLayers,
            answerTendency: undefined,
            questionAnswers: bound.map((a) => ({
              question: a.question,
              insight: a.insight,
              action: a.action,
            })),
          },
        };
      });

      return {
        ...result,
        cards,
        questionThread: thread ?? undefined,
        summary: thread?.oneLiner || result.summary,
        provider: 'llm',
        questionBackground: background,
      };
    }

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

    const thread =
      buildQuestionThread(cards, question, 'llm') ??
      result.questionThread ??
      undefined;

    return {
      ...result,
      cards,
      questionThread: thread,
      summary: thread?.oneLiner || result.summary,
      provider: 'llm',
      questionBackground: background,
    };
  } catch {
    return {
      ...result,
      provider: 'mock',
      questionBackground: background,
      questionThread:
        result.questionThread ??
        buildQuestionThread(result.cards, question, 'mock') ??
        undefined,
    };
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
        sections: parsed.sections.map((s) => ({
          ...s,
          body: sanitizeTopicText(s.body, card.topic),
        })),
        elementMappings: parsed.elementMappings.map((m) => ({
          ...m,
          body: sanitizeTopicText(m.body, card.topic),
        })),
        plainText: sanitizeTopicText(parsed.plainText, card.topic),
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
