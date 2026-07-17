import { CHINESE_HOURS } from '../../xiaoliuren/chinese-hour.ts';

/** 04 时辰页 · 十二时辰对照表（可点开人文彩蛋） */
export function renderShichenTable(activeIndex: number): string {
  const rows = CHINESE_HOURS.map((h) => {
    const active = h.index === activeIndex ? ' is-active' : '';
    const range = h.rangeLabel.replace(' – ', '–').replace(':00', '');
    return `
      <button type="button" class="xlr-shichen-row${active}" data-hour-index="${h.index}" aria-pressed="${h.index === activeIndex ? 'true' : 'false'}">
        <span class="xlr-shichen-row-name">${h.name}时</span>
        <span class="xlr-shichen-row-alias">${h.alias}</span>
        <span class="xlr-shichen-row-range">${range}</span>
      </button>`;
  }).join('');

  return `
    <div class="xlr-shichen-table">
      <p class="xlr-shichen-table-title">十二时辰对照表 · 点一行看彩蛋</p>
      <div class="xlr-shichen-table-grid">${rows}</div>
      <p class="xlr-shichen-lore" hidden data-shichen-lore></p>
    </div>
  `;
}

export function mountShichenTableLore(container: HTMLElement): void {
  const loreEl = container.querySelector<HTMLElement>('[data-shichen-lore]');
  if (!loreEl) return;

  container.querySelectorAll<HTMLButtonElement>('[data-hour-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.hourIndex);
      const hour = CHINESE_HOURS[idx];
      if (!hour) return;
      container.querySelectorAll('.xlr-shichen-row').forEach((row) => {
        row.classList.toggle('is-tapped', row === btn);
      });
      loreEl.hidden = false;
      loreEl.textContent = hour.lore;
    });
  });
}
