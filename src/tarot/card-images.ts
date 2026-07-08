/** Rider-Waite 公版牌面路径（由 scripts/fetch-tarot-images.mjs 下载到 public/tarot/） */

export function getCardImagePath(cardId: string): string {
  return `/tarot/${cardId}.jpg`;
}

export function getCardBackPath(): string {
  return '/tarot/back.jpg';
}

export function cardFaceImageHtml(
  cardId: string,
  alt: string,
  className = 'card-face-img',
): string {
  const src = getCardImagePath(cardId);
  const safeAlt = alt
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
  return `<img class="${className}" src="${src}" alt="${safeAlt}" loading="lazy" decoding="async" />`;
}

export function cardBackImageHtml(className = 'card-back-img'): string {
  return `<img class="${className}" src="${getCardBackPath()}" alt="牌背" loading="lazy" decoding="async" />`;
}
