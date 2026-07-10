import type { LessonResult } from './engine.ts';
import type { LunarDate } from './lunar.ts';
import type { ChineseHour } from './chinese-hour.ts';
import type { SixGodId } from './six-gods.ts';

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
};

const STORAGE_KEY = 'mystic-lab-xiaoliuren-journal';

function persist(list: XiaoliurenJournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
}

export function loadXiaoliurenJournal(): XiaoliurenJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as XiaoliurenJournalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    summary: input.lesson.result.summary,
    reflection: '',
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
