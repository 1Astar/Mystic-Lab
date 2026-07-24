/**
 * 结合所问的解答：卦名直译 + 拆题分答（并入现有此刻解读）
 */
import type { CastResult } from './engine.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { buildClassicCompendium } from './classic-compendium.ts';
import { buildPatternSummary } from './pattern-summary.ts';
import { yongTopicLabel } from './yong-focus.ts';
import { buildDirectReading } from './direct-reading.ts';

export type BriefingBlock = {
  title: string;
  body: string;
  /** 单独拎出的金句（引用卡） */
  quote?: string;
};

export type QuestionBriefing = {
  topicLabel: string;
  /** 全文只出现一次的问题锚点 */
  questionLead: string;
  layer1: BriefingBlock;
  layer2: BriefingBlock;
  layer3: BriefingBlock;
  layer4: BriefingBlock;
  strategy: BriefingBlock;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nlToBr(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br>');
}

function stripQuestionPrefix(text: string): string {
  return text
    .replace(/^就「[^」]+」而言[：:]\s*/, '')
    .replace(/^对照你问的「[^」]+」[：:]\s*/, '')
    .replace(/^结合你问的问题「[^」]+」而言[：:]\s*/, '')
    .trim();
}

function buildClassicNote(
  cast: CastResult,
  question: string,
  castAt: Date,
  pattern: ReturnType<typeof buildPatternSummary>,
): BriefingBlock {
  const corpus = getClassicCorpus(cast.primary.name);
  const comp = buildClassicCompendium(cast, question, castAt);
  const decision = comp.blocks.find((b) => b.tag === '决策')?.text;
  const classicQuiet =
    cast.changingIndexes.length === 0
      ? '传统断语：卦静无动，宜观旺衰与世应，勿以一词定终身。'
      : `传统断语：动在${cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、')}，吉凶须追变爻生克，勿见字面即断。`;

  const chipLine = pattern.chips
    .slice(0, 2)
    .map((c) => `· ${c.label}：${c.tip}`)
    .join('\n');

  const modern = stripQuestionPrefix(
    decision ||
      (cast.changed
        ? `本卦主偏「${cast.primary.keywords[0]}」→ 变卦偏「${cast.changed.keywords[0]}」。`
        : `卦象偏「${cast.primary.keywords.slice(0, 2).join('、')}」。`),
  );

  return {
    title: '📜 古籍旁注（选读）',
    body:
      `${classicQuiet}` +
      (corpus?.judgment ? `\n卦辞摘录：「${corpus.judgment}」` : '') +
      `\n\n白话落点：${modern}` +
      (chipLine ? `\n\n${chipLine}` : '') +
      `\n\n卦象是动态参考，不是死刑判决。`,
  };
}

/** 生成结合所问的解答（直译判词结构） */
export function buildQuestionBriefing(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): QuestionBriefing {
  const topicLabel = yongTopicLabel(question);
  const direct = buildDirectReading(cast, question);

  const partBlock =
    direct.partLeans.length > 1
      ? '\n\n分问对照：\n' +
        direct.partLeans.map((p, i) => `${i + 1}. ${p.part} → ${p.lean}`).join('\n')
      : '';

  return {
    topicLabel,
    questionLead: direct.frame,
    layer1: {
      title: '📌 核心判词',
      body: '',
      quote: direct.verdict,
    },
    layer2: {
      title: '解析',
      body: direct.analysis + partBlock,
    },
    layer3: {
      title: '⛳ 给你的最终决策参考',
      body: direct.decision,
    },
    layer4: {
      title: '🧐 为什么这么判断',
      body: `${direct.why}\n\n💡 接下来你要做的三件事：\n\n${direct.nextSteps}`,
    },
    strategy: {
      title: '📌 核心判词',
      body: direct.verdict,
      quote: direct.verdict,
    },
  };
}

/** 供渲染：在四层后附加古籍 */
export function buildQuestionBriefingWithClassic(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): QuestionBriefing & { classic: BriefingBlock } {
  const base = buildQuestionBriefing(cast, question, castAt);
  const pattern = buildPatternSummary(cast, question, castAt);
  return {
    ...base,
    classic: buildClassicNote(cast, question, castAt, pattern),
  };
}

function renderBlockHtml(block: BriefingBlock, extraClass = ''): string {
  if (!block.body.trim() && !block.quote) return '';
  return `
    <section class="ly-briefing-layer${extraClass}" data-briefing-section>
      <h4 class="ly-briefing-title">${escapeHtml(block.title)}</h4>
      ${block.body.trim() ? `<div class="ly-briefing-body">${nlToBr(block.body)}</div>` : ''}
      ${
        block.quote
          ? `<blockquote class="ly-briefing-quote"><p>${escapeHtml(block.quote)}</p></blockquote>`
          : ''
      }
    </section>`;
}

export function renderQuestionBriefingHtml(b: QuestionBriefing, classic?: BriefingBlock): string {
  return `
    <article class="ly-question-briefing" data-question-briefing>
      <p class="ly-briefing-kicker">${escapeHtml(b.questionLead)}</p>
      <p class="ly-briefing-topic">本题焦点 · ${escapeHtml(b.topicLabel)}</p>
      ${renderBlockHtml(b.layer1, ' is-verdict')}
      ${renderBlockHtml(b.layer2)}
      ${renderBlockHtml(b.layer3, ' is-actions')}
      ${renderBlockHtml(b.layer4)}
      ${
        classic
          ? `<details class="ly-briefing-more"><summary>${escapeHtml(classic.title)}</summary>${renderBlockHtml({ ...classic, title: '' })}</details>`
          : ''
      }
    </article>
  `;
}

export function renderQuestionBriefingForCast(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): string {
  const full = buildQuestionBriefingWithClassic(cast, question, castAt);
  return renderQuestionBriefingHtml(full, full.classic);
}
