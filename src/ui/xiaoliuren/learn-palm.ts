import { getSixGodByIndex } from '../../xiaoliuren/six-gods.ts';
import { formatPalmAnchor, LIUREN_ORIGIN } from '../../xiaoliuren/liuren-points.ts';
import { renderPalmPlate, renderPalmStepExplain } from './palm-plate.ts';

export type LearnSubPhase = 'await-origin' | 'ready' | 'hopping' | 'step-done';

export type LearnPalmOptions = {
  dotIndex?: number | null;
  litIndices?: number[];
  landingIndex?: number | null;
  phase?: 'month' | 'day' | 'hour' | null;
  stepIndex?: number | null;
  learnSubPhase?: LearnSubPhase;
};

const PHASE_LABELS: Record<string, string> = {
  month: '第一步：从月起 · 正月起大安',
  day: '第二步：从日起 · 从上一步落点继续',
  hour: '第三步：从时起 · 十二时辰顺数',
};

const ORIGIN_HINT =
  `${formatPalmAnchor(LIUREN_ORIGIN)}是顺数的起点。正月从此起——对应立春前后、万物安好之象，所以第一宫叫「大安」。`;

export function renderLearnPalm(opts: LearnPalmOptions = {}): string {
  const {
    dotIndex = null,
    litIndices = [],
    landingIndex = null,
    phase = null,
    stepIndex = null,
    learnSubPhase = 'ready',
  } = opts;

  const awaitOrigin = learnSubPhase === 'await-origin' && stepIndex === 0;
  const originLabel = formatPalmAnchor(LIUREN_ORIGIN);

  const intro = awaitOrigin
    ? `
      <p class="xlr-learn-intro">六个宫位像星点分布在掌上。</p>
      <p class="xlr-learn-ask">为什么从这里开始？<span>点${originLabel} · 大安</span></p>
    `
    : '';

  const originToast =
    learnSubPhase === 'ready' && stepIndex === 0 && litIndices.includes(0) && dotIndex === null
      ? `<p class="xlr-learn-toast">${ORIGIN_HINT}</p>`
      : '';

  const explain =
    stepIndex !== null && !awaitOrigin
      ? renderPalmStepExplain(
          stepIndex,
          dotIndex,
          landingIndex,
          phase ? PHASE_LABELS[phase] : '',
        )
      : phase && !awaitOrigin
        ? `<p class="xlr-learn-phase-hint">${PHASE_LABELS[phase]}</p>`
        : '';

  return `
    <div class="xlr-learn-palm-wrap${awaitOrigin ? ' is-await-origin' : ''}">
      ${intro}
      ${originToast}
      ${explain}
      ${renderPalmPlate({
        mode: 'teach',
        dotIndex,
        litIndices,
        landingIndex,
        stepIndex,
        showOrderPath: true,
        showGodIcons: false,
        interactive: awaitOrigin,
        starPoints: false,
      })}
    </div>
  `;
}

export function mountLearnPalmInteractions(
  container: HTMLElement,
  onOriginTap: () => void,
): void {
  const origin = container.querySelector<HTMLElement>('[data-origin-point]');
  origin?.addEventListener('click', onOriginTap);
}

export function renderStepTally(
  completedSteps: { label: string; landingIndex: number }[],
): string {
  if (completedSteps.length === 0) return '';

  return `
    <div class="xlr-step-tally">
      ${completedSteps
        .map(
          (s) => `
        <p class="xlr-step-tally-row">
          <span>${s.label}</span>
          <span class="xlr-step-tally-arrow">→</span>
          <strong>落${getSixGodByIndex(s.landingIndex).name}</strong>
        </p>`,
        )
        .join('')}
    </div>
  `;
}

export { LIUREN_ORIGIN, ORIGIN_HINT };
