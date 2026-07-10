import { Solar } from 'lunar-javascript';

export type LunarConvertView = {
  solarDateTime: string;
  solarLabel: string;
  weekdayLabel: string;
  lunarTitle: string;
  lunarMain: string;
  lunarLabel: string;
  ganzhiLine: string;
  hourLabel: string;
};

const SOLAR_MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
] as const;

const DAY_CN = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十', '卅一',
] as const;

function formatSolarDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function formatSolarLabel(date: Date): string {
  const m = date.getMonth();
  const d = date.getDate();
  return `公历 ${SOLAR_MONTHS[m]}${DAY_CN[d - 1] ?? `${d}日`}`;
}

function formatWeekdayLabel(week: string): string {
  const map: Record<string, string> = {
    日: '星期日',
    一: '星期一',
    二: '星期二',
    三: '星期三',
    四: '星期四',
    五: '星期五',
    六: '星期六',
  };
  return map[week] ?? `星期${week}`;
}

/** 公历转农历展示数据（挂历翻页用） */
export function getLunarConvertView(date: Date, hourLabel: string): LunarConvertView {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  const monthName = lunar.getMonthInChinese();
  const dayName = lunar.getDayInChinese();
  const lunarMain = `${monthName}月${dayName}`;

  return {
    solarDateTime: formatSolarDateTime(date),
    solarLabel: formatSolarLabel(date),
    weekdayLabel: formatWeekdayLabel(solar.getWeekInChinese()),
    lunarTitle: '对应',
    lunarMain,
    lunarLabel: `农历 ${lunarMain}`,
    ganzhiLine: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日 · ${hourLabel}`,
    hourLabel,
  };
}
