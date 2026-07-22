import { LIUYAO_ASSETS } from './assets.ts';

const MUTE_KEY = 'mystic-lab-liuyao-sfx-muted';
const cache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement {
  let a = cache.get(src);
  if (!a) {
    a = new Audio(src);
    a.preload = 'auto';
    cache.set(src, a);
  }
  return a;
}

export function isLiuyaoSfxMuted(): boolean {
  try {
    const v = localStorage.getItem(MUTE_KEY);
    // 未设置过偏好时默认关声
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

export function setLiuyaoSfxMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function toggleLiuyaoSfxMuted(): boolean {
  const next = !isLiuyaoSfxMuted();
  setLiuyaoSfxMuted(next);
  return next;
}

/** 用户手势后播放；静音 / 减少动态 / 失败时静默 */
export function playLiuyaoSfx(
  kind: 'shake' | 'drop' | 'form',
  opts?: { volume?: number },
): void {
  if (typeof window === 'undefined') return;
  if (isLiuyaoSfxMuted()) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const src =
    kind === 'shake'
      ? LIUYAO_ASSETS.sfxShake
      : kind === 'drop'
        ? LIUYAO_ASSETS.sfxDrop
        : LIUYAO_ASSETS.sfxForm;

  const a = getAudio(src);
  a.volume = opts?.volume ?? (kind === 'shake' ? 0.45 : kind === 'drop' ? 0.55 : 0.4);
  try {
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function preloadLiuyaoSfx(): void {
  if (isLiuyaoSfxMuted()) return;
  for (const src of [LIUYAO_ASSETS.sfxShake, LIUYAO_ASSETS.sfxDrop, LIUYAO_ASSETS.sfxForm]) {
    getAudio(src);
  }
}
