import { Solar } from 'lunar-javascript';

export type SiZhu = {
  year: string;
  month: string;
  day: string;
  hour: string;
  dayStem: string;
  dayXunKong: string;
};

/** 公历时刻 → 四柱（lunar-javascript） */
export function siZhuFromDate(date: Date): SiZhu {
  const lunar = Solar.fromDate(date).getLunar();
  const day = lunar.getDayInGanZhi();
  return {
    year: lunar.getYearInGanZhi(),
    month: lunar.getMonthInGanZhi(),
    day,
    hour: lunar.getTimeInGanZhi(),
    dayStem: day.charAt(0),
    dayXunKong: lunar.getDayXunKong(),
  };
}

/** datetime-local 值 ↔ Date */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): Date {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
