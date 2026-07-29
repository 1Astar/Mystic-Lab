/**
 * 结合所问的解答：OfflineAnswerPack（Mystic Engine）驱动此刻解读
 */
import type { CastResult } from './engine.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { buildClassicCompendium } from './classic-compendium.ts';
import { buildPatternSummary } from './pattern-summary.ts';
import { yongTopicLabel } from './yong-focus.ts';
import { buildOfflineAnswerPack } from '../mystic-engine/build-pack.ts';
import { renderAnswerPackHtml } from '../mystic-engine/render-pack.ts';
import type { OfflineAnswerPack } from '../mystic-engine/types.ts';
import { loadUseProfilePref } from '../life/profile-context.ts';
import { formatHexWithPinyin } from './hex-pinyin.ts';
import { buildDirectReading } from './direct-reading.ts';

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
  cast: CastResult;
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
    title: '古籍旁注（选读）',
    body:
      `${classicQuiet}` +
      (corpus?.judgment ? `\n卦辞摘录：「${corpus.judgment}」` : '') +
      `\n\n白话落点：${modern}` +
      (chipLine ? `\n\n${chipLine}` : '') +
      `\n\n卦象是动态参考，不是死刑判决。`,
  };
}

function whyBody(pack: OfflineAnswerPack): string {
  return pack.why
    .map((w) => {
      const lines = [
        w.title,
        w.hook,
        ...(w.points ?? []),
        w.tip ? `建议：${w.tip}` : '',
      ].filter(Boolean);
      return lines.join('\n') || `${w.title}\n${w.body}`;
    })
    .join('\n\n');
}

function weekBody(pack: OfflineAnswerPack): string {
  const items = [pack.breakthrough, ...pack.checklist];
  return items.map((c, i) => `${i + 1}. 【${c.title}】${c.body}`).join('\n');
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
  const direct = buildDirectReading(cast, question);

  const lead =
    direct.frame ||
    (cast.changed
      ? `（基于${formatHexWithPinyin(cast.primary.name, cast.primary.fullName)}卦变${formatHexWithPinyin(cast.changed.name, cast.changed.fullName)}，结合你的问题）`
      : `（基于${formatHexWithPinyin(cast.primary.name, cast.primary.fullName)}，结合你的问题）`);

  return {
    topicLabel,
    questionLead: lead,
    layer1: {
      title: '核心方向',
      body: pack.verdict.parse,
      quote: pack.verdict.headline,
    },
    layer2: {
      title: '现状与转机',
      body: whyBody(pack),
    },
    layer3: {
      title: '具体动作',
      body: weekBody(pack),
    },
    layer4: {
      title: '心理定心丸',
      body: pack.reassurance ?? '',
    },
    strategy: {
      title: pack.breakthrough.title,
      body: pack.breakthrough.body,
      quote: pack.breakthrough.title,
    },
    pack,
    cast,
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

export function renderQuestionBriefingHtml(b: QuestionBriefing, classic?: BriefingBlock): string {
  const classicHtml = classic
    ? `<details class="ly-classic-fold">
        <summary>古籍旁注 · 选读</summary>
        <div class="ly-classic-fold-body">${nlToBr(classic.body)}</div>
      </details>`
    : '';
  return renderAnswerPackHtml(b.pack, {
    topicLabel: b.topicLabel,
    lead: b.questionLead,
    classicHtml,
    cast: b.cast,
  });
}

export function renderQuestionBriefingForCast(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): string {
  const full = buildQuestionBriefingWithClassic(cast, question, castAt);
  return renderQuestionBriefingHtml(full, full.classic);
}

/** @deprecated 使用 mystic-engine/render-pack */
export { renderAnswerPackHtml };
