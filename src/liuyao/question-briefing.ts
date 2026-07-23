/**
 * 结合所问的四层解答（模板：本变大方向 → 职场能量 → 行动建议 → 古籍对照 → 破局策略）
 */
import type { CastResult } from './engine.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { dressHexagram, LIUSHEN_PLAIN, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { LINE_ROLE } from './reading-facts.ts';
import { formatLiuqinShort, LIUQIN_ENERGY } from './energy-lens.ts';
import { buildYongFocusPack, yongTopicLabel } from './yong-focus.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { buildClassicCompendium } from './classic-compendium.ts';
import { buildFinalLoop } from './final-loop.ts';
import { buildPatternSummary } from './pattern-summary.ts';

export type BriefingBlock = {
  title: string;
  body: string;
};

export type QuestionBriefing = {
  topicLabel: string;
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

function kwLine(hex: { keywords: string[]; name: string; gist: string }): string {
  const k = hex.keywords.slice(0, 3).join('、') || hex.name;
  return `${k}`;
}

function qSnippet(q: string, max = 48): string {
  const t = q.trim().replace(/\s+/g, ' ');
  if (!t) return '你问的事';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function buildLayer1(cast: CastResult, question: string): BriefingBlock {
  const q = qSnippet(question);
  const from = kwLine(cast.primary);
  const primaryMap = `本卦【${cast.primary.fullName}】：代表「${from}」。\n\n对应你的问题：就「${q}」而言，当下主调偏「${cast.primary.keywords[0] ?? cast.primary.name}」——${cast.primary.gist}`;

  let changedMap = '';
  let metaphor: string;
  if (cast.changed) {
    const to = kwLine(cast.changed);
    changedMap = `\n\n变卦【${cast.changed.fullName}】：代表「${to}」。\n\n对应你的问题：若你把眼前这一步走稳，走向更像「${cast.changed.keywords[0] ?? cast.changed.name}」——${cast.changed.gist}`;
    metaphor = `\n\n【核心隐喻】：你需要经历一个「${cast.primary.keywords[0] ?? '决断'}」的过程，处理好过渡与拉扯，才能走向「${cast.changed.keywords[0] ?? '下一幕'}」的阶段。`;
  } else {
    changedMap =
      '\n\n变卦：无动则无变——时间轴停在本卦。先把当下结构看清，比空想结局更有用。';
    metaphor = `\n\n【核心隐喻】：局面相对稳，关键不在「突变」，而在把「${cast.primary.keywords[0] ?? '当下'}」相关边界与准备做实。`;
  }

  return {
    title: '第一层：核心大方向（本卦 → 变卦）',
    body: `${primaryMap}${changedMap}${metaphor}`,
  };
}

function buildMovingLineReason(r: YaoDress): string {
  const energy = LIUQIN_ENERGY[r.liuqin];
  const role = LINE_ROLE[r.index] ?? '';
  const god = LIUSHEN_PLAIN[r.liushen] ?? '';
  const roleHint = role ? `（爻位偏「${role}」）` : '';
  return (
    `· ${r.label}发动：落在「${energy.modern}」${roleHint}；六神「${r.liushen}」偏「${god.replace(/。$/, '')}」。\n` +
    `  → 所以：这一层正在松动——和「${energy.modern}」相关的事，过程可能带上「${r.liushen}」的气味，宜当关键节点盯住，而不是当背景噪声。`
  );
}

function buildMovingSubtext(moving: YaoDress[]): string {
  if (moving.length === 1) {
    const r = moving[0]!;
    const energy = LIUQIN_ENERGY[r.liuqin];
    return (
      `变化主要落在「${energy.modern}」这一层（${r.label}动）。` +
      `不是全局一起翻盘，而是这一层在松动；过程可能反复，宜小步核对，少一次赌赢。`
    );
  }
  const layers = moving.map((r) => LIUQIN_ENERGY[r.liuqin].modern);
  const unique = [...new Set(layers)];
  return (
    `不止一处在动：${moving.map((r) => r.label).join('、')}分别牵动「${unique.join('」与「')}」。` +
    `所以过程未必一步到位，可能有拉扯或来回——要把这些动爻当成「正在松动的节点」合起来看，而不是只看一句总判词。`
  );
}

function buildLayer2(
  cast: CastResult,
  _question: string,
  _castAt: Date,
  shi: YaoDress | undefined,
  moving: YaoDress[],
  yong: ReturnType<typeof buildYongFocusPack>,
): BriefingBlock {
  const topic = yong.topicLabel;
  const parts: string[] = [];

  if (shi) {
    const energy = LIUQIN_ENERGY[shi.liuqin];
    parts.push(
      `1. 你的现状（世爻：${shi.label} · ${formatLiuqinShort(shi.liuqin)}）\n\n` +
        `潜台词：你现在的站位落在「${energy.modern}」——${energy.blurb}\n\n` +
        `依据：世爻是「你」在卦里的落点；本卦世在${shi.label}、六亲为${formatLiuqinShort(shi.liuqin)}，所以用「${energy.modern}」来描述你当下站位，而不是空泛心情。\n\n` +
        `建议：你很在意「${topic}」相关的掌控感与外部反馈；先承认压力/期待是真实的，再用一小步可验证的动作去对齐，而不是一次赌赢。`,
    );
  } else {
    parts.push('1. 你的现状（世爻）\n\n本卦世爻信息不足，先回看装卦表确认「你」落在哪一爻。');
  }

  if (moving.length) {
    const labels = moving.map((r) => r.label).join('、');
    const reasons = moving.map(buildMovingLineReason).join('\n');
    parts.push(
      `2. 你的下一步（动爻：${labels}）\n\n` +
        `潜台词：${buildMovingSubtext(moving)}\n\n` +
        `依据（动爻怎么推出上面这句话）：\n${reasons}\n\n` +
        `合起来怎么用：先把上述动爻当「正在松动的节点」盯住，少把全部希望押在一次结果上。`,
    );
  } else {
    parts.push(
      '2. 你的下一步（动爻）\n\n' +
        '潜台词：本卦无动爻——格局相对稳。关键不在突变，而在把世应与准备做实，再谈加码。\n\n' +
        '依据：六爻皆静，没有「哪一层正在松动」的发动信号；所以策略偏稳住与核对，而不是赌突变。',
    );
  }

  if (cast.changed) {
    parts.push(
      `3. 你的资源与底气（变卦 · ${cast.changed.fullName}）\n\n` +
        `潜台词：最终走向「${cast.changed.keywords.slice(0, 2).join('、') || cast.changed.name}」——${cast.changed.gist}\n\n` +
        `依据：动爻变出「${cast.changed.fullName}」，关键词偏「${cast.changed.keywords.slice(0, 3).join('、') || cast.changed.name}」；变卦是方向感，不是死刑判决。\n\n` +
        `这是偏积极的方向感：熬过眼前过渡与核实期，后面更可能摸到更稳的资源/位置。`,
    );
  }

  if (yong.primaryRow) {
    parts.push(
      `补充 · 核心聚焦（用神）\n${yong.statusText}\n${yong.translateText}`,
    );
  }

  return {
    title: `第二层：你当前和未来的「${topic}」能量状态`,
    body: parts.join('\n\n'),
  };
}

function buildLayer3(
  yong: ReturnType<typeof buildYongFocusPack>,
  loop: ReturnType<typeof buildFinalLoop>,
): BriefingBlock {
  const systemTip = yong.actionText || loop.action;
  const howto =
    loop.actions
      .slice(0, 3)
      .map((a) => `· ${a.label}：${a.text}`)
      .join('\n') || `· ${loop.action}`;

  return {
    title: '第三层：行动建议（结合你的问题）',
    body: `💡 系统给的精准干预：\n${systemTip}\n\n翻译成人话：先别把目标一次拉满；把能核对的事实（条件、时间、对方态度、现金流/底线）列清，再决定是否加码或接受。\n\n具体做法：\n${howto}`,
  };
}

function buildLayer4(
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
      ? '传统断语提醒：卦静无动，宜观旺衰与世应，勿以一词定终身。'
      : `传统断语提醒：动在${cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、')}，吉凶须追变爻生克，勿见字面即断。`;

  const chipLine = pattern.chips
    .slice(0, 3)
    .map((c) => `· ${c.label}：${c.tip}`)
    .join('\n');

  const modern =
    decision ||
    (cast.changed
      ? `本卦主偏「${cast.primary.keywords[0]}」→ 变卦偏「${cast.changed.keywords[0]}」。建议：先把内外对齐，再朝变卦方向做一小步可验证的行动。`
      : `卦象偏「${cast.primary.keywords.slice(0, 2).join('、')}」。建议：先稳边界与准备，少做大动作。`);

  return {
    title: '第四层：古籍与现代结论对照',
    body: `古籍侧：\n${classicQuiet}${
      corpus?.judgment ? `\n卦辞摘录：「${corpus.judgment}」` : ''
    }\n\n给你的定心丸：卦象是动态参考，不是死刑判决。口舌、杂音、拉扯出现时，准备好再沟通，比吓停更有用。\n\n格局摘要：\n${chipLine || '· 先看世应与动爻。'}\n\n现代结论：\n${modern}`,
  };
}

function buildStrategy(
  cast: CastResult,
  question: string,
  topic: string,
  yong: ReturnType<typeof buildYongFocusPack>,
): BriefingBlock {
  const bullets: string[] = [];
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const to = cast.changed?.keywords[0];

  bullets.push(
    `肯定大方向：就「${qSnippet(question, 28)}」而言，本卦「${cast.primary.fullName}」偏「${from}」——该迈的那一步，宜公开、明确，忌拖泥带水。`,
  );

  if (cast.changed && to) {
    bullets.push(
      `过渡期务实：变卦指向「${to}」，但中间可能有拉扯。先保证底线不断档（现金流 / 情绪 / 关系边界），再谈加码。`,
    );
  } else {
    bullets.push('先稳住当下：无动则无变——把能核对的一小步做实，再观后效。');
  }

  if (yong.primaryRow?.liushen === '朱雀' || cast.changingIndexes.length) {
    bullets.push(
      '提防「小雷」：面试/沟通时多留心眼，把口头承诺与书面条款核对清楚，避免信息不对等踩坑。',
    );
  }

  bullets.push(
    cast.changed
      ? `心态：过程常是「先${from}后${to}」，中间的拉扯正常。不急不躁，把可验证的一步做完，再谈下一幕。`
      : `心态：少要非黑即白的一句判词；把注意力放在「${topic}」可核对的事实上。`,
  );

  return {
    title: '💡 总结你当下的破局策略',
    body: bullets.map((b, i) => `${i + 1}. ${b}`).join('\n\n'),
  };
}

/** 按四层模板生成结合所问的解答 */
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

  return {
    topicLabel,
    layer1: buildLayer1(cast, question),
    layer2: buildLayer2(cast, question, castAt, shi, moving, yong),
    layer3: buildLayer3(yong, loop),
    layer4: buildLayer4(cast, question, castAt, pattern),
    strategy: buildStrategy(cast, question, topicLabel, yong),
  };
}

export function renderQuestionBriefingHtml(b: QuestionBriefing): string {
  const layers = [b.layer1, b.layer2, b.layer3, b.layer4, b.strategy]
    .map(
      (block, i) => `
      <section class="ly-briefing-layer${i === 4 ? ' is-strategy' : ''}" data-briefing-layer="${i + 1}">
        <h4 class="ly-briefing-title">${escapeHtml(block.title)}</h4>
        <div class="ly-briefing-body">${nlToBr(block.body)}</div>
      </section>`,
    )
    .join('');

  return `
    <article class="ly-question-briefing" data-question-briefing>
      <p class="ly-briefing-kicker">结合你的问题 · ${escapeHtml(b.topicLabel)}</p>
      <p class="ly-guide-tip">按「本变大方向 → 能量状态 → 行动 → 古籍对照 → 破局策略」读；卦象是参考，不是判决。</p>
      ${layers}
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
