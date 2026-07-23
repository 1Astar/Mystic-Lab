/**
 * 结合所问的解答：小标题 + 段落（不再堆「第 N 层 / Step N」）
 */
import type { CastResult } from './engine.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { dressHexagram, LIUSHEN_PLAIN, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { LINE_ROLE } from './reading-facts.ts';
import { LIUQIN_ENERGY } from './energy-lens.ts';
import { buildYongFocusPack, yongTopicLabel } from './yong-focus.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { buildClassicCompendium } from './classic-compendium.ts';
import { buildFinalLoop } from './final-loop.ts';
import { buildPatternSummary } from './pattern-summary.ts';

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

function buildStatusTurning(
  cast: CastResult,
  shi: YaoDress | undefined,
  moving: YaoDress[],
): BriefingBlock {
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const parts: string[] = [];

  parts.push(
    `你正处于一个「${from}」的时刻（本卦：${cast.primary.fullName}）。${cast.primary.gist}`,
  );

  if (shi) {
    const energy = LIUQIN_ENERGY[shi.liuqin];
    parts.push(
      `你的站位落在「${energy.modern}」（世爻·${shi.label}）——${energy.blurb}`,
    );
  }

  if (moving.length === 0) {
    parts.push('本卦无动爻：关键不在突变，而在把内外边界看清、把节奏稳住。');
  } else if (moving.length === 1) {
    const r = moving[0]!;
    const energy = LIUQIN_ENERGY[r.liuqin];
    const role = LINE_ROLE[r.index] ?? '';
    parts.push(
      `转机主要落在「${energy.modern}」这一层（${r.label}动${role ? ` · ${role}` : ''}）。` +
        `不是全局一起翻盘，而是这一层在松动；过程可能反复，宜小步核对。`,
    );
  } else {
    const layers = [...new Set(moving.map((r) => LIUQIN_ENERGY[r.liuqin].modern))];
    parts.push(
      `不止一处在动：${moving.map((r) => r.label).join('、')}分别牵动「${layers.join('」与「')}」。` +
        `过程未必一步到位，可能有拉扯或来回——把这些节点合起来看。`,
    );
  }

  return {
    title: '💡 你的现状与转折点',
    body: parts.join('\n\n'),
  };
}

function buildDirection(cast: CastResult, topic: string): BriefingBlock {
  if (cast.changed) {
    const toKw = cast.changed.keywords.slice(0, 2).join('、') || cast.changed.name;
    return {
      title: '🎯 你努力的方向',
      body:
        `事情正朝着「${toKw}」的方向发展（变卦：${cast.changed.fullName}）。${cast.changed.gist}\n\n` +
        `你需要先明确自己的立场和目标（把「${topic}」相关的内外对齐），再朝这个方向迈出一小步做验证，而不是一上来就梭哈。变卦是方向感，不是死刑判决。`,
    };
  }
  return {
    title: '🎯 你努力的方向',
    body:
      `无动则无变——时间轴仍停在本卦「${cast.primary.fullName}」。` +
      `关键不在赌突变，而在把「${topic}」相关边界与准备做实，再谈加码。`,
  };
}

function buildActionList(
  cast: CastResult,
  topic: string,
  yong: ReturnType<typeof buildYongFocusPack>,
  loop: ReturnType<typeof buildFinalLoop>,
): BriefingBlock {
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const to = cast.changed?.keywords[0];

  const mindset = cast.changed
    ? `支持你把「${from}」走完，也要有「熬过拉扯期」的心理准备——过程常是先${from}后${to}，中间的拉扯正常。`
    : `少要非黑即白的一句判词；把注意力放在「${topic}」可核对的事实上。`;

  const actionBit =
    loop.actions.find((a) => /策略|行动|务实/.test(a.label))?.text ||
    loop.action ||
    '先保证底线不断档，再谈加码。';

  const cautionParts: string[] = [];
  if (yong.primaryRow?.liushen === '朱雀' || cast.changingIndexes.length) {
    cautionParts.push(
      '面试/沟通时多留心眼，把口头承诺与书面条款核对清楚（朱雀偏信息与文书），避免信息不对等踩坑。',
    );
  }
  if (yong.primaryRow && yong.primaryRow.liushen !== '朱雀') {
    const god = LIUSHEN_PLAIN[yong.primaryRow.liushen];
    if (god) {
      cautionParts.push(
        `核心聚焦旁见「${yong.primaryRow.liushen}」——${god.replace(/。$/, '')}。`,
      );
    }
  }
  if (cautionParts.length === 0) {
    cautionParts.push('口舌、杂音、拉扯出现时，准备好再沟通，比吓停更有用。');
  }

  const body =
    `1. 心态上：${mindset}\n\n` +
    `2. 行动上：${actionBit}\n\n` +
    `3. 注意点：${cautionParts.join(' ')}`;

  const quote =
    yong.actionText?.trim() ||
    '先把能核对的事实（条件、时间、对方态度）写清，再决定是否加码。';

  return {
    title: '📝 给你的行动清单',
    body,
    quote,
  };
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
        ? `本卦主偏「${cast.primary.keywords[0]}」→ 变卦偏「${cast.changed.keywords[0]}」。宜先把内外对齐，再朝变卦方向做一小步可验证的行动。`
        : `卦象偏「${cast.primary.keywords.slice(0, 2).join('、')}」。宜先稳边界与准备，少做大动作。`),
  );

  return {
    title: '📜 古籍旁注',
    body:
      `${classicQuiet}` +
      (corpus?.judgment ? `\n卦辞摘录：「${corpus.judgment}」` : '') +
      `\n\n白话落点：${modern}` +
      (chipLine ? `\n\n${chipLine}` : '') +
      `\n\n卦象是动态参考，不是死刑判决。`,
  };
}

/** 生成结合所问的解答（小标题段落结构） */
export function buildQuestionBriefing(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): QuestionBriefing {
  const topicLabel = yongTopicLabel(question);
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const shi = dressed.rows.find((r) => r.isShi);
  const moving = dressed.rows.filter((r) => r.changing);
  const yong = buildYongFocusPack(cast, question, castAt);
  const loop = buildFinalLoop(cast, question, castAt);
  const pattern = buildPatternSummary(cast, question, castAt);

  const q = question.trim();
  const questionLead = q
    ? `结合你问的问题「${q}」而言：`
    : `结合你关心的「${topicLabel}」而言：`;

  const layer3 = buildActionList(cast, topicLabel, yong, loop);

  return {
    topicLabel,
    questionLead,
    layer1: buildStatusTurning(cast, shi, moving),
    layer2: buildDirection(cast, topicLabel),
    layer3,
    layer4: buildClassicNote(cast, question, castAt, pattern),
    /** 兼容旧字段：金句已并入行动清单的 quote */
    strategy: {
      title: '📌 记住这一句',
      body: layer3.quote ?? '',
      quote: layer3.quote,
    },
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

export function renderQuestionBriefingHtml(b: QuestionBriefing): string {
  return `
    <article class="ly-question-briefing" data-question-briefing>
      <p class="ly-briefing-kicker">${escapeHtml(b.questionLead)}</p>
      <p class="ly-briefing-topic">本题焦点 · ${escapeHtml(b.topicLabel)}</p>
      ${renderBlockHtml(b.layer1)}
      ${renderBlockHtml(b.layer2)}
      ${renderBlockHtml(b.layer3, ' is-actions')}
      ${renderBlockHtml(b.layer4)}
    </article>
  `;
}

export function renderQuestionBriefingForCast(
  cast: CastResult,
  question = '',
  castAt = new Date(),
): string {
  return renderQuestionBriefingHtml(buildQuestionBriefing(cast, question, castAt));
}
