import {
  EARTHLY_BRANCHES,
  SIX_GODS,
  formatClockTime,
  getCurrentChineseHour,
} from './chinese-hour.ts';

const HAND_POSITIONS = [
  { x: 28, y: 58 },
  { x: 42, y: 38 },
  { x: 58, y: 28 },
  { x: 72, y: 38 },
  { x: 68, y: 58 },
  { x: 50, y: 72 },
];

function renderTimeWheel(activeIndex: number): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    return `<span class="xlr-wheel-tick" style="transform: rotate(${angle}deg)"></span>`;
  }).join('');

  const items = EARTHLY_BRANCHES.map((name, i) => {
    const angle = (i / 12) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const r = 42;
    const x = 50 + r * Math.cos(rad);
    const y = 50 + r * Math.sin(rad);
    const active = i === activeIndex ? ' is-active' : '';
    return `<span class="xlr-branch${active}" style="left:${x}%;top:${y}%">${name}</span>`;
  }).join('');

  const hour = getCurrentChineseHour();
  const time = formatClockTime();

  return `
    <div class="xlr-time-wheel">
      <div class="xlr-wheel-glow${activeIndex >= 0 ? ' is-live' : ''}"></div>
      <div class="xlr-wheel-ring"></div>
      <div class="xlr-wheel-ticks">${ticks}</div>
      ${items}
      <div class="xlr-wheel-core">
        <span class="xlr-wheel-time">${time}</span>
        <span class="xlr-wheel-branch">${hour.label}</span>
      </div>
    </div>
  `;
}

function renderHandDiagram(): string {
  const pathD = HAND_POSITIONS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const points = SIX_GODS.map((g, i) => {
    const p = HAND_POSITIONS[i];
    const active = i === 0 ? ' is-origin' : '';
    return `
      <g class="xlr-hand-point${active}" transform="translate(${p.x}, ${p.y})">
        <circle r="9" class="xlr-hand-dot"/>
        <circle r="12" class="xlr-hand-pulse"/>
        <text y="3.5" text-anchor="middle" class="xlr-hand-num">${i + 1}</text>
        <text y="20" text-anchor="middle" class="xlr-hand-label">${g.name}</text>
      </g>`;
  }).join('');

  return `
    <div class="xlr-hand-panel">
      <div class="xlr-hand-scroll-edge xlr-hand-scroll-edge-top" aria-hidden="true"></div>
      <p class="xlr-hand-caption">掌上演算中…</p>
      <svg class="xlr-hand-svg" viewBox="0 0 100 90" aria-hidden="true">
        <path class="xlr-hand-shape" d="M50 82 C34 78 18 62 22 44 C24 34 32 30 38 36 L42 22 C44 14 52 12 56 20 L60 34 C66 28 76 32 78 42 C82 58 68 74 50 82 Z"/>
        <path class="xlr-hand-path" d="${pathD}"/>
        ${points}
      </svg>
      <p class="xlr-hand-hint">从大安起，顺时针数至所落之位即为结果。</p>
      <div class="xlr-hand-scroll-edge xlr-hand-scroll-edge-bottom" aria-hidden="true"></div>
    </div>
  `;
}

function renderSixGodsScroll(): string {
  return `
    <div class="xlr-scroll-strip" aria-label="六神图鉴预览">
      <div class="xlr-scroll-cap xlr-scroll-cap-left" aria-hidden="true"></div>
      <div class="xlr-scroll-body">
        <div class="xlr-six-gods-head">
          <span class="xlr-six-gods-title">六神图鉴</span>
          <span class="xlr-six-gods-soon">了解六神 ›</span>
        </div>
        <div class="xlr-six-gods-row">
          ${SIX_GODS.map((g, i) => `
            <div class="xlr-god-chip" style="--i:${i}">
              <span class="xlr-god-symbol">${g.symbol}</span>
              <span class="xlr-god-name">${g.name}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="xlr-scroll-cap xlr-scroll-cap-right" aria-hidden="true"></div>
    </div>
  `;
}

export function renderXiaoliurenHero(): string {
  const { index } = getCurrentChineseHour();
  return `
    <div class="xlr-hero-visual">
      ${renderTimeWheel(index)}
      ${renderHandDiagram()}
    </div>
    ${renderSixGodsScroll()}
  `;
}
