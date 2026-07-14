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



export function renderXiaoliurenHero(): string {

  const now = new Date();

  const hour = getChineseHour(now);

  const lunar = solarToLunar(now);



  return `

    <div class="xlr-home-stagger xlr-stagger-root">

      <section class="xlr-home-core" aria-label="小六壬概览">

        <div class="xlr-home-panel xlr-home-dial xlr-stagger-item" style="--si:2">

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

        <div class="xlr-home-panel xlr-home-palm xlr-stagger-item" style="--si:3">

          <p class="xlr-home-panel-label">掌上演算预览</p>

          <div class="xlr-home-palm-viewport">

            <img class="xlr-home-palm-img" src="${XLR_ASSETS.palmChart}" alt="掌诀示意" loading="lazy" />

          </div>

        </div>

      </section>

      ${renderXlrDivider('xlr-home-divider')}

      <section class="xlr-home-gods xlr-home-panel xlr-stagger-item" style="--si:4" aria-label="六神图鉴">

        <p class="xlr-home-panel-label">六神图鉴</p>

        <div class="xlr-home-gods-row">

          ${SIX_GODS.map((g, i) => `

            <div class="xlr-home-god-badge" style="--i:${i}">

              ${renderSixGodIcon(g, 'xlr-home-god-icon')}

              <span>${g.name}</span>

            </div>`).join('')}

        </div>

      </section>

    </div>

  `;

}



export function mountXiaoliurenHero(root: HTMLElement): void {

  const staggerRoot = root.querySelector('.xlr-home-stagger');

  if (staggerRoot) mountStaggerEntrance(staggerRoot as HTMLElement);



  const dialHost = root.querySelector('.xlr-home-dial');

  if (dialHost) mountShichenDialAnimation(dialHost as HTMLElement);

}

