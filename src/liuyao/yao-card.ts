import type { YaoDress } from './najia.ts';
import { LIUSHEN_PLAIN } from './najia.ts';
import { resolveYongShen } from './yong-shen.ts';
import {
  formatLiuqinShort,
  formatYongLabel,
  LIUQIN_DICT,
  renderQinFacetsHtml,
  buildYaoAskCard,
} from './energy-lens.ts';
import { detectSceneDomain } from './scene-map.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossLine } from './classic-gloss.ts';
import { formatClauseHtml } from './format-clause.ts';

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

export type YaoCardOpts = {
  /** 本卦名，用于爻辞原意 */
  hexName?: string;
};

/** 点爻 / 点生克节点：装卦事实 + 结合所问 + 爻辞原意 */
export function renderYaoCard(
  row: YaoDress,
  question: string,
  opts?: YaoCardOpts,
): string {
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
  const dict = LIUQIN_DICT[row.liuqin];
  const domain = detectSceneDomain(question);
  const ask = buildYaoAskCard(row, { domain });
  const hexName = opts?.hexName;
  const classic = hexName ? (getClassicCorpus(hexName)?.lineClassics[row.index] ?? '') : '';
  const bai = hexName ? (glossLine(hexName, row.index) ?? '') : '';
  const qSnippet = question.trim()
    ? question.trim().length > 36
      ? `${question.trim().slice(0, 36)}…`
      : question.trim()
    : '';

  return `
    <article class="ly-yao-card" data-yao-card="${row.index}">
      <header>
        <strong>${row.label} · ${yinYang}</strong>
        ${flags ? `<span class="ly-yao-card-flags">${flags}</span>` : ''}
      </header>
      ${
        qSnippet
          ? `<p class="ly-yao-card-ask"><b>结合所问</b>「${escapeHtml(qSnippet)}」</p>`
          : ''
      }
      <p class="ly-yao-card-relate">${escapeHtml(ask.relate.replace(/^📌\s*/, ''))}</p>
      ${
        classic
          ? `<p class="ly-classic-zh"><span class="ly-classic-tag">原意·爻辞</span>${escapeHtml(
              classic,
            )}</p>`
          : ''
      }
      ${
        bai
          ? `<p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(
              bai,
            )}</p>`
          : ''
      }
      <p class="ly-classic-note">（${escapeHtml(ask.classicNote)}）</p>
      <p><b>地支</b> ${row.branch}${row.wuxing}${
        row.changedBranch
          ? ` → 变 ${row.changedBranch}${row.changedWuxing ?? ''}`
          : ''
      }</p>
      <p>
        <b>能量模块</b>
        <button type="button" class="ly-qin-chip" data-open-qin-dict="${escapeHtml(
          row.liuqin,
        )}" title="打开六亲词典">${escapeHtml(qinLabel)}</button>
      </p>
      <p><b>六神</b> ${row.liushen} — ${LIUSHEN_PLAIN[row.liushen]}</p>
      ${dict ? renderQinFacetsHtml(dict) : ''}
      ${
        hit
          ? `<p class="ly-yao-card-yong">本题用神倾向「${escapeHtml(formatYongLabel(yong.name))}」，此爻相符，优先盯它。</p>`
          : `<p class="ly-guide-tip">本题用神倾向「${escapeHtml(formatYongLabel(yong.name))}」；此爻是${qinLabel}，作背景参考。</p>`
      }
    </article>
  `;
}
