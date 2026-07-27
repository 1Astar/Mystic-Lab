import { getCodexEntry } from '../codex/collection.ts';
import { loadJournalEntries } from '../journal/records.ts';
import type { EncounterRecord } from './types.ts';

function uniqueQuestions(questions: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of questions) {
    const key = q.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function buildEncounterRecord(deckId: string): EncounterRecord | null {
  const entry = getCodexEntry(deckId);
  if (!entry) return null;

  const journalNotes = loadJournalEntries()
    .filter((j) => j.cardIds.includes(deckId) && j.reflection.trim())
    .map((j) => j.reflection.trim())
    .slice(0, 5);

  const questions = uniqueQuestions(entry.encounters.map((e) => e.question));

  return {
    cardId: deckId,
    firstMetAt: entry.firstSeenAt,
    encounterCount: entry.count,
    questions,
    notes: [...(entry.personalNote ? [entry.personalNote] : []), ...journalNotes],
    lastMetAt: entry.encounters[0]?.at,
    timeline: entry.encounters.slice(0, 8).map((e) => ({
      at: e.at,
      question: e.question.trim(),
      spreadLabel: e.spreadLabel,
      reversed: e.reversed,
      summary: e.summary,
      guidance: e.guidance,
      journalId: e.journalId,
    })),
  };
}
