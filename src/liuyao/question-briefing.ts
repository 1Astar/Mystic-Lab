/**
 * 结合所问的解答：OfflineAnswerPack（Mystic Engine）驱动此刻解读
 */
import type { CastResult } from './engine.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { buildClassicCompendium } from './classic-compendium.ts';
import { buildPatternSummary } from './pattern-summary.ts';
import { yongTopicLabel } from './yong-focus.ts';
import {
  buildOfflineAnswerPack,
} from '../mystic-engine/build-pack.ts';
import type { OfflineAnswerPack } from '../mystic-engine/types.ts';
import { loadUseProfilePref } from '../life/profile-context.ts';

export type BriefingBlock = {
  title: string;
  body: string;
  quote?: string;
};

export type QuestionBriefing = {
  topicLabel: string;
  questionLead: string;
  layer1: BriefingBlock;
  layer2: BriefingBlock;
  layer3: BriefingBlock;
  layer4: BriefingBlock;
  strategy: BriefingBlock;
  pack: OfflineAnswerPack;
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

/** 决策参考：综合建议单独成段，避免一大坨 */
function renderDecisionHtml(decision: string): string {
  const m = decision.match(/^([\s\S]*?)\n综合建议[：:]\s*([\s\S]+)$/);
  if (m) {
    return `
      <p class="ly-pack-body" data-briefing-section>${escapeHtml(m[1]!.trim())}</p>
      <p class="ly-pack-body ly-pack-decision-rec" data-briefing-section><span class="ly-pack-label">综合建议</span>${escapeHtml(m[2]!.trim())}</p>`;
  }
  return `<p class="ly-pack-body" data-briefing-section>${nlToBr(decision)}</p>`;
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

function answersBody(pack: OfflineAnswerPack): string {
  return pack.answers
    .map((a, i) => {
      const ev = a.evidence.map((e) => `· ${e.plain}`).join('\n');
      return `${i + 1}. ${a.questionSlice}\n倾向：${a.lean}\n证据：\n${ev}`;
    })
    .join('\n\n');
}

function actionsBody(pack: OfflineAnswerPack): string {
  const check = pack.checklist
    .map((c, i) => `${i + 1}. ${c.title}：${c.body}`)
    .join('\n');
  return (
    `【${pack.breakthrough.title}】\n${pack.breakthrough.body}` +
    (check ? `\n\n还可同步：\n${check}` : '')
  );
}

/** 生成结合所问的解答（OfflineAnswerPack） */
export function buildQuestionBriefing(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): QuestionBriefing {
  const topicLabel = yongTopicLabel(question);
  const pack = buildOfflineAnswerPack({
    question,
    cast,
    castAt,
    useProfile: loadUseProfilePref(true),
  });

  const lead = cast.changed
    ? `（基于${cast.primary.fullName}卦变${cast.changed.fullName}，结合你的问题）`
    : `（基于${cast.primary.fullName}，结合你的问题）`;

  const firstLean = pack.answers[0]?.lean ?? pack.decision;

  return {
    topicLabel,
    questionLead: lead,
    layer1: {
      title: '先答你的问题',
      body: answersBody(pack),
      quote: firstLean,
    },
    layer2: {
      title: '决策参考',
      body: pack.decision,
    },
    layer3: {
      title: '破局动作',
      body: actionsBody(pack),
    },
    layer4: {
      title: '盘面辅读',
      body: pack.boardExpand ?? '',
    },
    strategy: {
      title: '破局动作',
      body: pack.breakthrough.body,
      quote: pack.breakthrough.title,
    },
    pack,
  };
}

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
      ${
        block.quote
          ? `<blockquote class="ly-briefing-quote"><p>${escapeHtml(block.quote)}</p></blockquote>`
          : ''
      }
      ${block.body.trim() ? `<div class="ly-briefing-body">${nlToBr(block.body)}</div>` : ''}
    </section>`;
}

export function renderAnswerPackHtml(pack: OfflineAnswerPack, topicLabel: string, lead: string): string {
  const answerSections = pack.answers
    .map((a, i) => {
      const ev = a.evidence
        .map((e) => `<li data-fact="${escapeHtml(e.factKey)}">${escapeHtml(e.plain)}</li>`)
        .join('');
      return `
        <div class="ly-pack-item" data-intent="${escapeHtml(a.intentId)}" data-briefing-section>
          <p class="ly-pack-q"><span class="ly-pack-idx">${i + 1}</span>${escapeHtml(a.questionSlice)}</p>
          <p class="ly-pack-lean"><span class="ly-pack-label">倾向</span>${escapeHtml(a.lean)}</p>
          ${ev ? `<ul class="ly-pack-evidence">${ev}</ul>` : ''}
        </div>`;
    })
    .join('');

  const checks = pack.checklist
    .map(
      (c) =>
        `<li><span class="ly-pack-label">${escapeHtml(c.title)}</span>${escapeHtml(c.body)}</li>`,
    )
    .join('');

  return `
    <article class="ly-question-briefing ly-answer-pack" data-question-briefing data-answer-pack>
      <p class="ly-briefing-kicker">${escapeHtml(lead)}</p>
      <p class="ly-briefing-topic">本题焦点 · ${escapeHtml(topicLabel)}</p>
      ${
        pack.contextUsed
          ? `<p class="ly-pack-context">已带入档案上下文</p>`
          : ''
      }
      <p class="ly-pack-section">先答你的问题</p>
      ${answerSections}
      <p class="ly-pack-section">决策参考</p>
      ${renderDecisionHtml(pack.decision)}
      <p class="ly-pack-section">破局动作</p>
      <div class="ly-pack-breakthrough" data-briefing-section>
        <p class="ly-pack-bt-title">${escapeHtml(pack.breakthrough.title)}</p>
        <p class="ly-pack-body">${nlToBr(pack.breakthrough.body)}</p>
        ${checks ? `<ul class="ly-pack-checklist">${checks}</ul>` : ''}
      </div>
      ${
        pack.boardExpand
          ? `<details class="ly-briefing-more"><summary>盘面辅读</summary><p class="ly-pack-body">${nlToBr(pack.boardExpand)}</p></details>`
          : ''
      }
    </article>
  `;
}

function renderBlockHtmlLegacy(block: BriefingBlock, extraClass = ''): string {
  return renderBlockHtml(block, extraClass);
}

export function renderQuestionBriefingHtml(b: QuestionBriefing, classic?: BriefingBlock): string {
  const lead = b.questionLead;
  let html = renderAnswerPackHtml(b.pack, b.topicLabel, lead);
  if (classic) {
    html = html.replace(
      '</article>',
      `<details class="ly-briefing-more"><summary>${escapeHtml(classic.title)}</summary>${renderBlockHtmlLegacy({ ...classic, title: '' })}</details></article>`,
    );
  }
  return html;
}

export function renderQuestionBriefingForCast(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): string {
  const full = buildQuestionBriefingWithClassic(cast, question, castAt);
  return renderQuestionBriefingHtml(full, full.classic);
}
