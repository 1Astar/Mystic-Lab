/** 小六壬静态素材路径（public/xiaoliuren/） */
const BASE = '/xiaoliuren';

export const XLR_ASSETS = {
  sceneBg: `${BASE}/scene-bg.webp`,
  scrollTop: `${BASE}/scroll-top.webp`,
  scrollPaper: `${BASE}/scroll-paper.webp`,
  scrollBottom: `${BASE}/scroll-bottom.webp`,
  paperCurl: `${BASE}/paper-curl.webp`,
  shichenDialBg: `${BASE}/shichen-dial-bg.webp`,
  shichenPointer: `${BASE}/shichen-pointer.png`,
  palmChart: `${BASE}/palm-chart.png`,
  scrollCard: `${BASE}/scroll-card.png`,
  divider: `${BASE}/divider.png`,
  /** @deprecated 使用 scrollTop + scrollPaper + scrollBottom */
  scrollFrame: `${BASE}/scroll-frame.png`,
  /** @deprecated 使用 scrollPaper */
  paperFlat: `${BASE}/paper-flat.png`,
} as const;

export function renderXlrDivider(className = 'xlr-rule-divider'): string {
  return `<hr class="${className}" aria-hidden="true" />`;
}
