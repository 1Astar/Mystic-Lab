/**
 * 紫微笔记抽屉（笔按钮）：推演依据 | 笔记
 * 与火花「深度解读」分工：笔=依据与手记；火花=AI 贴合解读。
 */
import type { PersonProfile } from '../life/types.ts';
import {
  buildYearDeepPack,
  listYearVerifyEvents,
  type YearDeepPack,
} from '../ziwei/year-deep.ts';
import { buildYearTrack, type TimeScopeLevel } from '../ziwei/time-scope.ts';
import type { LimitBoardSelection } from '../ziwei/horoscope-limits.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import {
  loadLabNoteText,
  openLabNotesSheet,
  type LabNotesSurface,
} from './lab-notes-sheet.ts';
import { bindYearDeepBody, renderYearDeepBodyHtml } from './ziwei-year-deep-drawer.ts';

export type ZiweiNotesTab = 'reason' | 'notes';

export type OpenZiweiNotesSheetOpts = {
  view: ZiweiChartView;
  person: PersonProfile;
  birthYear: number;
  selection?: LimitBoardSelection;
  level?: TimeScopeLevel;
  /** 默认推演依据 */
  initialTab?: ZiweiNotesTab;
  context?: string;
  surface?: LabNotesSurface;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolvePack(
  opts: OpenZiweiNotesSheetOpts,
): { pack: YearDeepPack; personId: string } | null {
  const year = opts.selection?.year ?? opts.view.theater.annual.year ?? new Date().getFullYear();
  const track = buildYearTrack({
    person: opts.person,
    birthYear: opts.birthYear,
    centerYear: year,
    radius: 0,
  });
  const item = track.find((t) => t.year === year) ?? track[0];
  if (!item) return null;
  const level = opts.level ?? 'year';
  const pack = buildYearDeepPack(opts.view, opts.person, item, {
    level,
    month: opts.selection?.month,
    day: opts.selection?.day,
    hour: opts.selection?.hour,
  });
  return { pack, personId: opts.person.id };
}

function tabsHtml(active: ZiweiNotesTab): string {
  const tabs: Array<{ id: ZiweiNotesTab; label: string }> = [
    { id: 'reason', label: '推演依据' },
    { id: 'notes', label: '笔记' },
  ];
  return `
    <div class="ly-note-mini-tabs ziwei-notes-tabs" role="tablist" aria-label="紫微笔记">
      ${tabs
        .map(
          (t) => `
        <button type="button" class="ly-note-mini-tab ${active === t.id ? 'is-active' : ''}" data-zw-notes-tab="${t.id}" role="tab" aria-selected="${active === t.id}">${t.label}</button>`,
        )
        .join('')}
    </div>`;
}

/** 笔按钮 /「为什么这样判断」→ 笔记抽屉（默认推演依据） */
export function openZiweiNotesSheet(opts: OpenZiweiNotesSheetOpts): void {
  const resolved = resolvePack(opts);
  const start = opts.initialTab ?? 'reason';
  const packHtml = resolved
    ? renderYearDeepBodyHtml(
        resolved.pack,
        listYearVerifyEvents(resolved.personId, resolved.pack.year),
        { showVerify: true },
      )
    : `<p class="ziwei-year-deep-muted">暂无可推演的年份。</p>`;

  const titleLevel = resolved?.pack.levelLabel ?? '流年';
  const year = resolved?.pack.year ?? opts.selection?.year ?? '';
  const draft = loadLabNoteText('ziwei', opts.person.id);

  openLabNotesSheet({
    system: 'ziwei',
    surface: opts.surface ?? 'reading',
    context: opts.context ?? opts.view.theater.headline,
    showNotePad: false,
    bodyHtml: `
      <div class="ziwei-notes-learn" data-zw-notes-root>
        ${tabsHtml(start)}
        <div class="ly-note-mini-body">
          <div class="ly-note-tab-panel ${start === 'reason' ? 'is-active' : ''}" data-zw-notes-pane="reason" ${start === 'reason' ? '' : 'hidden'}>
            <p class="ziwei-year-deep-kicker">为什么这样判断</p>
            <h3 class="ziwei-tl-title">${year ? `${year}年 · ` : ''}${escapeHtml(titleLevel)}推演</h3>
            <div class="ziwei-year-deep-body is-inline ziwei-tl-deep" data-zw-reason-root>
              ${packHtml}
            </div>
          </div>
          <div class="ly-note-tab-panel ${start === 'notes' ? 'is-active' : ''}" data-zw-notes-pane="notes" ${start === 'notes' ? '' : 'hidden'}>
            <label class="lab-notes-label" for="lab-notes-ta">写下这次想留住的句子、对照与疑问</label>
            <textarea id="lab-notes-ta" class="lab-notes-input" rows="10" maxlength="4000" placeholder="例如：今天最对味的一句是… / 想验证的一件小事…">${escapeHtml(draft)}</textarea>
            <p class="lab-notes-hint">自动保存在本机，按档案分开；可随时回来续写。</p>
          </div>
        </div>
      </div>`,
    onBodyReady: (body) => {
      body.querySelectorAll<HTMLButtonElement>('[data-zw-notes-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tab: ZiweiNotesTab = btn.dataset.zwNotesTab === 'notes' ? 'notes' : 'reason';
          body.querySelectorAll<HTMLButtonElement>('[data-zw-notes-tab]').forEach((b) => {
            const on = b.dataset.zwNotesTab === tab;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', String(on));
          });
          body.querySelectorAll<HTMLElement>('[data-zw-notes-pane]').forEach((pane) => {
            const on = pane.dataset.zwNotesPane === tab;
            pane.classList.toggle('is-active', on);
            pane.hidden = !on;
          });
          if (tab === 'notes') body.querySelector<HTMLTextAreaElement>('#lab-notes-ta')?.focus();
        });
      });

      if (!resolved) return;
      const reasonRoot = body.querySelector('[data-zw-reason-root]');
      if (!reasonRoot) return;

      const rebind = (): void => {
        const events = listYearVerifyEvents(resolved.personId, resolved.pack.year);
        reasonRoot.innerHTML = renderYearDeepBodyHtml(resolved.pack, events, {
          showVerify: true,
        });
        bindYearDeepBody({
          root: reasonRoot,
          pack: resolved.pack,
          view: opts.view,
          personId: resolved.personId,
          onRepaint: rebind,
        });
      };
      rebind();
    },
  });
}
