/**
 * 「了解这个人」弹窗 · 对照 matchmaker-mvp chart dialog
 */
import { findInPool, type MatchmakerCharacter } from './characters.ts';
import {
  bindPersonSheetClicks,
  renderPersonSheet,
  type ChartSystemTab,
} from './person-sheet.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type OpenPersonDialogOpts = {
  person: MatchmakerCharacter;
  pool: MatchmakerCharacter[];
  /** @deprecated 简介弹窗不再提供「选这位」；保留字段以免旧调用报错 */
  selected?: boolean;
  canSelect?: boolean;
  /** 当前主线人物 id；用于「追这户人家」 */
  mainlineId?: string | null;
  initialTab?: ChartSystemTab;
  onToggleSelect?: (id: string) => void;
  onFollowHousehold?: (id: string) => void;
  onClose?: () => void;
};

let activeDialog: HTMLDialogElement | null = null;

function ageLine(ch: MatchmakerCharacter): string {
  const y = Number(ch.birthYear);
  if (!Number.isFinite(y) || y < 1900) return '';
  return `${Math.max(18, new Date().getFullYear() - y)}岁上下`;
}

function paintDialog(
  dialog: HTMLDialogElement,
  opts: OpenPersonDialogOpts,
  tab: ChartSystemTab,
): void {
  const ch = opts.person;
  const gender = ch.gender === 'female' ? '女' : '男';
  const meta = [ageLine(ch), ch.job, ch.city || ch.birthPlace, gender]
    .filter(Boolean)
    .join(' · ');

  dialog.innerHTML = `
    <div class="mm-dialog-inner">
      <header class="mm-dialog-head">
        <div>
          <h2 class="mm-dialog-title" id="mm-person-dialog-title">${escapeHtml(ch.nickname)}的档案</h2>
          <p class="mm-dialog-meta">${escapeHtml(meta)}</p>
        </div>
        <button type="button" class="life-btn-ghost" data-mm-dialog-close aria-label="关闭">关闭</button>
      </header>
      <div class="mm-sys-capsule" role="tablist" aria-label="盘面体系">
        <button type="button" class="mm-sys-capsule-seg${tab === 'bazi' ? ' is-on' : ''}" role="tab" aria-selected="${tab === 'bazi'}" data-mm-chart-tab="bazi">八字</button>
        <button type="button" class="mm-sys-capsule-seg${tab === 'ziwei' ? ' is-on' : ''}" role="tab" aria-selected="${tab === 'ziwei'}" data-mm-chart-tab="ziwei">紫微</button>
      </div>
      <div class="mm-dialog-context">
        <p class="mm-dialog-context-line"><span class="mm-dialog-context-k">处境</span>${escapeHtml(ch.situation)}</p>
        <p class="mm-dialog-context-line"><span class="mm-dialog-context-k">愿望</span>${escapeHtml(ch.wish)}</p>
      </div>
      ${renderPersonSheet(ch, tab, { hideTabs: true })}
      <div class="mm-dialog-footer">
        ${
          opts.mainlineId === ch.id
            ? `<span class="mm-mainline-pill">正在追这户 · ${escapeHtml(ch.nickname)}</span>`
            : opts.onFollowHousehold
              ? `<button type="button" class="life-btn-primary" data-mm-dialog-follow>追这户人家</button>`
              : ''
        }
        <button type="button" class="life-btn-ghost" data-mm-dialog-close>关闭</button>
      </div>
    </div>`;

  bindPersonSheetClicks(dialog, opts.pool);

  dialog.querySelectorAll<HTMLElement>('[data-mm-dialog-close]').forEach((btn) => {
    btn.addEventListener('click', () => dialog.close());
  });

  dialog.querySelector('[data-mm-dialog-follow]')?.addEventListener('click', () => {
    opts.onFollowHousehold?.(ch.id);
    paintDialog(dialog, { ...opts, mainlineId: ch.id }, tab);
  });

  dialog.querySelectorAll<HTMLElement>('[data-mm-chart-tab]').forEach((el) => {
    el.addEventListener('click', () => {
      const next = el.dataset.mmChartTab === 'ziwei' ? 'ziwei' : 'bazi';
      paintDialog(dialog, opts, next);
    });
  });
}

export function openPersonDialog(opts: OpenPersonDialogOpts): void {
  document.querySelector('.mm-person-dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.className = 'mm-person-dialog';
  dialog.setAttribute('aria-labelledby', 'mm-person-dialog-title');
  document.body.appendChild(dialog);
  activeDialog = dialog;

  const tab = opts.initialTab ?? 'bazi';
  paintDialog(dialog, opts, tab);

  dialog.addEventListener('close', () => {
    dialog.remove();
    if (activeDialog === dialog) activeDialog = null;
    opts.onClose?.();
  });

  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function openPersonDialogById(
  pool: MatchmakerCharacter[],
  id: string,
  opts: Omit<OpenPersonDialogOpts, 'person' | 'pool'>,
): void {
  const person = findInPool(pool, id);
  if (!person) return;
  openPersonDialog({ ...opts, person, pool });
}

export function closePersonDialog(): void {
  activeDialog?.close();
}
