/** 小六壬静态素材路径（public/xiaoliuren/） */
const BASE = '/xiaoliuren';

export const XLR_ASSETS = {
  sceneBg: `${BASE}/scene-bg.webp`,
  calendarHanger: `${BASE}/calendar-top-bar.png`,
  calendarPaperMain: `${BASE}/calendar-paper-main.png`,
  calendarCurlTr: `${BASE}/calendar-paper-curl.png`,
  calendarBadgeYi: `${BASE}/calendar-status-badge-yi.png`,
  calendarBadgeJi: `${BASE}/calendar-status-badge-ji.png`,
  shichenDialBg: `${BASE}/shichen-dial-bg.webp`,
  shichenPointer: `${BASE}/shichen-pointer.png`,
  palmChart: `${BASE}/palm-chart.png`,
  scrollCard: `${BASE}/scroll-card.png`,
  divider: `${BASE}/divider.png`,
  /** @deprecated 黄历页已改用 calendarPaper */
  paperFlat: `${BASE}/paper-flat.png`,
  /** @deprecated 黄历页已改用 calendarCurlTr */
  paperCurl: `${BASE}/paper-curl.png`,
  /** @deprecated 黄历页不再使用卷轴结构 */
  scrollFrame: `${BASE}/scroll-frame.png`,
} as const;

export function renderXlrDivider(className = 'xlr-rule-divider'): string {
  return `<hr class="${className}" aria-hidden="true" />`;
}
