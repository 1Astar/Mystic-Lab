export type MysticEmblemKind = 'heart' | 'tarot' | 'star' | 'plum' | 'hex' | 'cosmos' | 'bazi';

/** 统一色：主金 + 透明度层次，跟主题走 */
const G = 'var(--emblem-gold, #e0b86a)';
const SW = 'var(--emblem-stroke, 2)';

const HEART_SVG = (uid: string) => `
  <svg class="mystic-emblem-svg mystic-heart-shape" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id="${uid}-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${G}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${G}" stop-opacity="0.55"/>
      </linearGradient>
    </defs>
    <path fill="url(#${uid}-grad)" d="M50 88 C22 62 8 42 22 24 C32 14 44 22 50 30 C56 22 68 14 78 24 C92 42 78 62 50 88 Z"/>
  </svg>`;

/** 塔罗 · 叠放卡牌 */
const TAROT_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="${G}" stroke-width="${SW}" stroke-linejoin="round">
      <rect x="18" y="22" width="38" height="56" rx="4" transform="rotate(-14 37 50)" opacity="0.55"/>
      <rect x="32" y="18" width="38" height="56" rx="4" transform="rotate(8 51 46)" opacity="0.75"/>
      <rect x="40" y="20" width="38" height="56" rx="4"/>
    </g>
    <path fill="${G}" d="M59 40 L62.2 46.5 L69.5 47.2 L64 52 L65.5 59.2 L59 55.5 L52.5 59.2 L54 52 L48.5 47.2 L55.8 46.5 Z"/>
  </svg>`;

/** 小六壬 · 掐指之手 */
const STAR_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="${G}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M38 58 C34 48 36 36 42 30 C45 26 49 28 50 34 L50 52"/>
      <path d="M50 48 C50 34 52 22 56 20 C60 18 62 24 62 32 L62 52"/>
      <path d="M62 50 C64 36 68 24 72 24 C76 24 78 30 76 40 L70 58"/>
      <path d="M36 58 C28 56 24 62 26 70 C30 82 42 88 56 86 C68 84 78 76 78 64 L76 58"/>
      <path d="M34 62 C30 68 32 76 38 78"/>
    </g>
    <circle cx="52" cy="66" r="5" fill="none" stroke="${G}" stroke-width="${SW}"/>
    <circle cx="52" cy="66" r="2" fill="${G}"/>
  </svg>`;

/** 梅花 · 五瓣梅花 */
const PLUM_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="${G}" fill-opacity="0.18" stroke="${G}" stroke-width="${SW}">
      <ellipse cx="50" cy="28" rx="12" ry="14"/>
      <ellipse cx="72" cy="42" rx="12" ry="14" transform="rotate(72 72 42)"/>
      <ellipse cx="64" cy="68" rx="12" ry="14" transform="rotate(144 64 68)"/>
      <ellipse cx="36" cy="68" rx="12" ry="14" transform="rotate(-144 36 68)"/>
      <ellipse cx="28" cy="42" rx="12" ry="14" transform="rotate(-72 28 42)"/>
    </g>
    <circle cx="50" cy="50" r="8" fill="${G}"/>
    <circle cx="50" cy="50" r="3.5" fill="none" stroke="${G}" stroke-width="1.2" opacity="0.5"/>
  </svg>`;

/** 六爻 · 铜钱（方孔钱） */
const HEX_SVG = `
  <svg class="mystic-emblem-svg mystic-hex-coin" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="34" fill="none" stroke="${G}" stroke-width="${SW}"/>
    <circle cx="50" cy="50" r="28" fill="none" stroke="${G}" stroke-width="1.2" opacity="0.45"/>
    <rect x="40" y="40" width="20" height="20" rx="1.5" fill="none" stroke="${G}" stroke-width="${SW}"/>
    <g fill="${G}" opacity="0.85">
      <circle cx="50" cy="24" r="2.2"/>
      <circle cx="76" cy="50" r="2.2"/>
      <circle cx="50" cy="76" r="2.2"/>
      <circle cx="24" cy="50" r="2.2"/>
    </g>
  </svg>`;

/** 紫微 · 星系盘（主星 + 轨道） */
const COSMOS_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="32" fill="none" stroke="${G}" stroke-width="1.3" opacity="0.4"/>
    <ellipse cx="50" cy="50" rx="30" ry="14" fill="none" stroke="${G}" stroke-width="${SW}" transform="rotate(-20 50 50)"/>
    <ellipse cx="50" cy="50" rx="14" ry="28" fill="none" stroke="${G}" stroke-width="1.5" opacity="0.7" transform="rotate(25 50 50)"/>
    <circle cx="50" cy="50" r="6" fill="${G}"/>
    <circle cx="74" cy="42" r="3.5" fill="${G}" opacity="0.9"/>
    <circle cx="30" cy="60" r="2.8" fill="${G}" opacity="0.75"/>
    <circle cx="58" cy="76" r="2.2" fill="${G}" opacity="0.65"/>
  </svg>`;

/** 八字 · 四柱简牍 */
const BAZI_SVG = `
  <svg class="mystic-emblem-svg" viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="${G}" stroke-width="${SW}" stroke-linejoin="round">
      <rect x="14" y="20" width="15" height="60" rx="3"/>
      <rect x="33" y="20" width="15" height="60" rx="3"/>
      <rect x="52" y="20" width="15" height="60" rx="3"/>
      <rect x="71" y="20" width="15" height="60" rx="3"/>
    </g>
    <g fill="${G}">
      <rect x="17" y="30" width="9" height="3" rx="1" opacity="0.85"/>
      <rect x="36" y="30" width="9" height="3" rx="1" opacity="0.7"/>
      <rect x="55" y="30" width="9" height="3" rx="1" opacity="0.85"/>
      <rect x="74" y="30" width="9" height="3" rx="1" opacity="0.7"/>
      <rect x="17" y="42" width="9" height="3" rx="1" opacity="0.55"/>
      <rect x="36" y="42" width="9" height="3" rx="1" opacity="0.85"/>
      <rect x="55" y="42" width="9" height="3" rx="1" opacity="0.55"/>
      <rect x="74" y="42" width="9" height="3" rx="1" opacity="0.85"/>
    </g>
  </svg>`;

let emblemUid = 0;

function nextUid(): string {
  emblemUid += 1;
  return `me${emblemUid}`;
}

function innerFor(kind: MysticEmblemKind): string {
  switch (kind) {
    case 'heart':
      return HEART_SVG(nextUid());
    case 'star':
      return STAR_SVG;
    case 'plum':
      return PLUM_SVG;
    case 'tarot':
      return TAROT_SVG;
    case 'hex':
      return HEX_SVG;
    case 'cosmos':
      return COSMOS_SVG;
    case 'bazi':
      return BAZI_SVG;
  }
}

/** 返回装饰 emblem HTML（心 / 塔罗牌 / 手 / 梅花 / 铜钱 / 星系 / 四柱） */
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
