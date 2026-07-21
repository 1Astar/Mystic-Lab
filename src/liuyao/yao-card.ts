import type { YaoDress } from './najia.ts';
import { LIUSHEN_PLAIN } from './najia.ts';
import { resolveYongShen } from './yong-shen.ts';
import { formatLiuqinShort, formatYongLabel } from './energy-lens.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function yongHit(yongName: string, liuqin: string): boolean {
  return yongName.includes(liuqin);
}

export function renderYaoCard(row: YaoDress, question: string): string {
  const yong = resolveYongShen(question);
  const hit = yongHit(yong.name, row.liuqin);
  const yinYang = row.bit === 1 ? '阳' : '阴';
  const flags = [
    row.isShi ? '世·我' : '',
    row.isYing ? '应·外' : '',
    row.changing ? '动爻' : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const qinLabel = formatLiuqinShort(row.liuqin);

  return `
    <article class="ly-yao-card" data-yao-card="${row.index}">
      <header>
        <strong>${row.label} · ${yinYang}</strong>
        ${flags ? `<span class="ly-yao-card-flags">${flags}</span>` : ''}
      </header>
      <p><b>地支</b> ${row.branch}${row.wuxing}${
        row.changedBranch
          ? ` → 变 ${row.changedBranch}${row.changedWuxing ?? ''}`
          : ''
      }</p>
      <p><b>能量模块</b> ${qinLabel}</p>
      <p><b>六神</b> ${row.liushen} — ${LIUSHEN_PLAIN[row.liushen]}</p>
      ${
        hit
          ? `<p class="ly-yao-card-yong">本题用神倾向「${escapeHtml(formatYongLabel(yong.name))}」，此爻相符，优先盯它。</p>`
          : `<p class="ly-guide-tip">本题用神倾向「${escapeHtml(formatYongLabel(yong.name))}」；此爻是${qinLabel}，作背景参考。</p>`
      }
    </article>
  `;
}
