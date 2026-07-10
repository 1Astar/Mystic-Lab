import type { LunarConvertView } from '../../xiaoliuren/lunar-convert.ts';
import { XLR_ASSETS } from './assets.ts';

export type LunarFlipOptions = {
  showTip?: boolean;
  showExpand?: boolean;
  flipped?: boolean;
};

export function renderLunarFlipScroll(
  view: LunarConvertView,
  opts: LunarFlipOptions = {},
): string {
  const { showTip = true, showExpand = true, flipped = false } = opts;
  const frontClass = flipped ? ' is-flipped' : '';

  return `
    <div class="xlr-lunar-scroll" aria-label="公历转农历">
      <p class="xlr-lunar-status${flipped ? ' is-done' : ''}" id="xlr-converting">
        ${flipped ? '翻阅完成' : '正在翻阅黄历……'}
      </p>

      <div class="xlr-scroll-calendar">
        <img class="xlr-scroll-top" src="${XLR_ASSETS.scrollTop}" alt="" loading="lazy" />
        <div class="xlr-scroll-body">
          <img class="xlr-scroll-paper-bg" src="${XLR_ASSETS.scrollPaper}" alt="" loading="lazy" />
          <div class="xlr-lunar-flip-stage">
            <div class="xlr-lunar-sheet xlr-lunar-sheet-back">
              <div class="xlr-lunar-paper-text xlr-lunar-paper-text--dark">
                <p class="xlr-lunar-line-kicker">${view.lunarTitle}</p>
                <p class="xlr-lunar-line-main">${view.lunarLabel}</p>
                <p class="xlr-lunar-line-sub">${view.ganzhiLine}</p>
              </div>
            </div>
            <div class="xlr-lunar-sheet xlr-lunar-sheet-front${frontClass}" id="xlr-lunar-front">
              <div class="xlr-lunar-paper-text xlr-lunar-paper-text--dark">
                <p class="xlr-lunar-line-kicker">今日</p>
                <p class="xlr-lunar-line-main">${view.solarLabel}</p>
                <p class="xlr-lunar-line-sub">${view.weekdayLabel} · ${view.solarDateTime.slice(11)}</p>
              </div>
              <img class="xlr-paper-curl" src="${XLR_ASSETS.paperCurl}" alt="" loading="lazy" />
            </div>
          </div>
        </div>
        <img class="xlr-scroll-bottom" src="${XLR_ASSETS.scrollBottom}" alt="" loading="lazy" />
      </div>

      ${flipped && showTip ? `
        <p class="xlr-lunar-tip">
          小六壬以农历起课，<br />所以先为你换算。
        </p>
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
  const front = container.querySelector('#xlr-lunar-front');
  const converting = container.querySelector('#xlr-converting');
  if (!front) return;

  await wait(reducedMotion ? 400 : 1200);

  if (reducedMotion) {
    front.classList.add('is-flipped');
  } else {
    front.classList.add('is-flipping');
    await wait(1000);
    front.classList.add('is-flipped');
  }

  converting?.classList.add('is-done');
  if (converting) converting.textContent = '翻阅完成';
  await wait(reducedMotion ? 200 : 500);
}
