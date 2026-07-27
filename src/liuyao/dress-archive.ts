import type { CastResult } from './engine.ts';
import { dressHexagram, dressChangedHexagram, type YaoDress, type DressedHexagram } from './najia.ts';
import { siZhuFromDate, renderDateChongBarHtml } from './ganzhi.ts';
import { renderYaoCard } from './yao-card.ts';
import { renderQinDictHtml } from './energy-lens.ts';
import { renderAdvancedPlateFoldHtml } from './advanced-plate.ts';
import { renderSpiritNarrativeForCast } from './spirit-narrative.ts';
import { renderLiushenNotesHtml } from './xiang-notes-pane.ts';
import {
  buildYongStatusPack,
  keyStrengthByIndex,
  renderYongStatusHtml,
  type KeyYaoStrength,
  type YongStatusPack,
} from './yao-strength.ts';

export type DressLens = 'shen' | 'qin' | 'energy';

const DRESS_LENS: { id: DressLens; label: string }[] = [
  { id: 'shen', label: '六神' },
  { id: 'qin', label: '六亲' },
  { id: 'energy', label: '能量' },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shiYingCell(r: YaoDress): string {
  if (r.isShi && r.isYing) return '世/应';
  if (r.isShi) return '世';
  if (r.isYing) return '应';
  return '—';
}

function strengthCell(hit: KeyYaoStrength | undefined): string {
  if (!hit) return '<td class="ly-dress-wx">—</td>';
  const bits = [
    `<span class="ly-wangxiang is-${escapeHtml(hit.wangXiang)}">${escapeHtml(hit.wangXiang)}</span>`,
    hit.kong ? '<span class="ly-dress-wx-flag">空</span>' : '',
  ].filter(Boolean);
  return `<td class="ly-dress-wx" title="${escapeHtml(hit.roles.join('·'))}">${bits.join(' ')}</td>`;
}

/** 单盘装卦表：爻相 / 爻位 / 六神 / 世应 / 六亲 / 干支 / 旺衰（关键爻） */
export function renderDressPlateTableHtml(
  dressed: DressedHexagram,
  opts: {
    side: 'primary' | 'changed';
    title: string;
    clickable?: boolean;
    /** 本卦：动爻来源下标，用于变卦表旁注「由动」 */
    movedFrom?: number[];
    /** 关键爻旺衰（用神/世/应/动）；变卦可不传 */
    strengthByIndex?: Map<number, KeyYaoStrength>;
  },
): string {
  const moved = new Set(opts.movedFrom ?? []);
  const strength = opts.strengthByIndex;
  const rowsTopFirst = [...dressed.rows].reverse();
  const body = rowsTopFirst
    .map((r) => {
      const xiang = r.bit === 1 ? '━━━' : '━ ━';
      const moveMark = r.changing ? '动' : moved.has(r.index) ? '化' : '';
      const clickable = opts.clickable !== false && opts.side === 'primary';
      const attrs = clickable
        ? `class="ly-dress-row" data-dress-line="${r.index}" data-dress-side="primary" tabindex="0" role="button"`
        : `class="ly-dress-row is-static" data-dress-side="${opts.side}" data-dress-line="${r.index}"`;
      return `
      <tr ${attrs}>
        <td class="ly-dress-xiang">${xiang}${moveMark ? `<span class="ly-dress-move">${moveMark}</span>` : ''}</td>
        <td>${escapeHtml(r.label)}</td>
        <td>${escapeHtml(r.liushen)}</td>
        <td class="ly-dress-sy">${shiYingCell(r)}</td>
        <td>${escapeHtml(r.liuqin)}</td>
        <td>${escapeHtml(r.branch)}${escapeHtml(r.wuxing)}</td>
        ${strengthCell(strength?.get(r.index))}
      </tr>`;
    })
    .join('');

  return `
    <div class="ly-dress-plate" data-dress-plate="${opts.side}">
      <p class="ly-dress-plate-title">${escapeHtml(opts.title)}</p>
      <p class="ly-dress-plate-meta">本宫 ${escapeHtml(dressed.palace)}（${escapeHtml(dressed.palaceWx)}）</p>
      <div class="ly-dress-wrap">
        <table class="ly-dress-table ly-dress-table-compact">
          <thead>
            <tr>
              <th>爻相</th>
              <th>爻位</th>
              <th>六神</th>
              <th>世应</th>
              <th>六亲</th>
              <th>干支</th>
              <th>旺衰</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

/** 本卦 ∥ 变卦：图3 分段切换（非左右双表） */
export function renderDressDualPlatesHtml(
  cast: CastResult,
  castAt: Date,
  strengthPack?: YongStatusPack | null,
): string {
  const dayStem = siZhuFromDate(castAt).dayStem;
  const primary = dressHexagram(cast, dayStem);
  const changed = dressChangedHexagram(cast, dayStem);
  const strengthByIndex = strengthPack ? keyStrengthByIndex(strengthPack) : undefined;

  const primaryHtml = renderDressPlateTableHtml(primary, {
    side: 'primary',
    title: `本卦 · ${cast.primary.fullName}`,
    clickable: true,
    strengthByIndex,
  });

  const changedHtml = changed
    ? renderDressPlateTableHtml(changed, {
        side: 'changed',
        title: `变卦 · ${cast.changed!.fullName}`,
        clickable: false,
        movedFrom: cast.changingIndexes,
      })
    : `<p class="ly-guide-tip">无动则无变：时间轴停在本卦。</p>`;

  const hasChanged = Boolean(changed);

  return `
    <section class="ly-gua-switch ly-dress-switch" data-gua-switch data-dress-dual>
      <div class="ly-gua-switch-tabs" role="tablist" aria-label="本卦 / 变卦装卦切换">
        <button type="button" class="ly-gua-switch-tab is-active" data-gua-side="primary" role="tab" aria-selected="true">
          本卦 · ${escapeHtml(cast.primary.name)}
        </button>
        <button type="button" class="ly-gua-switch-tab" data-gua-side="changed" role="tab" aria-selected="false"${
          hasChanged ? '' : ' disabled title="无动爻则无变卦"'
        }>
          变卦${hasChanged && cast.changed ? ` · ${escapeHtml(cast.changed.name)}` : ''}
        </button>
      </div>
      <div class="ly-gua-switch-pane is-active" data-gua-pane="primary" role="tabpanel">
        ${primaryHtml}
      </div>
      <div class="ly-gua-switch-pane" data-gua-pane="changed" role="tabpanel" hidden>
        ${changedHtml}
      </div>
    </section>
  `;
}

function renderDressLensHtml(
  cast: CastResult,
  castAt: Date,
  question: string,
  statusPack: YongStatusPack,
): string {
  const tabs = DRESS_LENS.map(
    (s, i) => `
      <button type="button" class="ly-xiang-rail-item${i === 0 ? ' is-active' : ''}" data-dress-lens="${s.id}" role="tab" aria-selected="${i === 0}">
        <span class="ly-xiang-rail-label">${s.label}</span>
      </button>`,
  ).join('');

  return `
    <div class="ly-dress-lens" data-dress-lens-host>
      <nav class="ly-xiang-rail" role="tablist" aria-label="六神六亲能量">
        ${tabs}
      </nav>
      <div class="ly-xiang-sec-pane is-active" data-dress-lens-pane="shen" role="tabpanel">
        <p class="ly-guide-tip">六神＝这一爻带什么气色（青龙喜庆、玄武暧昧…）。对照表上六神列逐爻看。</p>
        ${renderLiushenNotesHtml(cast, castAt, { compact: true })}
      </div>
      <div class="ly-xiang-sec-pane" data-dress-lens-pane="qin" role="tabpanel" hidden>
        <p class="ly-guide-tip">六亲＝这一爻相对「世」扮演什么角色（父母/兄弟/…）。点标签展开释义，再对照表上六亲列。</p>
        ${renderQinDictHtml()}
      </div>
      <div class="ly-xiang-sec-pane" data-dress-lens-pane="energy" role="tabpanel" hidden>
        <p class="ly-guide-tip">能量＝本题该盯哪一层、这个月力气够不够、谁帮谁拖。用 / 元 / 忌 / 仇都落在<strong>本卦</strong>装卦表上的爻。</p>
        ${renderDateChongBarHtml(castAt)}
        ${renderYongStatusHtml(statusPack)}
        <div class="ly-dress-energy" data-dress-energy>
          ${renderSpiritNarrativeForCast(cast, question, castAt)}
        </div>
      </div>
    </div>
  `;
}

function renderYaoModalShellHtml(): string {
  return `
    <div class="ly-yao-modal" data-yao-modal hidden>
      <div class="ly-yao-modal-backdrop" data-yao-modal-close></div>
      <div class="ly-yao-modal-panel" role="dialog" aria-modal="true" aria-label="爻注解">
        <button type="button" class="ly-yao-modal-close" data-yao-modal-close aria-label="关闭">×</button>
        <div class="ly-yao-modal-body" data-yao-modal-body></div>
      </div>
    </div>
  `;
}

/** 专业排盘：装卦表 → 六神/六亲/能量（用神状态在能量）→ 进阶 */
export function renderDressArchiveHtml(
  cast: CastResult,
  castAt: Date,
  question = '',
): string {
  const statusPack = buildYongStatusPack(cast, question, castAt);
  return `
    <div class="ly-dress-archive is-lens-shen" data-dress-archive>
      <p class="ly-guide-tip">本卦 / 变卦切换 · 点本卦一行看爻注解。表上「旺衰」只标用神/世/应/动。</p>
      <p class="ly-layer-guide">装卦表</p>
      ${renderDressDualPlatesHtml(cast, castAt, statusPack)}
      ${renderDressLensHtml(cast, castAt, question, statusPack)}
      ${renderAdvancedPlateFoldHtml(cast, castAt)}
      ${renderYaoModalShellHtml()}
    </div>
  `;
}

export function selectDressLens(root: HTMLElement, id: DressLens): void {
  const archive = root.matches('[data-dress-archive]')
    ? root
    : root.querySelector<HTMLElement>('[data-dress-archive]');
  if (!archive) return;
  const host = archive.querySelector<HTMLElement>('[data-dress-lens-host]') ?? archive;
  host.querySelectorAll('[data-dress-lens]').forEach((btn) => {
    if ((btn as HTMLElement).tagName !== 'BUTTON') return;
    const on = (btn as HTMLElement).dataset.dressLens === id;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
  });
  host.querySelectorAll('[data-dress-lens-pane]').forEach((pane) => {
    const on = (pane as HTMLElement).dataset.dressLensPane === id;
    pane.classList.toggle('is-active', on);
    (pane as HTMLElement).hidden = !on;
  });
  archive.classList.toggle('is-lens-shen', id === 'shen');
  archive.classList.toggle('is-lens-qin', id === 'qin');
  archive.classList.toggle('is-lens-energy', id === 'energy');
}

function syncDressHighlight(root: HTMLElement, index: number | null): void {
  root.querySelectorAll('.ly-dress-row[data-dress-side="primary"]').forEach((el) => {
    const on = index !== null && el.getAttribute('data-dress-line') === String(index);
    el.classList.toggle('is-open', on);
  });
  root.querySelectorAll('.ly-sk-node').forEach((el) => {
    const on = index !== null && el.getAttribute('data-sk-line') === String(index);
    el.classList.toggle('is-open', on);
  });
}

/** 笔记侧栏内高亮装卦行并滚入视野（不打开居中弹窗，避免锁死主界面滚动） */
export function highlightDressYaoRow(root: HTMLElement, index: number): void {
  syncDressHighlight(root, index);
  const row = root.querySelector<HTMLElement>(
    `.ly-dress-row[data-dress-side="primary"][data-dress-line="${index}"]`,
  );
  row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function getYaoModal(root: HTMLElement): HTMLElement | null {
  const archive = root.querySelector<HTMLElement>('[data-dress-archive]') ?? root;
  return archive.querySelector<HTMLElement>('[data-yao-modal]');
}

export function closeDressYaoModal(root: HTMLElement): void {
  const modal = getYaoModal(root);
  if (!modal) return;
  modal.hidden = true;
  modal.classList.remove('is-visible');
  const body = modal.querySelector<HTMLElement>('[data-yao-modal-body]');
  if (body) body.innerHTML = '';
  syncDressHighlight(root, null);
  document.body.classList.remove('ly-yao-modal-open');
}

function paintYaoModal(
  root: HTMLElement,
  row: YaoDress,
  question: string,
  hexName?: string,
  castAt = new Date(),
): void {
  const modal = getYaoModal(root);
  if (!modal) return;
  const body = modal.querySelector<HTMLElement>('[data-yao-modal-body]');
  if (!body) return;
  body.innerHTML = renderYaoCard(row, question, { hexName, castAt });
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-visible'));
  syncDressHighlight(root, row.index);
  document.body.classList.add('ly-yao-modal-open');
}

/** 点装卦行：居中弹窗看爻注解（含本爻六神 / 六亲 / 能量） */
export function openDressYaoCard(
  root: HTMLElement,
  rows: YaoDress[],
  index: number,
  question: string,
  hexName?: string,
  castAt = new Date(),
): void {
  const modal = getYaoModal(root);
  const body = modal?.querySelector<HTMLElement>('[data-yao-modal-body]');
  const existing = body?.querySelector(`[data-yao-card="${index}"]`);
  if (existing && modal && !modal.hidden) {
    closeDressYaoModal(root);
    return;
  }
  const row = rows.find((r) => r.index === index);
  if (!row) return;
  paintYaoModal(root, row, question, hexName, castAt);
}

/** 供外部强制打开某爻注解（不 toggle 关闭） */
export function showDressYaoCard(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  index: number,
  castAt = new Date(),
): void {
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const row = rows.find((r) => r.index === index);
  if (!row) return;
  paintYaoModal(root, row, question, cast.primary.name, castAt);
}

/** 绑定装卦表点行 → 居中爻卡；六神/六亲/能量小 Tab */
export function bindDressArchive(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  castAt = new Date(),
): void {
  const archive = root.querySelector<HTMLElement>('[data-dress-archive]');
  if (!archive || archive.dataset.bound === '1') return;
  archive.dataset.bound = '1';

  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;

  archive
    .querySelectorAll<HTMLElement>('.ly-dress-row[data-dress-side="primary"]')
    .forEach((tr) => {
      const open = () =>
        openDressYaoCard(root, rows, Number(tr.dataset.dressLine), question, cast.primary.name, castAt);
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

  const lens = archive.querySelector<HTMLElement>('[data-dress-lens-host]');
  if (lens && lens.dataset.lensBound !== '1') {
    lens.dataset.lensBound = '1';
    lens.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-dress-lens]');
      if (!btn || btn.tagName !== 'BUTTON' || !lens.contains(btn)) return;
      const id = btn.dataset.dressLens as DressLens | undefined;
      if (!id) return;
      selectDressLens(archive, id);
    });
  }

  if (archive.dataset.modalBound !== '1') {
    archive.dataset.modalBound = '1';
    archive.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-yao-modal-close]')) {
        e.preventDefault();
        closeDressYaoModal(root);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const modal = getYaoModal(root);
      if (!modal || modal.hidden) return;
      closeDressYaoModal(root);
    });
  }
}
