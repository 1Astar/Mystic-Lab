/** 六爻静态素材路径（public/liuyao）— 优先 WebP 压缩版 */

export const LIUYAO_ASSETS = {
  heroScene: '/liuyao/hero-scene.webp',
  heroCast: '/liuyao/hero-cast.webp',
  /** 学习模式首页主视觉 */
  heroLearn: '/liuyao/hero-learn.png',
  baguaBoard: '/liuyao/bagua-board.webp',
  baguaJade: '/liuyao/bagua-jade.webp',
  emblem: '/liuyao/emblem-coin-ring.webp',
  coinObverse: '/liuyao/coin-obverse.webp',
  coinReverse: '/liuyao/coin-reverse.webp',
  sfxShake: '/liuyao/sfx-shake.mp3',
  sfxDrop: '/liuyao/sfx-drop.mp3',
  sfxForm: '/liuyao/sfx-form.mp3',
} as const;

export function coinSrc(face: 'obverse' | 'reverse'): string {
  return face === 'obverse' ? LIUYAO_ASSETS.coinObverse : LIUYAO_ASSETS.coinReverse;
}

/** 预热铜钱图，减少起卦页首屏等待 */
export function preloadLiuyaoCoins(): void {
  for (const src of [LIUYAO_ASSETS.coinObverse, LIUYAO_ASSETS.coinReverse]) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}

/** 预热首页主视觉（完整单图） */
export function preloadLiuyaoHero(): void {
  for (const src of [LIUYAO_ASSETS.heroScene, LIUYAO_ASSETS.heroCast, LIUYAO_ASSETS.heroLearn]) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}
