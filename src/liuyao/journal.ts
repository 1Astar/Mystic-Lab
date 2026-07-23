import type { CastResult } from './engine.ts';
import type { FourLayerReading } from './interpret.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { ensureSceneTags, normalizeSceneTags } from '../life/scene-tags.ts';
import { currentReadingSubject } from '../life/reading-subject.ts';

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
  /** 完整起卦快照；旧记录可能缺失，回放时按卦名+动爻重建 */
  castSnapshot?: CastResult | null;
  /** 当时是否学习模式；缺省按学习复原（信息更全） */
  learnMode?: boolean | null;
  /** 场景标签（必打） */
  sceneTags?: string[];
  subjectId?: string;
  subjectName?: string;
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
    castSnapshot: entry.castSnapshot ?? null,
    learnMode: entry.learnMode ?? null,
    sceneTags: normalizeSceneTags(entry.sceneTags),
    subjectId: entry.subjectId,
    subjectName: entry.subjectName,
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
  learnMode?: boolean;
  sceneTags?: string[];
}): LiuyaoJournalEntry {
  const subject = currentReadingSubject();
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
    castSnapshot: input.cast,
    learnMode: input.learnMode ?? null,
    sceneTags: ensureSceneTags(input.question, input.sceneTags),
    subjectId: subject.subjectId,
    subjectName: subject.subjectName,
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
