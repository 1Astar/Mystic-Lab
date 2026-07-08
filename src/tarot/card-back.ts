/** 统一牌背视觉（不用 Rider-Waite Cover 图） */

export function cardBackArtHtml(className = 'mystic-card-back'): string {
  return `
    <div class="${className}" aria-hidden="true">
      <span class="mystic-card-back-ring mystic-card-back-ring-outer"></span>
      <span class="mystic-card-back-ring mystic-card-back-ring-inner"></span>
      <span class="mystic-card-back-star">✦</span>
    </div>`;
}
