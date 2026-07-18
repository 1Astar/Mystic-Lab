import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import { buildReadingResult } from './contextual-reading.ts';
import type { InterpretOptions, InterpretationProvider, ReadingResult } from './types.ts';

export class StaticInterpretationProvider implements InterpretationProvider {
  async interpret(
    cards: DrawnCard[],
    question?: string,
    spreadType?: SpreadType,
    options?: InterpretOptions,
  ): Promise<ReadingResult> {
    return buildReadingResult(
      cards,
      question ?? '',
      spreadType ?? 'past-present-future',
      options,
    );
  }
}

export const staticProvider = new StaticInterpretationProvider();
