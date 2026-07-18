import type { CastResult } from './engine.ts';
import type { FourLayerReading } from './interpret.ts';
import { LINE_LABELS } from './hexagrams.ts';

export type LiuyaoJournalEntry = {
  id: string;
  createdAt: string;
  /** 占卜时间（可与 createdAt 不同） */
  castAt?: string;
  question: string;
  method: CastResult['method'];
  primaryName: string;
  primaryFullName: string;
  changedFullName: string | null;
  changingLabels: string[];
  shiLine: number;
  yingLine: number;
  summary: string;
  reading: FourLayerReading;
  reflection: string;
  tags: string[];
  fulfilled?: boolean | null;
};

const STORAGE_KEY = 'mystic-lab-liuyao-journal';

function persist(list: LiuyaoJournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
}

function normalize(entry: LiuyaoJournalEntry): LiuyaoJournalEntry {
  return {
    ...entry,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    reflection: entry.reflection ?? '',
  };
}

export function loadLiuyaoJournal(): LiuyaoJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LiuyaoJournalEntry[];
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

export function saveLiuyaoJournalEntry(input: {
  question: string;
  cast: CastResult;
  reading: FourLayerReading;
  changingLabels: string[];
  tags?: string[];
  reflection?: string;
  castAt?: string;
}): LiuyaoJournalEntry {
  const entry: LiuyaoJournalEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    castAt: input.castAt,
    question: input.question.trim(),
    method: input.cast.method,
    primaryName: input.cast.primary.name,
    primaryFullName: input.cast.primary.fullName,
    changedFullName: input.cast.changed?.fullName ?? null,
    changingLabels: input.changingLabels,
    shiLine: input.cast.shiLine,
    yingLine: input.cast.yingLine,
    summary: input.reading.summary,
    reading: input.reading,
    reflection: input.reflection?.trim() ?? '',
    tags: input.tags ?? [],
    fulfilled: null,
  };
  const list = loadLiuyaoJournal();
  list.unshift(entry);
  persist(list);
  return entry;
}

export function updateLiuyaoReflection(id: string, reflection: string): void {
  const list = loadLiuyaoJournal();
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return;
  list[i] = { ...list[i]!, reflection };
  persist(list);
}

export function updateLiuyaoTags(id: string, tags: string[]): void {
  const list = loadLiuyaoJournal();
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return;
  list[i] = { ...list[i]!, tags };
  persist(list);
}

export function updateLiuyaoFulfilled(id: string, fulfilled: boolean): void {
  const list = loadLiuyaoJournal();
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return;
  list[i] = { ...list[i]!, fulfilled };
  persist(list);
}

export function journalMetaLine(entry: LiuyaoJournalEntry): string {
  const date = new Date(entry.castAt ?? entry.createdAt);
  const d = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return `${d} · ${entry.primaryFullName}${
    entry.changedFullName ? ` 变 ${entry.changedFullName}` : ''
  } · 世${LINE_LABELS[entry.shiLine - 1]} / 应${LINE_LABELS[entry.yingLine - 1]}`;
}
