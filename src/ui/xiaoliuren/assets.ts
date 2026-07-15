/** 小六壬静态素材路径（public/xiaoliuren/） */
const BASE = '/xiaoliuren';

export const XLR_ASSETS = {
  sceneBg: `${BASE}/scene-bg.webp`,
  calendarHanger: `${BASE}/calendar-top-bar.png`,
  calendarPaperMain: `${BASE}/calendar-paper-noise.png`,
  calendarCurlTr: `${BASE}/calendar-paper-curl.png`,
  calendarBadgeYi: `${BASE}/calendar-seal-yi.png`,
  calendarBadgeJi: `${BASE}/calendar-seal-ji.png`,
  calendarDivider: `${BASE}/calendar-divider.png`,
  calendarTear1: `${BASE}/calendar-tear-1.png`,
  calendarTear2: `${BASE}/calendar-tear-2.png`,
  calendarTear3: `${BASE}/calendar-tear-3.png`,
  shichenDialBg: `${BASE}/shichen-dial-bg.webp`,
  shichenPointer: `${BASE}/shichen-pointer.png`,
  palmChart: `${BASE}/palm-chart.png`,
  /** 首页掌上演算预览（古典掌图） */
  palmChartHome: `${BASE}/palm-chart-home.png`,
  /** 原手部底图；掌盘已导出为透明 palm-chart */
  palmHandSource: `${BASE}/hand.png`,
  scrollCard: `${BASE}/scroll-card.png`,
  divider: `${BASE}/calendar-divider.png`,
  /** @deprecated 黄历页已改用 calendarPaperMain */
  paperFlat: `${BASE}/paper-flat.png`,
  /** @deprecated 黄历页已改用 calendarCurlTr */
  paperCurl: `${BASE}/paper-curl.png`,
  /** @deprecated 黄历页不再使用卷轴结构 */
  scrollFrame: `${BASE}/scroll-frame.png`,
} as const;

export function renderXlrDivider(className = 'xlr-rule-divider'): string {
  return `<hr class="${className}" aria-hidden="true" />`;
}
