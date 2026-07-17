import { LIUYAO_ASSETS } from '../liuyao/assets.ts';

export function renderLiuyaoHero(): string {
  return `
    <div class="ly-hero-scene" aria-hidden="true">
      <img class="ly-hero-bg" src="${LIUYAO_ASSETS.heroScene}" alt="" />
      <div class="ly-hero-veil"></div>
      <img class="ly-hero-board-img" src="${LIUYAO_ASSETS.baguaBoard}" alt="" />
    </div>
  `;
}
