/**
 * Lab 首页 · 本周只学一件卡
 */
import { navigate } from '../router.ts';
import { mysticEmblemHtml } from './mystic-emblem.ts';
import { resolveWeekFocus, type WeekFocusCard } from '../lab/week-focus.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function weekFocusCardHtml(card: WeekFocusCard): string {
  const sourceNote = card.source === 'chart' ? '盘上焦点' : '本周基础词';
  const drill =
    card.system === 'ziwei'
      ? { path: '/ziwei/guess', label: '猜星曜练一题 ›' }
      : card.system === 'tarot'
        ? { path: '/tarot/guess', label: '猜牌义练一题 ›' }
        : card.system === 'bazi'
          ? { path: '/bazi/guess', label: '猜命盘练一题 ›' }
          : null;
  const drillHtml = drill
    ? `<p class="lab-week-focus-drill"><button type="button" class="lab-week-focus-drill-btn" data-week-focus-go data-path="${escapeHtml(drill.path)}">${escapeHtml(drill.label)}</button></p>`
    : '';
  return `
    <section class="lab-week-focus" aria-label="本周只学一件">
      <button type="button" class="lab-week-focus-card" data-week-focus-go data-path="${escapeHtml(card.href)}">
        <div class="lab-week-focus-emblem">${mysticEmblemHtml(card.emblem, 'sm')}</div>
        <div class="lab-week-focus-copy">
          <p class="lab-week-focus-kicker">本周只学一件 · ${escapeHtml(card.systemLabel)} · ${escapeHtml(sourceNote)}</p>
          <h2 class="lab-week-focus-title">${escapeHtml(card.title)}</h2>
          <p class="lab-week-focus-blurb">${escapeHtml(card.blurb)}</p>
          <p class="lab-week-focus-why">${escapeHtml(card.why)}</p>
          <span class="lab-week-focus-cta">去学这件 ›</span>
        </div>
      </button>
      ${drillHtml}
      <p class="lab-week-focus-meta">自然周 ${escapeHtml(card.weekStart)} 起 · 本周内刷新仍是这一件</p>
    </section>
  `;
}

export function mountLabWeekFocusCard(host: HTMLElement): WeekFocusCard {
  const card = resolveWeekFocus();
  host.innerHTML = weekFocusCardHtml(card);
  host.querySelectorAll<HTMLElement>('[data-week-focus-go]').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.dataset.path;
      if (path) navigate(path);
    });
  });
  return card;
}
