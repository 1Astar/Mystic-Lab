/**
 * 年度轨迹：可横滑年份 + 年度解读｜我的记录
 */
import type { PersonProfile } from '../life/types.ts';
import {
  addYearVerifyEvent,
  listYearVerifyEvents,
  removeYearVerifyEvent,
} from '../ziwei/year-deep.ts';
import {
  buildYearTrack,
  type YearTrackItem,
} from '../ziwei/year-track.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
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

/** 年度解读短结构：主题 / 可能表现 / 观察重点（按时态措辞，不用「预测」套过去） */
function readPaneHtml(item: YearTrackItem): string {
  const possibles = item.possibles
    .slice(0, 3)
    .map((p) => `<li>${escapeHtml(p)}</li>`)
    .join('');

  return `
    <div class="ziwei-year-pane is-read" data-year-pane="read">
      <section class="ziwei-year-block">
        <h4>年度主题</h4>
        <p>${escapeHtml(item.theme)}</p>
      </section>
      <section class="ziwei-year-block">
        <h4>可能表现</h4>
        <ul class="ziwei-year-possibles">${possibles}</ul>
      </section>
      <section class="ziwei-year-block">
        <h4>观察重点</h4>
        <p class="ziwei-year-watch">${escapeHtml(item.watchFocus)}</p>
      </section>
      <p class="ziwei-year-expand-meta">流年命｜${escapeHtml(shortPalace(item.yearPalace) || '—')}${
        item.yearMutagenLine
          ? `　四化｜${escapeHtml(item.yearMutagenLine)}`
          : ''
      }</p>
      <button type="button" class="ziwei-year-why" data-open-year-deep>为什么这样判断 ›</button>
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
    : `<li class="ziwei-year-record-empty">还没有记录。写下真实发生的事，用来对照年度解读。</li>`;

  return `
    <div class="ziwei-year-pane is-record" data-year-pane="record">
      <p class="ziwei-year-record-kicker">我的记录</p>
      <ul class="ziwei-year-record-list">${list}</ul>
      <form class="ziwei-year-record-form" data-record-form>
        <input type="text" name="record" maxlength="120" placeholder="例如：${year}年8月，我开始认真考虑离职…" autocomplete="off" />
        <button type="submit">添加</button>
      </form>
    </div>`;
}

function expandHtml(item: YearTrackItem, tab: ExpandTab, personId: string): string {
  return `
    <div class="ziwei-year-expand is-${item.tense}">
      <p class="ziwei-year-expand-kicker">${escapeHtml(item.tenseLabel)}</p>
      <h3 class="ziwei-year-expand-title">${item.year}｜${item.age}岁${
        item.gz ? ` · ${escapeHtml(item.gz)}` : ''
      }</h3>
      <div class="ziwei-year-tabs" role="tablist" aria-label="年度内容">
        <button type="button" role="tab" class="ziwei-year-tab ${tab === 'read' ? 'is-on' : ''}" data-year-tab="read" aria-selected="${tab === 'read'}">年度解读</button>
        <button type="button" role="tab" class="ziwei-year-tab ${tab === 'record' ? 'is-on' : ''}" data-year-tab="record" aria-selected="${tab === 'record'}">我的记录</button>
      </div>
      ${tab === 'read' ? readPaneHtml(item) : recordsHtml(personId, item.year)}
    </div>`;
}

export type MountZiweiYearTrackOpts = {
  person: PersonProfile;
  view: ZiweiChartView;
  birthYear: number;
  initialYear?: number;
  onYearChange?: (year: number, item: YearTrackItem) => void;
};

export type ZiweiYearTrackHandle = {
  destroy: () => void;
  selectYear: (year: number, emit?: boolean) => void;
  getYear: () => number;
};

export function mountZiweiYearTrack(
  host: HTMLElement,
  opts: MountZiweiYearTrackOpts,
): ZiweiYearTrackHandle {
  const nowYear = new Date().getFullYear();
  let selected = opts.initialYear ?? nowYear;
  let tab: ExpandTab = 'read';
  let items = buildYearTrack({
    person: opts.person,
    birthYear: opts.birthYear,
    centerYear: selected,
    nowYear,
  });

  function current(): YearTrackItem | undefined {
    return items.find((i) => i.year === selected) ?? items[0];
  }

  function openDeep(): void {
    const item = current();
    if (!item) return;
    openZiweiYearDeepDrawer({
      view: opts.view,
      person: opts.person,
      item,
    });
  }

  function paint(): void {
    const cur = current();
    const chips = items
      .map((it) => {
        const on = it.year === selected ? 'is-on' : '';
        return `
          <button type="button" class="ziwei-year-chip is-${it.tense} ${on}" data-year="${it.year}" aria-pressed="${it.year === selected}">
            <span class="ziwei-year-chip-y">${it.year}</span>
            <span class="ziwei-year-chip-t">${escapeHtml(it.chipLabel)}</span>
          </button>`;
      })
      .join('');

    host.innerHTML = `
      <section class="ziwei-year-track" aria-label="年度轨迹">
        <header class="ziwei-year-track-head">
          <p class="ziwei-year-track-kicker">年度轨迹</p>
          <p class="ziwei-year-track-hint">解读给结论；记录写真实发生——两者对照才有用。</p>
        </header>
        <div class="ziwei-year-rail" role="listbox" aria-label="年份">${chips}</div>
        ${cur ? expandHtml(cur, tab, opts.person.id) : ''}
      </section>`;

    host.querySelectorAll<HTMLButtonElement>('[data-year]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const y = Number(btn.dataset.year);
        selectYear(y, true);
      });
    });

    host.querySelectorAll<HTMLButtonElement>('[data-year-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        tab = btn.dataset.yearTab === 'record' ? 'record' : 'read';
        paint();
      });
    });

    host.querySelector('[data-open-year-deep]')?.addEventListener('click', openDeep);

    host.querySelectorAll<HTMLButtonElement>('[data-del-record]').forEach((btn) => {
      btn.addEventListener('click', () => {
        removeYearVerifyEvent(opts.person.id, selected, Number(btn.dataset.delRecord));
        paint();
      });
    });

    host.querySelector<HTMLFormElement>('[data-record-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      const input = form.elements.namedItem('record') as HTMLInputElement | null;
      addYearVerifyEvent(opts.person.id, selected, input?.value ?? '');
      paint();
    });

    const on = host.querySelector<HTMLElement>('.ziwei-year-chip.is-on');
    on?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }

  function selectYear(year: number, emit = true): void {
    selected = year;
    tab = 'read';
    items = buildYearTrack({
      person: opts.person,
      birthYear: opts.birthYear,
      centerYear: year,
      nowYear,
    });
    paint();
    const item = current();
    if (emit && item) opts.onYearChange?.(year, item);
  }

  paint();
  return {
    destroy: () => {
      document.querySelector('[data-ziwei-year-deep]')?.remove();
      host.innerHTML = '';
    },
    selectYear,
    getYear: () => selected,
  };
}
