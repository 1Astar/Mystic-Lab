import { getSixGodByIndex } from '../../xiaoliuren/six-gods.ts';
import { LIUREN_ORIGIN } from '../../xiaoliuren/liuren-points.ts';
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
  month: '第一步：从「月」起，顺数定位',
  day: '第二步：从上一落点继续顺数',
  hour: '第三步：时辰落点即为结果',
};

const ORIGIN_HINT = '大安为起点，象征稳定与开始。';

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

  const intro = awaitOrigin
    ? `
      <p class="xlr-learn-intro">六个宫位像星点分布在掌上。</p>
      <p class="xlr-learn-ask">为什么从这里开始？<span>点无名指第三节</span></p>
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
        showOrderPath: !awaitOrigin,
        showGodIcons: awaitOrigin,
        showOrigin: !awaitOrigin,
        interactive: awaitOrigin,
        starPoints: awaitOrigin,
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

/** @deprecated */
export function renderLearnChain(): string {
  return '';
}

export { LIUREN_ORIGIN, ORIGIN_HINT };
