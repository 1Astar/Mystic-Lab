/** 提问页 · 当前时间起课子卡（纯 CSS，无素材底图） */
export function renderTimeBadge(
  hourLabel: string,
  clock: string,
  dateLabel: string,
  lunarLabel?: string,
): string {
  return `
    <div class="xlr-subcard xlr-time-subcard xlr-stagger-item" style="--si:5" aria-label="当前时间起课">
      <h3 class="xlr-subcard-title">当前时间起课</h3>
      <p class="xlr-time-main">${hourLabel} ${clock}</p>
      <p class="xlr-time-sub">${dateLabel}${lunarLabel ? ` · 农历 ${lunarLabel}` : ''}</p>
    </div>
  `;
}
