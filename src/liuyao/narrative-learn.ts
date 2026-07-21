import type { CastResult } from './engine.ts';
import { buildStrategyPack } from './strategy.ts';
import { formatClauseHtml } from './format-clause.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import {
  buildReadingFacts,
  type ReadingFacts,
} from './reading-facts.ts';
import {
  buildCoreParseBlocks,
  buildEnergyFocus,
  buildYaoAskCard,
  buildInternalInference,
  formatLiuqinShort,
  renderCoreParseHtml,
  renderEnergyFocusHtml,
  renderInternalInferenceHtml,
  renderQinDictHtml,
  renderYongShenTeachHtml,
  renderYaoAskCardHtml,
} from './energy-lens.ts';
import { dressHexagram, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildShengKeMap } from './shengke-map.ts';

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

function mapYongBite(facts: ReadingFacts): string {
  if (!facts.question.trim()) {
    return `你还没有写具体问题。若这是问工作，用神常看「${formatLiuqinShort('官鬼')}」；问感情常看「${formatLiuqinShort('妻财')} / ${formatLiuqinShort('官鬼')}」。写下问题后，映射会更准。`;
  }
  if (facts.yong.matchedLabel) {
    const moving = facts.changing.labels.includes(facts.yong.matchedLabel);
    return moving
      ? `用神落在${facts.yong.matchedLabel}，且这一爻在动——你问的事正在「变心」，优先盯这一层。`
      : `用神倾向落在${facts.yong.matchedLabel}；目前动爻没有直接咬在用神上，说明眼前未必有直接突破口，先调整注意力（减干扰、借助力），或只做小验证。`;
  }
  return `本题用神倾向「${facts.yong.name}」，本卦尚未直接落到对应模块——先把问题写具体，或结合世应与动爻看。`;
}

function dressedRows(cast: CastResult, castAt = new Date()): YaoDress[] {
  return dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
}

function highlightIndexes(facts: ReadingFacts): number[] {
  return facts.yong.matchedLine !== undefined ? [facts.yong.matchedLine] : [];
}

function energyFocusFromCast(cast: CastResult, castAt = new Date()): string {
  const rows = dressedRows(cast, castAt);
  const changingQin = rows.filter((r) => r.changing).map((r) => r.liuqin);
  const items = buildEnergyFocus({
    changingQin,
    changedQin: changingQin[0] ?? null,
  });
  return renderEnergyFocusHtml(items);
}

function inferenceFromCast(cast: CastResult, question: string, castAt = new Date()): string {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const map = buildShengKeMap(cast, dressed, question);
  const domain = buildReadingFacts(cast, question, castAt).domain;
  const inf = buildInternalInference({
    domain,
    yongRow: map.nodes.find((n) => n.role === '用神')?.row,
    yongQin: map.yongQin,
    yuanRow: map.nodes.find((n) => n.role === '原神')?.row,
    jiRow: map.nodes.find((n) => n.role === '忌神')?.row,
  });
  return `${renderInternalInferenceHtml(inf)}${renderQinDictHtml()}`;
}

export function renderCausalReadingHtml(
  facts: ReadingFacts,
  cast: CastResult,
  castAt = new Date(),
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
  const rows = dressedRows(cast, castAt);
  const hi = highlightIndexes(facts);
  const yongRow = hi.length ? rows.find((r) => r.index === hi[0]) : undefined;

  return `
    <section class="ly-result-panel ly-causal-chain">
      <span class="ly-layer-num">一</span>
      <h3>核心锚点</h3>
      <p class="ly-causal-anchor">${escapeHtml(causal.anchor)}</p>
      ${renderYongShenTeachHtml({
        domain: facts.domain,
        yongLabel: facts.yong.name,
        yongWhy: facts.yong.why,
        row: yongRow,
        highlightIndexes: hi,
      })}
    </section>
    <section class="ly-result-panel ly-causal-chain">
      <span class="ly-layer-num">二</span>
      <h3>推导过程</h3>
      ${becauseHtml}
      ${energyFocusFromCast(cast, castAt)}
      ${inferenceFromCast(cast, facts.question, castAt)}
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

export function renderCoreMappedHtml(
  facts: ReadingFacts,
  cast: CastResult,
  castAt = new Date(),
): string {
  const hi = highlightIndexes(facts);
  const rows = dressedRows(cast, castAt);
  const blocks = buildCoreParseBlocks(rows, {
    domain: facts.domain,
    shiYingTip: facts.shiYingRel.tip,
  });
  return `
    <p class="ly-layer-guide">生活翻译在前；括号里的「注」是传统标记，方便你对照进阶排盘。点爻旁 <strong>?</strong> 可看单爻能量解析。</p>
    <div class="ly-guide-hex" data-ask-hex>
      ${renderHexagramSvg({
        lines: cast.primaryLines,
        shiLine: cast.shiLine,
        yingLine: cast.yingLine,
        changingIndexes: cast.changingIndexes,
        emphasizeShiYing: true,
        showTrigramLabels: true,
        showAskButtons: true,
        highlightIndexes: hi,
      })}
      <div class="ly-yao-ask-slot" data-ask-slot hidden></div>
    </div>
    ${renderCoreParseHtml(blocks)}
    <article class="ly-core-yong ly-core-yong-inline">
      <h4>用神 · ${escapeHtml(facts.yong.name)}</h4>
      <p>${escapeHtml(mapYongBite(facts))}</p>
      <p class="ly-guide-tip">${escapeHtml(facts.yong.tip)}</p>
    </article>
  `;
}

/** 绑定学习模式点爻问号 */
export function bindYaoAskButtons(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  castAt = new Date(),
): void {
  const rows = dressedRows(cast, castAt);
  const domain = buildReadingFacts(cast, question, castAt).domain;
  root.querySelectorAll<SVGGElement>('[data-ask-line]').forEach((g) => {
    const open = () => {
      const idx = Number(g.getAttribute('data-ask-line'));
      const row = rows.find((r) => r.index === idx);
      if (!row) return;
      const host =
        g.closest<HTMLElement>('[data-ask-hex]') ??
        root.querySelector<HTMLElement>('[data-ask-hex]') ??
        root;
      let slot = host.querySelector<HTMLElement>('[data-ask-slot]');
      if (!slot) {
        slot = document.createElement('div');
        slot.className = 'ly-yao-ask-slot';
        slot.dataset.askSlot = '';
        host.appendChild(slot);
      }
      const card = buildYaoAskCard(row, { domain });
      slot.hidden = false;
      slot.innerHTML = renderYaoAskCardHtml(card);
      slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    g.style.cursor = 'pointer';
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      open();
    });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
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
export function renderLearnReadingTab(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  return renderCausalReadingHtml(facts, cast, castAt);
}

export function renderLearnCorePanel(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  return renderCoreMappedHtml(facts, cast, castAt);
}
