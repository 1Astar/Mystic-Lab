/** 公历 → 农历（1900–2100，无第三方依赖） */

export type LunarDate = {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  label: string;
  monthLabel: string;
  dayLabel: string;
};

const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05270, 0x07263, 0x02650, 0x059d0, 0x05aa0,
  0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0,
  0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63,
  0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, 0x0a2e0,
  0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, 0x052d0,
  0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, 0x0b273,
  0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, 0x0e968,
  0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, 0x0d520,
  0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20,
  0x0ada0, 0x14b63,
] as const;

const MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
] as const;

const DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
] as const;

function lunarYearDays(year: number): number {
  let sum = 348;
  const info = LUNAR_INFO[year - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += info & i ? 1 : 0;
  }
  return sum + leapDays(year);
}

function leapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function leapDays(year: number): number {
  if (leapMonth(year)) {
    return LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29;
  }
  return 0;
}

function monthDays(year: number, month: number): number {
  return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29;
}

function solarBaseDate(): Date {
  return new Date(1900, 0, 31);
}

export function solarToLunar(date: Date): LunarDate {
  let offset = Math.floor((date.getTime() - solarBaseDate().getTime()) / 86400000);
  if (offset < 0) {
    throw new RangeError('日期超出支持范围（1900–2100）');
  }

  let year = 1900;
  let daysInYear = lunarYearDays(year);
  while (offset >= daysInYear && year < 2100) {
    offset -= daysInYear;
    year++;
    daysInYear = lunarYearDays(year);
  }

  const leap = leapMonth(year);
  let month = 1;
  let isLeapMonth = false;

  while (month <= 12) {
    if (leap > 0 && month === leap + 1 && !isLeapMonth) {
      const leapDaysCount = leapDays(year);
      if (offset < leapDaysCount) {
        isLeapMonth = true;
        break;
      }
      offset -= leapDaysCount;
    }

    const md = monthDays(year, month);
    if (offset < md) break;
    offset -= md;
    month++;
  }

  const day = offset + 1;
  const monthLabel = `${isLeapMonth ? '闰' : ''}${MONTH_NAMES[month - 1]}`;
  const dayLabel = DAY_NAMES[day - 1] ?? `${day}日`;

  return {
    year,
    month,
    day,
    isLeapMonth,
    monthLabel,
    dayLabel,
    label: `${monthLabel}${dayLabel}`,
  };
}

export function formatSolarDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}
