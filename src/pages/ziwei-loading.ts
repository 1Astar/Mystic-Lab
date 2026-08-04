import { navigate } from '../router.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { createStarsLayer } from '../tarot/animations.ts';

const RITUAL_MS = 2800;

const RITUAL_STARS = ['紫微', '天机', '贪狼', '廉贞', '武曲', '七杀', '破军'];

export function renderZiweiLoading(root: HTMLElement): () => void {
  const stars = createStarsLayer();
  document.body.appendChild(stars);

  const page = document.createElement('div');
  page.className = 'page ziwei-page ziwei-loading-page';
  mountEnvBanner(page);
  page.innerHTML = `
    <div class="ziwei-ritual" aria-live="polite">
      <p class="ziwei-ritual-copy">正在根据你的生辰，构建属于你的星辰罗盘…</p>
      <div class="ziwei-ritual-disk" aria-hidden="true">
        <div class="ziwei-ritual-ring"></div>
        ${RITUAL_STARS.map(
          (name, i) =>
            `<span class="ziwei-ritual-star" style="--i:${i}">${name}</span>`,
        ).join('')}
      </div>
    </div>
  `;
  root.appendChild(page);

  const timer = window.setTimeout(() => {
    navigate('/ziwei/reading');
  }, RITUAL_MS);

  return () => {
    window.clearTimeout(timer);
    stars.remove();
  };
}
