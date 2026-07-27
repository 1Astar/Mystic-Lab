import { Solar } from 'lunar-javascript';
import { LIU_CHONG } from './yao-special.ts';

export type SiZhu = {
  year: string;
  month: string;
  day: string;
  hour: string;
  dayStem: string;
  dayXunKong: string;
};

/** 公历时刻 → 四柱（lunar-javascript） */
export function siZhuFromDate(date: Date): SiZhu {
  const lunar = Solar.fromDate(date).getLunar();
  const day = lunar.getDayInGanZhi();
  return {
    year: lunar.getYearInGanZhi(),
    month: lunar.getMonthInGanZhi(),
    day,
    hour: lunar.getTimeInGanZhi(),
    dayStem: day.charAt(0),
    dayXunKong: lunar.getDayXunKong(),
  };
}

/** datetime-local 值 ↔ Date */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): Date {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function formatAskTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ganZhiParts(gz: string): { stem: string; branch: string } {
  return { stem: gz.charAt(0) || '', branch: gz.slice(1) || '' };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tokenHtml(gz: string, unit: string, opts?: { accent?: boolean; hint?: string }): string {
  const { stem, branch } = ganZhiParts(gz);
  const accent = opts?.accent ? ' is-accent' : '';
  const hint = opts?.hint
    ? `<span class="ly-time-hint">${escapeHtml(opts.hint)}</span>`
    : '';
  return `<span class="ly-time-token${accent}" role="listitem"><em class="ly-time-stem">${escapeHtml(
    stem,
  )}</em><b class="ly-time-branch">${escapeHtml(branch)}</b><i class="ly-time-unit">${escapeHtml(
    unit,
  )}</i>${hint}</span>`;
}

/** 问卦时间 + 横向干支能量刻度（放在核心卦象上方） */
export function renderCastTimePlaque(date: Date, opts?: { compact?: boolean }): string {
  const sz = siZhuFromDate(date);
  const compact = opts?.compact ? ' is-compact' : '';
  const monthBr = ganZhiParts(sz.month).branch;
  const dayBr = ganZhiParts(sz.day).branch;
  return `
    <aside class="ly-time-plaque${compact}" aria-label="问卦时间与干支刻度">
      <p class="ly-time-plaque-ask">📜 问卦时间：${formatAskTime(date)}</p>
      <p class="ly-time-plaque-label">传统干支能量刻度</p>
      <div class="ly-time-scale" role="list">
        ${tokenHtml(sz.year, '年')}
        <span class="ly-time-sep" aria-hidden="true">·</span>
        ${tokenHtml(sz.month, '月', { accent: true, hint: '月建' })}
        <span class="ly-time-sep" aria-hidden="true">·</span>
        ${tokenHtml(sz.day, '日', { accent: true, hint: '日建' })}
        <span class="ly-time-sep" aria-hidden="true">·</span>
        ${tokenHtml(sz.hour, '时')}
      </div>
      ${
        sz.dayXunKong
          ? `<p class="ly-time-plaque-meta">日空亡 ${escapeHtml(sz.dayXunKong)} · 日干 ${escapeHtml(sz.dayStem)}</p>`
          : `<p class="ly-time-plaque-meta">日干 ${escapeHtml(sz.dayStem)}</p>`
      }
      <p class="ly-time-plaque-chong">冲看这里：日支<strong>${escapeHtml(dayBr)}</strong>冲<strong>${escapeHtml(
        LIU_CHONG[dayBr] ?? '—',
      )}</strong>（暗动）· 月支<strong>${escapeHtml(monthBr)}</strong>冲<strong>${escapeHtml(
        LIU_CHONG[monthBr] ?? '—',
      )}</strong>（月破）</p>
    </aside>
  `;
}

/**
 * 能量 Tab 用：日期对照条（说清月建/日建/空亡，以及冲谁）
 */
export function renderDateChongBarHtml(date: Date): string {
  const sz = siZhuFromDate(date);
  const month = ganZhiParts(sz.month);
  const day = ganZhiParts(sz.day);
  const monthChong = LIU_CHONG[month.branch] ?? '—';
  const dayChong = LIU_CHONG[day.branch] ?? '—';
  return `
    <section class="ly-date-chong" data-date-chong>
      <p class="ly-layer-guide">日期对照 · 看有没有冲</p>
      <p class="ly-guide-tip">暗动看<strong>日建</strong>冲哪一支；月破看<strong>月建</strong>冲哪一支。对照装卦表地支列即可。</p>
      <p class="ly-date-chong-time">问卦：${escapeHtml(formatAskTime(date))}</p>
      <ul class="ly-date-chong-list">
        <li><strong>月建</strong> ${escapeHtml(sz.month)}（${escapeHtml(month.branch)}）· 冲 <em>${escapeHtml(monthChong)}</em> → 月破</li>
        <li><strong>日建</strong> ${escapeHtml(sz.day)}（${escapeHtml(day.branch)}）· 冲 <em>${escapeHtml(dayChong)}</em> → 暗动</li>
        <li><strong>日空亡</strong> ${escapeHtml(sz.dayXunKong || '—')} · 日干 ${escapeHtml(sz.dayStem)}</li>
        <li><strong>年 / 时</strong> ${escapeHtml(sz.year)} · ${escapeHtml(sz.hour)}</li>
      </ul>
    </section>
  `;
}
