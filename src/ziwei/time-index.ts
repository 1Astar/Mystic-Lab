/** 钟点 → iztro 时辰序号 0–12（早子…晚子） */

export function clockToTimeIndex(hour: number, minute = 0): number {
  const h = ((hour % 24) + 24) % 24;
  const total = h * 60 + minute;
  // 23:00–00:59 早子；01:00–02:59 丑 …；21:00–22:59 亥
  if (total >= 23 * 60 || total < 60) return 0;
  if (total < 3 * 60) return 1;
  if (total < 5 * 60) return 2;
  if (total < 7 * 60) return 3;
  if (total < 9 * 60) return 4;
  if (total < 11 * 60) return 5;
  if (total < 13 * 60) return 6;
  if (total < 15 * 60) return 7;
  if (total < 17 * 60) return 8;
  if (total < 19 * 60) return 9;
  if (total < 21 * 60) return 10;
  return 11;
}

export const TIME_INDEX_LABELS = [
  '早子时',
  '丑时',
  '寅时',
  '卯时',
  '辰时',
  '巳时',
  '午时',
  '未时',
  '申时',
  '酉时',
  '戌时',
  '亥时',
  '晚子时',
] as const;
