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
  buildDecadeScope,
  buildHourScope,
  buildMonthScope,
  buildYearTrack,
  monthLabel,
  yearFamilyLine,
  yearThemeHeadline,
  type DecadeScopeItem,
  type TimeScopeLevel,
  type YearTrackItem,
} from '../ziwei/time-scope.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';
type ExpandTab = 'read' | 'record';

/** 流年横滑左右各扩几年（接近旧运限条） */
const YEAR_RADIUS = 8;

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

function yearRailHtml(items: YearTrackItem[], selected?: number): string {
  return items
    .map((it) => {
      const on = it.year === selected ? 'is-on' : '';
      return `
        <button type="button" class="ziwei-year-chip is-${it.tense} ${on}" data-year="${it.year}" aria-pressed="${it.year === selected}">
          <span class="ziwei-year-chip-y">${it.year}</span>
          <span class="ziwei-year-chip-t">${escapeHtml(it.chipLabel)}</span>
        </button>`;
    })
    .join('');
}

/** 级联一行：左侧标签 + 右侧横滑 */
function cascadeRow(label: string, railInner: string, railClass = ''): string {
  return `
    <div class="ziwei-tl-row">
      <span class="ziwei-tl-label">${escapeHtml(label)}</span>
      <div class="ziwei-tl-rail ${railClass}">${railInner}</div>
    </div>`;
}

function monthRailHtml(selected?: number): string {
  return Array.from({ length: 12 }, (_, i) => i + 1)
    .map(
      (mth) =>
        `<button type="button" class="ziwei-tl-chip ${selected === mth ? 'is-on' : ''}" data-month="${mth}" aria-pressed="${selected === mth}">${monthLabel(mth)}</button>`,
    )
    .join('');
}

function dayRailHtml(selected?: number): string {
  return Array.from({ length: 28 }, (_, i) => i + 1)
    .map(
      (d) =>
        `<button type="button" class="ziwei-tl-chip is-day ${selected === d ? 'is-on' : ''}" data-day="${d}" aria-pressed="${selected === d}">${d}日</button>`,
    )
    .join('');
}

function decadeReadHtml(item: DecadeScopeItem): string {
  const possibles = item.possibles.map((p) => `<li>${escapeHtml(p)}</li>`).join('');
  const age =
    item.ageFrom && item.ageTo ? `虚岁 ${item.ageFrom}–${item.ageTo}` : '十年阶段';
  return `
    <div class="ziwei-tl-pane">
      <p class="ziwei-tl-kicker">十年阶段</p>
      <h3 class="ziwei-tl-title">大限 · ${escapeHtml(shortPalace(item.palace) || '—')}${
        item.gz ? ` · ${escapeHtml(item.gz)}` : ''
      }</h3>
      <p class="ziwei-tl-focus">${escapeHtml(age)}</p>
      <section class="ziwei-tl-block">
        <h4>十年主题</h4>
        <p class="ziwei-tl-theme">${escapeHtml(item.theme)}</p>
        <p class="ziwei-tl-theme-sub">${escapeHtml(item.lead)}</p>
      </section>
      <p class="ziwei-tl-focus">重点领域：${escapeHtml(item.domains.join(' · '))}</p>
      ${
        item.majorStars.length
          ? `<p class="ziwei-tl-meta">主场星｜${escapeHtml(item.majorStars.join(' · '))}</p>`
          : ''
      }
      <section class="ziwei-tl-block">
        <h4>可能表现</h4>
        <ul class="ziwei-tl-list">${possibles}</ul>
      </section>
      <p class="ziwei-tl-meta">大限命｜${escapeHtml(shortPalace(item.palace) || '—')}${
        item.mutagenLine ? `　四化｜${escapeHtml(item.mutagenLine)}` : ''
      }</p>
      <button type="button" class="ziwei-year-why" data-open-deep>为什么这样判断 ›</button>
      <button type="button" class="ziwei-tl-jump" data-jump-year>进入流年看这一阶段 ›</button>
    </div>`;
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
      <h3 class="ziwei-tl-title">${year}年 · ${escapeHtml(monthItem.monthLabel)}${
        monthItem.gz ? ` · ${escapeHtml(monthItem.gz)}` : ''
      }</h3>
      <section class="ziwei-tl-block">
        <h4>本月推进</h4>
        <p class="ziwei-tl-theme">${escapeHtml(monthItem.lead || monthItem.theme)}</p>
      </section>
      <section class="ziwei-tl-block">
        <h4>本月主题</h4>
        <p class="ziwei-tl-theme">${escapeHtml(monthItem.theme)}</p>
      </section>
      <p class="ziwei-tl-focus">重点领域：${escapeHtml(monthItem.domains.join(' · '))}</p>
      <section class="ziwei-tl-block">
        <h4>可能表现</h4>
        <ul class="ziwei-tl-list">${possibles}</ul>
      </section>
      <p class="ziwei-tl-meta">流月命｜${escapeHtml(shortPalace(monthItem.palace) || '—')}${
        monthItem.mutagenLine ? `　月四化｜${escapeHtml(monthItem.mutagenLine)}` : ''
      }</p>
      <p class="ziwei-tl-meta">对照流年命｜${escapeHtml(shortPalace(monthItem.yearPalace) || '—')}${
        monthItem.yearMutagenLine ? `　年四化｜${escapeHtml(monthItem.yearMutagenLine)}` : ''
      }</p>
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


export type ZiweiTimeLadderDeepCtx = {
  level: TimeScopeLevel;
  selection: LimitBoardSelection;
};

export type MountZiweiTimeLadderOpts = {
  person: PersonProfile;
  view: ZiweiChartView;
  birthYear: number;
  initial?: LimitBoardSelection;
  onChange?: (
    sel: LimitBoardSelection,
    focus: TimeScopeLevel,
  ) => void;
  /** 「为什么这样判断」→ 打开笔记抽屉（推演依据） */
  onOpenDeep?: (ctx: ZiweiTimeLadderDeepCtx) => void;
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

  function rebuildYears(center = sel.year): void {
    yearItems = buildYearTrack({
      person: opts.person,
      birthYear: opts.birthYear,
      centerYear: center,
      radius: YEAR_RADIUS,
    });
  }

  let yearItems: YearTrackItem[] = [];
  rebuildYears();

  function currentYear(): YearTrackItem | undefined {
    return yearItems.find((i) => i.year === sel.year) ?? yearItems[0];
  }

  function emit(focus: TimeScopeLevel): void {
    opts.onChange?.(sel, focus);
  }

  function applyYear(y: number, focus: TimeScopeLevel = level, doEmit = true): void {
    const year = Math.min(2100, Math.max(opts.birthYear, Math.floor(y)));
    sel = { ...sel, year };
    rebuildYears(year);
    tab = 'read';
    if (doEmit) emit(focus === 'decade' ? 'year' : focus);
    paint();
  }

  function openDeep(): void {
    if (level === 'decade') {
      const d = buildDecadeScope(
        opts.person,
        opts.view,
        opts.birthYear,
        sel.decadePalace || opts.view.soulPalace.name,
      );
      sel = { ...sel, year: d.midYear };
      rebuildYears(d.midYear);
    }
    if (opts.onOpenDeep) {
      opts.onOpenDeep({ level, selection: { ...sel } });
      return;
    }
  }

  function contentHtml(): string {
    const yItem = currentYear();
    const decadeRail = decadeChips(opts.view.palaces, sel.decadePalace);
    const yearRail = yearRailHtml(yearItems, sel.year);

    if (level === 'decade') {
      const d = buildDecadeScope(
        opts.person,
        opts.view,
        opts.birthYear,
        sel.decadePalace || opts.view.soulPalace.name,
      );
      return `
        <div class="ziwei-tl-cascade" aria-label="大限">
          ${cascadeRow('大限', decadeRail, 'is-decade')}
        </div>
        <div class="ziwei-tl-read">${decadeReadHtml(d)}</div>`;
    }
    if (level === 'month') {
      const m = buildMonthScope(opts.person, sel.year!, sel.month!);
      return `
        <div class="ziwei-tl-cascade" aria-label="流年流月">
          ${cascadeRow('流年', yearRail, 'is-year')}
          ${cascadeRow('流月', monthRailHtml(sel.month), 'is-month')}
        </div>
        <div class="ziwei-tl-read">${monthReadHtml(sel.year!, m)}</div>`;
    }
    if (level === 'day') {
      return `
        <div class="ziwei-tl-cascade" aria-label="流年流月流日">
          ${cascadeRow('流年', yearRail, 'is-year')}
          ${cascadeRow('流月', monthRailHtml(sel.month), 'is-month')}
          ${cascadeRow('流日', dayRailHtml(sel.day), 'is-day')}
        </div>
        <div class="ziwei-tl-read">${dayReadHtml(
          buildDayScope(opts.person, sel.year!, sel.month!, sel.day!),
          opts.person.id,
        )}</div>`;
    }
    if (level === 'hour') {
      return `
        <div class="ziwei-tl-cascade" aria-label="流年流月流日">
          ${cascadeRow('流年', yearRail, 'is-year')}
          ${cascadeRow('流月', monthRailHtml(sel.month), 'is-month')}
          ${cascadeRow('流日', dayRailHtml(sel.day), 'is-day')}
        </div>
        <div class="ziwei-tl-read">
          <p class="ziwei-tl-context">${sel.year}年${sel.month}月${sel.day}日 · 十二时辰</p>
          ${hourReadHtml(buildHourScope(opts.person, sel.year!, sel.month!, sel.day!, sel.hour ?? 6))}
        </div>`;
    }
    if (!yItem) return '';
    return `
      <div class="ziwei-tl-cascade" aria-label="大限流年">
        ${cascadeRow('大限', decadeRail, 'is-decade')}
        ${cascadeRow('流年', yearRail, 'is-year')}
      </div>
      <div class="ziwei-tl-read">
        <div class="ziwei-year-tabs" role="tablist" aria-label="流年内容">
          <button type="button" role="tab" class="ziwei-year-tab ${tab === 'read' ? 'is-on' : ''}" data-tab="read" aria-selected="${tab === 'read'}">当前时间内容</button>
          <button type="button" role="tab" class="ziwei-year-tab ${tab === 'record' ? 'is-on' : ''}" data-tab="record" aria-selected="${tab === 'record'}">我的记录</button>
        </div>
        ${tab === 'read' ? yearReadHtml(yItem) : recordsHtml(opts.person.id, yItem.year)}
      </div>`;
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
        if (level === 'decade') level = 'year';
        applyYear(Number(btn.dataset.year), level === 'hour' ? 'day' : level);
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-month]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sel = { ...sel, month: Number(btn.dataset.month) };
        if (level === 'year') level = 'month';
        const focus: TimeScopeLevel =
          level === 'hour' ? 'hour' : level === 'day' ? 'day' : 'month';
        emit(focus);
        paint();
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sel = { ...sel, day: Number(btn.dataset.day) };
        emit(level === 'hour' ? 'hour' : 'day');
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
          rebuildYears(sel.year);
        }
        if (level === 'decade') emit('decade');
        else emit('year');
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
      const d = buildDecadeScope(
        opts.person,
        opts.view,
        opts.birthYear,
        sel.decadePalace || opts.view.soulPalace.name,
      );
      level = 'year';
      applyYear(d.midYear, 'year');
    });

    const dayInput = host.querySelector<HTMLInputElement>('[data-day-input]');
    dayInput?.addEventListener('change', () => {
      const v = dayInput.value;
      if (!v) return;
      const [yy, mm, dd] = v.split('-').map(Number);
      if (!yy || !mm || !dd) return;
      sel = { ...sel, year: yy, month: mm, day: Math.min(dd, 28) };
      rebuildYears(yy);
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
      applyYear(year, 'year', emitChange);
    },
    getSelection: () => ({ ...sel }),
    getLevel: () => level,
  };
}
