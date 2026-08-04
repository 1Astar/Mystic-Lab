import { astro } from 'iztro';
import type { PersonProfile } from '../life/types.ts';
import { parseBirthParts } from '../bazi/parse-birth.ts';
import { clockToTimeIndex, TIME_INDEX_LABELS } from './time-index.ts';
import { isMajorStar } from './stars.ts';
import { buildTheater } from './narrative.ts';
import type {
  PalaceSnap,
  StarSnap,
  ZiweiChartView,
  ZiweiIntent,
} from './types.ts';

function starSnap(s: {
  name: string;
  brightness?: string;
  mutagen?: string;
  type?: string;
}): StarSnap {
  return {
    name: s.name,
    brightness: s.brightness ?? '',
    mutagen: s.mutagen ?? '',
    isMajor: isMajorStar(s.name) || s.type === 'major',
  };
}

function palaceSnap(p: {
  name: string;
  isOriginalPalace?: boolean;
  isBodyPalace?: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: Array<{ name: string; brightness?: string; mutagen?: string; type?: string }>;
  minorStars: Array<{ name: string; brightness?: string; mutagen?: string; type?: string }>;
  adjectiveStars?: Array<{ name: string; brightness?: string; mutagen?: string; type?: string }>;
  isEmpty?: () => boolean;
  decadal?: { range?: [number, number] };
}): PalaceSnap {
  const majors = (p.majorStars ?? []).map(starSnap);
  const minors = (p.minorStars ?? []).map(starSnap);
  const adjectives = (p.adjectiveStars ?? []).map(starSnap);
  const empty =
    typeof p.isEmpty === 'function' ? Boolean(p.isEmpty()) : majors.length === 0;
  const range = p.decadal?.range;
  return {
    name: p.name,
    isSoul: p.name === '命宫',
    isBody: Boolean(p.isBodyPalace),
    isEmpty: empty,
    heavenlyStem: p.heavenlyStem,
    earthlyBranch: p.earthlyBranch,
    majors,
    minors,
    adjectives,
    decadalRange:
      range && range.length === 2 ? [Number(range[0]), Number(range[1])] : undefined,
  };
}

export function genderToIztro(gender: '' | 'female' | 'male'): '男' | '女' | null {
  if (gender === 'male') return '男';
  if (gender === 'female') return '女';
  return null;
}

export type CastError = { error: string };

export function castZiweiChart(
  person: PersonProfile,
  opts?: { intent?: ZiweiIntent; year?: number; question?: string },
): ZiweiChartView | CastError {
  const parts = parseBirthParts(
    person.birthYear,
    person.birthMonth,
    person.birthDay,
    person.birthHour,
  );
  if (!parts) {
    return { error: '请先填写完整的出生年月日' };
  }
  const gender = genderToIztro(person.gender);
  if (!gender) {
    return { error: '紫微排盘需要性别（阴阳顺逆），请先在档案里选择' };
  }

  const timeIndex = parts.hasHour
    ? clockToTimeIndex(parts.hour, parts.minute)
    : 6; // 未填时辰：取午时中位，结果页会标注
  const solarDate = `${parts.year}-${parts.month}-${parts.day}`;
  const astrolabe = astro.bySolar(solarDate, timeIndex, gender, true, 'zh-CN');

  const palaces = (astrolabe.palaces ?? []).map((p) => palaceSnap(p));
  const soulPalace =
    palaces.find((p) => p.name === '命宫') ??
    palaces.find((p) => p.isSoul) ??
    palaces[0]!;
  const bodyPalace =
    palaces.find((p) => p.isBody) ??
    palaces.find((p) => p.name === '命宫') ??
    soulPalace;

  const intent = opts?.intent ?? 'map';
  const year = opts?.year ?? new Date().getFullYear();
  const theater = buildTheater({
    palaces,
    soulPalace,
    bodyPalace,
    soulStarName: String(astrolabe.soul ?? ''),
    bodyStarName: String(astrolabe.body ?? ''),
    fiveElementsClass: String(astrolabe.fiveElementsClass ?? ''),
    intent,
    year,
    question: opts?.question ?? '',
    horoscopeDate: `${year}-6-15`,
    astrolabe,
  });

  return {
    solarDate,
    timeLabel: parts.hasHour
      ? TIME_INDEX_LABELS[timeIndex] ?? parts.hourLabel
      : '时辰未填（暂按午时）',
    genderLabel: gender,
    soul: String(astrolabe.soul ?? ''),
    body: String(astrolabe.body ?? ''),
    fiveElementsClass: String(astrolabe.fiveElementsClass ?? ''),
    palaces,
    soulPalace,
    bodyPalace,
    theater,
    intent,
  };
}
