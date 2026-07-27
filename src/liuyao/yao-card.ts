import type { YaoDress } from './najia.ts';
import { LIUSHEN_PLAIN, branchWuXing } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { resolveYongShen } from './yong-shen.ts';
import {
  formatLiuqinShort,
  formatYongLabel,
  LIUQIN_DICT,
  LIUQIN_ENERGY,
  renderQinFacetsHtml,
  buildYaoAskCard,
} from './energy-lens.ts';
import { detectSceneDomain } from './scene-map.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossLine } from './classic-gloss.ts';
import { formatClauseHtml } from './format-clause.ts';
import { wangXiangOf, wangXiangReason } from './yao-strength.ts';
import { buildYaoSpecialFlags, formatYaoSpecialTags } from './yao-special.ts';

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

function branchOfGanzhi(gz: string): string {
  return gz.slice(1) || '';
}

export type YaoCardOpts = {
  /** 本卦名，用于爻辞原意 */
  hexName?: string;
  /** 起卦时间：算本爻相对月建的旺衰 */
  castAt?: Date;
};

/** 点爻：现有注解 + 本爻对应的六神 / 六亲 / 能量 */
export function renderYaoCard(
  row: YaoDress,
  question: string,
  opts?: YaoCardOpts,
): string {
  const yong = resolveYongShen(question);
  const hit = yongHit(yong.name, row.liuqin);
  const yinYang = row.bit === 1 ? '阳' : '阴';
  const roleFlags = [
    row.isShi ? '世·我' : '',
    row.isYing ? '应·外' : '',
    row.changing ? '动爻' : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const qinLabel = formatLiuqinShort(row.liuqin);
  const dict = LIUQIN_DICT[row.liuqin];
  const energyModern = LIUQIN_ENERGY[row.liuqin]?.modern ?? qinLabel;
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

  const castAt = opts?.castAt ?? new Date();
  const sz = siZhuFromDate(castAt);
  const monthBranch = branchOfGanzhi(sz.month);
  const monthWx = branchWuXing(monthBranch);
  const dayBranch = branchOfGanzhi(sz.day);
  const wangXiang = wangXiangOf(row.wuxing, monthWx);
  const reason = wangXiangReason(row.wuxing, monthWx);
  const wangPlain =
    wangXiang === '旺' || wangXiang === '相'
      ? `偏强（${wangXiang}）`
      : wangXiang === '休'
        ? `一般（${wangXiang}）`
        : `偏弱（${wangXiang}）`;
  const special = buildYaoSpecialFlags(row, {
    dayBranch,
    monthBranch,
    dayXunKong: sz.dayXunKong,
  });
  const movePlain = row.changing
    ? '在动——这一层正在起变化'
    : special.anDong
      ? `暗动——日支${dayBranch}冲${row.branch}，表上没标动，暗处可能在发力`
      : '没动——局面相对静';
  const specialTags = formatYaoSpecialTags(special);
  const shenPlain = LIUSHEN_PLAIN[row.liushen] ?? '';

  return `
    <article class="ly-yao-card" data-yao-card="${row.index}">
      <header>
        <strong>${row.label} · ${yinYang}</strong>
        ${roleFlags ? `<span class="ly-yao-card-flags">${roleFlags}</span>` : ''}
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

      <section class="ly-yao-card-sec" data-yao-sec="shen">
        <p class="ly-yao-card-sec-title">六神</p>
        <p class="ly-yao-card-sec-lead">
          <strong>${escapeHtml(row.liushen)}</strong>
          ${shenPlain ? `——${escapeHtml(shenPlain)}` : ''}
        </p>
      </section>

      <section class="ly-yao-card-sec" data-yao-sec="qin">
        <p class="ly-yao-card-sec-title">六亲</p>
        <p class="ly-yao-card-sec-lead">
          <button type="button" class="ly-qin-chip" data-open-qin-dict="${escapeHtml(
            row.liuqin,
          )}" title="打开六亲词典">${escapeHtml(qinLabel)}</button>
          <span class="ly-yao-card-sec-sub">${escapeHtml(energyModern)}</span>
        </p>
        ${dict ? renderQinFacetsHtml(dict) : ''}
      </section>

      <section class="ly-yao-card-sec" data-yao-sec="energy">
        <p class="ly-yao-card-sec-title">能量</p>
        <p class="ly-yao-card-sec-lead">
          <b>地支</b> ${escapeHtml(row.branch)}${escapeHtml(row.wuxing)}${
            row.changedBranch
              ? ` → 变 ${escapeHtml(row.changedBranch)}${escapeHtml(row.changedWuxing ?? '')}`
              : ''
          }
        </p>
        <p class="ly-yao-card-energy-meta">
          <span class="ly-wangxiang is-${escapeHtml(wangXiang)}">${escapeHtml(wangPlain)}</span>
          <span>· 月建 ${escapeHtml(monthBranch)}${escapeHtml(monthWx)}</span>
          <span>· ${escapeHtml(reason)}</span>
        </p>
        <p class="ly-yao-card-energy-meta">
          ${escapeHtml(movePlain)}
        </p>
        ${
          specialTags.length
            ? `<p class="ly-yao-card-energy-meta">特殊：${escapeHtml(specialTags.join(' · '))}</p>`
            : ''
        }
        ${
          hit
            ? `<p class="ly-yao-card-yong">本题用神倾向「${escapeHtml(formatYongLabel(yong.name))}」，此爻相符，优先盯它。</p>`
            : `<p class="ly-guide-tip">本题用神倾向「${escapeHtml(formatYongLabel(yong.name))}」；此爻是${qinLabel}，作背景参考。</p>`
        }
      </section>
    </article>
  `;
}
