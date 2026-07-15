import type { HuangliCalendarLayout } from '../../xiaoliuren/huangli.ts';
import type { LunarConvertView } from '../../xiaoliuren/lunar-convert.ts';
import { XLR_ASSETS } from './assets.ts';

export type LunarFlipOptions = {
  showTip?: boolean;
  showExpand?: boolean;
  flipped?: boolean;
  /** 如 15:00 – 17:00 */
  hourRangeLabel?: string;
};

function formatHourRange(rangeLabel: string): string {
  return rangeLabel.replace(/\s*–\s*/g, '–').replace(/\s*-\s*/g, '–');
}

function renderActivityCol(tag: '宜' | '忌', items: string[], src: string): string {
  const tagClass = tag === '宜' ? 'xlr-cal-tag--yi' : 'xlr-cal-tag--ji';
  const lines = items.map((item) => `<li>${item}</li>`).join('');
  return `
    <div class="xlr-cal-yiji-col">
      <img class="xlr-cal-tag ${tagClass}" src="${src}" alt="${tag}" loading="lazy" />
      <ul class="xlr-cal-yiji-list">${lines}</ul>
    </div>
  `;
}

function renderMetaRow(label: string, value: string): string {
  return `<li><span>${label}</span>${value}</li>`;
}

function renderPaperShell(bodyHtml: string): string {
  return `
    <div class="xlr-cal-page">
      <img class="xlr-cal-paper-main" src="${XLR_ASSETS.calendarPaperMain}" alt="" loading="lazy" aria-hidden="true" />
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
  hourRangeLabel: string,
): string {
  const timePart = view.solarDateTime.slice(11);
  const state = visible ? ' is-visible' : ' is-hidden';
  const range = formatHourRange(hourRangeLabel);

  return `
    <div class="xlr-cal-face xlr-cal-face--solar${state}" id="${id}">
      <p class="xlr-cal-hero">${view.solarDay}</p>
      <p class="xlr-cal-sub">${view.solarMonthDay}</p>
      <p class="xlr-cal-hour">当前时辰：${view.hourLabel}<span>（${range}）</span></p>
      <p class="xlr-cal-note">${layout.weekdayLabel} · ${timePart}</p>
      <img class="xlr-cal-rule" src="${XLR_ASSETS.calendarDivider}" alt="" loading="lazy" aria-hidden="true" />
      <p class="xlr-cal-hint">公历 → 农历</p>
    </div>
  `;
}

function renderLunarFace(
  view: LunarConvertView,
  layout: HuangliCalendarLayout,
  visible: boolean,
  id: string,
  hourRangeLabel: string,
): string {
  const state = visible ? ' is-visible' : ' is-hidden';
  const range = formatHourRange(hourRangeLabel);

  return `
    <div class="xlr-cal-face xlr-cal-face--lunar${state}" id="${id}">
      <p class="xlr-cal-hero">${view.lunarDay}</p>
      <p class="xlr-cal-sub">${view.lunarMain}</p>
      <p class="xlr-cal-hour">当前时辰：${view.hourLabel}<span>（${range}）</span></p>

      <div class="xlr-cal-yiji">
        ${renderActivityCol('宜', layout.yiColumn, XLR_ASSETS.calendarBadgeYi)}
        ${renderActivityCol('忌', layout.jiColumn, XLR_ASSETS.calendarBadgeJi)}
      </div>

      <img class="xlr-cal-rule" src="${XLR_ASSETS.calendarDivider}" alt="" loading="lazy" aria-hidden="true" />

      <div class="xlr-cal-meta" aria-label="简版黄历">
        <ul class="xlr-cal-meta-col">
          ${renderMetaRow('五行', layout.wuxingShort)}
          ${renderMetaRow('冲煞', layout.chongShort)}
        </ul>
        <ul class="xlr-cal-meta-col">
          ${renderMetaRow('财神', layout.caiShen)}
          ${renderMetaRow('喜神', layout.xiShen)}
          ${renderMetaRow('时辰', view.hourLabel)}
        </ul>
      </div>
    </div>
  `;
}

function renderLessonTip(flipped: boolean, showExpand: boolean): string {
  const stepLine = flipped
    ? '已为你转换：公历 → 农历 → 时辰'
    : '正在为你转换：公历 → 农历 → 时辰';

  return `
    <div class="xlr-lunar-explain">
      <p class="xlr-lunar-explain-title">起课提示</p>
      <p class="xlr-lunar-explain-body">小六壬以农历月、日、时辰作为起课依据。</p>
      <p class="xlr-lunar-explain-step">${stepLine}</p>
      ${showExpand ? `
        <button type="button" class="xlr-lunar-expand" data-huangli-expand>
          展开完整黄历 <span aria-hidden="true">↓</span>
        </button>
      ` : ''}
    </div>
  `;
}

export function renderLunarFlipScroll(
  view: LunarConvertView,
  layout: HuangliCalendarLayout,
  opts: LunarFlipOptions = {},
): string {
  const {
    showTip = true,
    showExpand = true,
    flipped = false,
    hourRangeLabel = '—',
  } = opts;
  const convertedClass = flipped ? ' is-converted' : '';

  const faces = `
    ${renderSolarFace(view, layout, !flipped, 'xlr-calendar-solar', hourRangeLabel)}
    ${renderLunarFace(view, layout, flipped, 'xlr-calendar-lunar', hourRangeLabel)}
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

      ${showTip ? renderLessonTip(flipped, showExpand) : showExpand ? `
        <button type="button" class="xlr-lunar-expand" data-huangli-expand>
          展开完整黄历 <span aria-hidden="true">↓</span>
        </button>
      ` : ''}
    </div>
  `;
}

async function playPageTurn(
  page: Element,
  wait: (ms: number) => Promise<void>,
  reducedMotion: boolean,
): Promise<void> {
  page.classList.add('is-turning');
  await wait(reducedMotion ? 200 : 520);
  page.classList.remove('is-turning');
  page.classList.add('is-turned');
}

export async function playLunarFlipAnimation(
  container: HTMLElement,
  wait: (ms: number) => Promise<void>,
  reducedMotion: boolean,
): Promise<void> {
  const calendar = container.querySelector('.xlr-lunar-calendar');
  const page = container.querySelector('.xlr-cal-page');
  const solar = container.querySelector('#xlr-calendar-solar');
  const lunar = container.querySelector('#xlr-calendar-lunar');
  const converting = container.querySelector('#xlr-converting');
  if (!calendar || !solar || !lunar) return;

  await wait(reducedMotion ? 400 : 1200);

  if (converting) converting.textContent = '对应农历…';
  await wait(reducedMotion ? 160 : 360);

  calendar.classList.add('is-converting');
  if (page) {
    const turnPromise = playPageTurn(page, wait, reducedMotion);
    await wait(reducedMotion ? 80 : 180);
    solar.classList.remove('is-visible');
    solar.classList.add('is-hidden');
    lunar.classList.remove('is-hidden');
    lunar.classList.add('is-visible');
    await turnPromise;
  } else {
    solar.classList.remove('is-visible');
    solar.classList.add('is-hidden');
    lunar.classList.remove('is-hidden');
    lunar.classList.add('is-visible');
    await wait(reducedMotion ? 300 : 560);
  }

  calendar.classList.add('is-converted');
  calendar.classList.remove('is-converting');
  converting?.classList.add('is-done');
  if (converting) converting.textContent = '换算完成';
  await wait(reducedMotion ? 160 : 280);
}
