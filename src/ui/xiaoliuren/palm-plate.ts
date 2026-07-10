import { getSixGodByIndex, getSixGodIconUrl } from '../../xiaoliuren/six-gods.ts';
import {
  LIUREN_ORIGIN,
  LIUREN_POINTS,
  getLiurenPoint,
} from '../../xiaoliuren/liuren-points.ts';
import { XLR_ASSETS } from './assets.ts';

export type PalmPlateMode = 'preview' | 'teach' | 'count';

export type PalmPlateOptions = {
  mode?: PalmPlateMode;
  dotIndex?: number | null;
  litIndices?: number[];
  landingIndex?: number | null;
  stepIndex?: number | null;
  showOrderPath?: boolean;
  showGodIcons?: boolean;
  showOrigin?: boolean;
  caption?: string;
  interactive?: boolean;
  starPoints?: boolean;
};

function orderPathD(): string {
  const pts = LIUREN_POINTS.map((p) => `${p.x},${p.y}`);
  return `M ${pts.join(' L ')} Z`;
}

function hopPathD(indices: number[]): string {
  if (indices.length < 2) return '';
  const pts = indices.map((i) => {
    const p = getLiurenPoint(i);
    return `${p.x},${p.y}`;
  });
  return `M ${pts.join(' L ')}`;
}

function renderPointHtmlLayer(opts: {
  litIndices: number[];
  landingIndex: number | null;
  dotIndex: number | null;
  showGodIcons: boolean;
  interactive: boolean;
  starPoints: boolean;
}): string {
  const litSet = new Set(opts.litIndices);
  return LIUREN_POINTS.map((p) => {
    const lit = litSet.has(p.index) ? ' is-lit' : '';
    const land = opts.landingIndex === p.index ? ' is-landing' : '';
    const active = opts.dotIndex === p.index ? ' is-active' : '';
    const star = opts.starPoints ? ' is-star' : '';
    const isOrigin = p.index === 0;
    const originAttr = opts.interactive && isOrigin ? ' data-origin-point tabindex="0" role="button"' : '';
    const icon = opts.showGodIcons
      ? `<img class="xlr-palm-god-chip" src="${getSixGodIconUrl(p.godId)}" alt="${p.name}" width="28" height="28" loading="lazy" />`
      : `<span class="xlr-palm-point-num">${p.id}</span>`;
    return `
      <div class="xlr-palm-point-html${lit}${land}${active}${star}${isOrigin && opts.interactive ? ' is-origin-tap' : ''}" data-index="${p.index}" style="--px:${p.x}%;--py:${p.y}%"${originAttr}>
        ${icon}
        <span class="xlr-palm-point-label">${p.name}</span>
      </div>`;
  }).join('');
}

function renderSvgInteractionLayer(opts: {
  showOrderPath: boolean;
  hopIndices: number[];
  dotIndex: number | null;
  showOrigin: boolean;
}): string {
  const pathD = orderPathD();
  const hopD = opts.hopIndices.length > 1 ? hopPathD(opts.hopIndices) : '';

  const activeDot =
    opts.dotIndex !== null
      ? (() => {
          const p = getLiurenPoint(opts.dotIndex);
          return `
        <g class="xlr-palm-highlight" transform="translate(${p.x}, ${p.y})">
          <circle class="xlr-palm-highlight-glow" r="8"/>
          <circle class="xlr-palm-highlight-core" r="3"/>
        </g>`;
        })()
      : '';

  const originDot = opts.showOrigin
    ? `<circle class="xlr-palm-origin-dot" cx="${LIUREN_ORIGIN.x}" cy="${LIUREN_ORIGIN.y}" r="4"/>`
    : '';

  return `
    ${opts.showOrderPath ? `<path class="xlr-palm-order-path" d="${pathD}"/>` : ''}
    ${hopD ? `<path class="xlr-palm-hop-path" d="${hopD}"/>` : ''}
    ${originDot}
    ${activeDot}
  `;
}

export function renderPalmPlate(opts: PalmPlateOptions = {}): string {
  const {
    mode = 'teach',
    dotIndex = null,
    litIndices = [],
    landingIndex = null,
    stepIndex = null,
    showOrderPath = mode !== 'preview',
    showGodIcons = mode === 'preview',
    showOrigin = mode !== 'preview',
    caption,
    interactive = false,
    starPoints = false,
  } = opts;

  const hopIndices = litIndices.filter((v, i, a) => a.indexOf(v) === i);
  const useStagger = mode === 'preview';

  const stepBadge =
    stepIndex !== null
      ? `<span class="xlr-palm-step-badge${useStagger ? ' xlr-stagger-item' : ''}" style="--si:1">${stepIndex + 1}<span>/3</span></span>`
      : '';

  const cap =
    caption ??
    (mode === 'preview'
      ? '掌上演算预览'
      : '掌上六壬 · 顺时针顺数');

  return `
    <div class="xlr-palm-plate xlr-palm-plate--${mode}${starPoints ? ' is-star-intro' : ''}">
      <div class="xlr-palm-plate-head${useStagger ? ' xlr-stagger-item' : ''}" style="--si:2">
        ${stepBadge}
        <p class="xlr-palm-plate-caption">${cap}</p>
      </div>
      <div class="xlr-palm-stage${useStagger ? ' xlr-stagger-item' : ''}" style="--si:3">
        <div class="xlr-palm-hand-base">
          <img class="xlr-palm-hand-img" src="${XLR_ASSETS.palmChart}" alt="掌诀示意" loading="lazy" />
        </div>
        <div class="xlr-palm-points-html"${interactive ? '' : ' aria-hidden="true"'}>
          ${renderPointHtmlLayer({ litIndices, landingIndex, dotIndex, showGodIcons, interactive, starPoints })}
        </div>
        <svg class="xlr-palm-overlay" viewBox="0 0 100 125" aria-hidden="true">
          ${renderSvgInteractionLayer({ showOrderPath, hopIndices, dotIndex, showOrigin })}
        </svg>
      </div>
    </div>
  `;
}

export function renderPalmStepExplain(
  stepIndex: number,
  dotIndex: number | null,
  landingIndex: number | null,
  phaseLabel: string,
): string {
  const phaseNames = ['月', '日', '时'];
  const phase = phaseNames[stepIndex] ?? '步';
  const landing = landingIndex !== null ? getSixGodByIndex(landingIndex).name : '—';
  const active = dotIndex !== null ? getSixGodByIndex(dotIndex).name : '起数中';
  return `
    <p class="xlr-palm-explain xlr-stagger-item" style="--si:4">
      从<strong>${phase}</strong>起，顺数定位 · 当前落在 <strong>${active}</strong>
      ${landingIndex !== null ? `· 本步落点 <em>${landing}</em>` : ''}
      <span class="xlr-palm-explain-sub">${phaseLabel}</span>
    </p>
  `;
}
