import { CHINESE_HOURS } from '../../xiaoliuren/chinese-hour.ts';

/** 04 时辰页 · 十二时辰对照表（设计稿常显） */
export function renderShichenTable(activeIndex: number): string {
  const rows = CHINESE_HOURS.map((h) => {
    const active = h.index === activeIndex ? ' is-active' : '';
    const range = h.rangeLabel.replace(' – ', '–').replace(':00', '');
    return `
      <div class="xlr-shichen-row${active}">
        <span class="xlr-shichen-row-name">${h.name}时</span>
        <span class="xlr-shichen-row-alias">${h.alias}</span>
        <span class="xlr-shichen-row-range">${range}</span>
      </div>`;
  }).join('');

  return `
    <div class="xlr-shichen-table">
      <p class="xlr-shichen-table-title">十二时辰对照表</p>
      <div class="xlr-shichen-table-grid">${rows}</div>
    </div>
  `;
}
