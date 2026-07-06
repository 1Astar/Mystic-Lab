import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import type { InterpretationProvider, ReadingResult } from './types.ts';
import { staticProvider } from './static-provider.ts';

export class LlmInterpretationProvider implements InterpretationProvider {
  async interpret(
    cards: DrawnCard[],
    question?: string,
    spreadType?: SpreadType,
  ): Promise<ReadingResult> {
    const apiKey = import.meta.env.VITE_LLM_API_KEY;
    if (!apiKey) {
      return staticProvider.interpret(cards, question, spreadType);
    }
    return staticProvider.interpret(cards, question, spreadType);
  }
}

export function createInterpretationProvider(): InterpretationProvider {
  const apiKey = import.meta.env.VITE_LLM_API_KEY;
  if (apiKey) {
    return new LlmInterpretationProvider();
  }
  return staticProvider;
}
