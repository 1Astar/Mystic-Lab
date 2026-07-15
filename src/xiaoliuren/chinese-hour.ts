export type ChineseHour = {
  name: string;
  label: string;
  index: number;
  order: number;
  rangeLabel: string;
  memoryHint: string;
  startHour: number;
  endHour: number;
};

const HOURS: ChineseHour[] = [
  { name: '子', label: '子时', index: 0, order: 1, rangeLabel: '23:00 – 01:00', memoryHint: '深夜十一点到一点，就是子时。', startHour: 23, endHour: 1 },
  { name: '丑', label: '丑时', index: 1, order: 2, rangeLabel: '01:00 – 03:00', memoryHint: '凌晨一点到三点，就是丑时。', startHour: 1, endHour: 3 },
  { name: '寅', label: '寅时', index: 2, order: 3, rangeLabel: '03:00 – 05:00', memoryHint: '凌晨三点到五点，就是寅时。', startHour: 3, endHour: 5 },
  { name: '卯', label: '卯时', index: 3, order: 4, rangeLabel: '05:00 – 07:00', memoryHint: '清晨五点到七点，就是卯时。', startHour: 5, endHour: 7 },
  { name: '辰', label: '辰时', index: 4, order: 5, rangeLabel: '07:00 – 09:00', memoryHint: '早上七点到九点，就是辰时。', startHour: 7, endHour: 9 },
  { name: '巳', label: '巳时', index: 5, order: 6, rangeLabel: '09:00 – 11:00', memoryHint: '上午九点到十一点，就是巳时。', startHour: 9, endHour: 11 },
  { name: '午', label: '午时', index: 6, order: 7, rangeLabel: '11:00 – 13:00', memoryHint: '中午十一点到一点，就是午时。', startHour: 11, endHour: 13 },
  { name: '未', label: '未时', index: 7, order: 8, rangeLabel: '13:00 – 15:00', memoryHint: '午后一点到三点，就是未时。', startHour: 13, endHour: 15 },
  { name: '申', label: '申时', index: 8, order: 9, rangeLabel: '15:00 – 17:00', memoryHint: '下午三点到五点，就是申时。', startHour: 15, endHour: 17 },
  { name: '酉', label: '酉时', index: 9, order: 10, rangeLabel: '17:00 – 19:00', memoryHint: '傍晚五点到七点，就是酉时。', startHour: 17, endHour: 19 },
  { name: '戌', label: '戌时', index: 10, order: 11, rangeLabel: '19:00 – 21:00', memoryHint: '晚上七点到九点，就是戌时。', startHour: 19, endHour: 21 },
  { name: '亥', label: '亥时', index: 11, order: 12, rangeLabel: '21:00 – 23:00', memoryHint: '晚上九点到十一点，就是亥时。', startHour: 21, endHour: 23 },
];

export const CHINESE_HOURS = HOURS;
export const EARTHLY_BRANCHES = HOURS.map((h) => h.name);

export function getChineseHour(date: Date = new Date()): ChineseHour {
  const h = date.getHours();
  for (const hour of HOURS) {
    if (hour.startHour > hour.endHour) {
      if (h >= hour.startHour || h < hour.endHour) return hour;
    } else if (h >= hour.startHour && h < hour.endHour) {
      return hour;
    }
  }
  return HOURS[0];
}

export function formatClockTime(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function clockAngle(date: Date = new Date()): number {
  const h = date.getHours();
  const m = date.getMinutes();
  return ((h % 12) + m / 60) * 30;
}

/** 时辰盘指针：子在 12 点，顺时针每格 30°；在当前时辰扇区内按时刻从起点插到终点 */
export function sectorPointerAngle(date: Date = new Date()): number {
  const hour = getChineseHour(date);
  const h = date.getHours();
  const m = date.getMinutes();
  let elapsed = 0;
  if (hour.startHour > hour.endHour) {
    if (h >= hour.startHour) {
      elapsed = h - hour.startHour + m / 60;
    } else {
      elapsed = 24 - hour.startHour + h + m / 60;
    }
  } else {
    elapsed = h - hour.startHour + m / 60;
  }
  const fraction = Math.min(1, Math.max(0, elapsed / 2));
  // 与扇区高亮一致：扇区中心为 index*30，半宽 ±15°
  return hour.index * 30 - 15 + fraction * 30;
}
