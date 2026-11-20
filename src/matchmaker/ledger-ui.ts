/**
 * 红娘簿列表 · 近失信笺 · 家谱
 */
import type { MatchmakerCharacter } from './characters.ts';
import {
  findPersonAnywhere,
  getLedgerEntry,
  type LedgerEntry,
  type MatchmakerStore,
} from './store.ts';
import { NEAR_MISS_ID } from './twogen-sample.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function kindLabel(kind: LedgerEntry['kind']): string {
  if (kind === 'near_miss') return '近失';
  if (kind === 'marriage') return '成家';
  return '在追';
}

function personChip(
  ch: MatchmakerCharacter | undefined,
  id: string,
  opts?: { child?: boolean },
): string {
  const name = ch?.nickname ?? id;
  const initial = name.slice(0, 1);
  return `<span class="mm-family-node${opts?.child ? ' is-child' : ''}" data-roster-id="${escapeHtml(id)}">
    <span class="mm-char-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
    <strong>${escapeHtml(name)}</strong>
    ${ch ? `<em>${escapeHtml(ch.job || '')}</em>` : ''}
  </span>`;
}

export function renderLedgerView(store: MatchmakerStore): string {
  const rows = store.ledger.length
    ? store.ledger
        .map((e) => {
          const action =
            e.kind === 'near_miss'
              ? '翻看记录'
              : e.kind === 'marriage'
                ? '看家谱'
                : '打开';
          return `
        <button type="button" class="mm-ledger-row" data-mm-ledger-open="${escapeHtml(e.id)}">
          <span class="mm-ledger-kind">${kindLabel(e.kind)}</span>
          <span class="mm-ledger-main">
            <strong>${escapeHtml(e.title)}</strong>
            <span class="mm-muted">${e.year}年 · ${escapeHtml(e.summary)}</span>
          </span>
          <span class="mm-ledger-go">${action} ›</span>
        </button>`;
        })
        .join('')
    : `<p class="mm-muted">簿册还是空的。载入「两代小样」后会出现近失与成家记录。</p>`;

  return `
  <section class="mm-section" aria-label="红娘簿">
    <h2 class="mm-section-title">红娘簿</h2>
    <p class="mm-section-lead">这里记着你牵过的线，以及父辈留下的近失页。</p>
    <div class="mm-ledger-list">${rows}</div>
    <div class="mm-actions">
      <button type="button" class="life-btn-ghost" data-mm-view-play>← 回去选人</button>
    </div>
  </section>`;
}

export function renderFamilyView(store: MatchmakerStore): string {
  const entry = getLedgerEntry(store, store.focusLedgerId);
  if (!entry || entry.kind !== 'marriage') {
    return `
    <section class="mm-section">
      <p class="mm-muted">找不到这条成家记录。</p>
      <button type="button" class="life-btn-ghost" data-mm-view-ledger>← 红娘簿</button>
    </section>`;
  }
  const a = findPersonAnywhere(store, entry.idA);
  const b = findPersonAnywhere(store, entry.idB);
  const children = (entry.childIds ?? [])
    .map((id) => personChip(findPersonAnywhere(store, id), id, { child: true }))
    .join('');
  const nearMiss = entry.relatedNearMissId
    ? getLedgerEntry(store, entry.relatedNearMissId)
    : getLedgerEntry(store, NEAR_MISS_ID);

  return `
  <section class="mm-section" aria-label="家谱">
    <h2 class="mm-section-title">家谱 · ${escapeHtml(a?.nickname ?? '')} × ${escapeHtml(b?.nickname ?? '')}</h2>
    <p class="mm-section-lead">${escapeHtml(entry.body || entry.summary)}</p>
    <div class="mm-family-tree">
      <div class="mm-family-parents">
        ${personChip(a, entry.idA)}
        <span class="mm-family-plus" aria-hidden="true">×</span>
        ${personChip(b, entry.idB)}
      </div>
      ${children ? `<div class="mm-family-parents mm-family-children">${children}</div>` : ''}
    </div>
    ${
      nearMiss
        ? `<aside class="mm-near-miss-card">
        <p class="mm-kicker">二十年前</p>
        <p class="mm-sub" style="margin-top:0">${escapeHtml(nearMiss.title)}</p>
        <p class="mm-muted">${escapeHtml(nearMiss.summary)}</p>
        <button type="button" class="life-btn-ghost mm-near-miss-open" data-mm-open-near-miss="${escapeHtml(nearMiss.id)}">翻看「没约成」的记录 ›</button>
      </aside>`
        : ''
    }
    <div class="mm-actions">
      <button type="button" class="life-btn-ghost" data-mm-view-ledger>← 红娘簿</button>
      <button type="button" class="life-btn-primary" data-mm-view-play>回去选人 ›</button>
    </div>
  </section>`;
}

/** 近失只读弹层（挂 document.body） */
export function openNearMissDialog(entry: LedgerEntry, names: { a: string; b: string }): void {
  document.querySelector('.mm-near-miss-dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.className = 'mm-person-dialog mm-near-miss-dialog';
  dialog.setAttribute('aria-labelledby', 'mm-near-miss-title');
  const body = escapeHtml(entry.body || entry.summary).replace(/\n/g, '<br>');
  dialog.innerHTML = `
    <div class="mm-dialog-inner">
      <header class="mm-dialog-head">
        <div>
          <h2 class="mm-dialog-title" id="mm-near-miss-title">${escapeHtml(entry.title)}</h2>
          <p class="mm-dialog-meta">${entry.year}年 · ${escapeHtml(names.a)} × ${escapeHtml(names.b)}</p>
        </div>
        <button type="button" class="life-btn-ghost" data-mm-dialog-close aria-label="关闭">关闭</button>
      </header>
      <p class="mm-muted" style="white-space:normal;line-height:1.65">${body}</p>
      <div class="mm-dialog-footer">
        <button type="button" class="life-btn-primary" data-mm-dialog-close>知道了</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  dialog.querySelectorAll('[data-mm-dialog-close]').forEach((btn) => {
    btn.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('close', () => dialog.remove());
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function ledgerNavHtml(store: MatchmakerStore): string {
  if (store.mode !== 'twogen' && store.ledger.length === 0) return '';
  return `<div class="mm-ledger-nav">
    <button type="button" class="life-btn-ghost" data-mm-view-ledger>红娘簿${
      store.ledger.length ? ` · ${store.ledger.length}` : ''
    }</button>
  </div>`;
}
