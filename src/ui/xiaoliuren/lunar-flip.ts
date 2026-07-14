import type { HuangliCalendarLayout } from '../../xiaoliuren/huangli.ts';
import type { LunarConvertView } from '../../xiaoliuren/lunar-convert.ts';
import { XLR_ASSETS } from './assets.ts';

export type LunarFlipOptions = {
  showTip?: boolean;
  showExpand?: boolean;
  flipped?: boolean;
};

function activeHourLuck(layout: HuangliCalendarLayout): string {
  const cell = layout.shichenRow.find((c) => c.active);
  return cell ? `${cell.luck}` : '—';
}

function renderPaperShell(bodyHtml: string): string {
  return `
    <div class="xlr-cal-page">
      <img class="xlr-cal-paper-main" src="${XLR_ASSETS.calendarPaperMain}" alt="" loading="lazy" aria-hidden="true" />
      <img class="xlr-cal-curl" src="${XLR_ASSETS.calendarCurlTr}" alt="" loading="lazy" aria-hidden="true" />
      <div class="xlr-cal-body">
        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderSolarFace(
  view: LunarConvertView,
  layout: HuangliCalendarLayout,
  visible: boolean,
  id: string,
): string {
  const timePart = view.solarDateTime.slice(11);
  const state = visible ? ' is-visible' : ' is-hidden';

  return `
    <div class="xlr-cal-face xlr-cal-face--solar${state}" id="${id}">
      <p class="xlr-cal-kicker">公历</p>
      <p class="xlr-cal-headline">${layout.solarLabel} · ${layout.weekdayLabel}</p>
      <p class="xlr-cal-hero">${view.solarDay}</p>
      <p class="xlr-cal-sub">${view.solarMonthDay}</p>
      <p class="xlr-cal-note">${layout.weekdayLabel} · ${timePart} · ${view.hourLabel}</p>
      <img class="xlr-cal-rule" src="${XLR_ASSETS.divider}" alt="" loading="lazy" aria-hidden="true" />
      <p class="xlr-cal-hint">换算后将显示农历日期与简版宜忌</p>
    </div>
  `;
}

function renderLunarFace(
  view: LunarConvertView,
  layout: HuangliCalendarLayout,
  visible: boolean,
  id: string,
): string {
  const state = visible ? ' is-visible' : ' is-hidden';
  const hourLuck = activeHourLuck(layout);

  return `
    <div class="xlr-cal-face xlr-cal-face--lunar${state}" id="${id}">
      <p class="xlr-cal-kicker">农历</p>
      <p class="xlr-cal-headline">${view.ganzhiDate}</p>
      <p class="xlr-cal-hero">${view.lunarDay}</p>
      <p class="xlr-cal-sub">${view.lunarMain}</p>

      <div class="xlr-cal-yiji">
        <div class="xlr-cal-yiji-col">
          <span class="xlr-cal-tag xlr-cal-tag--yi">宜</span>
          <p class="xlr-cal-yiji-text">${layout.yiPreview}</p>
        </div>
        <div class="xlr-cal-yiji-col">
          <span class="xlr-cal-tag xlr-cal-tag--ji">忌</span>
          <p class="xlr-cal-yiji-text">${layout.jiPreview}</p>
        </div>
      </div>

      <img class="xlr-cal-rule" src="${XLR_ASSETS.divider}" alt="" loading="lazy" aria-hidden="true" />

      <ul class="xlr-cal-meta" aria-label="简版黄历">
        <li><span>五行</span>${layout.wuxingNayin}</li>
        <li><span>冲煞</span>${layout.chongsha}</li>
        <li><span>时辰</span>${view.hourLabel} · ${hourLuck}</li>
      </ul>
    </div>
  `;
}

export function renderLunarFlipScroll(
  view: LunarConvertView,
  layout: HuangliCalendarLayout,
  opts: LunarFlipOptions = {},
): string {
  const { showTip = true, showExpand = true, flipped = false } = opts;
  const convertedClass = flipped ? ' is-converted' : '';

  const faces = `
    ${renderSolarFace(view, layout, !flipped, 'xlr-calendar-solar')}
    ${renderLunarFace(view, layout, flipped, 'xlr-calendar-lunar')}
  `;

  return `
    <div class="xlr-lunar-calendar${convertedClass}" aria-label="公历转农历">
      <p class="xlr-lunar-status${flipped ? ' is-done' : ''}" id="xlr-converting">
        ${flipped ? '换算完成' : '正在换算…'}
      </p>

      <div class="xlr-cal-card">
        <div class="xlr-cal-stack">
          <img class="xlr-cal-hanger" src="${XLR_ASSETS.calendarHanger}" alt="" loading="lazy" />
          ${renderPaperShell(faces)}
        </div>
      </div>

      ${flipped && showTip ? `
        <div class="xlr-lunar-explain">
          小六壬以农历起课，<br />所以先为你换算。
        </div>
      ` : ''}
      ${showExpand ? '<button type="button" class="xlr-lunar-expand" data-huangli-expand>展开完整黄历 ↓</button>' : ''}
    </div>
  `;
}

export async function playLunarFlipAnimation(
  container: HTMLElement,
  wait: (ms: number) => Promise<void>,
  reducedMotion: boolean,
): Promise<void> {
  const calendar = container.querySelector('.xlr-lunar-calendar');
  const solar = container.querySelector('#xlr-calendar-solar');
  const lunar = container.querySelector('#xlr-calendar-lunar');
  const converting = container.querySelector('#xlr-converting');
  if (!calendar || !solar || !lunar) return;

  await wait(reducedMotion ? 500 : 2200);

  if (converting) converting.textContent = '对应农历…';
  await wait(reducedMotion ? 200 : 600);

  calendar.classList.add('is-converting');
  solar.classList.remove('is-visible');
  solar.classList.add('is-hidden');
  lunar.classList.remove('is-hidden');
  lunar.classList.add('is-visible');
  await wait(reducedMotion ? 400 : 1300);

  calendar.classList.add('is-converted');
  calendar.classList.remove('is-converting');
  converting?.classList.add('is-done');
  if (converting) converting.textContent = '换算完成';
  await wait(reducedMotion ? 200 : 500);
}
