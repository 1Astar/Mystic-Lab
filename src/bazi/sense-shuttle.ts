/**
 * 命盘时间穿梭：年帧 + 干支白话 + 换大运知识卡
 */
import type { LifeProfileInput } from '../life/types.ts';
import type { BaziChart } from './cast.ts';
import { BRANCH_WUXING, STEM_WUXING } from './elements.ts';
import { TEN_GOD_PLAIN } from './learn-steps.ts';
import type { DayunColumn, LiunianColumn, LuckCycles } from './luck-cycles.ts';
import { buildYearForecast } from './sense-forecast.ts';

/** 十神 → 心态短词（换运气泡用） */
export const TEN_GOD_ATTITUDE: Record<string, string> = {
  正官: '守规矩扛责',
  七杀: '硬刚冲关',
  正财: '稳拿结果',
  偏财: '抓流动机会',
  正印: '求懂求托',
  偏印: '独辟蹊径',
  食神: '求稳创造',
  伤官: '锋芒表达',
  比肩: '并肩硬刚',
  劫财: '争夺互换',
};

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);
const YANG_BRANCHES = new Set(['子', '寅', '辰', '午', '申', '戌']);

export type ShuttleRange = {
  minYear: number;
  maxYear: number;
  birthYear: number;
  nowYear: number;
};

export type DecadeShiftCard = {
  key: string;
  fromGod: string;
  toGod: string;
  fromPlain: string;
  toPlain: string;
  fromAttitude: string;
  toAttitude: string;
  body: string;
};

export type ShuttleFrame = {
  year: number;
  age: number;
  birthYear: number;
  nowYear: number;
  isNow: boolean;
  isPast: boolean;
  isFuture: boolean;
  liunianGanZhi: string;
  liunianStemGod: string;
  liunianHint: string;
  dayunGanZhi: string;
  dayunStemGod: string;
  dayunHint: string;
  dayunEmpty: boolean;
  dayunStartYear: number;
  dayunEndYear: number;
  title: string;
  weather: string;
  tone: string;
  decadeNote?: string;
  shipMetaphor: string;
  yearTag: string;
};

export const SHIP_METAPHOR =
  '本命四柱像一艘船，始终停在水面上；大运是十年季节，流年是当年风浪——船不动，天上的云在换。';

export function shuttleYearRange(
  birthYear: number,
  now = new Date(),
  futureYears = 10,
): ShuttleRange {
  const nowYear = now.getFullYear();
  const minYear = Number.isFinite(birthYear) ? birthYear : nowYear - 40;
  const maxYear = Math.max(minYear + 1, nowYear + futureYears);
  return { minYear, maxYear, birthYear: minYear, nowYear };
}

export function clampShuttleYear(year: number, range: ShuttleRange): number {
  return Math.min(range.maxYear, Math.max(range.minYear, Math.floor(year)));
}

/** 甲子 → 阳木 + 阳水 */
export function ganZhiPlainHint(ganZhi: string): string {
  const stem = ganZhi.charAt(0);
  const branch = ganZhi.charAt(1);
  if (!stem || !branch) return '';
  const sw = STEM_WUXING[stem];
  const bw = BRANCH_WUXING[branch];
  if (!sw || !bw) return '';
  const sy = YANG_STEMS.has(stem) ? '阳' : '阴';
  const by = YANG_BRANCHES.has(branch) ? '阳' : '阴';
  return `${sy}${sw} + ${by}${bw}`;
}

export function attitudeOfGod(god: string): string {
  return TEN_GOD_ATTITUDE[god] || TEN_GOD_PLAIN[god] || '换一种节奏';
}

export function decadeShiftCard(fromGod: string, toGod: string): DecadeShiftCard | null {
  const from = fromGod.trim();
  const to = toGod.trim();
  if (!from || !to || from === to) return null;
  const fromAttitude = attitudeOfGod(from);
  const toAttitude = attitudeOfGod(to);
  const fromPlain = TEN_GOD_PLAIN[from] || from;
  const toPlain = TEN_GOD_PLAIN[to] || to;
  return {
    key: `${from}->${to}`,
    fromGod: from,
    toGod: to,
    fromPlain,
    toPlain,
    fromAttitude,
    toAttitude,
    body: `注意！你现在跨越了十年大运。你的「主导能量」从【${from}】切换到【${to}】。做事心态将从「${fromAttitude}」转变为「${toAttitude}」，这会是你人生的一道分水岭。`,
  };
}

export function findDayunForYear(luck: LuckCycles, year: number): DayunColumn | null {
  return (
    luck.dayun.find((d) => year >= d.startYear && year <= d.endYear) ??
    luck.dayun.find((d) => d.current) ??
    null
  );
}

export function findLiunianForYear(luck: LuckCycles, year: number): LiunianColumn | null {
  return luck.liunian.find((n) => n.year === year) ?? null;
}

export function buildShuttleFrame(
  chart: BaziChart,
  profile: LifeProfileInput,
  luck: LuckCycles,
  year: number,
  opts?: { gender?: '' | 'female' | 'male'; now?: Date },
): ShuttleFrame {
  const nowYear = (opts?.now ?? new Date()).getFullYear();
  const birthYear = Number(profile.birthYear) || nowYear;
  const y = year;
  const dayun = findDayunForYear(luck, y);
  const liu = findLiunianForYear(luck, y);
  const forecast = buildYearForecast(chart, profile, {
    gender: opts?.gender ?? '',
    year: y,
  });

  const dayunGz = dayun && !dayun.empty ? dayun.ganZhi : '';
  const dayunGod = dayun && !dayun.empty ? dayun.stemGod : '';
  const liuGz = liu?.ganZhi || '';
  const liuGod = liu?.stemGod || '';

  let yearTag = String(y);
  if (y === nowYear) yearTag = `${y} · 今`;
  else if (y < nowYear) yearTag = `${y} · 过去`;
  else yearTag = `${y} · 未来`;

  return {
    year: y,
    age: Math.max(1, y - birthYear + 1),
    birthYear,
    nowYear,
    isNow: y === nowYear,
    isPast: y < nowYear,
    isFuture: y > nowYear,
    liunianGanZhi: liuGz,
    liunianStemGod: liuGod,
    liunianHint: ganZhiPlainHint(liuGz),
    dayunGanZhi: dayunGz,
    dayunStemGod: dayunGod,
    dayunHint: ganZhiPlainHint(dayunGz),
    dayunEmpty: !dayun || dayun.empty,
    dayunStartYear: dayun?.startYear ?? y,
    dayunEndYear: dayun?.endYear ?? y,
    title: forecast.title,
    weather: dayun?.empty ? '起运前的薄雾天' : forecast.weather,
    tone: dayun?.empty
      ? '童限还没有干支大运：先看本命船怎么造的，季节云要等起运后才飘来。'
      : forecast.tone,
    decadeNote: forecast.decadeNote,
    shipMetaphor: SHIP_METAPHOR,
    yearTag,
  };
}
