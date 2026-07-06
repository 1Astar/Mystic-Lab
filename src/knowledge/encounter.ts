import { getCodexEntry } from '../codex/collection.ts';
import { loadJournalEntries } from '../journal/records.ts';
import type { EncounterRecord } from './types.ts';

export function buildEncounterRecord(deckId: string): EncounterRecord | null {
  const entry = getCodexEntry(deckId);
  if (!entry) return null;

  const journalNotes = loadJournalEntries()
    .filter((j) => j.cardIds.includes(deckId) && j.reflection.trim())
    .map((j) => j.reflection.trim())
    .slice(0, 5);

  const questions = entry.encounters
    .map((e) => e.question.trim())
    .filter(Boolean);

  return {
    cardId: deckId,
    firstMetAt: entry.firstSeenAt,
    encounterCount: entry.count,
    questions,
    notes: [...(entry.personalNote ? [entry.personalNote] : []), ...journalNotes],
    lastMetAt: entry.encounters[0]?.at,
  };
}
