import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import type { ReadingResult } from '../interpretation/types.ts';

export type JournalEntry = {
  id: string;
  createdAt: string;
  question: string;
  spreadType: SpreadType;
  cardIds: string[];
  cards: { name: string; position: string; reversed: boolean }[];
  summary: string;
  learningNote: string;
  reflection: string;
  fulfilled?: boolean | null;
};

const STORAGE_KEY = 'mystic-lab-journal';

export function saveJournalEntry(
  question: string,
  spreadType: SpreadType,
  cards: DrawnCard[],
  reading: ReadingResult,
  learningNote: string,
  reflection = '',
): JournalEntry {
  const entry: JournalEntry = {
    id: `j-${Date.now()}`,
    createdAt: new Date().toISOString(),
    question,
    spreadType,
    cardIds: cards.map((c) => c.card.id),
    cards: cards.map((c) => ({
      name: c.card.nameZh,
      position: c.position ?? '',
      reversed: c.reversed,
    })),
    summary: reading.summary,
    learningNote,
    reflection,
    fulfilled: null,
  };

  const list = loadJournalEntries();
  list.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
  return entry;
}

export function updateJournalReflection(id: string, reflection: string): void {
  const list = loadJournalEntries();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.reflection = reflection;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function updateJournalFulfilled(id: string, fulfilled: boolean): void {
  const list = loadJournalEntries();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.fulfilled = fulfilled;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function loadJournalEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    return parsed.map((e) => ({
      ...e,
      cardIds: e.cardIds ?? [],
      reflection: e.reflection ?? '',
      fulfilled: e.fulfilled ?? null,
    }));
  } catch {
    return [];
  }
}
