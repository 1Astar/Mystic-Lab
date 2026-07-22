import type { CastResult } from './engine.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 装卦简表（笔记 Tab：含爻相，与笔记对照） */
export function renderDressArchiveHtml(cast: CastResult, castAt: Date): string {
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const rowsTopFirst = [...dressed.rows].reverse();
  const body = rowsTopFirst
    .map((r) => {
      const mark = [r.isShi ? '世' : '', r.isYing ? '应' : '', r.changing ? '动' : '']
        .filter(Boolean)
        .join('/');
      const xiang = r.bit === 1 ? '━━━' : '━ ━';
      return `
      <tr>
        <td class="ly-dress-xiang">${xiang}</td>
        <td>${r.liushen}</td>
        <td>${r.liuqin}</td>
        <td>${r.branch}${r.wuxing}${
          r.changedBranch ? `→${r.changedBranch}${r.changedWuxing ?? ''}` : ''
        }</td>
        <td>${r.label}</td>
        <td>${mark || '—'}</td>
      </tr>`;
    })
    .join('');

  return `
    <div class="ly-dress-archive" data-dress-archive>
      <p class="ly-guide-tip">本宫 ${escapeHtml(dressed.palace)}（${escapeHtml(
        dressed.palaceWx,
      )}）· 传统断卦「原始档案」，写笔记时可对照这一表。</p>
      <div class="ly-dress-wrap">
        <table class="ly-dress-table ly-dress-table-compact">
          <thead>
            <tr><th>爻相</th><th>六神</th><th>六亲</th><th>地支</th><th>爻</th><th>标记</th></tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}
