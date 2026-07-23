import { Lunar, LunarMonth, Solar } from 'lunar-javascript';
import { parseBirthHour, parseBirthParts } from './parse-birth.ts';

export type BirthSolarValue = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type CalendarMode = 'solar' | 'lunar';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 钟点所在时辰（23–1 子，1–3 丑…） */
export function shichenOfHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const idx = Math.floor(((h + 1) % 24) / 2);
  return BRANCHES[idx]!;
}

export function hourWheelLabel(hour: number): string {
  return `${hour}${shichenOfHour(hour)}时`;
}

export function daysInSolarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function daysInLunarMonth(year: number, month: number): number {
  try {
    return LunarMonth.fromYm(year, month).getDayCount();
  } catch {
    return 30;
  }
}

export type LunarMonthOption = { month: number; label: string };

/** 某农历年的月份列表（含闰月，按时间序） */
export function lunarMonthsInYear(year: number): LunarMonthOption[] {
  const out: LunarMonthOption[] = [];
  for (let m = 1; m <= 12; m++) {
    try {
      const L = Lunar.fromYmd(year, m, 1);
      if (L.getYear() === year) {
        out.push({ month: m, label: `${L.getMonthInChinese()}月` });
      }
    } catch {
      /* skip */
    }
    try {
      const L = Lunar.fromYmd(year, -m, 1);
      if (L.getYear() === year) {
        out.push({ month: -m, label: `${L.getMonthInChinese()}月` });
      }
    } catch {
      /* no leap */
    }
  }
  out.sort((a, b) => {
    const sa = Lunar.fromYmd(year, a.month, 1).getSolar().toYmd();
    const sb = Lunar.fromYmd(year, b.month, 1).getSolar().toYmd();
    return sa.localeCompare(sb);
  });
  return out;
}

export function lunarDayLabel(day: number): string {
  try {
    return Lunar.fromYmd(2000, 1, Math.min(Math.max(day, 1), 30)).getDayInChinese();
  } catch {
    return `${day}日`;
  }
}

/** 用真实年月拿日名（更准） */
export function lunarDayLabelInMonth(year: number, month: number, day: number): string {
  try {
    return Lunar.fromYmd(year, month, day).getDayInChinese();
  } catch {
    return lunarDayLabel(day);
  }
}

export function solarToLunar(
  value: BirthSolarValue,
): { year: number; month: number; day: number } {
  const lunar = Solar.fromYmdHms(
    value.year,
    value.month,
    value.day,
    value.hour,
    value.minute,
    0,
  ).getLunar();
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
  };
}

export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): BirthSolarValue {
  const solar = Lunar.fromYmd(year, month, day).getSolar();
  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    hour,
    minute,
  };
}

export function clampBirthSolar(value: BirthSolarValue): BirthSolarValue {
  const year = Math.min(2100, Math.max(1900, value.year));
  const month = Math.min(12, Math.max(1, value.month));
  const maxDay = daysInSolarMonth(year, month);
  const day = Math.min(maxDay, Math.max(1, value.day));
  const hour = Math.min(23, Math.max(0, value.hour));
  const minute = Math.min(59, Math.max(0, value.minute));
  return { year, month, day, hour, minute };
}

export function defaultBirthSolar(): BirthSolarValue {
  return { year: 1990, month: 1, day: 1, hour: 12, minute: 0 };
}

export function valueFromBirthFields(
  birthYear: string,
  birthMonth: string,
  birthDay: string,
  birthHour: string,
): BirthSolarValue | null {
  const parts = parseBirthParts(birthYear, birthMonth, birthDay, birthHour);
  if (!parts) return null;
  return clampBirthSolar({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hasHour ? parts.hour : 12,
    minute: parts.hasHour ? parts.minute : 0,
  });
}

export function birthFieldsFromValue(value: BirthSolarValue): {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
} {
  const v = clampBirthSolar(value);
  return {
    birthYear: String(v.year),
    birthMonth: String(v.month),
    birthDay: String(v.day),
    birthHour: `${v.hour}:${String(v.minute).padStart(2, '0')}`,
  };
}

export function formatBirthDatetimeSummary(value: BirthSolarValue, mode: CalendarMode): string {
  const v = clampBirthSolar(value);
  const hm = `${v.hour}${shichenOfHour(v.hour)}时${String(v.minute).padStart(2, '0')}分`;
  if (mode === 'solar') {
    return `公历:${v.year}年${v.month}月${v.day}日 ${hm}`;
  }
  const L = solarToLunar(v);
  const monthName = (() => {
    try {
      return `${Lunar.fromYmd(L.year, L.month, 1).getMonthInChinese()}月`;
    } catch {
      return `${L.month}月`;
    }
  })();
  const dayName = lunarDayLabelInMonth(L.year, L.month, L.day);
  return `农历:${L.year}年${monthName}${dayName} ${hm}`;
}

export function formatBirthTriggerLabel(value: BirthSolarValue | null): string {
  if (!value) return '点击选择出生时间';
  const v = clampBirthSolar(value);
  const solar = `${v.year}-${String(v.month).padStart(2, '0')}-${String(v.day).padStart(2, '0')}`;
  const lunar = solarToLunar(v);
  let lunarText = '';
  try {
    const L = Lunar.fromYmd(lunar.year, lunar.month, lunar.day);
    lunarText = `农历${L.getMonthInChinese()}月${L.getDayInChinese()}`;
  } catch {
    lunarText = '';
  }
  const hour = `${hourWheelLabel(v.hour)}${String(v.minute).padStart(2, '0')}分`;
  return lunarText ? `${solar} · ${lunarText} · ${hour}` : `${solar} · ${hour}`;
}

/** 兼容旧「午时」等：解析失败则用默认 */
export function resolveInitialValue(
  birthYear: string,
  birthMonth: string,
  birthDay: string,
  birthHour: string,
): BirthSolarValue {
  return (
    valueFromBirthFields(birthYear, birthMonth, birthDay, birthHour) ?? defaultBirthSolar()
  );
}

export function hasParsedHour(birthHour: string): boolean {
  return parseBirthHour(birthHour).kind !== 'none';
}
