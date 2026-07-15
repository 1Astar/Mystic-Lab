import { renderSixGodIcon, SIX_GODS } from '../../xiaoliuren/six-gods.ts';
import { getLiurenPointCoords } from '../../xiaoliuren/liuren-points.ts';
import { renderPalmPlate } from './palm-plate.ts';

/** @deprecated 使用 liuren-points.ts */
export { ORBIT_POSITIONS } from '../../xiaoliuren/liuren-points.ts';

export type OrbitPlateOptions = {
  dotIndex?: number | null;
  litIndices?: number[];
  landingIndex?: number | null;
  scrollFrame?: boolean;
  showArrows?: boolean;
  title?: string;
  stepIndex?: number | null;
};

export function renderOrbitPlate(opts: OrbitPlateOptions = {}): string {
  return renderPalmPlate({
    mode: 'teach',
    dotIndex: opts.dotIndex ?? null,
    litIndices: opts.litIndices ?? [],
    landingIndex: opts.landingIndex ?? null,
    stepIndex: opts.stepIndex ?? null,
    showOrderPath: opts.showArrows !== false,
    showGodIcons: false,
    caption: opts.title ? `${opts.title} · 掌上起课` : undefined,
  });
}

export function renderSixGodsReveal(resultIndex: number): string {
  const chips = SIX_GODS.map((g, i) => {
    const hit = i === resultIndex ? ' is-result' : '';
    return `
      <div class="xlr-god-reveal-chip${hit}" style="--i:${i}">
        ${renderSixGodIcon(g, 'xlr-god-reveal-icon')}
        <span class="xlr-god-reveal-name">${g.name}</span>
      </div>`;
  }).join('');

  return `
    <div class="xlr-god-reveal">
      <p class="xlr-god-reveal-lead">六神浮现</p>
      <div class="xlr-god-reveal-row">${chips}</div>
    </div>
  `;
}

/** @deprecated */
export function renderHandPlate(activeIndex: number | null, dotIndex: number | null): string {
  return renderOrbitPlate({ landingIndex: activeIndex, dotIndex });
}

export function renderHourTimeline(activeIndex: number): string {
  const segments = [
    [23, 1], [1, 3], [3, 5], [5, 7], [7, 9], [9, 11],
    [11, 13], [13, 15], [15, 17], [17, 19], [19, 21], [21, 23],
  ];
  const names = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  return `
    <div class="xlr-hour-timeline">
      ${names
        .map((name, i) => {
          const [start, end] = segments[i];
          const range = start > end ? `${start}:00–${end}:00` : `${String(start).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`;
          const active = i === activeIndex ? ' is-active' : '';
          return `
            <div class="xlr-hour-seg${active}">
              <span class="xlr-hour-seg-name">${name}时</span>
              <span class="xlr-hour-seg-range">${range}</span>
            </div>`;
        })
        .join('')}
    </div>
  `;
}

export { getLiurenPointCoords };
