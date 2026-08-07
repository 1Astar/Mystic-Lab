/**
 * 运限时间梯：大限｜流年｜流月｜流日｜流时
 * 年看主题，月看推进，日看当天，时看当下
 */
import { CHINESE_HOURS, getChineseHour } from '../xiaoliuren/chinese-hour.ts';
import type { PersonProfile } from '../life/types.ts';
import type { LimitBoardSelection } from '../ziwei/horoscope-limits.ts';
import {
  addDayVerifyEvent,
  addYearVerifyEvent,
  listDayVerifyEvents,
  listYearVerifyEvents,
  removeDayVerifyEvent,
  removeYearVerifyEvent,
} from '../ziwei/year-deep.ts';
import {
  buildDayScope,
  buildHourScope,
  buildMonthScope,
  buildYearTrack,
  monthLabel,
  yearFamilyLine,
  yearThemeHeadline,
  type TimeScopeLevel,
  type YearTrackItem,
} from '../ziwei/time-scope.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
import { openZiweiYearDeepDrawer } from './ziwei-year-deep-drawer.ts';

type ExpandTab = 'read' | 'record';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

const LEVELS: Array<{ id: TimeScopeLevel; label: string; hint: string }> = [
  { id: 'decade', label: '大限', hint: '十年阶段' },
  { id: 'year', label: '流年', hint: '看人生阶段' },
  { id: 'month', label: '流月', hint: '看年度推进' },
  { id: 'day', label: '流日', hint: '选日期查看' },
  { id: 'hour', label: '流时', hint: '此刻时机' },
];

function decadeChips(palaces: PalaceSnap[], selected?: string): string {
  const rows = palaces
    .filter((p) => p.decadalRange)
    .slice()
    .sort((a, b) => (a.decadalRange![0] ?? 0) - (b.decadalRange![0] ?? 0));
  return rows
    .map((p) => {
      const [from, to] = p.decadalRange!;
      const gz = `${p.decadalStem ?? ''}${p.decadalBranch ?? ''}`;
      const on = selected === p.name ? 'is-on' : '';
      return `<button type="button" class="ziwei-tl-chip ${on}" data-decade="${escapeHtml(p.name)}" aria-pressed="${selected === p.name}">
        <span>${from}–${to}</span>
        <em>${escapeHtml(shortPalace(p.name))}${gz ? ` · ${escapeHtml(gz)}` : ''}</em>
      </button>`;
    })
    .join('');
}

function yearReadHtml(item: YearTrackItem): string {
  const possibles = item.possibles
    .slice(0, 3)
    .map((p) => `<li>${escapeHtml(p)}</li>`)
    .join('');
  return `
    <div class="ziwei-tl-pane">
      <p class="ziwei-tl-kicker">${escapeHtml(item.tenseLabel)}</p>
      <h3 class="ziwei-tl-title">${item.year}年｜${escapeHtml(item.tenseLabel)}</h3>
      <section class="ziwei-tl-block">
        <h4>年度主题</h4>
        <p class="ziwei-tl-theme">${escapeHtml(yearThemeHeadline(item))}</p>
        <p class="ziwei-tl-theme-sub">${escapeHtml(item.theme)}</p>
      </section>
      <ul class="ziwei-tl-domains" aria-label="重点领域">
        <li><strong>事业</strong><span>${escapeHtml(item.career)}</span></li>
        <li><strong>关系</strong><span>${escapeHtml(item.relation)}</span></li>
        <li><strong>财富</strong><span>${escapeHtml(item.wealth)}</span></li>
        <li><strong>家庭</strong><span>${escapeHtml(yearFamilyLine(item))}</span></li>
      </ul>
      <section class="ziwei-tl-block">
        <h4>可能表现</h4>
        <ul class="ziwei-tl-list">${possibles}</ul>
      </section>
      <p class="ziwei-tl-meta">流年命｜${escapeHtml(shortPalace(item.yearPalace) || '—')}${
        item.yearMutagenLine ? `　四化｜${escapeHtml(item.yearMutagenLine)}` : ''
      }</p>
      <button type="button" class="ziwei-year-why" data-open-deep>为什么这样判断 ›</button>
    </div>`;
}

function monthReadHtml(year: number, monthItem: ReturnType<typeof buildMonthScope>): string {
  const possibles = monthItem.possibles.map((p) => `<li>${escapeHtml(p)}</li>`).join('');
  return `
    <div class="ziwei-tl-pane">
      <h3 class="ziwei-tl-title">${year}年 · ${escapeHtml(monthItem.monthLabel)}</h3>
      <section class="ziwei-tl-block">
        <h4>本月主题</h4>
        <p class="ziwei-tl-theme">${escapeHtml(monthItem.theme)}</p>
      </section>
      <p class="ziwei-tl-focus">重点领域：${escapeHtml(monthItem.domains.join(' · '))}</p>
      <section class="ziwei-tl-block">
        <h4>可能表现</h4>
        <ul class="ziwei-tl-list">${possibles}</ul>
      </section>
      <p class="ziwei-tl-meta">流月命｜${escapeHtml(shortPalace(monthItem.palace) || '—')}</p>
      <button type="button" class="ziwei-year-why" data-open-deep>为什么这样判断 ›</button>
    </div>`;
}

function dayReadHtml(
  dayItem: ReturnType<typeof buildDayScope>,
  personId: string,
): string {
  const events = listDayVerifyEvents(personId, dayItem.year, dayItem.month, dayItem.day);
  const list = events.length
    ? events
        .map(
          (e, i) => `
        <li class="ziwei-year-record-item">
          <p>${escapeHtml(e)}</p>
          <button type="button" class="ziwei-year-record-del" data-del-day="${i}" aria-label="删除">×</button>
        </li>`,
        )
        .join('')
    : `<li class="ziwei-year-record-empty">还没有记录。写下当天真实发生的事，用来对照。</li>`;

  return `
    <div class="ziwei-tl-pane">
      <label class="ziwei-tl-date-label">选择日期
        <input type="date" class="ziwei-tl-date" data-day-input value="${dayItem.year}-${String(dayItem.month).padStart(2, '0')}-${String(dayItem.day).padStart(2, '0')}" />
      </label>
      <h3 class="ziwei-tl-title">${escapeHtml(dayItem.dateLabel)}</h3>
      <section class="ziwei-tl-block">
        <h4>今日重点</h4>
        <ul class="ziwei-tl-domains is-day">
          <li><strong>事业</strong><span>${escapeHtml(dayItem.career)}</span></li>
          <li><strong>关系</strong><span>${escapeHtml(dayItem.relation)}</span></li>
          <li><strong>行动提示</strong><span>${escapeHtml(dayItem.action)}</span></li>
        </ul>
      </section>
      <p class="ziwei-tl-meta">流日命｜${escapeHtml(shortPalace(dayItem.palace) || '—')}</p>
      <button type="button" class="ziwei-year-why" data-open-deep>为什么这样判断 ›</button>
      <section class="ziwei-tl-block is-record">
        <h4>记录实际事件</h4>
        <ul class="ziwei-year-record-list">${list}</ul>
        <form class="ziwei-year-record-form" data-day-record-form>
          <input type="text" name="record" maxlength="120" placeholder="今天实际发生了什么…" autocomplete="off" />
          <button type="submit">添加</button>
        </form>
      </section>
    </div>`;
}

function hourReadHtml(hourItem: ReturnType<typeof buildHourScope>): string {
  const chips = CHINESE_HOURS.map(
    (h) => `
      <button type="button" class="ziwei-tl-shichen ${hourItem.hour === h.index ? 'is-on' : ''}" data-hour="${h.index}" aria-pressed="${hourItem.hour === h.index}">
        ${escapeHtml(h.label)}
      </button>`,
  ).join('');

  return `
    <div class="ziwei-tl-pane is-hour">
      <div class="ziwei-tl-shichen-rail" role="listbox" aria-label="十二时辰">${chips}</div>
      <h3 class="ziwei-tl-title">${escapeHtml(hourItem.hourLabel)} · ${escapeHtml(hourItem.rangeLabel)}</h3>
      <section class="ziwei-tl-block">
        <h4>当前时段主题</h4>
        <p class="ziwei-tl-theme">${escapeHtml(hourItem.theme)}</p>
      </section>
      <ul class="ziwei-tl-domains is-hour">
        <li><strong>适合</strong><span>${escapeHtml(hourItem.suit)}</span></li>
        <li><strong>注意</strong><span>${escapeHtml(hourItem.caution)}</span></li>
      </ul>
      <p class="ziwei-tl-meta">流时命｜${escapeHtml(shortPalace(hourItem.palace) || '—')}　把它当作时机提示，不是长篇人生预测。</p>
      <button type="button" class="ziwei-year-why" data-open-deep>为什么这样判断 ›</button>
    </div>`;
}

function recordsHtml(personId: string, year: number): string {
  const events = listYearVerifyEvents(personId, year);
  const list = events.length
    ? events
        .map(
          (e, i) => `
        <li class="ziwei-year-record-item">
          <p>${escapeHtml(e)}</p>
          <button type="button" class="ziwei-year-record-del" data-del-record="${i}" aria-label="删除">×</button>
        </li>`,
        )
        .join('')
    : `<li class="ziwei-year-record-empty">还没有记录。写下真实发生的事，用来对照解读。</li>`;

  return `
    <div class="ziwei-tl-pane is-record">
      <p class="ziwei-year-record-kicker">我的记录</p>
      <ul class="ziwei-year-record-list">${list}</ul>
      <form class="ziwei-year-record-form" data-record-form>
        <input type="text" name="record" maxlength="120" placeholder="例如：${year}年8月，我开始认真考虑离职…" autocomplete="off" />
        <button type="submit">添加</button>
      </form>
    </div>`;
}

export type MountZiweiTimeLadderOpts = {
  person: PersonProfile;
  view: ZiweiChartView;
  birthYear: number;
  initial?: LimitBoardSelection;
  onChange?: (
    sel: LimitBoardSelection,
    focus: TimeScopeLevel,
  ) => void;
};

export type ZiweiTimeLadderHandle = {
  destroy: () => void;
  syncDecade: (palaceName: string) => void;
  setYear: (year: number, emit?: boolean) => void;
  getSelection: () => LimitBoardSelection;
  getLevel: () => TimeScopeLevel;
};

export function mountZiweiTimeLadder(
  host: HTMLElement,
  opts: MountZiweiTimeLadderOpts,
): ZiweiTimeLadderHandle {
  const now = new Date();
  let level: TimeScopeLevel = 'year';
  let tab: ExpandTab = 'read';
  let sel: LimitBoardSelection = {
    decadePalace:
      opts.initial?.decadePalace ??
      (opts.view.theater.decade.palaceName || opts.view.soulPalace.name),
    year: opts.initial?.year ?? opts.view.theater.annual.year ?? now.getFullYear(),
    month: opts.initial?.month ?? now.getMonth() + 1,
    day: opts.initial?.day ?? Math.min(now.getDate(), 28),
    hour: opts.initial?.hour ?? getChineseHour(now).index,
  };

  let yearItems = buildYearTrack({
    person: opts.person,
    birthYear: opts.birthYear,
    centerYear: sel.year,
  });

  function currentYear(): YearTrackItem | undefined {
    return yearItems.find((i) => i.year === sel.year) ?? yearItems[0];
  }

  function emit(focus: TimeScopeLevel): void {
    opts.onChange?.(sel, focus);
  }

  function openDeep(): void {
    const item = currentYear();
    if (!item) return;
    openZiweiYearDeepDrawer({
      view: opts.view,
      person: opts.person,
      item,
      scope: {
        level: level === 'decade' ? 'year' : level,
        month: sel.month,
        day: sel.day,
        hour: sel.hour,
      },
    });
  }

  function contentHtml(): string {
    const yItem = currentYear();
    if (level === 'decade') {
      return `
        <div class="ziwei-tl-pane">
          <p class="ziwei-tl-kicker">十年阶段</p>
          <h3 class="ziwei-tl-title">大限 · ${escapeHtml(shortPalace(sel.decadePalace || '') || '—')}</h3>
          <p class="ziwei-tl-theme-sub">大限看人生十年主场。点选下方大限后，盘面叠看该限；细读从流年进入。</p>
          <div class="ziwei-tl-rail is-decade">${decadeChips(opts.view.palaces, sel.decadePalace)}</div>
          <button type="button" class="ziwei-tl-jump" data-jump-year>进入流年看这一阶段 ›</button>
        </div>`;
    }
    if (level === 'month') {
      const m = buildMonthScope(opts.person, sel.year!, sel.month!);
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
        .map(
          (mth) =>
            `<button type="button" class="ziwei-tl-chip ${sel.month === mth ? 'is-on' : ''}" data-month="${mth}" aria-pressed="${sel.month === mth}">${monthLabel(mth)}</button>`,
        )
        .join('');
      return `
        <p class="ziwei-tl-context">${sel.year}年 · 选月看推进</p>
        <div class="ziwei-tl-rail is-month">${months}</div>
        ${monthReadHtml(sel.year!, m)}`;
    }
    if (level === 'day') {
      return dayReadHtml(
        buildDayScope(opts.person, sel.year!, sel.month!, sel.day!),
        opts.person.id,
      );
    }
    if (level === 'hour') {
      return `
        <p class="ziwei-tl-context">${sel.year}年${sel.month}月${sel.day}日 · 十二时辰</p>
        ${hourReadHtml(buildHourScope(opts.person, sel.year!, sel.month!, sel.day!, sel.hour ?? 6))}`;
    }
    if (!yItem) return '';
    const chips = yearItems
      .map((it) => {
        const on = it.year === sel.year ? 'is-on' : '';
        return `
          <button type="button" class="ziwei-year-chip is-${it.tense} ${on}" data-year="${it.year}" aria-pressed="${it.year === sel.year}">
            <span class="ziwei-year-chip-y">${it.year}</span>
            <span class="ziwei-year-chip-t">${escapeHtml(it.chipLabel)}</span>
          </button>`;
      })
      .join('');
    const monthRail = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(
        (mth) =>
          `<button type="button" class="ziwei-tl-chip ${sel.month === mth ? 'is-on' : ''}" data-month="${mth}" aria-pressed="${sel.month === mth}">${monthLabel(mth)}</button>`,
      )
      .join('');
    return `
      <div class="ziwei-tl-rail is-year" role="listbox" aria-label="年份">${chips}</div>
      <div class="ziwei-year-tabs" role="tablist" aria-label="流年内容">
        <button type="button" role="tab" class="ziwei-year-tab ${tab === 'read' ? 'is-on' : ''}" data-tab="read" aria-selected="${tab === 'read'}">当前时间内容</button>
        <button type="button" role="tab" class="ziwei-year-tab ${tab === 'record' ? 'is-on' : ''}" data-tab="record" aria-selected="${tab === 'record'}">我的记录</button>
      </div>
      ${tab === 'read' ? yearReadHtml(yItem) : recordsHtml(opts.person.id, yItem.year)}
      ${
        tab === 'read'
          ? `<div class="ziwei-tl-month-under">
              <p class="ziwei-tl-context">${yItem.year}年 · 选月看推进</p>
              <div class="ziwei-tl-rail is-month">${monthRail}</div>
            </div>`
          : ''
      }`;
  }

  function paint(): void {
    const levelTabs = LEVELS.map(
      (L) => `
      <button type="button" class="ziwei-tl-level ${level === L.id ? 'is-on' : ''}" data-level="${L.id}" aria-pressed="${level === L.id}">
        <strong>${L.label}</strong>
        <span>${L.hint}</span>
      </button>`,
    ).join('');

    host.innerHTML = `
      <section class="ziwei-time-ladder" aria-label="运限时间梯">
        <header class="ziwei-tl-head">
          <p class="ziwei-tl-head-kicker">时间层级</p>
          <p class="ziwei-tl-head-hint">年看主题 · 月看推进 · 日看当天 · 时看当下</p>
        </header>
        <div class="ziwei-tl-levels" role="tablist">${levelTabs}</div>
        <div class="ziwei-tl-body">${contentHtml()}</div>
      </section>`;

    host.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        level = (btn.dataset.level as TimeScopeLevel) || 'year';
        tab = 'read';
        emit(level);
        paint();
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-year]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const y = Number(btn.dataset.year);
        sel = { ...sel, year: y };
        yearItems = buildYearTrack({
          person: opts.person,
          birthYear: opts.birthYear,
          centerYear: y,
        });
        tab = 'read';
        emit('year');
        paint();
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-month]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sel = { ...sel, month: Number(btn.dataset.month) };
        if (level === 'year') level = 'month';
        emit('month');
        paint();
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-hour]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sel = { ...sel, hour: Number(btn.dataset.hour) };
        emit('hour');
        paint();
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-decade]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.decade ?? '';
        sel = { ...sel, decadePalace: name };
        const p = opts.view.palaces.find((x) => x.name === name);
        if (p?.decadalRange) {
          const mid = Math.round((p.decadalRange[0] + p.decadalRange[1]) / 2);
          sel = { ...sel, year: opts.birthYear + mid - 1 };
          yearItems = buildYearTrack({
            person: opts.person,
            birthYear: opts.birthYear,
            centerYear: sel.year,
          });
        }
        emit('decade');
        paint();
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        tab = btn.dataset.tab === 'record' ? 'record' : 'read';
        paint();
      });
    });

    host.querySelector('[data-open-deep]')?.addEventListener('click', openDeep);
    host.querySelector('[data-jump-year]')?.addEventListener('click', () => {
      level = 'year';
      emit('year');
      paint();
    });

    const dayInput = host.querySelector<HTMLInputElement>('[data-day-input]');
    dayInput?.addEventListener('change', () => {
      const v = dayInput.value;
      if (!v) return;
      const [yy, mm, dd] = v.split('-').map(Number);
      if (!yy || !mm || !dd) return;
      sel = { ...sel, year: yy, month: mm, day: Math.min(dd, 28) };
      yearItems = buildYearTrack({
        person: opts.person,
        birthYear: opts.birthYear,
        centerYear: yy,
      });
      emit('day');
      paint();
    });

    host.querySelectorAll<HTMLButtonElement>('[data-del-record]').forEach((btn) => {
      btn.addEventListener('click', () => {
        removeYearVerifyEvent(opts.person.id, sel.year!, Number(btn.dataset.delRecord));
        paint();
      });
    });

    host.querySelector<HTMLFormElement>('[data-record-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const input = form.elements.namedItem('record') as HTMLInputElement | null;
      addYearVerifyEvent(opts.person.id, sel.year!, input?.value ?? '');
      paint();
    });

    host.querySelectorAll<HTMLButtonElement>('[data-del-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        removeDayVerifyEvent(
          opts.person.id,
          sel.year!,
          sel.month!,
          sel.day!,
          Number(btn.dataset.delDay),
        );
        paint();
      });
    });

    host.querySelector<HTMLFormElement>('[data-day-record-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const input = form.elements.namedItem('record') as HTMLInputElement | null;
      addDayVerifyEvent(
        opts.person.id,
        sel.year!,
        sel.month!,
        sel.day!,
        input?.value ?? '',
      );
      paint();
    });

    const on =
      host.querySelector<HTMLElement>('.ziwei-year-chip.is-on') ??
      host.querySelector<HTMLElement>('.ziwei-tl-chip.is-on') ??
      host.querySelector<HTMLElement>('.ziwei-tl-shichen.is-on');
    on?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }

  paint();
  return {
    destroy: () => {
      document.querySelector('[data-ziwei-year-deep]')?.remove();
      host.innerHTML = '';
    },
    syncDecade: (palaceName: string) => {
      if (!palaceName || sel.decadePalace === palaceName) return;
      sel = { ...sel, decadePalace: palaceName };
      paint();
    },
    setYear: (year: number, emitChange = true) => {
      sel = { ...sel, year };
      yearItems = buildYearTrack({
        person: opts.person,
        birthYear: opts.birthYear,
        centerYear: year,
      });
      paint();
      if (emitChange) emit('year');
    },
    getSelection: () => ({ ...sel }),
    getLevel: () => level,
  };
}
