export type MysticEmblemKind = 'heart' | 'tarot' | 'star' | 'plum' | 'hex' | 'cosmos' | 'bazi';

const HEART_SVG = (uid: string) => `
  <svg class="mystic-emblem-svg mystic-heart-shape" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id="${uid}-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffd6a6"/>
        <stop offset="45%" stop-color="#e8a0c8"/>
        <stop offset="100%" stop-color="#9b7fd4"/>
      </linearGradient>
      <filter id="${uid}-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <path filter="url(#${uid}-glow)" fill="url(#${uid}-grad)" d="M50 88 C22 62 8 42 22 24 C32 14 44 22 50 30 C56 22 68 14 78 24 C92 42 78 62 50 88 Z"/>
  </svg>`;

const STAR_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <polygon fill="none" stroke="#ffd6a6" stroke-width="2"
      points="50,8 58,38 90,38 64,56 74,88 50,68 26,88 36,56 10,38 42,38"/>
    <circle cx="50" cy="50" r="6" fill="#ffd6a6" opacity="0.9"/>
  </svg>`;

const PLUM_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="52" r="14" fill="none" stroke="#ffd6a6" stroke-width="1.5"/>
    <path fill="#ffd6a6" opacity="0.15" d="M50 18 C38 30 28 42 32 58 C36 72 50 78 50 78 C50 78 64 72 68 58 C72 42 62 30 50 18 Z"/>
    <circle cx="50" cy="50" r="5" fill="#ffd6a6"/>
    <path fill="none" stroke="#ffd6a6" stroke-width="1.2" d="M50 64 L50 82 M42 70 L50 82 L58 70"/>
  </svg>`;

const TAROT_INNER = `
  <div class="mystic-tarot-core">
    <span class="mystic-tarot-symbol">✦</span>
    <div class="mystic-tarot-shimmer"></div>
  </div>`;

const HEX_SVG = `
  <svg class="mystic-emblem-svg mystic-hex-lines" viewBox="0 0 48 56" aria-hidden="true">
    <line x1="8" y1="6" x2="40" y2="6"/>
    <line x1="8" y1="16" x2="22" y2="16"/><line x1="26" y1="16" x2="40" y2="16"/>
    <line x1="8" y1="26" x2="40" y2="26"/>
    <line x1="8" y1="36" x2="22" y2="36"/><line x1="26" y1="36" x2="40" y2="36"/>
    <line x1="8" y1="46" x2="40" y2="46"/>
  </svg>`;

const COSMOS_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="50" rx="34" ry="18" fill="none" stroke="#ffd6a6" stroke-width="1.2" opacity="0.7"/>
    <ellipse cx="50" cy="50" rx="18" ry="34" fill="none" stroke="#9b7fd4" stroke-width="1.2" opacity="0.75"/>
    <circle cx="50" cy="50" r="7" fill="#ffd6a6" opacity="0.95"/>
    <circle cx="78" cy="42" r="3" fill="#e8b4d0"/>
    <circle cx="28" cy="62" r="2.5" fill="#ffd6a6"/>
    <circle cx="62" cy="78" r="2" fill="#c9e0ff"/>
  </svg>`;

/** 四柱示意 */
const BAZI_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <rect x="14" y="22" width="16" height="56" rx="3" fill="none" stroke="#ffd6a6" stroke-width="1.5"/>
    <rect x="34" y="22" width="16" height="56" rx="3" fill="none" stroke="#e8b4d0" stroke-width="1.5"/>
    <rect x="54" y="22" width="16" height="56" rx="3" fill="none" stroke="#9b7fd4" stroke-width="1.5"/>
    <rect x="74" y="22" width="16" height="56" rx="3" fill="none" stroke="#ffd6a6" stroke-width="1.5" opacity="0.85"/>
    <circle cx="22" cy="50" r="3" fill="#ffd6a6"/>
    <circle cx="42" cy="50" r="3" fill="#e8b4d0"/>
    <circle cx="62" cy="50" r="3" fill="#9b7fd4"/>
    <circle cx="82" cy="50" r="3" fill="#ffd6a6" opacity="0.85"/>
  </svg>`;

let emblemUid = 0;

function nextUid(): string {
  emblemUid += 1;
  return `me${emblemUid}`;
}

function innerFor(kind: MysticEmblemKind): string {
  switch (kind) {
    case 'heart': return HEART_SVG(nextUid());
    case 'star': return STAR_SVG;
    case 'plum': return PLUM_SVG;
    case 'tarot': return TAROT_INNER;
    case 'hex': return HEX_SVG;
    case 'cosmos': return COSMOS_SVG;
    case 'bazi': return BAZI_SVG;
  }
}

/** 返回装饰 emblem HTML（心 / 塔罗 / 星 / 梅花 / 六爻 / 宇宙 / 八字） */
export function mysticEmblemHtml(kind: MysticEmblemKind, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const pulse = kind === 'heart' ? ' mystic-emblem-pulse' : '';
  return `
    <div class="mystic-emblem mystic-emblem-${kind} mystic-emblem-${size}${pulse}" aria-hidden="true">
      <div class="mystic-emblem-ring"></div>
      <div class="mystic-emblem-ticks"></div>
      <div class="mystic-emblem-body">${innerFor(kind)}</div>
      <div class="mystic-emblem-aura"></div>
    </div>`;
}

export function createMysticEmblem(kind: MysticEmblemKind, size: 'sm' | 'md' | 'lg' = 'md'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.innerHTML = mysticEmblemHtml(kind, size);
  return wrap.firstElementChild as HTMLElement;
}
