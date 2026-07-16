import type { LessonResult } from './engine.ts';
import type { LunarDate } from './lunar.ts';
import type { ChineseHour } from './chinese-hour.ts';
import { sixGodOneLiner, type SixGodId } from './six-gods.ts';

export type XiaoliurenJournalEntry = {
  id: string;
  createdAt: string;
  question: string;
  solarLabel: string;
  lunar: Pick<LunarDate, 'label' | 'monthLabel' | 'dayLabel' | 'month' | 'day'>;
  hour: Pick<ChineseHour, 'name' | 'label' | 'rangeLabel'>;
  resultId: SixGodId;
  resultName: string;
  summary: string;
  reflection: string;
  /** true 应验 / false 未应验 / null 未标 */
  fulfilled?: boolean | null;
};

/** 起课后满此时长且未标对照 → 待对照 */
export const REVIEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

const STORAGE_KEY = 'mystic-lab-xiaoliuren-journal';

function persist(list: XiaoliurenJournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
}

function normalizeEntry(entry: XiaoliurenJournalEntry): XiaoliurenJournalEntry {
  return {
    ...entry,
    fulfilled: entry.fulfilled ?? null,
  };
}

export function loadXiaoliurenJournal(): XiaoliurenJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as XiaoliurenJournalEntry[];
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

export function isXiaoliurenDueForReview(
  entry: XiaoliurenJournalEntry,
  nowMs = Date.now(),
): boolean {
  if (entry.fulfilled === true || entry.fulfilled === false) return false;
  const created = new Date(entry.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return nowMs - created >= REVIEW_AFTER_MS;
}

export function listXiaoliurenDueForReview(nowMs = Date.now()): XiaoliurenJournalEntry[] {
  return loadXiaoliurenJournal().filter((e) => isXiaoliurenDueForReview(e, nowMs));
}

export function fulfilledLabel(fulfilled: boolean | null | undefined): string {
  if (fulfilled === true) return '后来对照：应验';
  if (fulfilled === false) return '后来对照：未应验';
  return '';
}

export function saveXiaoliurenJournalEntry(input: {
  question: string;
  solarLabel: string;
  lunar: LunarDate;
  hour: ChineseHour;
  lesson: LessonResult;
}): XiaoliurenJournalEntry {
  const entry: XiaoliurenJournalEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    question: input.question.trim(),
    solarLabel: input.solarLabel,
    lunar: {
      label: input.lunar.label,
      monthLabel: input.lunar.monthLabel,
      dayLabel: input.lunar.dayLabel,
      month: input.lunar.month,
      day: input.lunar.day,
    },
    hour: {
      name: input.hour.name,
      label: input.hour.label,
      rangeLabel: input.hour.rangeLabel,
    },
    resultId: input.lesson.result.id,
    resultName: input.lesson.result.name,
    summary: sixGodOneLiner(input.lesson.result),
    reflection: '',
    fulfilled: null,
  };

  const list = loadXiaoliurenJournal();
  list.unshift(entry);
  persist(list);
  return entry;
}

export function updateXiaoliurenReflection(id: string, reflection: string): void {
  const list = loadXiaoliurenJournal();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.reflection = reflection.trim();
  persist(list);
}

export function updateXiaoliurenFulfilled(id: string, fulfilled: boolean): void {
  const list = loadXiaoliurenJournal();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.fulfilled = fulfilled;
  persist(list);
}

export function getXiaoliurenJournalEntry(id: string): XiaoliurenJournalEntry | undefined {
  return loadXiaoliurenJournal().find((e) => e.id === id);
}
