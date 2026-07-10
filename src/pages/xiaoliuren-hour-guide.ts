import { navigate } from '../router.ts';
import { CHINESE_HOURS, getChineseHour, sectorPointerAngle, formatClockTime } from '../xiaoliuren/chinese-hour.ts';
import { solarToLunar } from '../xiaoliuren/lunar.ts';
import { renderHourTimeline } from '../ui/xiaoliuren/hand-plate.ts';
import {
  formatWeekday,
  mountShichenDialAnimation,
  renderShichenDial,
} from '../ui/xiaoliuren/shichen-dial.ts';
import { mountEnvBanner } from '../ui/banner.ts';

export function renderXiaoliurenHourGuide(root: HTMLElement): void {
  const now = new Date();
  const hour = getChineseHour(now);
  const lunar = solarToLunar(now);

  const page = document.createElement('div');
  page.className = 'page xlr-hour-guide-page xlr-xuan-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回小六壬';
  back.addEventListener('click', () => navigate('/xiaoliuren'));
  page.append(back);

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">时辰入门</h1>
    <p class="page-subtitle">${formatClockTime(now)} 属${hour.label} · 快速看懂十二时辰</p>
  `;
  page.append(header);

  const visual = document.createElement('div');
  visual.className = 'xlr-scene-enter';
  visual.innerHTML =
    renderShichenDial({
      activeIndex: hour.index,
      clockDeg: sectorPointerAngle(now),
      timeLabel: formatClockTime(now),
      hourLabel: hour.label,
      lunarLabel: lunar.label,
      weekday: formatWeekday(now),
      animateEnter: true,
    }) + renderHourTimeline(hour.index);
  page.append(visual);
  mountShichenDialAnimation(visual);

  const list = document.createElement('div');
  list.className = 'xlr-hour-guide-list';
  for (const h of CHINESE_HOURS) {
    const row = document.createElement('article');
    row.className = `xlr-hour-guide-row${h.index === hour.index ? ' is-active' : ''}`;
    row.innerHTML = `
      <h2>${h.label}</h2>
      <p>${h.rangeLabel}</p>
      <p class="xlr-hour-guide-memory">${h.memoryHint}</p>
    `;
    list.appendChild(row);
  }
  page.append(list);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.textContent = '去起课试试';
  btn.addEventListener('click', () => navigate('/xiaoliuren/reading'));
  page.append(btn);

  root.appendChild(page);
}
