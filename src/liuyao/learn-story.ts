import type { CastResult } from './engine.ts';
import { upperLowerFromLines, yingLineOf } from './hexagrams.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate, renderCastTimePlaque } from './ganzhi.ts';
import { buildReadingFacts, LINE_ROLE, type ReadingFacts } from './reading-facts.ts';
import { LIUQIN_ENERGY } from './energy-lens.ts';
import { buildStrategyPack } from './strategy.ts';
import { formatClauseHtml } from './format-clause.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import { renderXiangVisual } from './xiang-visual.ts';
import { resolveClassicDossier } from './classic-folder.ts';
import { glossDaXiang } from './classic-gloss.ts';
import { buildFiveSteps } from './compose-teach.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function guaOneLiner(name: string, fullName: string, keywords: string[]): string {
  const kw = keywords.slice(0, 2).join('、') || '当下局面';
  const map: Record<string, string> = {
    比: '水在地上流淌，万物滋润。比，代表亲近、联合。',
    观: '风在地上吹过，俯瞰万物。观，代表观察、看透形势。',
    剥: '山附于地，该收的要收。剥，代表剥离、减负。',
    复: '一阳在底下回来。复，代表转机刚冒头。',
    屯: '云雷交加，万事开头难。屯，代表蓄力、起步。',
    蒙: '山下有泉，尚在启蒙。蒙，代表先学再动。',
  };
  return map[name] ?? `「${fullName}」主调偏「${kw}」——先抓住这几个词感受局面。`;
}

function conflictLine(facts: ReadingFacts, shiModern: string, yingModern: string): string {
  if (facts.shiYingRel.rel === '相克') {
    return `你的「${shiModern}」与外界的「${yingModern}」正在碰撞——需求与环境暂不匹配。`;
  }
  if (facts.shiYingRel.rel === '相生') {
    return `你的「${shiModern}」与外界的「${yingModern}」在互相拉扯又彼此滋养——宜借力，也别全交出去。`;
  }
  return `你的「${shiModern}」与外界的「${yingModern}」节奏接近——适合协同，也防一起原地打转。`;
}

function turningLine(facts: ReadingFacts): string {
  if (facts.changing.labels.length === 0) {
    return '本卦无动爻：关键不在突变，而在把世应看清、把节奏稳住。';
  }
  const roles = facts.changing.indexes.map((i) => LINE_ROLE[i]!).join('、');
  const to = facts.changed?.keywords[0] ?? '新方向';
  return `事情的变化点在于${facts.changing.labels.join('、')}（偏「${roles}」），局面正滑向「${to}」——你需要调整沟通或节奏，而不是硬冲。`;
}

function storyTriLines(facts: ReadingFacts): [string, string, string] {
  const conclusion = facts.changed
    ? `顺着「${facts.changed.keywords[0]}」做可验证的一小步，同时守住「${facts.themeWord}」。`
    : `先按兵不动，把「${facts.themeWord}」相关边界对齐，等结构更清楚再推。`;
  const a = facts.changed
    ? `你现在的核心矛盾是「想要「${facts.primary.keywords[0]}」，但走向在「${facts.changed.keywords[0]}」」。`
    : `你现在的核心矛盾是守住「${facts.themeWord}」，同时把内外边界对齐。`;
  const b =
    facts.changing.labels.length > 0
      ? `因为经历了动爻，局面会从「${facts.primary.keywords[0]}」变成「${facts.changed?.keywords[0] ?? '观察'}」。`
      : `因为没有动爻推动，局面仍停在「${facts.primary.keywords[0]}」——先看清再谈变。`;
  const c = `所以你的策略应该是：${conclusion}`;
  return [a, b, c];
}

function actionCards(facts: ReadingFacts, cast: CastResult): { title: string; body: string }[] {
  const conclusion = facts.changed
    ? `顺着「${facts.changed.keywords[0]}」做可验证的一小步，同时守住「${facts.themeWord}」。`
    : `先按兵不动，把「${facts.themeWord}」相关边界对齐，等结构更清楚再推。`;
  const actionLead = facts.changed
    ? `朝「${facts.changed.keywords[0]}」选一个最小动作验证。`
    : `围绕「${facts.themeWord}」列出本周可验证的下一步。`;
  const pack = buildStrategyPack(cast, facts.domain, facts.question);
  const advice = pack.items[0]?.text ?? actionLead;
  const comfort =
    facts.shiYingRel.rel === '相克'
      ? '冲突不一定是坏事。你在对齐真实需求与环境，这需要一些时间。'
      : facts.changed
        ? '变化中的不确定感很正常。先做可验证的一小步，比一次梭哈更稳。'
        : '不必急着制造转折。把边界说清，本身就是行动。';

  return [
    { title: '一句话总结', body: `卦象提示你：${conclusion}` },
    { title: '具体建议', body: advice },
    { title: '心态安抚', body: comfort },
  ];
}

/** 第一章：建立连接（仪式感） */
export function renderLearnChapter1(
  cast: CastResult,
  question: string,
  castAt: Date,
): string {
  const q = question.trim() || '（尚未写下具体问题——可回想你真正卡在哪）';
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;

  return `
    <header class="ly-ch ly-ch-1" data-learn-ch="1">
      ${renderCastTimePlaque(castAt)}
      <div class="ly-layer-pair ly-hex-hero-pair" data-ask-hex>
        <div class="ly-hex-hero-col">
          <p class="ly-guide-label">本卦 · ${escapeHtml(cast.primary.fullName)}</p>
          ${renderHexagramSvg({
            lines: cast.primaryLines,
            shiLine: cast.shiLine,
            yingLine: cast.yingLine,
            changingIndexes: cast.changingIndexes,
            pulseChanging: true,
            showTrigramLabels: true,
            showAskButtons: true,
          })}
        </div>
        <div class="ly-hex-hero-col">
          <p class="ly-guide-label">变卦${cast.changed ? ` · ${escapeHtml(cast.changed.fullName)}` : ''}</p>
          ${
            cast.changed
              ? renderHexagramSvg({
                  lines: cast.changedLines,
                  shiLine: changedShi,
                  yingLine: changedYing,
                  changingIndexes: cast.changingIndexes,
                  showTrigramLabels: true,
                })
              : '<p class="ly-guide-tip">无动则无变</p>'
          }
        </div>
        <div class="ly-yao-ask-slot" data-ask-slot hidden></div>
      </div>
      <article class="ly-q-card">
        <p class="ly-q-card-label">你问的是</p>
        <p class="ly-q-card-text">${escapeHtml(q)}</p>
      </article>
      <p class="ly-ch-bridge">你的问题在卦象里已经显现，接下来我们一步步解读。</p>
    </header>
  `;
}

/** 第二章：冲突与转机 */
export function renderLearnChapter2(facts: ReadingFacts, cast: CastResult, castAt: Date): string {
  const rows = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows;
  const shi = rows.find((r) => r.isShi);
  const ying = rows.find((r) => r.isYing);
  const shiE = shi ? LIUQIN_ENERGY[shi.liuqin] : null;
  const yingE = ying ? LIUQIN_ENERGY[ying.liuqin] : null;
  const shiModern = shiE?.modern ?? '当下状态';
  const yingModern = yingE?.modern ?? '外部环境';

  return `
    <section class="ly-ch ly-ch-2 ly-result-panel" data-learn-ch="2">
      <h3 class="ly-ch-title">⚡️ 冲突与转机</h3>
      <ul class="ly-power-list">
        <li class="ly-power-item">
          <span class="ly-power-icon" aria-hidden="true">🧍</span>
          <div>
            <strong>你（世爻）</strong>
            <p>目前处于「${escapeHtml(shiModern)}」的状态${
              shi ? `<span class="ly-power-note">（注：传统属${shi.liuqin}）</span>` : ''
            }</p>
          </div>
        </li>
        <li class="ly-power-item">
          <span class="ly-power-icon" aria-hidden="true">🌐</span>
          <div>
            <strong>外界（应爻）</strong>
            <p>环境呈现「${escapeHtml(yingModern)}」的状态${
              ying ? `<span class="ly-power-note">（注：传统属${ying.liuqin}）</span>` : ''
            }</p>
          </div>
        </li>
        <li class="ly-power-item">
          <span class="ly-power-icon" aria-hidden="true">⚔️</span>
          <div>
            <strong>核心冲突</strong>
            <p>${escapeHtml(conflictLine(facts, shiModern, yingModern))}</p>
          </div>
        </li>
        <li class="ly-power-item">
          <span class="ly-power-icon" aria-hidden="true">🔑</span>
          <div>
            <strong>关键转机（动爻）</strong>
            <p>${escapeHtml(turningLine(facts))}</p>
          </div>
        </li>
      </ul>
      <p class="ly-ch-bridge">了解了冲突与转机，接下来我们看看卦象本身在诉说什么故事。</p>
    </section>
  `;
}

/** 第三章：卦象故事 + 三行推演 + 折叠古籍 */
export function renderLearnChapter3(facts: ReadingFacts, cast: CastResult): string {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const visual = renderXiangVisual(upper, lower);
  const [l1, l2, l3] = storyTriLines(facts);
  const dossier = resolveClassicDossier(cast.primary.name);
  const daBai = glossDaXiang(cast.primary.name) ?? dossier.modern;

  const changedBlock = cast.changed
    ? `<div class="ly-story-gua">
        <p class="ly-story-gua-name">变卦【${escapeHtml(cast.changed.fullName)}】</p>
        <p class="ly-story-gua-line">${escapeHtml(
          guaOneLiner(cast.changed.name, cast.changed.fullName, cast.changed.keywords),
        )}</p>
      </div>`
    : `<div class="ly-story-gua">
        <p class="ly-story-gua-name">变卦</p>
        <p class="ly-story-gua-line">无动则无变：时间轴停在本卦，先把当下看清。</p>
      </div>`;

  return `
    <section class="ly-ch ly-ch-3 ly-result-panel" data-learn-ch="3">
      <h3 class="ly-ch-title">📖 翻译卦象的故事</h3>
      <p class="ly-ch-sub">你为什么会抽到这个卦？</p>
      <div class="ly-story-layout">
        <div class="ly-story-main">
          ${visual}
          <div class="ly-story-gua">
            <p class="ly-story-gua-name">本卦【${escapeHtml(cast.primary.fullName)}】</p>
            <p class="ly-story-gua-line">${escapeHtml(
              guaOneLiner(cast.primary.name, cast.primary.fullName, cast.primary.keywords),
            )}</p>
          </div>
          ${changedBlock}
          <ol class="ly-story-tri">
            <li>${escapeHtml(l1)}</li>
            <li>${escapeHtml(l2)}</li>
            <li>${escapeHtml(l3)}</li>
          </ol>
        </div>
        <details class="ly-story-classic">
          <summary>查阅古书原话</summary>
          <p class="ly-guide-tip">字眼生僻可先看左侧现代翻译。</p>
          ${
            dossier.judgment
              ? `<p><span class="ly-classic-tag">《易经》</span>${escapeHtml(dossier.judgment)}</p>
                 <p><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(daBai)}</p>`
              : '<p class="ly-guide-tip">本库暂无该卦卦辞摘录。</p>'
          }
          ${
            dossier.zengshan
              ? `<p><span class="ly-classic-tag">《增删卜易》</span>${escapeHtml(
                  dossier.zengshan.replace(/^《增删卜易》义理摘录（教学整理）：/, ''),
                )}</p>`
              : ''
          }
        </details>
      </div>
    </section>
  `;
}

/** 第四章：行动指南 */
export function renderLearnChapter4(facts: ReadingFacts, cast: CastResult): string {
  const cards = actionCards(facts, cast);
  return `
    <section class="ly-ch ly-ch-4 ly-result-panel" data-learn-ch="4">
      <h3 class="ly-ch-title">🚀 给你的行动指南</h3>
      <div class="ly-action-cards">
        ${cards
          .map(
            (c) => `
          <article class="ly-action-card">
            <p class="ly-action-card-label">${escapeHtml(c.title)}</p>
            <p class="ly-action-card-body">${formatClauseHtml(c.body)}</p>
          </article>`,
          )
          .join('')}
      </div>
      <p class="ly-ch-bridge">想一步步弄懂「为什么是世应 / 动爻」→ 切到「边算边学」。想看推演笔记 →「深度推演」。</p>
    </section>
  `;
}

/** 四章解读主体（不含第一章仪式头） */
export function renderLearnChaptersBody(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  const facts = buildReadingFacts(cast, question, castAt);
  return [
    renderLearnChapter2(facts, cast, castAt),
    renderLearnChapter3(facts, cast),
    renderLearnChapter4(facts, cast),
  ].join('');
}

/** 完整学习主叙事：章1 + 章2–4 */
export function renderLearnStoryHtml(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  return `
    ${renderLearnChapter1(cast, question, castAt)}
    <div class="ly-ch-stack" data-learn-story>
      ${renderLearnChaptersBody(cast, question, castAt)}
    </div>
  `;
}

/** 悬浮：读卦五步法底栏 */
export function renderFiveStepSheetHtml(cast: CastResult, question: string): string {
  const steps = buildFiveSteps(cast, question);
  return `
    <button type="button" class="ly-help-fab" data-five-open aria-label="怎么读卦 · 五步法" title="怎么读卦">?</button>
    <div class="ly-help-sheet" data-five-sheet hidden>
      <div class="ly-help-sheet-backdrop" data-five-close></div>
      <div class="ly-help-sheet-panel" role="dialog" aria-label="读卦五步法">
        <header class="ly-help-sheet-head">
          <h3>怎么读卦 · 五步法</h3>
          <button type="button" class="ly-help-sheet-x" data-five-close aria-label="关闭">×</button>
        </header>
        <p class="ly-help-sheet-lead">我们的解读就是按这五步推的，欢迎你学懂原理。</p>
        <ol class="ly-help-steps">
          ${steps
            .map(
              (s) => `
            <li>
              <strong>Step ${s.step} · ${escapeHtml(s.title)}</strong>
              <span>${escapeHtml(s.lookAt)}</span>
            </li>`,
            )
            .join('')}
        </ol>
      </div>
    </div>
  `;
}

export function bindFiveStepSheet(root: HTMLElement): void {
  const sheet = root.querySelector<HTMLElement>('[data-five-sheet]');
  if (!sheet) return;
  const setOpen = (on: boolean) => {
    sheet.hidden = !on;
    document.body.classList.toggle('ly-help-open', on);
  };
  root.querySelector('[data-five-open]')?.addEventListener('click', () => setOpen(true));
  sheet.querySelectorAll('[data-five-close]').forEach((el) => {
    el.addEventListener('click', () => setOpen(false));
  });
}
