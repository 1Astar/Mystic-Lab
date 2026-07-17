/** 六爻静态素材路径（public/liuyao） */

export const LIUYAO_ASSETS = {
  heroScene: '/liuyao/hero-scene.png',
  heroCast: '/liuyao/hero-cast.png',
  baguaBoard: '/liuyao/bagua-board.png',
  baguaJade: '/liuyao/bagua-jade.png',
  emblem: '/liuyao/emblem-coin-ring.png',
  coinObverse: '/liuyao/coin-obverse.png',
  coinReverse: '/liuyao/coin-reverse.png',
  sfxShake: '/liuyao/sfx-shake.mp3',
  sfxDrop: '/liuyao/sfx-drop.mp3',
  sfxForm: '/liuyao/sfx-form.mp3',
} as const;

export function coinSrc(face: 'obverse' | 'reverse'): string {
  return face === 'obverse' ? LIUYAO_ASSETS.coinObverse : LIUYAO_ASSETS.coinReverse;
}
