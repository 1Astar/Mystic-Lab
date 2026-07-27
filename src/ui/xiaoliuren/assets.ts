/** 小六壬静态素材路径（public/xiaoliuren/）— 优先 WebP */
const BASE = '/xiaoliuren';

export const XLR_ASSETS = {
  sceneBg: `${BASE}/scene-bg.webp`,
  calendarHanger: `${BASE}/calendar-top-bar.webp`,
  calendarPaperMain: `${BASE}/calendar-paper-noise.webp`,
  calendarCurlTr: `${BASE}/calendar-paper-curl.webp`,
  calendarBadgeYi: `${BASE}/calendar-seal-yi.webp`,
  calendarBadgeJi: `${BASE}/calendar-seal-ji.webp`,
  calendarDivider: `${BASE}/calendar-divider.webp`,
  calendarTear1: `${BASE}/calendar-tear-1.png`,
  calendarTear2: `${BASE}/calendar-tear-2.png`,
  calendarTear3: `${BASE}/calendar-tear-3.png`,
  shichenDialBg: `${BASE}/shichen-dial-bg.webp`,
  shichenPointer: `${BASE}/shichen-pointer.png`,
  palmChart: `${BASE}/palm-chart.webp`,
  /** 首页掌上演算预览（古典掌图） */
  palmChartHome: `${BASE}/palm-chart-home.png`,
  /** 原手部底图；掌盘已导出为透明 palm-chart */
  palmHandSource: `${BASE}/hand.png`,
  scrollCard: `${BASE}/scroll-card.png`,
  divider: `${BASE}/calendar-divider.webp`,
  /** @deprecated 黄历页已改用 calendarPaperMain */
  paperFlat: `${BASE}/paper-flat.png`,
  /** @deprecated 黄历页已改用 calendarCurlTr */
  paperCurl: `${BASE}/paper-curl.png`,
  /** @deprecated 黄历页不再使用卷轴结构 */
  scrollFrame: `${BASE}/scroll-frame.png`,
} as const;

const PRELOAD_FLOW = [
  XLR_ASSETS.palmChart,
  XLR_ASSETS.calendarPaperMain,
  XLR_ASSETS.calendarHanger,
  XLR_ASSETS.shichenDialBg,
] as const;

/** 起课流程预热主视觉，减少翻黄历 / 掌盘首屏等待 */
export function preloadXlrFlowAssets(): void {
  for (const src of PRELOAD_FLOW) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}

export function renderXlrDivider(className = 'xlr-rule-divider'): string {
  return `<hr class="${className}" aria-hidden="true" />`;
}
