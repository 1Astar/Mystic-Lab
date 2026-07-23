import { CHINESE_HOURS, type ChineseHour } from './chinese-hour.ts';
import { computeLesson, type LessonResult } from './engine.ts';
import type { LunarDate } from './lunar.ts';
import type { XiaoliurenJournalEntry } from './journal.ts';

export type XiaoliurenLessonResolve = {
  lesson: LessonResult;
  lunar: LunarDate;
  hour: ChineseHour;
  regenerated: boolean;
  entry: XiaoliurenJournalEntry;
};

function resolveHour(entry: XiaoliurenJournalEntry): ChineseHour | null {
  return (
    CHINESE_HOURS.find((h) => h.name === entry.hour.name) ??
    CHINESE_HOURS.find((h) => h.label === entry.hour.label) ??
    null
  );
}

function resolveLunar(entry: XiaoliurenJournalEntry): LunarDate {
  const year = new Date(entry.createdAt).getFullYear();
  return {
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    month: entry.lunar.month,
    day: entry.lunar.day,
    isLeapMonth: false,
    label: entry.lunar.label,
    monthLabel: entry.lunar.monthLabel,
    dayLabel: entry.lunar.dayLabel,
  };
}

/** 小六壬起课可完全由农历月日+时辰重建 */
export function resolveXiaoliurenLesson(
  entry: XiaoliurenJournalEntry,
): XiaoliurenLessonResolve | null {
  const hour = resolveHour(entry);
  if (!hour) return null;
  const lunar = resolveLunar(entry);
  try {
    const lesson = computeLesson(lunar, hour);
    return {
      lesson,
      lunar,
      hour,
      regenerated: true,
      entry,
    };
  } catch {
    return null;
  }
}
