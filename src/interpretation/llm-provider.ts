import { fetchContextualReading } from '../ai/llm-client.ts';
import { isAiConfigured, loadAiSettings } from '../ai/settings.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import { staticProvider } from './static-provider.ts';
import type { InterpretationProvider, ReadingResult } from './types.ts';

async function enrichWithLlm(result: ReadingResult, question: string): Promise<ReadingResult> {
  const settings = loadAiSettings();
  if (!isAiConfigured(settings)) {
    return { ...result, provider: 'mock' };
  }

  try {
    const cards = await Promise.all(
      result.cards.map(async (card) => {
        const contextualReading = await fetchContextualReading({ question, card }, settings);
        return {
          ...card,
          inContext: contextualReading,
          interpretationLayers: {
            ...card.interpretationLayers,
            contextualReading,
            contextualSections: undefined,
          },
          interpretationProvider: 'llm' as const,
        };
      }),
    );
    return { ...result, cards, provider: 'llm' };
  } catch {
    return { ...result, provider: 'mock' };
  }
}

export class LlmInterpretationProvider implements InterpretationProvider {
  async interpret(
    cards: DrawnCard[],
    question?: string,
    spreadType?: SpreadType,
  ): Promise<ReadingResult> {
    const base = await staticProvider.interpret(cards, question, spreadType);
    return enrichWithLlm(base, question ?? '');
  }
}

export function createInterpretationProvider(): InterpretationProvider {
  if (isAiConfigured()) {
    return new LlmInterpretationProvider();
  }
  return staticProvider;
}
