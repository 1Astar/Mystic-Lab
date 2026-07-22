import type { CastResult } from './engine.ts';
import { yingLineOf } from './hexagrams.ts';
import { dressHexagram, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { buildYaoAskCard } from './energy-lens.ts';
import { buildShengKeGraph } from './sheng-ke-graph.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import {
  bindLearnCourse,
  type CourseStep,
  loadCourseNote,
  renderLearnCourseHtml,
  saveCourseNote,
} from './learn-course.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossLine } from './classic-gloss.ts';
import { formatClauseHtml } from './format-clause.ts';
import { renderDressArchiveHtml } from './dress-archive.ts';
import { bindDeepNotesBlock, renderDeepNotesBlockHtml } from './deep-course.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @deprecated 请用 dress-archive.renderDressArchiveHtml */
export function renderDressInfoCard(cast: CastResult, castAt: Date): string {
  return renderDressArchiveHtml(cast, castAt);
}

function positionBand(index: number): string {
  if (index <= 1) return '属于底部（根基 / 开端）';
  if (index <= 3) return '属于中段（过程 / 门户）';
  return '属于顶部（结果 / 收束）';
}

function stateBand(row: YaoDress): string {
  if (row.changing) return '这里是强盛的（正在发动、向外扩张）';
  if (row.isShi || row.isYing) return '这里相对稳固（你的站位或环境主调）';
  return '这里偏安静（作背景参照）';
}

function rowsForStep(
  step: CourseStep,
  _cast: CastResult,
  rows: YaoDress[],
  question: string,
): YaoDress[] {
  if (step === 1) {
    return rows.filter((r) => r.isShi || r.isYing);
  }
  if (step === 2) {
    const moving = rows.filter((r) => r.changing);
    return moving.length ? moving : rows.filter((r) => r.isShi);
  }
  if (step === 3) {
    return rows.filter((r) => r.index === 2 || r.index === 5);
  }
  if (step === 4) {
    const g = buildShengKeGraph(rows, question);
    const idxs = new Set(g.nodes.map((n) => n.row.index));
    return rows.filter((r) => idxs.has(r.index));
  }
  return rows.filter((r) => r.isShi);
}

/** Step 对应位置解析（古籍抽屉） */
export function renderStepYaoPanelHtml(
  step: CourseStep,
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const focus = rowsForStep(step, cast, rows, question);
  const corpus = getClassicCorpus(cast.primary.name);
  const note = loadCourseNote(cast, step);

  const cards = focus
    .map((row) => {
      const ask = buildYaoAskCard(row, { domain: facts.domain });
      const classic = corpus?.lineClassics[row.index] ?? '';
      const bai = glossLine(cast.primary.name, row.index) ?? '';
      return `
        <article class="ly-step-yao-card">
          <h5>Step ${step} · ${escapeHtml(row.label)} 对应位置解析</h5>
          <p><strong>位置：</strong>${escapeHtml(positionBand(row.index))}</p>
          <p><strong>状态：</strong>${escapeHtml(stateBand(row))}</p>
          <p><strong>生活映射：</strong>${escapeHtml(ask.relate.replace(/^📌\s*/, ''))}</p>
          <p class="ly-classic-note">（${escapeHtml(ask.classicNote)}）</p>
          ${
            classic
              ? `<p class="ly-classic-zh"><span class="ly-classic-tag">爻辞</span>${escapeHtml(classic)}</p>`
              : ''
          }
          ${
            bai
              ? `<p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(bai)}</p>`
              : ''
          }
        </article>`;
    })
    .join('');

  return `
    <div class="ly-step-yao-panel" data-step-yao-for="${step}">
      <p class="ly-layer-guide">当前五步讲到 Step ${step}，下面是这一步相关爻的切片。</p>
      ${cards || '<p class="ly-guide-tip">这一步暂无对应单爻切片。</p>'}
      <label class="ly-course-note-field">
        <span>本步笔记</span>
        <textarea class="question-input" rows="3" data-shell-step-note data-step="${step}" placeholder="记录下你此刻的理解或疑惑…">${escapeHtml(note)}</textarea>
      </label>
    </div>
  `;
}

function renderPointYaoBlock(cast: CastResult): string {
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;
  return `
    <section class="ly-teach-ask ly-result-panel">
      <h4>点爻学爻</h4>
      <p class="ly-layer-guide">起了兴趣就点爻旁 ? —— 一条一条学。</p>
      <div class="ly-layer-pair" data-ask-hex>
        <div>
          <p class="ly-guide-label">本卦 · ${escapeHtml(cast.primary.fullName)}</p>
          ${renderHexagramSvg({
            lines: cast.primaryLines,
            shiLine: cast.shiLine,
            yingLine: cast.yingLine,
            changingIndexes: cast.changingIndexes,
            pulseChanging: true,
            showAskButtons: true,
            emphasizeShiYing: true,
            showTrigramLabels: true,
          })}
        </div>
        ${
          cast.changed
            ? `<div>
          <p class="ly-guide-label">变卦 · ${escapeHtml(cast.changed.fullName)}</p>
          ${renderHexagramSvg({
            lines: cast.changedLines,
            shiLine: changedShi,
            yingLine: changedYing,
            showTrigramLabels: true,
          })}
        </div>`
            : ''
        }
        <div class="ly-yao-ask-slot" data-ask-slot hidden></div>
      </div>
    </section>
  `;
}

/** 学习结果主叙事：问题卡 → 五步（含深度能量推演）→ 点爻 / 笔记 */
export function renderLearnTeachPageHtml(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const q = question.trim() || '（尚未写下具体问题）';
  return `
    <div class="ly-teach-page" data-learn-teach>
      <header class="ly-teach-top">
        <article class="ly-q-card">
          <p class="ly-q-card-label">你问的是</p>
          <p class="ly-q-card-text">${escapeHtml(q)}</p>
        </article>
      </header>
      <main class="ly-teach-main">
        <p class="ly-teach-main-kicker">五步学习 · 边学边推演</p>
        ${renderLearnCourseHtml(cast, question, castAt)}
      </main>
      <footer class="ly-teach-tools">
        ${renderPointYaoBlock(cast)}
        ${renderDeepNotesBlockHtml(cast, castAt)}
      </footer>
    </div>
  `;
}

export function bindLearnTeachPage(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  castAt = new Date(),
): void {
  bindLearnCourse(root, cast, question, castAt);
  bindDeepNotesBlock(root);
}
