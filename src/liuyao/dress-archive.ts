import type { CastResult } from './engine.ts';
import { dressHexagram, dressChangedHexagram, type YaoDress, type LiuQin, type DressedHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { renderYaoCard } from './yao-card.ts';
import { buildShengKeMap, YUAN_OF, JI_OF } from './shengke-map.ts';
import { formatLiuqinShort, renderQinDictHtml } from './energy-lens.ts';
import { renderSpiritNarrativeForCast } from './spirit-narrative.ts';
import { renderAdvancedPlateFoldHtml } from './advanced-plate.ts';

function chouOf(yongQin: LiuQin): LiuQin {
  return YUAN_OF[JI_OF[yongQin]];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function spiritLine(
  role: string,
  row: YaoDress | undefined,
  extra?: string,
): string {
  if (!row) {
    return `<li><strong>${escapeHtml(role)}</strong>：本卦未明显落到具体爻</li>`;
  }
  const mark = [
    row.changing ? '动' : '',
    row.isShi ? '世' : '',
    row.isYing ? '应' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join('·');
  return `<li><strong>${escapeHtml(role)}</strong>：${escapeHtml(row.label)} · ${escapeHtml(
    formatLiuqinShort(row.liuqin),
  )} · ${escapeHtml(row.branch)}${escapeHtml(row.wuxing)}${
    mark ? `（${escapeHtml(mark)}）` : ''
  }</li>`;
}

function renderSpiritBlockHtml(cast: CastResult, castAt: Date, question: string): string {
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const map = buildShengKeMap(cast, dressed, question);
  const yong = map.nodes.find((n) => n.role === '用神')?.row;
  const yuan = map.nodes.find((n) => n.role === '原神')?.row;
  const ji = map.nodes.find((n) => n.role === '忌神')?.row;
  const chouQin = map.yongQin ? chouOf(map.yongQin) : null;
  const chou = chouQin
    ? dressed.rows.find((r) => r.liuqin === chouQin && r.changing) ??
      dressed.rows.find((r) => r.liuqin === chouQin)
    : undefined;

  return `
    <div class="ly-dress-spirits" data-dress-spirits>
      <p class="ly-layer-guide">核心聚焦 / 补给 / 耗散 / 拉扯 · 能量关系（括号内为传统称谓）</p>
      <ul class="ly-dress-spirit-list">
        ${spiritLine('核心聚焦（用神）', yong)}
        ${spiritLine('补给系统（元神）', yuan, yuan?.changing ? '生用' : undefined)}
        ${spiritLine('耗散系统（忌神）', ji, ji?.changing ? '克用' : undefined)}
        ${spiritLine('拉扯层（仇神）', chou)}
      </ul>
      ${renderSpiritNarrativeForCast(cast, question, castAt)}
      <p class="ly-dress-spirit-summary">${escapeHtml(map.summary)}</p>
      <p class="ly-guide-tip">${escapeHtml(map.tip)}</p>
    </div>
  `;
}

function shiYingCell(r: YaoDress): string {
  if (r.isShi && r.isYing) return '世/应';
  if (r.isShi) return '世';
  if (r.isYing) return '应';
  return '—';
}

/** 单盘装卦表：爻相 / 爻位 / 六神 / 世应 / 六亲 / 干支五行 */
export function renderDressPlateTableHtml(
  dressed: DressedHexagram,
  opts: {
    side: 'primary' | 'changed';
    title: string;
    clickable?: boolean;
    /** 本卦：动爻来源下标，用于变卦表旁注「由动」 */
    movedFrom?: number[];
  },
): string {
  const moved = new Set(opts.movedFrom ?? []);
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
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

/** 本卦 ∥ 变卦双表 */
export function renderDressDualPlatesHtml(cast: CastResult, castAt: Date): string {
  const dayStem = siZhuFromDate(castAt).dayStem;
  const primary = dressHexagram(cast, dayStem);
  const changed = dressChangedHexagram(cast, dayStem);

  const primaryHtml = renderDressPlateTableHtml(primary, {
    side: 'primary',
    title: `本卦 · ${cast.primary.fullName}`,
    clickable: true,
  });

  const changedHtml = changed
    ? renderDressPlateTableHtml(changed, {
        side: 'changed',
        title: `变卦 · ${cast.changed!.fullName}`,
        clickable: false,
        movedFrom: cast.changingIndexes,
      })
    : `
      <div class="ly-dress-plate is-empty" data-dress-plate="changed">
        <p class="ly-dress-plate-title">变卦</p>
        <p class="ly-guide-tip">无动则无变：时间轴停在本卦。</p>
      </div>`;

  return `
    <div class="ly-dress-dual" data-dress-dual>
      ${primaryHtml}
      ${changedHtml}
    </div>
  `;
}

/** 装卦简表（笔记 Tab：用元忌 + 本∥变双表） */
export function renderDressArchiveHtml(
  cast: CastResult,
  castAt: Date,
  question = '',
): string {
  return `
    <div class="ly-dress-archive" data-dress-archive>
      <p class="ly-guide-tip">本卦 ∥ 变卦对照 · 点本卦一行看爻注解。</p>
      ${renderSpiritBlockHtml(cast, castAt, question)}
      <p class="ly-layer-guide">六神 · 六亲装卦表</p>
      ${renderDressDualPlatesHtml(cast, castAt)}
      ${renderAdvancedPlateFoldHtml(cast, castAt)}
      <div class="ly-yao-card-slot" data-yao-card-slot></div>
      ${renderQinDictHtml()}
    </div>
  `;
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

/** 在笔记区装卦表中打开某一爻注解卡 */
export function openDressYaoCard(
  root: HTMLElement,
  rows: YaoDress[],
  index: number,
  question: string,
  hexName?: string,
): void {
  const archive = root.querySelector<HTMLElement>('[data-dress-archive]') ?? root;
  const slot = archive.querySelector<HTMLElement>('[data-yao-card-slot]');
  if (!slot) return;
  const row = rows.find((r) => r.index === index);
  if (!row) return;

  const existing = slot.querySelector(`[data-yao-card="${index}"]`);
  if (existing) {
    slot.innerHTML = '';
    syncDressHighlight(root, null);
    return;
  }

  slot.innerHTML = renderYaoCard(row, question, { hexName });
  syncDressHighlight(root, index);
  archive
    .querySelector<HTMLElement>(
      `.ly-dress-row[data-dress-side="primary"][data-dress-line="${index}"]`,
    )
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/** 绑定装卦表点行 → 爻注解；可选同时绑定生克节点 */
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
      const open = () => openDressYaoCard(root, rows, Number(tr.dataset.dressLine), question, cast.primary.name);
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
}

/** 供外部（生克星图）强制打开某爻注解，不 toggle 关闭 */
export function showDressYaoCard(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  index: number,
  castAt = new Date(),
): void {
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const archive = root.querySelector<HTMLElement>('[data-dress-archive]') ?? root;
  const slot = archive.querySelector<HTMLElement>('[data-yao-card-slot]');
  if (!slot) return;
  const row = rows.find((r) => r.index === index);
  if (!row) return;
  slot.innerHTML = renderYaoCard(row, question, { hexName: cast.primary.name });
  syncDressHighlight(root, index);
  archive
    .querySelector<HTMLElement>(
      `.ly-dress-row[data-dress-side="primary"][data-dress-line="${index}"]`,
    )
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
