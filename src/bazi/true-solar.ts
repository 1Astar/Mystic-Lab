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
