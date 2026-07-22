import { Solar } from 'lunar-javascript';

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

function tokenHtml(gz: string, unit: string): string {
  const { stem, branch } = ganZhiParts(gz);
  return `<span class="ly-time-token" role="listitem"><em class="ly-time-stem">${stem}</em><b class="ly-time-branch">${branch}</b><i class="ly-time-unit">${unit}</i></span>`;
}

/** 问卦时间 + 横向干支能量刻度（放在核心卦象上方） */
export function renderCastTimePlaque(date: Date, opts?: { compact?: boolean }): string {
  const sz = siZhuFromDate(date);
  const compact = opts?.compact ? ' is-compact' : '';
  return `
    <aside class="ly-time-plaque${compact}" aria-label="问卦时间与干支刻度">
      <p class="ly-time-plaque-ask">📜 问卦时间：${formatAskTime(date)}</p>
      <p class="ly-time-plaque-label">传统干支能量刻度</p>
      <div class="ly-time-scale" role="list">
        ${tokenHtml(sz.year, '年')}
        <span class="ly-time-sep" aria-hidden="true">·</span>
        ${tokenHtml(sz.month, '月')}
        <span class="ly-time-sep" aria-hidden="true">·</span>
        ${tokenHtml(sz.day, '日')}
        <span class="ly-time-sep" aria-hidden="true">·</span>
        ${tokenHtml(sz.hour, '时')}
      </div>
      ${
        sz.dayXunKong
          ? `<p class="ly-time-plaque-meta">空亡 ${sz.dayXunKong} · 日干 ${sz.dayStem}</p>`
          : `<p class="ly-time-plaque-meta">日干 ${sz.dayStem}</p>`
      }
    </aside>
  `;
}
