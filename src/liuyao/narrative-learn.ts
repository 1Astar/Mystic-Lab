import type { CastResult } from './engine.ts';
import { buildStrategyPack } from './strategy.ts';
import { formatClauseHtml } from './format-clause.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import {
  buildReadingFacts,
  type ReadingFacts,
} from './reading-facts.ts';

export type CausalReading = {
  anchor: string;
  because: string[];
  conclusion: string;
  actionLead: string;
};

function sceneLine(facts: ReadingFacts): string {
  if (facts.domain === 'love') return facts.sceneLove;
  if (facts.domain === 'career') return facts.sceneCareer;
  return `${facts.sceneCareer} ${facts.sceneLove}`;
}

function questionHint(facts: ReadingFacts): string {
  const q = facts.question.trim();
  if (q) return `因为你问的是「${q}」`;
  return '因为你还没写下具体问题，先按卦象本身来看';
}

/** 学习模式：锚点 → 因为… → 所以… */
export function buildCausalReading(facts: ReadingFacts): CausalReading {
  const because: string[] = [];

  because.push(
    `${questionHint(facts)}，卦象上下是「${facts.lowerNature}」与「${facts.upperNature}」（${facts.primary.fullName}）。${sceneLine(facts)}`,
  );

  if (facts.changing.labels.length === 0) {
    because.push(
      `因为本卦没有动爻，格局先停在「${facts.primary.fullName}」——先把当下结构看清，比空想结局更有用。`,
    );
  } else {
    const next = facts.changed
      ? `把「${facts.primary.fullName}」推成「${facts.changed.fullName}」`
      : '推动变化';
    because.push(
      `因为第${facts.changing.labels.join('、第')}动了（${facts.changing.labels.length} 个动爻），${next}。这代表僵局或旧节奏正在松动，事情从「${facts.primary.keywords[0]}」滑向「${facts.changed?.keywords[0] ?? '新方向'}」。`,
    );
  }

  because.push(
    `因为世在${facts.shi.label}、应在${facts.ying.label}，世应${facts.shiYingRel.rel}（${facts.shiYingRel.verdict}）——${facts.shiYingRel.tip}`,
  );

  const conclusion = facts.changed
    ? `所以你的策略不是硬冲到底，也不是直接放弃，而是顺着「${facts.changed.keywords[0]}」做可验证的一小步，同时守住「${facts.themeWord}」这条主线。`
    : `所以你的策略是先按兵不动、把「${facts.themeWord}」相关边界对齐，等结构更清楚再推。`;

  const actionLead = facts.changed
    ? `朝「${facts.changed.keywords[0]}」选一个最小动作验证外界是否配合。`
    : `围绕「${facts.themeWord}」列出本周可验证的下一步与边界。`;

  return {
    anchor: `你今天的问题核心在于「${facts.themeWord}」。`,
    because,
    conclusion,
    actionLead,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mapShiLife(facts: ReadingFacts): string {
  const role = facts.shi.role;
  if (facts.shi.line >= 5) {
    return `上爻/五爻一带偏「${role}」——这段时间你容易触顶、遇到瓶颈，或心里很想停下来喘口气。`;
  }
  if (facts.shi.line === 1) {
    return `初爻偏「${role}」——你更像站在事情的起点，能动的是地基与第一步。`;
  }
  if (facts.shi.line === 3) {
    return `三爻偏「${role}」——你正好卡在不上不下的关口，进退都需要额外用力。`;
  }
  return `这一爻偏「${role}」——你的立场与能动部分，主要落在这一层。`;
}

function mapYingLife(facts: ReadingFacts): string {
  const role = facts.ying.role;
  if (facts.ying.line === 3) {
    return `三爻是下卦的顶，偏「${role}」——你面对的局势/对方，刚好卡在尴尬的过渡位。`;
  }
  if (facts.ying.line >= 5) {
    return `偏「${role}」——外界的压力或结果感更强，像站在收束端等你回应。`;
  }
  if (facts.ying.line === 1) {
    return `偏「${role}」——外界还在基层酝酿，未必已经定局。`;
  }
  return `偏「${role}」——对方/岗位/环境的主要作用点在这一层。`;
}

function mapYongBite(facts: ReadingFacts): string {
  if (!facts.question.trim()) {
    return '你还没有写具体问题。若这是问工作，用神常看「官鬼爻」；问感情常看「妻财/官鬼」。写下问题后，映射会更准。';
  }
  if (facts.yong.matchedLabel) {
    const moving = facts.changing.labels.includes(facts.yong.matchedLabel);
    return moving
      ? `用神落在${facts.yong.matchedLabel}，且这一爻在动——你问的事正在「变心」，优先盯这一层。`
      : `用神倾向落在${facts.yong.matchedLabel}；目前动爻没有直接咬在用神上，说明眼前未必有直接突破口，先借原神/减忌神，或只做小验证。`;
  }
  return `本题用神倾向「${facts.yong.name}」，本卦尚未直接落到对应六亲爻——先把问题写具体，或结合世应与动爻看。`;
}

export function renderCausalReadingHtml(
  facts: ReadingFacts,
  cast: CastResult,
): string {
  const causal = buildCausalReading(facts);
  const pack = buildStrategyPack(cast, facts.domain, facts.question);
  const becauseHtml = causal.because
    .map((b) => `<p class="ly-causal-because">${formatClauseHtml(b)}</p>`)
    .join('');
  const actions = pack.items
    .map(
      (it) =>
        `<li><strong>${escapeHtml(it.label)}</strong><span>${formatClauseHtml(it.text)}</span></li>`,
    )
    .join('');

  return `
    <section class="ly-result-panel ly-causal-chain">
      <span class="ly-layer-num">一</span>
      <h3>核心锚点</h3>
      <p class="ly-causal-anchor">${escapeHtml(causal.anchor)}</p>
    </section>
    <section class="ly-result-panel ly-causal-chain">
      <span class="ly-layer-num">二</span>
      <h3>推导过程</h3>
      ${becauseHtml}
    </section>
    <section class="ly-result-panel ly-causal-chain">
      <span class="ly-layer-num">三</span>
      <h3>推导结论</h3>
      <p class="ly-causal-so">${formatClauseHtml(causal.conclusion)}</p>
      <p class="ly-guide-tip">${escapeHtml(causal.actionLead)}</p>
      <h4 class="ly-strategy-title">行动建议</h4>
      <ul class="ly-strategy-list">${actions}</ul>
    </section>
  `;
}

export function renderCoreMappedHtml(facts: ReadingFacts, cast: CastResult): string {
  return `
    <p class="ly-layer-guide">先记住锚：<strong>世＝你</strong>，<strong>应＝对方或环境</strong>；用神＝你问的事在卦里的代表。下面把它们映射到这一卦。</p>
    <div class="ly-guide-hex">${renderHexagramSvg({
      lines: cast.primaryLines,
      shiLine: cast.shiLine,
      yingLine: cast.yingLine,
      changingIndexes: cast.changingIndexes,
      emphasizeShiYing: true,
      showTrigramLabels: true,
    })}</div>
    <div class="ly-core-cards ly-core-mapped">
      <article>
        <h4>世 · 你</h4>
        <p class="ly-core-def">世＝你。世在${escapeHtml(facts.shi.label)}（${escapeHtml(facts.shi.role)}）。</p>
        <p>${escapeHtml(mapShiLife(facts))}</p>
      </article>
      <article>
        <h4>应 · 对方 / 环境</h4>
        <p class="ly-core-def">应＝对方或环境。应在${escapeHtml(facts.ying.label)}（${escapeHtml(facts.ying.role)}）。</p>
        <p>${escapeHtml(mapYingLife(facts))}</p>
      </article>
      <article class="ly-core-yong">
        <h4>用神 · ${escapeHtml(facts.yong.name)}</h4>
        <p class="ly-core-def">${escapeHtml(facts.yong.why)}</p>
        <p>${escapeHtml(mapYongBite(facts))}</p>
        <p class="ly-guide-tip">${escapeHtml(facts.yong.tip)}</p>
      </article>
    </div>
  `;
}

export function buildLearnFaq(
  facts: ReadingFacts,
): { q: string; a: string[] }[] {
  const moveHint =
    facts.changing.labels.length === 0
      ? '本卦无动爻：格局相对稳，先把世应与本卦场景看清。'
      : `动爻在${facts.changing.labels.join('、')}——这些位置正在「变心」，是当下最该盯的具体层面。`;

  const strategyQ = facts.changed
    ? `为什么这个卦告诉我要观察，而不是硬冲？`
    : `为什么这个卦更像先稳住，而不是大动作？`;

  const strategyA = facts.changed
    ? [
        `因为卦从「${facts.primary.fullName}」变为「${facts.changed.fullName}」。`,
        `这说明如果你能停半步观察，反而更容易看见「${facts.changed.keywords[0]}」那一侧的机会——不是让你躺平，而是「静观其变」后再动。`,
      ]
    : [
        `因为没有动爻推动变卦，时间轴停在「${facts.primary.fullName}」。`,
        `所以更适合先对齐「${facts.themeWord}」相关边界，等窗口再推，而不是硬造变化。`,
      ];

  return [
    {
      q: `为什么叫「${facts.primary.fullName}」？`,
      a: [
        `上卦为${facts.upperNature}（${facts.upperId}），下卦为${facts.lowerNature}（${facts.lowerId}）。`,
        facts.sceneBridge,
        sceneLine(facts),
      ],
    },
    {
      q: `动爻在哪？对我问的事有什么影响？`,
      a: [
        moveHint,
        facts.changed
          ? `变化指向变卦「${facts.changed.fullName}」：${facts.changed.gist}`
          : '无变卦时，不必硬找未来，先稳住当下。',
      ],
    },
    {
      q: `用神是什么？我该看哪一类爻？`,
      a: [facts.yong.why, `本题用神倾向：${facts.yong.name}。`, facts.yong.tip],
    },
    {
      q: strategyQ,
      a: strategyA,
    },
    {
      q: facts.question.trim()
        ? `如果「${facts.question.trim()}」不顺利，我还能做什么？`
        : '如果结果不理想，我还能做什么？',
      a: [
        '先对齐世应：哪些是我能改的，哪些是环境。',
        facts.changed
          ? `可朝变卦关键词「${facts.changed.keywords[0]}」做一小步验证，而不是一次梭哈。`
          : '无动则宜整理与等待窗口：把「下一步」写成一周可验证动作。',
      ],
    },
  ];
}

export function classicModernScene(facts: ReadingFacts, classicGloss: string): string {
  const q = facts.question.trim();
  const topic = q || '你在意的那件事';
  return `你现在感觉「${topic}」就在那里，却又像被「${facts.themeWord}」挡住。白话里说：${classicGloss} 这种时候先别急着硬推，越急越乱；可先按「${facts.changed?.keywords[0] ?? facts.themeWord}」的方向观察一小步。`;
}

/** 便捷：从 cast 直接渲染学习解读 Tab */
export function renderLearnReadingTab(cast: CastResult, question: string): string {
  const facts = buildReadingFacts(cast, question);
  return renderCausalReadingHtml(facts, cast);
}

export function renderLearnCorePanel(cast: CastResult, question: string): string {
  const facts = buildReadingFacts(cast, question);
  return renderCoreMappedHtml(facts, cast);
}
