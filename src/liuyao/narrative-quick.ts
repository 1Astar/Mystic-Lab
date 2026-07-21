import type { CastResult } from './engine.ts';
import { LINE_LABELS, yingLineOf } from './hexagrams.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossDaXiang, glossLine } from './classic-gloss.ts';
import { formatClauseHtml } from './format-clause.ts';
import { buildReadingFacts, type ReadingFacts } from './reading-facts.ts';
import { buildQuickSummary } from './interpret.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { formatLiuqinShort } from './energy-lens.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

/** 表格式本卦∥变卦（速断盘面） */
export function renderQuickBoard(cast: CastResult, castAt: Date = new Date()): string {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;

  const rowsTopFirst = [...dressed.rows].reverse();
  const primaryRows = rowsTopFirst
    .map((r) => {
      const mark = [r.isShi ? '世' : '', r.isYing ? '应' : '', r.changing ? '动' : '']
        .filter(Boolean)
        .join('');
      const yao = r.bit === 1 ? '━━━' : '━ ━';
      return `<tr>
        <td class="ly-qb-yao">${yao}</td>
        <td>${r.label}</td>
        <td>${formatLiuqinShort(r.liuqin)}</td>
        <td class="ly-qb-mark">${mark || '—'}</td>
      </tr>`;
    })
    .join('');

  const changedRows = cast.changed
    ? rowsTopFirst
        .map((r) => {
          const line = r.index + 1;
          const isShi = changedShi === line;
          const isYing = changedYing === line;
          const bit = cast.changedLines[r.index]!;
          const yao = bit === 1 ? '━━━' : '━ ━';
          const mark = [isShi ? '世' : '', isYing ? '应' : '', r.changing ? '变' : '']
            .filter(Boolean)
            .join('');
          return `<tr>
            <td class="ly-qb-yao">${yao}</td>
            <td>${LINE_LABELS[r.index]}</td>
            <td>${r.changing && r.changedBranch ? `${r.changedBranch}${r.changedWuxing ?? ''}` : `${r.branch}${r.wuxing}`}</td>
            <td class="ly-qb-mark">${mark || '—'}</td>
          </tr>`;
        })
        .join('')
    : `<tr><td colspan="4" class="ly-qb-empty">无动则无变</td></tr>`;

  return `
    <header class="ly-quick-board">
      <p class="ly-hex-hero-meta">世${LINE_LABELS[cast.shiLine - 1]} · 应${LINE_LABELS[cast.yingLine - 1]} · ${
        cast.changingIndexes.length
          ? `动爻 ${cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、')}`
          : '无动爻'
      }</p>
      <div class="ly-qb-pair">
        <div class="ly-qb-col">
          <p class="ly-guide-label">本卦 · ${escapeHtml(cast.primary.fullName)}</p>
          <table class="ly-qb-table" aria-label="本卦装卦简表">
            <thead><tr><th>爻</th><th>位</th><th>六亲</th><th>标记</th></tr></thead>
            <tbody>${primaryRows}</tbody>
          </table>
        </div>
        <div class="ly-qb-col">
          <p class="ly-guide-label">变卦${cast.changed ? ` · ${escapeHtml(cast.changed.fullName)}` : ''}</p>
          <table class="ly-qb-table" aria-label="变卦简表">
            <thead><tr><th>爻</th><th>位</th><th>支/五行</th><th>标记</th></tr></thead>
            <tbody>${changedRows}</tbody>
          </table>
        </div>
      </div>
    </header>
  `;
}

function renderConclusionTab(facts: ReadingFacts): string {
  const move =
    facts.changing.labels.length === 0
      ? '无动爻'
      : `动爻 ${facts.changing.labels.length} 处`;
  const arrow = facts.changed
    ? `「${facts.primary.keywords[0]}」→「${facts.changed.keywords[0]}」`
    : `「${facts.primary.keywords[0]}」`;
  return `
    <section class="ly-result-panel">
      <h3>结论</h3>
      <p class="ly-quick-verdict">${formatClauseHtml(facts.primary.gist)}</p>
      <p class="ly-quick-tags">世应${escapeHtml(facts.shiYingRel.rel)} · ${escapeHtml(move)} · ${escapeHtml(arrow)}</p>
      ${
        facts.changed
          ? `<p class="ly-guide-tip">变卦「${escapeHtml(facts.changed.fullName)}」：${formatClauseHtml(facts.changed.gist)}</p>`
          : ''
      }
    </section>
  `;
}

function renderCategoryTab(facts: ReadingFacts): string {
  const luck = clip(facts.primary.gist, 48);
  const career = clip(facts.sceneCareer, 40);
  const love = clip(facts.sceneLove, 40);
  const decision = facts.changed
    ? `朝「${facts.changed.keywords[0]}」做一小步验证，忌硬冲旧法。`
    : `先稳「${facts.themeWord}」相关边界，再谈大动作。`;

  const items: { label: string; text: string; hot?: boolean }[] = [
    { label: '运势', text: luck, hot: facts.domain === 'general' || facts.domain === 'life' },
    { label: '事业', text: career, hot: facts.domain === 'career' },
    { label: '感情', text: love, hot: facts.domain === 'love' },
    { label: '决策', text: decision, hot: true },
  ];

  return `
    <section class="ly-result-panel">
      <h3>分类建议</h3>
      <ul class="ly-quick-cats">
        ${items
          .map(
            (it) => `
          <li class="${it.hot ? 'is-hot' : ''}">
            <strong>${it.label}${it.hot && facts.domain !== 'general' ? ' · 本题相关' : ''}</strong>
            <span>${escapeHtml(it.text)}</span>
          </li>`,
          )
          .join('')}
      </ul>
    </section>
  `;
}

function renderClassicTab(cast: CastResult): string {
  const corpus = getClassicCorpus(cast.primary.name);
  const daxiang =
    glossDaXiang(cast.primary.name) ?? corpus?.daXiang ?? cast.primary.gist;
  const moveLines = cast.changingIndexes.length ? cast.changingIndexes : [];

  const lineBlocks =
    moveLines.length > 0
      ? moveLines
          .map((i) => {
            const label = LINE_LABELS[i]!;
            const gloss =
              glossLine(cast.primary.name, i) ??
              corpus?.lineNotes?.[i] ??
              '（白话暂缺，可对照原文体味）';
            const classic = corpus?.lineClassics?.[i] ?? '';
            return `
          <details class="ly-quick-classic-item" open>
            <summary>动爻 · ${label}爻辞</summary>
            <p class="ly-classic-src">${formatClauseHtml(classic || '（本库暂无逐爻原文，见白话）')}</p>
            <p class="ly-guide-tip">${escapeHtml(gloss)}</p>
          </details>`;
          })
          .join('')
      : `<details class="ly-quick-classic-item">
          <summary>爻辞</summary>
          <p class="ly-guide-tip">无动爻：可先读卦辞与大象，点开学习模式再看逐爻。</p>
        </details>`;

  return `
    <section class="ly-result-panel">
      <h3>原文</h3>
      <details class="ly-quick-classic-item" open>
        <summary>卦辞 / 大象</summary>
        <p class="ly-classic-src">${formatClauseHtml(corpus?.judgment || cast.primary.gist)}</p>
        <p class="ly-guide-tip">白话：${escapeHtml(daxiang)}</p>
      </details>
      ${lineBlocks}
    </section>
  `;
}

export function renderQuickTabsHtml(cast: CastResult, question: string, castAt?: Date): string {
  const facts = buildReadingFacts(cast, question, castAt);
  void buildQuickSummary;
  return `
    <div class="ly-result-tab-panel is-active" data-panel="conclusion" role="tabpanel">
      ${renderConclusionTab(facts)}
    </div>
    <div class="ly-result-tab-panel" data-panel="category" role="tabpanel" hidden>
      ${renderCategoryTab(facts)}
    </div>
    <div class="ly-result-tab-panel" data-panel="classic" role="tabpanel" hidden>
      ${renderClassicTab(cast)}
    </div>
  `;
}

export const QUICK_TAB_DEFS = [
  { id: 'conclusion', label: '结论' },
  { id: 'category', label: '分类建议' },
  { id: 'classic', label: '原文' },
] as const;
