import { getSixGodByIndex } from '../../xiaoliuren/six-gods.ts';
import { practiceTapHint } from '../../xiaoliuren/skill-gates.ts';
import type { CountPhase } from '../../xiaoliuren/engine.ts';
import { renderPalmPlate } from './palm-plate.ts';

export type PracticePalmOptions = {
  dotIndex?: number | null;
  litIndices?: number[];
  landingIndex?: number | null;
  stepIndex?: number | null;
  phase: CountPhase;
  count: number;
  hopCursor: number;
  feedback?: string | null;
};

/** 关2：空白掌，隐藏顺数编号，靠自点验证 */
export function renderPracticePalm(opts: PracticePalmOptions): string {
  const {
    dotIndex = null,
    litIndices = [],
    landingIndex = null,
    stepIndex = null,
    phase,
    count,
    hopCursor,
    feedback = null,
  } = opts;

  const hint = practiceTapHint(phase, count, hopCursor);
  const progress = `已点对 ${hopCursor}/${count}`;

  return `
    <div class="xlr-practice-palm-wrap">
      <p class="xlr-practice-ask">空白掌 · 自己顺数<span>${progress}</span></p>
      <p class="xlr-practice-hint">${hint}</p>
      ${feedback ? `<p class="xlr-practice-feedback" role="status">${feedback}</p>` : ''}
      ${renderPalmPlate({
        mode: 'count',
        dotIndex,
        litIndices,
        landingIndex: hopCursor >= count ? landingIndex : null,
        stepIndex,
        showOrderPath: false,
        showGodIcons: false,
        interactive: true,
        blank: true,
        allPointsInteractive: true,
        caption: '点掌上宫位 · 编号已隐藏',
      })}
    </div>
  `;
}

export function mountPracticePalmInteractions(
  container: HTMLElement,
  onTap: (index: number) => void,
): void {
  container.querySelectorAll<HTMLElement>('[data-practice-point]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.index);
      if (Number.isFinite(idx)) onTap(idx);
    });
  });
}

export function practiceExpectedLabel(hops: number[], hopCursor: number): string {
  const idx = hops[hopCursor];
  if (idx === undefined) return '—';
  return getSixGodByIndex(idx).name;
}
