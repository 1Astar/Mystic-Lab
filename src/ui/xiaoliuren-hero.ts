import {
  formatClockTime,
  getChineseHour,
  sectorPointerAngle,
} from '../xiaoliuren/chinese-hour.ts';
import { solarToLunar } from '../xiaoliuren/lunar.ts';
import { renderSixGodIcon, SIX_GODS } from '../xiaoliuren/six-gods.ts';
import { renderXlrDivider } from './xiaoliuren/assets.ts';
import {
  formatWeekday,
  mountShichenDialAnimation,
  renderShichenDial,
} from './xiaoliuren/shichen-dial.ts';
import { XLR_ASSETS } from './xiaoliuren/assets.ts';
import { mountStaggerEntrance } from './xiaoliuren/motion.ts';

const FLOW_STEPS = ['时间', '起数', '掐指定位', '六神落位', '结合问题解读'] as const;

function renderIntroSection(): string {
  return `
    <section class="xlr-home-intro xlr-home-panel xlr-stagger-item" style="--si:4" aria-label="认识小六壬">
      <p class="xlr-home-panel-label">认识小六壬</p>
      <h2 class="xlr-home-intro-title">什么是小六壬？</h2>
      <p class="xlr-home-intro-lead">小六壬是一种以时间起课的传统占测方法。</p>
      <p class="xlr-home-intro-body">它通过<strong>农历月 → 农历日 → 时辰</strong>三个时间信息，推算六神落位。</p>
      <p class="xlr-home-intro-body">六神分别是：大安、留连、速喜、赤口、小吉、空亡。每一个结果都有自己的象征含义。</p>

      <p class="xlr-home-flow-label">一句话理解</p>
      <ol class="xlr-home-flow" aria-label="起课流程">
        ${FLOW_STEPS.map(
          (step, i) => `
          <li class="xlr-home-flow-step" style="--fi:${i}">
            <span class="xlr-home-flow-dot">${i + 1}</span>
            <span class="xlr-home-flow-text">${step}</span>
          </li>`,
        ).join('')}
      </ol>
    </section>
  `;
}

export function renderXiaoliurenHero(): string {
  const now = new Date();
  const hour = getChineseHour(now);
  const lunar = solarToLunar(now);

  return `
    <div class="xlr-home-stagger xlr-stagger-root">
      <section class="xlr-home-core" aria-label="此刻时间与掌诀">
        <div class="xlr-home-panel xlr-home-dial xlr-stagger-item" style="--si:1">
          ${renderShichenDial({
            activeIndex: hour.index,
            clockDeg: sectorPointerAngle(now),
            timeLabel: formatClockTime(now),
            hourLabel: hour.label,
            lunarLabel: lunar.label,
            weekday: formatWeekday(now),
            animateEnter: true,
            size: 'hero',
          })}
        </div>

        <div class="xlr-home-panel xlr-home-palm xlr-stagger-item" style="--si:2">
          <p class="xlr-home-panel-label">掌上演算预览</p>
          <div class="xlr-home-palm-viewport">
            <img class="xlr-home-palm-img" src="${XLR_ASSETS.palmChartHome}" alt="掌诀示意" loading="lazy" />
          </div>
        </div>
      </section>

      ${renderXlrDivider('xlr-home-divider')}

      <section class="xlr-home-gods xlr-home-panel xlr-stagger-item" style="--si:3" aria-label="六神图鉴">
        <p class="xlr-home-panel-label">六神图鉴</p>
        <p class="xlr-home-gods-hint">点下方「六神图鉴」看完整象征与用法</p>
        <div class="xlr-home-gods-row">
          ${SIX_GODS.map(
            (g, i) => `
            <div class="xlr-home-god-badge" style="--i:${i}">
              ${renderSixGodIcon(g, 'xlr-home-god-icon')}
              <span>${g.name}</span>
            </div>`,
          ).join('')}
        </div>
      </section>

      ${renderXlrDivider('xlr-home-divider')}

      ${renderIntroSection()}
    </div>
  `;
}

export function mountXiaoliurenHero(root: HTMLElement): void {
  const staggerRoot = root.querySelector('.xlr-home-stagger');
  if (staggerRoot) mountStaggerEntrance(staggerRoot as HTMLElement);

  const dialHost = root.querySelector('.xlr-home-dial');
  if (dialHost) mountShichenDialAnimation(dialHost as HTMLElement);
}
