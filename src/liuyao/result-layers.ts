import type { CastResult } from './engine.ts';
import {
  fromDatetimeLocalValue,
  siZhuFromDate,
  toDatetimeLocalValue,
  renderCastTimePlaque,
  type SiZhu,
} from './ganzhi.ts';
import { LINE_LABELS, upperLowerFromLines, yingLineOf } from './hexagrams.ts';
import { bindClassicFolder, renderClassicFolderHtml } from './classic-folder.ts';
import { dressHexagram, type YaoDress } from './najia.ts';
import { renderDressDualPlatesHtml } from './dress-archive.ts';
import { buildShengKeGraph, renderShengKeGraphHtml } from './sheng-ke-graph.ts';
import { renderYaoCard } from './yao-card.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import { formatClauseHtml } from './format-clause.ts';
import { teachFold } from './flip-teach.ts';
import {
  renderLearnCorePanel,
  renderLearnFaqHtml,
} from './narrative-learn.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { bindQinDict, renderClassicPlateIntroHtml } from './energy-lens.ts';
import {
  bindDeepCourse,
  bindDeepNotesBlock,
  renderDeepCourseHtml,
  renderDeepNotesBlockHtml,
} from './deep-course.ts';

function renderSiZhuBar(sz: SiZhu, castAt?: Date): string {
  if (castAt) return renderCastTimePlaque(castAt, { compact: true });
  return `
    <div class="ly-sizhu" data-sizhu>
      <span>年 ${sz.year}</span>
      <span>月 ${sz.month}</span>
      <span>日 ${sz.day}</span>
      <span>时 ${sz.hour}</span>
      <span class="ly-sizhu-stem">日干 ${sz.dayStem}</span>
      ${sz.dayXunKong ? `<span class="ly-sizhu-kong">空亡 ${sz.dayXunKong}</span>` : ''}
    </div>
  `;
}

function renderDressTable(cast: CastResult, castAt: Date): string {
  return `
    <p class="ly-guide-tip">本卦 ∥ 变卦对照 · 点本卦一行看实盘卡</p>
    ${renderDressDualPlatesHtml(cast, castAt)}
    <div class="ly-yao-card-slot" data-yao-card-slot></div>
  `;
}

export function renderDeepPanel(cast: CastResult, castAt: Date, question: string): string {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const graph = buildShengKeGraph(dressed.rows, question);
  const facts = buildReadingFacts(cast, question, castAt);
  const whyBits = [
    facts.shengKe.whyYuan
      ? `<p class="ly-sk-why"><strong>为什么是原神？</strong>${facts.shengKe.whyYuan}</p>`
      : '',
    facts.shengKe.whyJi
      ? `<p class="ly-sk-why"><strong>为什么是忌神？</strong>${facts.shengKe.whyJi}</p>`
      : '',
  ].join('');

  return `
    <label class="ly-cast-at">
      <span>占卜时间</span>
      <input type="datetime-local" data-cast-at value="${toDatetimeLocalValue(castAt)}" />
    </label>
    <p class="ly-layer-guide">默认此刻，可改。改时间会重算四柱与六神（历法：lunar-javascript）。</p>
    ${renderSiZhuBar(sz, castAt)}
    ${renderDeepCourseHtml(cast, question, castAt)}
    ${renderDeepNotesBlockHtml(cast, castAt, question)}
    <details class="ly-deep-more">
      <summary>传统排盘进阶（点行看卡 · 生克图）</summary>
      ${renderClassicPlateIntroHtml()}
      ${renderDressTable(cast, castAt)}
      ${renderShengKeGraphHtml(graph, { question })}
      ${whyBits ? `<div class="ly-sk-why-box">${whyBits}<p class="ly-guide-tip">${facts.shengKe.tip}</p></div>` : ''}
      ${renderClassicFolderHtml(cast)}
    </details>
  `;
}

/** 变卦解释整块默认收起，避免结果页膨胀 */
export function renderChangeHowHtml(cast: CastResult): string {
  const hasChange = Boolean(cast.changed && cast.changingIndexes.length > 0);

  if (!hasChange) {
    const body = `
      <div class="ly-change-how is-static">
        <p class="ly-change-how-rule">六爻都是少阳 / 少阴，火柴棍形状不变，所以<strong>没有变卦</strong>。</p>
        <div class="ly-bian-explainer">
          <p><em>变卦是什么？</em>动爻翻完后形成的新卦，叫变卦——同一盘棋的下一幕。</p>
          <p><em>为什么这卦没有？</em>没有老阳 / 老阴，没有人「翻」，拼不出新卦。先把本卦与世应看清即可。</p>
          <p><em>无变意味着什么？</em>不是坏事。少一份「下一幕」，多一份把当下结构读懂的空间。</p>
        </div>
      </div>
    `;
    return teachFold('变卦说明 · 为什么没有变卦', body);
  }

  const rows = cast.changingIndexes
    .map((i) => {
      const t = cast.throws[i]!;
      const fromYang = t.bit === 1;
      if (fromYang) {
        return `
        <li class="ly-change-how-card">
          <p class="ly-change-how-card-head"><strong>${LINE_LABELS[i]} · 老阳 ○</strong>会变</p>
          <div class="ly-change-how-viz" aria-hidden="true">
            <span class="ly-change-how-bar is-yang"></span>
            <span class="ly-change-how-arrow">→</span>
            <span class="ly-change-how-bar is-yin"><i></i><i></i></span>
          </div>
          <p class="ly-change-how-card-body">一整条横线（阳）→ 从中间断开（阴）<br>杯水满溢——满极则反</p>
        </li>`;
      }
      return `
        <li class="ly-change-how-card">
          <p class="ly-change-how-card-head"><strong>${LINE_LABELS[i]} · 老阴 ×</strong>会变</p>
          <div class="ly-change-how-viz" aria-hidden="true">
            <span class="ly-change-how-bar is-yin"><i></i><i></i></span>
            <span class="ly-change-how-arrow">→</span>
            <span class="ly-change-how-bar is-yang"></span>
          </div>
          <p class="ly-change-how-card-body">中间断开的两截（阴）→ 连成一整条（阳）<br>冬尽春来——阴极则生</p>
        </li>`;
    })
    .join('');

  const { upper: pu, lower: pl } = upperLowerFromLines(cast.primaryLines);
  const { upper: cu, lower: cl } = upperLowerFromLines(cast.changedLines!);
  const trigramNote =
    pu.id === cu.id && pl.id === cl.id
      ? `<p class="ly-change-how-trigram">其它爻不动，整卦成为「${cast.changed!.fullName}」。</p>`
      : `<p class="ly-change-how-trigram">其它爻不动。${
          pu.id !== cu.id ? `上卦 ${pu.id}·${pu.nature} → ${cu.id}·${cu.nature}` : `上卦仍是 ${pu.id}·${pu.nature}`
        } · ${
          pl.id !== cl.id ? `下卦 ${pl.id}·${pl.nature} → ${cl.id}·${cl.nature}` : `下卦仍是 ${pl.id}·${pl.nature}`
        } → 「${cast.changed!.fullName}」</p>`;

  const moveHint = cast.changingIndexes.map((i) => LINE_LABELS[i]!).join('、');
  const body = `
    <div class="ly-change-how">
      <p class="ly-change-how-title">这一爻怎么变的</p>
      <p class="ly-change-how-rule">连着＝阳，断开＝阴。只有<strong>老阳 / 老阴</strong>会翻到对面。</p>
      <ul class="ly-change-how-list">${rows}</ul>
      ${trigramNote}
      <div class="ly-bian-explainer">
        <p><em>变卦是什么？</em>本卦是你此刻摇出来的样子；动爻翻完后六爻重新拼成的新卦，叫<strong>变卦</strong>——同一盘棋翻过几子后的下一幕。</p>
        <p><em>为什么会形成？</em>只有老阳、老阴会翻。有动爻才有变卦。</p>
        <p><em>意味着什么？</em>提示事情<strong>可能滑向的方向</strong>，像天气预报，不是判决书。宜对照问题问：愿不愿意朝这个方向走一小步？</p>
        <p class="ly-bian-explainer-eg">对照：从「${cast.primary.fullName}」到「${cast.changed!.fullName}」，${cast.primary.keywords[0]} → ${cast.changed!.keywords[0]}。</p>
      </div>
    </div>
  `;

  return teachFold(`变卦说明 · 动爻 ${moveHint} 怎么变成「${cast.changed!.name}」`, body);
}

/** 本卦 + 变卦主视觉（进入结果页先见爻象） */
export function renderHexHero(
  cast: CastResult,
  opts: {
    askable?: boolean;
    highlightIndexes?: number[];
    castAt?: Date;
    /** 学习模式：用最终闭环一句话替换本卦旁 gist */
    primaryGist?: string;
  } = {},
): string {
  const movingLabels =
    cast.changingIndexes.length === 0
      ? '无动爻'
      : `动爻 ${cast.changingIndexes.map((i) => LINE_LABELS[i]!).join('、')}`;
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;
  const askable = opts.askable ?? false;
  const highlightIndexes = opts.highlightIndexes ?? [];
  const castAt = opts.castAt ?? new Date();
  const primaryGist = opts.primaryGist?.trim() || cast.primary.gist;

  return `
    <header class="ly-hex-hero">
      ${renderCastTimePlaque(castAt)}
      <p class="ly-hex-hero-meta">世${LINE_LABELS[cast.shiLine - 1]} · 应${LINE_LABELS[cast.yingLine - 1]} · ${movingLabels}${
        askable ? ' · 点爻看旁注' : ''
      }</p>
      <div class="ly-layer-pair ly-hex-hero-pair">
        <div class="ly-hex-hero-col ly-hex-inline-host" data-ask-hex>
          <p class="ly-guide-label">本卦 · ${cast.primary.fullName}</p>
          ${renderHexagramSvg({
            lines: cast.primaryLines,
            shiLine: cast.shiLine,
            yingLine: cast.yingLine,
            changingIndexes: cast.changingIndexes,
            pulseChanging: true,
            showTrigramLabels: true,
            showAskButtons: askable,
            highlightIndexes,
          })}
          <p class="ly-hex-hero-gist">${formatClauseHtml(primaryGist)}</p>
        </div>
        <div class="ly-hex-hero-col">
          <p class="ly-guide-label">变卦${cast.changed ? ` · ${cast.changed.fullName}` : ''}</p>
          ${
            cast.changed
              ? `${renderHexagramSvg({
                  lines: cast.changedLines,
                  shiLine: changedShi,
                  yingLine: changedYing,
                  changingIndexes: cast.changingIndexes,
                  showTrigramLabels: true,
                })}<p class="ly-hex-hero-gist">${formatClauseHtml(cast.changed.gist)}</p>`
              : '<p class="ly-guide-tip">无动则无变，时间轴停在本卦。</p>'
          }
        </div>
      </div>
      <p class="ly-keywords ly-hex-hero-keywords">${cast.primary.keywords.join(' · ')}${
        cast.changed ? ` → ${cast.changed.keywords.join(' · ')}` : ''
      }</p>
      ${renderChangeHowHtml(cast)}
    </header>
  `;
}

/** 世 / 应 / 用神（定义锚 + 生活映射） */
export function renderCorePanel(cast: CastResult, question: string): string {
  return renderLearnCorePanel(cast, question);
}

export function renderFaqPanel(cast: CastResult, question: string): string {
  return renderLearnFaqHtml(cast, question);
}

export type ResultLayersOptions = {
  castAt?: Date;
};

/** @deprecated 结果页已改用 result-tabs；保留兼容 */
export function renderResultLayers(
  cast: CastResult,
  question: string,
  opts: ResultLayersOptions = {},
): string {
  const castAt = opts.castAt ?? new Date();
  return `
    <section class="ly-layers" data-result-layers data-cast-iso="${castAt.toISOString()}">
      ${renderHexHero(cast)}
      <div class="ly-layer-tabs" role="tablist">
        <button type="button" class="ly-layer-tab is-active" data-tab="core" role="tab">核心要素</button>
        <button type="button" class="ly-layer-tab" data-tab="deep" role="tab">深度推演</button>
      </div>
      <div class="ly-layer-panel is-active" data-panel="core">
        ${renderCorePanel(cast, question)}
      </div>
      <div class="ly-layer-panel" data-panel="deep" hidden data-deep-panel>
        ${renderDeepPanel(cast, castAt, question)}
      </div>
    </section>
    ${renderFaqPanel(cast, question)}
  `;
}

function syncDressAndSk(root: HTMLElement, index: number | null): void {
  root.querySelectorAll('.ly-dress-row[data-dress-side="primary"]').forEach((el) => {
    const on = index !== null && el.getAttribute('data-dress-line') === String(index);
    el.classList.toggle('is-open', on);
  });
  root.querySelectorAll('.ly-sk-node').forEach((el) => {
    const on = index !== null && el.getAttribute('data-sk-line') === String(index);
    el.classList.toggle('is-open', on);
  });
}

function openYaoCard(
  slot: HTMLElement,
  rows: YaoDress[],
  index: number,
  question: string,
  tableRoot: HTMLElement,
  hexName?: string,
): void {
  const row = rows.find((r) => r.index === index);
  if (!row) return;
  const existing = slot.querySelector(`[data-yao-card="${index}"]`);
  if (existing) {
    slot.innerHTML = '';
    syncDressAndSk(tableRoot, null);
    return;
  }
  slot.innerHTML = renderYaoCard(row, question, { hexName });
  syncDressAndSk(tableRoot, index);
  tableRoot
    .querySelector<HTMLElement>(`.ly-dress-row[data-dress-side="primary"][data-dress-line="${index}"]`)
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export function bindDeepPanel(
  deep: HTMLElement,
  cast: CastResult,
  question: string,
  castAt: Date,
  onCastAtChange: (d: Date) => void,
): void {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);

  const openLine = (idx: number) => {
    const slot = deep.querySelector<HTMLElement>('[data-yao-card-slot]');
    if (slot) openYaoCard(slot, dressed.rows, idx, question, deep, cast.primary.name);
  };

  deep.querySelectorAll<HTMLElement>('.ly-dress-row[data-dress-side="primary"]').forEach((tr) => {
    const open = () => openLine(Number(tr.dataset.dressLine));
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  deep.querySelectorAll<SVGGElement>('.ly-sk-node').forEach((g) => {
    g.style.cursor = 'pointer';
    const open = () => openLine(Number(g.getAttribute('data-sk-line')));
    g.addEventListener('click', open);
  });

  bindClassicFolder(deep);
  bindQinDict(deep);
  bindDeepCourse(deep, cast, question, castAt);
  bindDeepNotesBlock(deep, cast, question, castAt);

  deep.querySelectorAll<HTMLButtonElement>('[data-classic-line]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.classicLine!;
      const hint = deep.querySelector<HTMLElement>(`[data-classic-hint="${i}"]`);
      if (hint) hint.hidden = !hint.hidden;
    });
  });

  const input = deep.querySelector<HTMLInputElement>('[data-cast-at]');
  input?.addEventListener('change', () => {
    const next = fromDatetimeLocalValue(input.value);
    onCastAtChange(next);
  });
}

export function bindResultLayers(
  root: HTMLElement,
  cast: CastResult,
  question: string,
): { getCastAt: () => Date } {
  const layers =
    root.querySelector<HTMLElement>('[data-result-layers]') ??
    root.querySelector<HTMLElement>('[data-result-tabs]');
  let castAt = new Date(layers?.dataset.castIso ?? Date.now());

  const tabs = root.querySelectorAll<HTMLButtonElement>('.ly-result-tab, .ly-layer-tab');
  const panels = root.querySelectorAll<HTMLElement>('.ly-result-tab-panel, .ly-layer-panel');

  const activateTab = (id: string) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    panels.forEach((p) => {
      const on = p.dataset.panel === id;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab ?? 'reading'));
  });

  const refreshDeep = (next: Date) => {
    castAt = next;
    if (layers) layers.dataset.castIso = next.toISOString();
    const deep = root.querySelector<HTMLElement>('[data-deep-panel]');
    if (!deep) return;
    deep.innerHTML = renderDeepPanel(cast, next, question);
    bindDeepPanel(deep, cast, question, next, refreshDeep);
    activateTab('deep');
  };

  const deep = root.querySelector<HTMLElement>('[data-deep-panel]');
  if (deep) bindDeepPanel(deep, cast, question, castAt, refreshDeep);

  return {
    getCastAt: () => castAt,
  };
}

export const NOTE_TAG_OPTIONS = ['心态记录', '事后反馈', '古书对照', '工作', '感情', '考试'] as const;
