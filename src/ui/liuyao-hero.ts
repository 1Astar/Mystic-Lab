import { LIUYAO_ASSETS } from '../liuyao/assets.ts';

/** 完整主视觉：单图完整展示（不再叠八卦盘小图） */
export function renderLiuyaoHero(opts: { mode?: 'cast' | 'learn' } = {}): string {
  const mode = opts.mode ?? 'cast';
  const src = mode === 'learn' ? LIUYAO_ASSETS.heroLearn : LIUYAO_ASSETS.heroScene;
  return `
    <div class="ly-hero-scene ly-hero-scene--${mode}" aria-hidden="true">
      <img
        class="ly-hero-bg"
        src="${src}"
        alt=""
        width="720"
        height="1280"
        decoding="async"
        fetchpriority="high"
      />
      <div class="ly-hero-veil"></div>
    </div>
  `;
}

/** 页面氛围底图（完整图作背景，文字叠在上层） */
export function liuyaoPageBgStyle(mode: 'cast' | 'learn' = 'cast'): string {
  const src = mode === 'learn' ? LIUYAO_ASSETS.heroLearn : LIUYAO_ASSETS.heroScene;
  return `--ly-page-bg: url('${src}')`;
}
