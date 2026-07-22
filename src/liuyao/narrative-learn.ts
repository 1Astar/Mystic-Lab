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
  formatLiuqinShort,
  renderCoreParseHtml,
} from './energy-lens.ts';
import { dressHexagram, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { renderLearnChaptersBody } from './learn-story.ts';
import { composeScene, renderSceneXiangHtml } from './scene-map.ts';
import { upperLowerFromLines } from './hexagrams.ts';
import { showYaoInlineTip } from './yao-inline-tip.ts';

export type CausalStep = {
  /** 步骤标签，如「卦象」 */
  step: string;
  /** 一行能读完的结论 */
  short: string;
  /** 点开才看的补充 */
  detail: string;
};

export type CausalReading = {
  anchor: string;
  /** 用神一行提示 */
  yongBite: string;
  because: CausalStep[];
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

function mapYongBite(facts: ReadingFacts): string {
  if (!facts.question.trim()) {
    return `先写下具体问题。工作常盯「${formatLiuqinShort('官鬼')}」；感情常盯「${formatLiuqinShort('妻财')}」。`;
  }
  if (facts.yong.matchedLabel) {
    const moving = facts.changing.labels.includes(facts.yong.matchedLabel);
    return moving
      ? `盯${facts.yong.matchedLabel}（${facts.yong.name}）——它在动，优先看这一层。`
      : `盯${facts.yong.matchedLabel}（${facts.yong.name}）；动爻没直接咬上，先减干扰、做小验证。`;
  }
  return `本题用神倾向「${facts.yong.name}」，尚未落到具体爻——先写清问题，或看世应与动爻。`;
}

/** 学习模式：锚点 → 三步短卡 → 所以… */
export function buildCausalReading(facts: ReadingFacts): CausalReading {
  const because: CausalStep[] = [];

  because.push({
    step: '卦象',
    short: `下${facts.lowerNature}上${facts.upperNature} · ${facts.primary.name}`,
    detail: facts.sceneBridge,
  });

  if (facts.changing.labels.length === 0) {
    because.push({
      step: '动爻',
      short: '无动爻 · 先稳住当下结构',
      detail: `格局停在「${facts.primary.fullName}」——先把结构看清，比空想结局更有用。`,
    });
  } else {
    const toName = facts.changed?.name ?? '新方向';
    because.push({
      step: '动爻',
      short: `${facts.changing.labels.join('、')}动 → ${toName}`,
      detail: `从「${facts.primary.keywords[0]}」滑向「${facts.changed?.keywords[0] ?? '新方向'}」。僵局或旧节奏正在松动。`,
    });
  }

  because.push({
    step: '世应',
    short: `世${facts.shi.label} · 应${facts.ying.label} · ${facts.shiYingRel.rel}`,
    detail: `${facts.shiYingRel.verdict}——${facts.shiYingRel.tip}`,
  });

  const conclusion = facts.changed
    ? `顺着「${facts.changed.keywords[0]}」做可验证的一小步，同时守住「${facts.themeWord}」。`
    : `先按兵不动，把「${facts.themeWord}」相关边界对齐，等结构更清楚再推。`;

  const actionLead = facts.changed
    ? `朝「${facts.changed.keywords[0]}」选一个最小动作验证。`
    : `围绕「${facts.themeWord}」列出本周可验证的下一步。`;

  return {
    anchor: facts.themeWord,
    yongBite: mapYongBite(facts),
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

function dressedRows(cast: CastResult, castAt = new Date()): YaoDress[] {
  return dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
}

function highlightIndexes(facts: ReadingFacts): number[] {
  return facts.yong.matchedLine !== undefined ? [facts.yong.matchedLine] : [];
}

/** 此刻解读：短卡教学，细节点开，深度推演另放 */
export function renderCausalReadingHtml(
  facts: ReadingFacts,
  cast: CastResult,
  _castAt = new Date(),
  opts?: { oneLiner?: string },
): string {
  const causal = buildCausalReading(facts);
  const oneLiner = opts?.oneLiner?.trim() || causal.anchor;
  const pack = buildStrategyPack(cast, facts.domain, facts.question);
  const first = pack.items[0];
  const rest = pack.items.slice(1);

  const stepsHtml = causal.because
    .map(
      (s, i) => `
      <details class="ly-lesson-step">
        <summary>
          <span class="ly-lesson-step-n">${i + 1}</span>
          <span class="ly-lesson-step-label">${escapeHtml(s.step)}</span>
          <span class="ly-lesson-step-short">${escapeHtml(s.short)}</span>
        </summary>
        <p class="ly-lesson-step-detail">${formatClauseHtml(s.detail)}</p>
      </details>`,
    )
    .join('');

  const restHtml = rest.length
    ? `<details class="ly-lesson-more">
        <summary>还有 ${rest.length} 条建议</summary>
        <ul class="ly-strategy-list">${rest
          .map(
            (it) =>
              `<li><strong>${escapeHtml(it.label)}</strong><span>${formatClauseHtml(it.text)}</span></li>`,
          )
          .join('')}</ul>
      </details>`
    : '';

  return `
    <section class="ly-lesson ly-result-panel">
      <p class="ly-lesson-kicker">一句话</p>
      <h3 class="ly-lesson-theme">${escapeHtml(oneLiner)}</h3>
      <p class="ly-lesson-yong">${escapeHtml(causal.yongBite)}</p>
    </section>
    <section class="ly-lesson ly-result-panel">
      <p class="ly-lesson-kicker">三步看懂 · 点开看详解</p>
      <div class="ly-lesson-steps">${stepsHtml}</div>
    </section>
    <section class="ly-lesson ly-result-panel ly-lesson-so">
      <p class="ly-lesson-kicker">所以</p>
      <p class="ly-lesson-conclusion">${escapeHtml(causal.conclusion)}</p>
      ${
        first
          ? `<div class="ly-lesson-action">
        <span class="ly-lesson-action-label">${escapeHtml(first.label)}</span>
        <p>${formatClauseHtml(first.text)}</p>
        <p class="ly-guide-tip">${escapeHtml(causal.actionLead)}</p>
      </div>`
          : `<p class="ly-guide-tip">${escapeHtml(causal.actionLead)}</p>`
      }
      ${restHtml}
      <p class="ly-lesson-deep-hint">想边学边推演用神/元忌、点爻与笔记 → 切到「五步学习」。</p>
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
    <p class="ly-layer-guide">点爻旁 <strong>?</strong> 看单爻；下面三块各一句主旨，传统注折叠。</p>
    <div class="ly-guide-hex ly-hex-inline-host" data-ask-hex>
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
    </div>
    ${renderCoreParseHtml(blocks)}
  `;
}

/** 绑定学习模式点爻：注解悬浮在该爻旁，并联动笔记侧栏 */
export function bindYaoAskButtons(
  root: HTMLElement,
  cast: CastResult,
  question: string,
  castAt = new Date(),
): void {
  const rows = dressedRows(cast, castAt);
  const domain = buildReadingFacts(cast, question, castAt).domain;
  root.querySelectorAll<SVGElement>('[data-ask-line]').forEach((g) => {
    if ((g as HTMLElement & { dataset: DOMStringMap }).dataset.askBound === '1') return;
    (g as HTMLElement).dataset.askBound = '1';
    const open = () => {
      const idx = Number(g.getAttribute('data-ask-line'));
      const row = rows.find((r) => r.index === idx);
      if (!row) return;
      const host =
        g.closest<HTMLElement>('[data-ask-hex]') ??
        g.closest<HTMLElement>('.ly-hex-inline-host') ??
        root.querySelector<HTMLElement>('[data-ask-hex]') ??
        root;
      const compact = Boolean(g.closest('.ly-hexagram-compact'));
      showYaoInlineTip(host, row, { compact, domain });
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

export type LearnFaqItem = {
  q: string;
  a: string[];
  bodyHtml?: string;
};

export function buildLearnFaq(facts: ReadingFacts): LearnFaqItem[] {
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

function escapeFaq(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFaqNameAnswerHtml(cast: CastResult, facts: ReadingFacts): string {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  return renderSceneXiangHtml(scene, {
    domain: facts.domain,
    showFormula: false,
  });
}

/** 边看边问：放在笔记 / 书籍注解区 */
export function renderLearnFaqHtml(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  const faq = buildLearnFaq(facts).map((item, i) => {
    const isNameQ = item.q.startsWith('为什么叫');
    const body = isNameQ
      ? renderFaqNameAnswerHtml(cast, facts)
      : item.a
          .map((p) =>
            p.includes('\n')
              ? `<div class="ly-faq-pre">${escapeFaq(p).replace(/\n/g, '<br>')}</div>`
              : `<p>${escapeFaq(p)}</p>`,
          )
          .join('');
    return `
    <details class="ly-faq-item"${i === 0 ? ' open' : ''}>
      <summary>${escapeFaq(item.q)}</summary>
      <div class="ly-faq-body">${body}</div>
    </details>`;
  }).join('');
  return `
    <section class="ly-deep-faq ly-faq-panel" data-learn-faq>
      <h4>边看边问</h4>
      <p class="ly-layer-guide">点开你此刻卡住的问题。</p>
      ${faq}
    </section>
  `;
}

export function classicModernScene(facts: ReadingFacts, classicGloss: string): string {
  const q = facts.question.trim();
  const topic = q || '你在意的那件事';
  return `你现在感觉「${topic}」就在那里，却又像被「${facts.themeWord}」挡住。白话里说：${classicGloss} 这种时候先别急着硬推，越急越乱；可先按「${facts.changed?.keywords[0] ?? facts.themeWord}」的方向观察一小步。`;
}

/** 便捷：学习主 Tab = 章2–4（章1在页顶仪式区） */
export function renderLearnReadingTab(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  return renderLearnChaptersBody(cast, question, castAt);
}

export function renderLearnCorePanel(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  return renderCoreMappedHtml(facts, cast, castAt);
}
