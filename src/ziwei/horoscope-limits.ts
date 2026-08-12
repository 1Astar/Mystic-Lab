/**
 * 由选中的大限/流年日期解析运限落宫（iztro horoscope）
 */
import { astro } from 'iztro';
import type { PersonProfile } from '../life/types.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { genderToIztro } from './cast.ts';
import { formatMutagenLine } from './mutagen-format.ts';
import { clockToTimeIndex } from './time-index.ts';

export type LimitBoardSelection = {
  decadePalace?: string;
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
};

export type HoroscopeLimitSnap = {
  dateStr: string;
  decadePalace: string;
  yearPalace: string;
  monthPalace: string;
  dayPalace: string;
  hourPalace: string;
  /** 流年四化：破军化禄 · … */
  yearMutagenLine: string;
  decadeMutagenLine: string;
  /** 流月四化 */
  monthMutagenLine: string;
  yearGZ: string;
  decadeGZ: string;
  monthGZ: string;
  decadeAge?: [number, number];
  yearMutagen: string[];
  monthMutagen: string[];
  decadeMutagen: string[];
};

function palaceAt(
  palaces: Array<{ name: string }>,
  index: number | undefined,
): string {
  if (typeof index !== 'number' || index < 0 || index >= palaces.length) return '';
  return palaces[index]?.name ?? '';
}

/** 阳历近似：流月/流日按公历月日；流时用时辰序号 */
export function resolveHoroscopeLimits(
  person: PersonProfile,
  sel: LimitBoardSelection,
): HoroscopeLimitSnap | null {
  const parts = parseBirthParts(
    person.birthYear,
    person.birthMonth,
    person.birthDay,
    person.birthHour,
  );
  const gender = genderToIztro(person.gender);
  if (!parts || !gender) return null;

  const birthTime = parts.hasHour
    ? clockToTimeIndex(parts.hour, parts.minute)
    : 6;
  const solarDate = `${parts.year}-${parts.month}-${parts.day}`;
  const astrolabe = astro.bySolar(solarDate, birthTime, gender, true, 'zh-CN');

  const year = sel.year ?? new Date().getFullYear();
  const month = Math.min(12, Math.max(1, sel.month ?? 6));
  const day = Math.min(28, Math.max(1, sel.day ?? 15));
  const hour = typeof sel.hour === 'number' ? sel.hour : 6;
  const dateStr = `${year}-${month}-${day}`;

  const h = astrolabe.horoscope(dateStr, hour);
  const palaces = astrolabe.palaces ?? [];

  const decadePalace = palaceAt(palaces, h.decadal?.index);
  const yearPalace = palaceAt(palaces, h.yearly?.index);
  const monthPalace = palaceAt(palaces, h.monthly?.index);
  const dayPalace = palaceAt(palaces, h.daily?.index);
  const hourPalace = palaceAt(palaces, h.hourly?.index);

  const decadeSnap = decadePalace
    ? palaces.find((p) => p.name === decadePalace)
    : undefined;
  const range = decadeSnap?.decadal?.range as [number, number] | undefined;

  const yearMutagen = (h.yearly?.mutagen as string[] | undefined) ?? [];
  const monthMutagen = (h.monthly?.mutagen as string[] | undefined) ?? [];
  const decadeMutagen = (h.decadal?.mutagen as string[] | undefined) ?? [];

  return {
    dateStr,
    decadePalace,
    yearPalace,
    monthPalace,
    dayPalace,
    hourPalace,
    yearMutagenLine: formatMutagenLine(yearMutagen),
    decadeMutagenLine: formatMutagenLine(decadeMutagen),
    monthMutagenLine: formatMutagenLine(monthMutagen),
    yearGZ: `${h.yearly?.heavenlyStem ?? ''}${h.yearly?.earthlyBranch ?? ''}`,
    decadeGZ: `${h.decadal?.heavenlyStem ?? ''}${h.decadal?.earthlyBranch ?? ''}`,
    monthGZ: `${h.monthly?.heavenlyStem ?? ''}${h.monthly?.earthlyBranch ?? ''}`,
    decadeAge: range ? [Number(range[0]), Number(range[1])] : undefined,
    yearMutagen,
    monthMutagen,
    decadeMutagen,
  };
}
