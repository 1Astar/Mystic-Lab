/**
 * 运限选择：大限 / 流年 / 流月 / 流日 / 流时
 * 流年·流月横滑；流日默认折叠；选中短金线。
 */
import type { LimitBoardSelection } from '../ziwei/horoscope-limits.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';

export type { LimitBoardSelection };

const LUNAR_MONTHS = [
  '正月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '冬月',
  '腊月',
];

const ONES = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

const LUNAR_DAYS = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  if (n === 10) return '初十';
  if (n === 20) return '二十';
  if (n === 30) return '三十';
  if (n < 10) return `初${ONES[n]}`;
  if (n < 20) return `十${ONES[n - 10]}`;
  return `廿${ONES[n - 20]}`;
});

const HOURS = [
  '子时',
  '丑时',
  '寅时',
  '卯时',
  '辰时',
  '巳时',
  '午时',
  '未时',
  '申时',
  '酉时',
  '戌时',
  '亥时',
];

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function yearGanzhi(year: number): string {
  const i = ((year - 1984) % 60 + 60) % 60;
  return `${STEMS[i % 10]}${BRANCHES[i % 12]}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decadeChips(palaces: PalaceSnap[], selected?: string): string {
  const rows = palaces
    .filter((p) => p.decadalRange)
    .slice()
    .sort((a, b) => (a.decadalRange![0] ?? 0) - (b.decadalRange![0] ?? 0));
  return rows
    .map((p) => {
      const [from, to] = p.decadalRange!;
      const gz = `${p.decadalStem ?? ''}${p.decadalBranch ?? ''}`;
      const label = `${from}–${to}${gz ? ` · ${gz}` : ''}`;
      const on = selected === p.name ? 'is-on' : '';
      return `<button type="button" class="ziwei-limit-chip ${on}" data-limit-decade="${escapeHtml(p.name)}" aria-pressed="${selected === p.name}">${escapeHtml(label)}</button>`;
    })
    .join('');
}

function yearChips(centerYear: number, birthYear: number, selected?: number): string {
  const start = Math.max(birthYear, centerYear - 8);
  const end = centerYear + 6;
  const parts: string[] = [];
  for (let y = start; y <= end; y++) {
    const on = selected === y ? 'is-on' : '';
    parts.push(
      `<button type="button" class="ziwei-limit-chip ${on}" data-limit-year="${y}" aria-pressed="${selected === y}">${y}<em>${yearGanzhi(y)}</em></button>`,
    );
  }
  return parts.join('');
}

function monthChips(selected?: number): string {
  return LUNAR_MONTHS.map(
    (name, i) =>
      `<button type="button" class="ziwei-limit-chip ${selected === i + 1 ? 'is-on' : ''}" data-limit-month="${i + 1}" aria-pressed="${selected === i + 1}">${name}</button>`,
  ).join('');
}

function dayChips(selected?: number): string {
  return LUNAR_DAYS.map(
    (name, i) =>
      `<button type="button" class="ziwei-limit-chip ${selected === i + 1 ? 'is-on' : ''}" data-limit-day="${i + 1}" aria-pressed="${selected === i + 1}">${name}</button>`,
  ).join('');
}

function hourChips(selected?: number): string {
  return HOURS.map(
    (name, i) =>
      `<button type="button" class="ziwei-limit-chip ${selected === i ? 'is-on' : ''}" data-limit-hour="${i}" aria-pressed="${selected === i}">${name}</button>`,
  ).join('');
}

function summaryLine(sel: LimitBoardSelection, birthYear: number): string {
  const decade = sel.decadePalace ? sel.decadePalace.replace(/宫$/, '') : '—';
  const y = sel.year ?? new Date().getFullYear();
  const age = y - birthYear + 1;
  const m = sel.month ? LUNAR_MONTHS[sel.month - 1] : '—';
  const d = sel.day ? LUNAR_DAYS[sel.day - 1] : '—';
  const h = typeof sel.hour === 'number' ? HOURS[sel.hour] : '—';
  return `大限 ${decade}　流年 ${y}（${age}岁）　${m}${d}　${h}`;
}

export type MountZiweiLimitBoardOpts = {
  view: ZiweiChartView;
  birthYear: number;
  initial?: LimitBoardSelection;
  onChange?: (
    sel: LimitBoardSelection,
    focus: 'decade' | 'year' | 'month' | 'day' | 'hour',
  ) => void;
};

export type ZiweiLimitBoardHandle = {
  destroy: () => void;
  syncDecade: (palaceName: string) => void;
  setYear: (year: number, emit?: boolean) => void;
  getSelection: () => LimitBoardSelection;
};

export function mountZiweiLimitBoard(
  host: HTMLElement,
  opts: MountZiweiLimitBoardOpts,
): ZiweiLimitBoardHandle {
  const now = new Date();
  let sel: LimitBoardSelection = {
    decadePalace:
      opts.initial?.decadePalace ??
      (opts.view.theater.decade.palaceName || opts.view.soulPalace.name),
    year: opts.initial?.year ?? opts.view.theater.annual.year ?? now.getFullYear(),
    month: opts.initial?.month ?? now.getMonth() + 1,
    day: opts.initial?.day ?? Math.min(now.getDate(), 30),
    hour: opts.initial?.hour ?? 6,
  };
  /** 流日默认折叠，避免手机一排小字 */
  let dayOpen = false;
  let hourOpen = false;

  function emit(focus: 'decade' | 'year' | 'month' | 'day' | 'hour'): void {
    opts.onChange?.(sel, focus);
  }

  function paint(): void {
    const dayLabel = sel.day ? LUNAR_DAYS[sel.day - 1] : '选择日期';
    const hourLabel = typeof sel.hour === 'number' ? HOURS[sel.hour] : '选择时辰';

    host.innerHTML = `
      <section class="ziwei-limit" aria-label="运限">
        <header class="ziwei-limit-head">
          <p class="ziwei-limit-kicker">运限</p>
          <p class="ziwei-limit-summary">${escapeHtml(summaryLine(sel, opts.birthYear))}</p>
        </header>

        <div class="ziwei-limit-row">
          <span class="ziwei-limit-label">大限</span>
          <div class="ziwei-limit-track">${decadeChips(opts.view.palaces, sel.decadePalace)}</div>
        </div>
        <div class="ziwei-limit-row">
          <span class="ziwei-limit-label">流年</span>
          <div class="ziwei-limit-track is-year">${yearChips(sel.year ?? now.getFullYear(), opts.birthYear, sel.year)}</div>
        </div>
        <div class="ziwei-limit-row">
          <span class="ziwei-limit-label">流月</span>
          <div class="ziwei-limit-track is-month">${monthChips(sel.month)}</div>
        </div>
        <div class="ziwei-limit-row is-fold">
          <span class="ziwei-limit-label">流日</span>
          <button type="button" class="ziwei-limit-fold ${dayOpen ? 'is-open' : ''}" data-toggle-day aria-expanded="${dayOpen}">
            ${escapeHtml(dayLabel ?? '选择日期')}
          </button>
        </div>
        ${
          dayOpen
            ? `<div class="ziwei-limit-row is-nested"><div class="ziwei-limit-track is-day">${dayChips(sel.day)}</div></div>`
            : ''
        }
        <div class="ziwei-limit-row is-fold">
          <span class="ziwei-limit-label">流时</span>
          <button type="button" class="ziwei-limit-fold ${hourOpen ? 'is-open' : ''}" data-toggle-hour aria-expanded="${hourOpen}">
            ${escapeHtml(hourLabel ?? '选择时辰')}
          </button>
        </div>
        ${
          hourOpen
            ? `<div class="ziwei-limit-row is-nested"><div class="ziwei-limit-track is-hour">${hourChips(sel.hour)}</div></div>`
            : ''
        }
      </section>`;

    const bind = (
      selAttr: string,
      apply: (v: string) => void,
      focus: 'decade' | 'year' | 'month' | 'day' | 'hour',
    ) => {
      host.querySelectorAll<HTMLButtonElement>(`[${selAttr}]`).forEach((btn) => {
        btn.addEventListener('click', () => {
          apply(btn.getAttribute(selAttr) ?? '');
          if (focus === 'day') dayOpen = false;
          if (focus === 'hour') hourOpen = false;
          emit(focus);
          paint();
        });
      });
    };

    bind(
      'data-limit-decade',
      (v) => {
        sel = { ...sel, decadePalace: v };
        const p = opts.view.palaces.find((x) => x.name === v);
        if (p?.decadalRange) {
          const mid = Math.round((p.decadalRange[0] + p.decadalRange[1]) / 2);
          sel = { ...sel, year: opts.birthYear + mid - 1 };
        }
      },
      'decade',
    );
    bind('data-limit-year', (v) => {
      sel = { ...sel, year: Number(v) };
    }, 'year');
    bind('data-limit-month', (v) => {
      sel = { ...sel, month: Number(v) };
    }, 'month');
    bind('data-limit-day', (v) => {
      sel = { ...sel, day: Number(v) };
    }, 'day');
    bind('data-limit-hour', (v) => {
      sel = { ...sel, hour: Number(v) };
    }, 'hour');

    host.querySelector('[data-toggle-day]')?.addEventListener('click', () => {
      dayOpen = !dayOpen;
      paint();
    });
    host.querySelector('[data-toggle-hour]')?.addEventListener('click', () => {
      hourOpen = !hourOpen;
      paint();
    });

    host.querySelectorAll<HTMLElement>('.ziwei-limit-track').forEach((track) => {
      const on = track.querySelector<HTMLElement>('.ziwei-limit-chip.is-on');
      if (on) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    });
  }

  paint();
  return {
    destroy: () => {
      host.innerHTML = '';
    },
    syncDecade: (palaceName: string) => {
      if (!palaceName || sel.decadePalace === palaceName) return;
      sel = { ...sel, decadePalace: palaceName };
      paint();
    },
    setYear: (year: number, emitChange = true) => {
      if (sel.year === year) {
        if (emitChange) emit('year');
        return;
      }
      sel = { ...sel, year };
      paint();
      if (emitChange) emit('year');
    },
    getSelection: () => ({ ...sel }),
  };
}
