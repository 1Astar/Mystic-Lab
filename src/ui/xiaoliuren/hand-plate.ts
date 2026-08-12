import { renderSixGodIcon, SIX_GODS } from '../../xiaoliuren/six-gods.ts';
import { CHINESE_HOURS } from '../../xiaoliuren/chinese-hour.ts';
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
  return `
    <div class="xlr-hour-timeline" role="listbox" aria-label="十二时辰">
      ${CHINESE_HOURS.map((h) => {
        const active = h.index === activeIndex ? ' is-active' : '';
        const range = h.rangeLabel.replace(' – ', '–');
        return `
            <button type="button" class="xlr-hour-seg${active}" role="option" data-hour-index="${h.index}" aria-selected="${h.index === activeIndex ? 'true' : 'false'}">
              <span class="xlr-hour-seg-name">${h.name}时 <em>${h.alias}</em></span>
              <span class="xlr-hour-seg-range">${range}</span>
            </button>`;
      }).join('')}
    </div>
  `;
}

/** 点时辰格：更新记忆句 + 彩蛋说明，并同步表盘指针 */
export function mountHourTimelineLore(
  container: HTMLElement,
  memoryEl?: HTMLElement | null,
  onSelect?: (hourIndex: number) => void,
): void {
  const loreEl = container.querySelector<HTMLElement>('[data-shichen-lore]');
  container.querySelectorAll<HTMLButtonElement>('.xlr-hour-seg[data-hour-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.hourIndex);
      const hour = CHINESE_HOURS[idx];
      if (!hour) return;
      container.querySelectorAll('.xlr-hour-seg').forEach((seg) => {
        const on = seg === btn;
        seg.classList.toggle('is-active', on);
        seg.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (memoryEl) {
        memoryEl.textContent = `${hour.alias} · ${hour.memoryHint}`;
      }
      if (loreEl) {
        loreEl.hidden = false;
        loreEl.textContent = hour.lore;
      }
      onSelect?.(idx);
    });
  });
}

export { getLiurenPointCoords };
