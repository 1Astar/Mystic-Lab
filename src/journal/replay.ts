import type { DrawnCard } from '../tarot/engine.ts';
import { buildReadingResult } from '../interpretation/contextual-reading.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import { SPREADS } from '../tarot/spreads.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import type { JournalEntry } from './records.ts';

export function reconstructDrawnCards(entry: JournalEntry): DrawnCard[] {
  return entry.cards.map((c, i) => {
    const cardId = entry.cardIds[i];
    const card =
      (cardId ? TAROT_DECK.find((d) => d.id === cardId) : undefined) ??
      TAROT_DECK.find((d) => d.nameZh === c.name);
    if (!card) {
      throw new Error(`Unknown card: ${cardId ?? c.name}`);
    }
    const spreadPos = SPREADS[entry.spreadType].positions[i];
    return {
      card,
      reversed: c.reversed,
      position: c.position || spreadPos?.label,
      positionKey: spreadPos?.key ?? (c.position === '补牌' ? 'clarifier' : undefined),
    };
  });
}

export type JournalReadingResolve = {
  reading: ReadingResult;
  /** 无快照时为根据记录重新生成 */
  regenerated: boolean;
};

export function resolveJournalReading(entry: JournalEntry): JournalReadingResolve {
  if (entry.readingSnapshot?.cards?.length) {
    return { reading: entry.readingSnapshot, regenerated: false };
  }

  const drawn = reconstructDrawnCards(entry);
  const reading = buildReadingResult(drawn, entry.question, entry.spreadType);
  reading.summary = entry.summary || reading.summary;
  reading.learningNote = entry.learningNote || reading.learningNote;
  return { reading, regenerated: true };
}
