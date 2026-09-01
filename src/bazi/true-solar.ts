import { CST_MERIDIAN } from './cities.ts';

/** 均时差近似（分钟），Spencer 公式 */
export function equationOfTimeMinutes(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const dayOfYear =
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000;
  const b = ((2 * Math.PI) / 365) * (dayOfYear - 81);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * 钟表时刻（东八区本地）→ 真太阳时 Date。
 * 修正 = 4*(lng-120) + 均时差（分钟）。
 */
export function toTrueSolarDate(
  clock: Date,
  lng: number,
  opts?: { applyEquationOfTime?: boolean },
): Date {
  const applyEot = opts?.applyEquationOfTime !== false;
  const longOffset = 4 * (lng - CST_MERIDIAN);
  const eot = applyEot ? equationOfTimeMinutes(clock) : 0;
  return new Date(clock.getTime() + (longOffset + eot) * 60_000);
}

/**
 * 真太阳时 → 东八区钟表时刻（反推）。
 * 用于「要得到某真太阳时辰，本地钟该拨几点」。
 */
export function clockDateFromTrueSolar(
  trueSolar: Date,
  lng: number,
  opts?: { applyEquationOfTime?: boolean },
): Date {
  const applyEot = opts?.applyEquationOfTime !== false;
  const longOffset = 4 * (lng - CST_MERIDIAN);
  // 均时差按真太阳日近似；与 toTrueSolarDate 互逆误差通常 <1 分钟
  const eot = applyEot ? equationOfTimeMinutes(trueSolar) : 0;
  return new Date(trueSolar.getTime() - (longOffset + eot) * 60_000);
}

/** 经度相对东八区标准经线的钟表偏移（分钟）：西边为负（真太阳更早） */
export function longitudeOffsetMinutes(lng: number): number {
  return 4 * (lng - CST_MERIDIAN);
}

/** 0–23 点（真太阳或钟表）→ 地支时辰 */
export function hourToShichenBranch(hour: number): string {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const table: ReadonlyArray<{ start: number; end: number; branch: string }> = [
    { start: 23, end: 1, branch: '子' },
    { start: 1, end: 3, branch: '丑' },
    { start: 3, end: 5, branch: '寅' },
    { start: 5, end: 7, branch: '卯' },
    { start: 7, end: 9, branch: '辰' },
    { start: 9, end: 11, branch: '巳' },
    { start: 11, end: 13, branch: '午' },
    { start: 13, end: 15, branch: '未' },
    { start: 15, end: 17, branch: '申' },
    { start: 17, end: 19, branch: '酉' },
    { start: 19, end: 21, branch: '戌' },
    { start: 21, end: 23, branch: '亥' },
  ];
  for (const row of table) {
    if (row.start < row.end) {
      if (h >= row.start && h < row.end) return row.branch;
    } else if (h >= row.start || h < row.end) {
      return row.branch;
    }
  }
  return '子';
}

export function formatHm(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 目标「真太阳时辰中点」→ 当地应填入档案的钟表时刻。
 */
export function clockHmForShichenMid(
  year: number,
  month: number,
  day: number,
  midHour: number,
  lng: number,
): { clockHm: string; trueSolarHm: string; offsetMin: number } {
  const trueSolar = new Date(year, month - 1, day, midHour, 0, 0);
  const clock = clockDateFromTrueSolar(trueSolar, lng);
  const offsetMin = Math.round((clock.getTime() - trueSolar.getTime()) / 60_000);
  return {
    clockHm: formatHm(clock),
    trueSolarHm: formatHm(trueSolar),
    offsetMin,
  };
}
