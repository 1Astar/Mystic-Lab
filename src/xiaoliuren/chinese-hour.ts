export type ChineseHour = {
  name: string;
  label: string;
  index: number;
  order: number;
  /** 钟点区间，如 23:00 – 01:00 */
  rangeLabel: string;
  /** 传统别名：夜半、鸡鸣… */
  alias: string;
  /** 白话记忆句 */
  memoryHint: string;
  /** 点击彩蛋：人文科普 */
  lore: string;
  startHour: number;
  endHour: number;
};

const HOURS: ChineseHour[] = [
  { name: '子', label: '子时', index: 0, order: 1, rangeLabel: '23:00 – 01:00', alias: '夜半', memoryHint: '深夜十一点到一点，就是子时。', lore: '现代 23:00–01:00，对应古代「夜半」——一日阴阳交替处。记住子时，半夜不用对表也能大致知道。', startHour: 23, endHour: 1 },
  { name: '丑', label: '丑时', index: 1, order: 2, rangeLabel: '01:00 – 03:00', alias: '鸡鸣', memoryHint: '凌晨一点到三点，就是丑时。', lore: '现代 01:00–03:00，对应「鸡鸣」——天未亮、鸡先叫。丑时多半还在熟睡里。', startHour: 1, endHour: 3 },
  { name: '寅', label: '寅时', index: 2, order: 3, rangeLabel: '03:00 – 05:00', alias: '平旦', memoryHint: '凌晨三点到五点，就是寅时。', lore: '现代 03:00–05:00，对应「平旦」——天色将明未明。寅时是阳气初升。', startHour: 3, endHour: 5 },
  { name: '卯', label: '卯时', index: 3, order: 4, rangeLabel: '05:00 – 07:00', alias: '日出', memoryHint: '清晨五点到七点，就是卯时。', lore: '现代 05:00–07:00，对应「日出」。卯时一到，天光正式起来。', startHour: 5, endHour: 7 },
  { name: '辰', label: '辰时', index: 4, order: 5, rangeLabel: '07:00 – 09:00', alias: '食时', memoryHint: '早上七点到九点，就是辰时。', lore: '现代 07:00–09:00，对应「食时」——古人早饭时段。辰时多在通勤与开张。', startHour: 7, endHour: 9 },
  { name: '巳', label: '巳时', index: 5, order: 6, rangeLabel: '09:00 – 11:00', alias: '隅中', memoryHint: '上午九点到十一点，就是巳时。', lore: '现代 09:00–11:00，对应「隅中」——日头将正未正。巳时适合干正经事。', startHour: 9, endHour: 11 },
  { name: '午', label: '午时', index: 6, order: 7, rangeLabel: '11:00 – 13:00', alias: '日中', memoryHint: '中午十一点到一点，就是午时。', lore: '现代 11:00–13:00，对应「日中」——太阳最高。记住午时，就是正中午前后。', startHour: 11, endHour: 13 },
  { name: '未', label: '未时', index: 7, order: 8, rangeLabel: '13:00 – 15:00', alias: '日昳', memoryHint: '午后一点到三点，就是未时。', lore: '现代 13:00–15:00，对应古代「日昳」——太阳偏西，午休后再开工。记住未时，以后不用看表也能知道大概几点。', startHour: 13, endHour: 15 },
  { name: '申', label: '申时', index: 8, order: 9, rangeLabel: '15:00 – 17:00', alias: '晡时', memoryHint: '下午三点到五点，就是申时。', lore: '现代 15:00–17:00，对应「晡时」——下午申刻。申时多在收尾与赶工。', startHour: 15, endHour: 17 },
  { name: '酉', label: '酉时', index: 9, order: 10, rangeLabel: '17:00 – 19:00', alias: '日入', memoryHint: '傍晚五点到七点，就是酉时。', lore: '现代 17:00–19:00，对应「日入」——日落时分。酉时天色收束。', startHour: 17, endHour: 19 },
  { name: '戌', label: '戌时', index: 10, order: 11, rangeLabel: '19:00 – 21:00', alias: '黄昏', memoryHint: '晚上七点到九点，就是戌时。', lore: '现代 19:00–21:00，对应「黄昏」。戌时灯火渐起、夜生活开始。', startHour: 19, endHour: 21 },
  { name: '亥', label: '亥时', index: 11, order: 12, rangeLabel: '21:00 – 23:00', alias: '人定', memoryHint: '晚上九点到十一点，就是亥时。', lore: '现代 21:00–23:00，对应「人定」——人定休息。亥时宜收心。', startHour: 21, endHour: 23 },
];

export const CHINESE_HOURS = HOURS;
export const EARTHLY_BRANCHES = HOURS.map((h) => h.name);

export function formatHourMemory(hour: ChineseHour): string {
  return `${hour.alias} · ${hour.memoryHint}`;
}

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
  return hour.index * 30 - 15 + fraction * 30;
}
