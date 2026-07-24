import { XLR_ASSETS } from './assets.ts';

export type ShichenDialOptions = {
  activeIndex: number;
  clockDeg: number;
  timeLabel: string;
  hourLabel: string;
  lunarLabel?: string;
  weekday?: string;
  animateEnter?: boolean;
  size?: 'hero' | 'flow';
};

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function wedgePath(cx: number, cy: number, rOut: number, rIn: number, startDeg: number, endDeg: number): string {
  const [x1, y1] = polar(cx, cy, rOut, startDeg);
  const [x2, y2] = polar(cx, cy, rOut, endDeg);
  const [x3, y3] = polar(cx, cy, rIn, endDeg);
  const [x4, y4] = polar(cx, cy, rIn, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`;
}

export function renderShichenDial(opts: ShichenDialOptions): string {
  const cx = 120;
  const cy = 120;
  const sizeClass = opts.size === 'hero' ? ' xlr-shichen-scene--hero' : ' xlr-shichen-scene--flow';
  const start = opts.activeIndex * 30 - 90 - 15;
  const end = start + 30;
  const activeWedge = wedgePath(cx, cy, 108, 72, start, end);
  const enter = opts.animateEnter ? ' is-entering' : '';

  return `
    <div class="xlr-shichen-scene${sizeClass}${enter} xlr-stagger-item" style="--si:3" data-clock-deg="${opts.clockDeg}" data-active-index="${opts.activeIndex}">
      <div class="xlr-shichen-dial">
        <img class="xlr-shichen-dial-bg" src="${XLR_ASSETS.shichenDialBg}" alt="" loading="eager" decoding="async" />
        <svg class="xlr-shichen-overlay" viewBox="0 0 240 240" aria-hidden="true">
          <path class="xlr-shichen-seg is-active is-lit" d="${activeWedge}"/>
        </svg>
        <div class="xlr-shichen-center" aria-label="十二时辰盘">
          <span class="xlr-shichen-hour-label">${opts.hourLabel}</span>
          <span class="xlr-shichen-time">${opts.timeLabel}</span>
          ${opts.lunarLabel ? `<span class="xlr-shichen-lunar">农历 ${opts.lunarLabel}</span>` : ''}
          ${opts.weekday ? `<span class="xlr-shichen-weekday">${opts.weekday}</span>` : ''}
        </div>
        <div class="xlr-shichen-pointer-wrap">
          <img class="xlr-shichen-pointer-img" src="${XLR_ASSETS.shichenPointer}" alt="" loading="lazy" />
        </div>
      </div>
    </div>
  `;
}

export function mountShichenDialAnimation(container: HTMLElement): void {
  const scene = container.querySelector('.xlr-shichen-scene');
  const wrap = container.querySelector('.xlr-shichen-pointer-wrap') as HTMLElement | null;
  const dial = container.querySelector('.xlr-shichen-dial') as HTMLElement | null;
  if (!scene || !wrap) return;

  const target = Number(scene.getAttribute('data-clock-deg') ?? 0);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 200 : 2400;

  requestAnimationFrame(() => {
    scene.classList.add('is-live');
    dial?.classList.add('is-settled');

    if (reduced) {
      wrap.style.transform = `rotate(${target}deg)`;
      return;
    }

    const start = performance.now();
    const from = target - 18;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      wrap.style.transform = `rotate(${from + (target - from) * eased}deg)`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function formatWeekday(date: Date): string {
  return `星期${WEEKDAYS[date.getDay()]}`;
}
