import type { CastResult } from './engine.ts';
import {
  fromDatetimeLocalValue,
  siZhuFromDate,
  toDatetimeLocalValue,
  type SiZhu,
} from './ganzhi.ts';
import { LINE_LABELS, upperLowerFromLines, yingLineOf } from './hexagrams.ts';
import { bindClassicFolder, renderClassicFolderHtml } from './classic-folder.ts';
import { dressHexagram, type DressedHexagram, type YaoDress } from './najia.ts';
import { buildShengKeGraph, renderShengKeGraphHtml } from './sheng-ke-graph.ts';
import { composeScene, detectSceneDomain } from './scene-map.ts';
import { resolveYongShen } from './yong-shen.ts';
import { renderYaoCard } from './yao-card.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';

const LINE_ROLE = [
  '基础 / 开端 / 基层',
  '内部 / 宅内 / 助手',
  '关口 / 过渡 / 门口',
  '外部 / 门庭 / 近外',
  '核心 / 君位 / 决策',
  '收束 / 结果 / 终结',
] as const;

function modernLineGloss(cast: CastResult, i: number): { modern: string; classicHint: string } {
  const role = LINE_ROLE[i]!;
  const moving = cast.changingIndexes.includes(i);
  const isShi = cast.shiLine === i + 1;
  const isYing = cast.yingLine === i + 1;
  const who = isShi ? '这一爻是「世」（你）' : isYing ? '这一爻是「应」（外界）' : '这一爻是闲爻';
  const move = moving
    ? '它还在动——这一层正在发生转折，值得优先关注。'
    : '它是静爻——这一层相对稳定。';
  return {
    modern: `${LINE_LABELS[i]}提示：位置偏「${role}」。${who}。${move}`,
    classicHint: `《易经》对该卦${LINE_LABELS[i]}另有爻辞；点 📖 可看古文入口（进阶资料，不必一次啃完）。`,
  };
}

function buildFaq(cast: CastResult, question: string) {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, cast.primary);
  const yong = resolveYongShen(question);
  const moving =
    cast.changingIndexes.length === 0
      ? '无明显动爻'
      : cast.changingIndexes.map((i) => LINE_LABELS[i]!).join('、');

  return [
    {
      q: `为什么叫「${cast.primary.fullName}」？`,
      a: [
        `上卦为${upper.nature}（${upper.id}），下卦为${lower.nature}（${lower.id}）。`,
        scene.bridge,
        detectSceneDomain(question) === 'love' ? scene.love : scene.career,
      ],
    },
    {
      q: `动爻在哪？对我问的事有什么影响？`,
      a: [
        moving === '无明显动爻'
          ? '本卦无动爻：格局相对稳，先把世应与本卦场景看清。'
          : `动爻在${moving}——这些位置正在「变心」，是当下最该盯的具体层面。`,
        cast.changed
          ? `变化指向变卦「${cast.changed.fullName}」：${cast.changed.gist}`
          : '无变卦时，不必硬找未来，先稳住当下。',
      ],
    },
    {
      q: `用神是什么？我该看哪一类爻？`,
      a: [yong.why, `本题用神倾向：${yong.name}。`, yong.tip],
    },
    {
      q: question.trim()
        ? `如果「${question.trim()}」不顺利，我还能做什么？`
        : '如果结果不理想，我还能做什么？',
      a: [
        '先对齐世应：哪些是我能改的，哪些是环境。',
        cast.changed
          ? `可朝变卦关键词「${cast.changed.keywords[0]}」做一小步验证，而不是一次梭哈。`
          : '无动则宜整理与等待窗口：把「下一步」写成一周可验证动作。',
      ],
    },
  ];
}

function renderSiZhuBar(sz: SiZhu): string {
  return `
    <div class="ly-sizhu" data-sizhu>
      <span>年 ${sz.year}</span>
      <span>月 ${sz.month}</span>
      <span>日 ${sz.day}</span>
      <span>时 ${sz.hour}</span>
      <span class="ly-sizhu-stem">日干 ${sz.dayStem}</span>
      ${sz.dayXunKong ? `<span class="ly-sizhu-kong">空亡 ${sz.dayXunKong}</span>` : ''}
    </div>
  `;
}

function renderDressTable(dressed: DressedHexagram): string {
  const rowsTopFirst = [...dressed.rows].reverse();
  const body = rowsTopFirst
    .map((r) => {
      const mark = [r.isShi ? '世' : '', r.isYing ? '应' : '', r.changing ? '动' : '']
        .filter(Boolean)
        .join('/');
      return `
      <tr class="ly-dress-row" data-dress-line="${r.index}" tabindex="0" role="button">
        <td>${r.liushen}</td>
        <td>${r.liuqin}</td>
        <td>${r.branch}${r.wuxing}${
          r.changedBranch ? `→${r.changedBranch}${r.changedWuxing ?? ''}` : ''
        }</td>
        <td>${r.label}</td>
        <td>${mark || '—'}</td>
      </tr>`;
    })
    .join('');

  return `
    <p class="ly-guide-tip">本宫 ${dressed.palace}（${dressed.palaceWx}）· 点一行看实盘卡</p>
    <div class="ly-dress-wrap">
      <table class="ly-dress-table">
        <thead>
          <tr><th>六神</th><th>六亲</th><th>地支</th><th>爻</th><th>标记</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="ly-yao-card-slot" data-yao-card-slot></div>
  `;
}

function renderDeepPanel(cast: CastResult, castAt: Date, question: string): string {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const graph = buildShengKeGraph(dressed.rows, question);
  const lineCards = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const g = modernLineGloss(cast, i);
      return `
      <article class="ly-line-card">
        <header>
          <strong>${LINE_LABELS[i]}</strong>
          <button type="button" class="ly-line-classic-btn" data-classic-line="${i}" title="古文与典故">📖</button>
        </header>
        <p>${g.modern}</p>
        <p class="ly-line-classic-hint" data-classic-hint="${i}" hidden>${g.classicHint}</p>
      </article>
    `;
    })
    .join('');

  return `
    <label class="ly-cast-at">
      <span>占卜时间</span>
      <input type="datetime-local" data-cast-at value="${toDatetimeLocalValue(castAt)}" />
    </label>
    <p class="ly-layer-guide">默认此刻，可改。改时间会重算四柱与六神（历法：lunar-javascript）。</p>
    ${renderSiZhuBar(sz)}
    ${renderDressTable(dressed)}
    ${renderShengKeGraphHtml(graph)}
    ${renderClassicFolderHtml(cast)}
    <details class="ly-deep-more">
      <summary>白话爻位速览</summary>
      <div class="ly-line-cards">${lineCards}</div>
    </details>
  `;
}

export type ResultLayersOptions = {
  castAt?: Date;
};

/** 改造后的结果信息层：三签 + 问答 + 装卦 */
export function renderResultLayers(
  cast: CastResult,
  question: string,
  opts: ResultLayersOptions = {},
): string {
  const castAt = opts.castAt ?? new Date();
  const movingLabels =
    cast.changingIndexes.length === 0
      ? '无'
      : cast.changingIndexes.map((i) => LINE_LABELS[i]!).join('、');
  const yong = resolveYongShen(question);
  const changedShi = cast.changed?.shiLine;
  const changedYing = changedShi ? yingLineOf(changedShi) : undefined;

  const faq = buildFaq(cast, question)
    .map(
      (item, i) => `
    <details class="ly-faq-item"${i === 0 ? ' open' : ''}>
      <summary>${item.q}</summary>
      <div class="ly-faq-body">${item.a.map((p) => `<p>${p}</p>`).join('')}</div>
    </details>
  `,
    )
    .join('');

  return `
    <section class="ly-layers" data-result-layers data-cast-iso="${castAt.toISOString()}">
      <div class="ly-layer-tabs" role="tablist">
        <button type="button" class="ly-layer-tab is-active" data-tab="status" role="tab">现状与变化</button>
        <button type="button" class="ly-layer-tab" data-tab="core" role="tab">核心要素</button>
        <button type="button" class="ly-layer-tab" data-tab="deep" role="tab">深度推演</button>
      </div>

      <div class="ly-layer-panel is-active" data-panel="status">
        <p class="ly-layer-guide">这是【${cast.primary.fullName}】${
          cast.changed ? `，变为【${cast.changed.fullName}】` : '（无变卦）'
        }。动爻：${movingLabels}——有动就代表这件事有转折，先盯动爻。</p>
        <div class="ly-layer-pair">
          <div>
            <p class="ly-guide-label">本卦 · ${cast.primary.name}</p>
            ${renderHexagramSvg({
              lines: cast.primaryLines,
              shiLine: cast.shiLine,
              yingLine: cast.yingLine,
              changingIndexes: cast.changingIndexes,
              pulseChanging: true,
              showTrigramLabels: true,
            })}
          </div>
          <div>
            <p class="ly-guide-label">变卦${cast.changed ? ` · ${cast.changed.name}` : ''}</p>
            ${
              cast.changed
                ? renderHexagramSvg({
                    lines: cast.changedLines,
                    shiLine: changedShi,
                    yingLine: changedYing,
                    changingIndexes: cast.changingIndexes,
                    showTrigramLabels: true,
                  })
                : '<p class="ly-guide-tip">无动则无变，时间轴停在本卦。</p>'
            }
          </div>
        </div>
        <p class="ly-keywords">${cast.primary.keywords.join(' · ')}${
          cast.changed ? ` → ${cast.changed.keywords.join(' · ')}` : ''
        }</p>
      </div>

      <div class="ly-layer-panel" data-panel="core" hidden>
        <p class="ly-layer-guide">专业会看「世 / 应 / 用神」。世＝你，应＝对方或环境；用神＝你问的事在卦里的代表。</p>
        <div class="ly-guide-hex">${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: cast.shiLine,
          yingLine: cast.yingLine,
          changingIndexes: cast.changingIndexes,
          emphasizeShiYing: true,
          showTrigramLabels: true,
        })}</div>
        <div class="ly-core-cards">
          <article><h4>世 · 我</h4><p>在${LINE_LABELS[cast.shiLine - 1]}。你的立场与能动部分。</p></article>
          <article><h4>应 · 外界</h4><p>在${LINE_LABELS[cast.yingLine - 1]}。对方 / 岗位 / 环境。</p></article>
          <article class="ly-core-yong">
            <h4>用神 · ${yong.name}</h4>
            <p>${yong.why}</p>
            <p class="ly-guide-tip">${yong.tip}</p>
          </article>
        </div>
      </div>

      <div class="ly-layer-panel" data-panel="deep" hidden data-deep-panel>
        ${renderDeepPanel(cast, castAt, question)}
      </div>
    </section>

    <section class="ly-faq-panel">
      <h3>边看边问</h3>
      <p class="ly-layer-guide">不要一次吞完整本教科书——点开你此刻卡住的问题。</p>
      ${faq}
    </section>
  `;
}

function syncDressAndSk(root: HTMLElement, index: number | null): void {
  root.querySelectorAll('.ly-dress-row').forEach((el) => {
    const on = index !== null && el.getAttribute('data-dress-line') === String(index);
    el.classList.toggle('is-open', on);
  });
  root.querySelectorAll('.ly-sk-node').forEach((el) => {
    const on = index !== null && el.getAttribute('data-sk-line') === String(index);
    el.classList.toggle('is-open', on);
  });
}

function openYaoCard(
  slot: HTMLElement,
  rows: YaoDress[],
  index: number,
  question: string,
  tableRoot: HTMLElement,
): void {
  const row = rows.find((r) => r.index === index);
  if (!row) return;
  const existing = slot.querySelector(`[data-yao-card="${index}"]`);
  if (existing) {
    slot.innerHTML = '';
    syncDressAndSk(tableRoot, null);
    return;
  }
  slot.innerHTML = renderYaoCard(row, question);
  syncDressAndSk(tableRoot, index);
  tableRoot
    .querySelector<HTMLElement>(`.ly-dress-row[data-dress-line="${index}"]`)
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function bindDeepPanel(
  deep: HTMLElement,
  cast: CastResult,
  question: string,
  castAt: Date,
  onCastAtChange: (d: Date) => void,
): void {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);

  const openLine = (idx: number) => {
    const slot = deep.querySelector<HTMLElement>('[data-yao-card-slot]');
    if (slot) openYaoCard(slot, dressed.rows, idx, question, deep);
  };

  deep.querySelectorAll<HTMLElement>('.ly-dress-row').forEach((tr) => {
    const open = () => openLine(Number(tr.dataset.dressLine));
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  deep.querySelectorAll<SVGGElement>('.ly-sk-node').forEach((g) => {
    g.style.cursor = 'pointer';
    const open = () => openLine(Number(g.getAttribute('data-sk-line')));
    g.addEventListener('click', open);
  });

  bindClassicFolder(deep);

  deep.querySelectorAll<HTMLButtonElement>('[data-classic-line]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.classicLine!;
      const hint = deep.querySelector<HTMLElement>(`[data-classic-hint="${i}"]`);
      if (hint) hint.hidden = !hint.hidden;
    });
  });

  const input = deep.querySelector<HTMLInputElement>('[data-cast-at]');
  input?.addEventListener('change', () => {
    const next = fromDatetimeLocalValue(input.value);
    onCastAtChange(next);
  });
}

export function bindResultLayers(
  root: HTMLElement,
  cast: CastResult,
  question: string,
): { getCastAt: () => Date } {
  const layers = root.querySelector<HTMLElement>('[data-result-layers]');
  let castAt = new Date(layers?.dataset.castIso ?? Date.now());

  const tabs = root.querySelectorAll<HTMLButtonElement>('.ly-layer-tab');
  const panels = root.querySelectorAll<HTMLElement>('.ly-layer-panel');

  const activateTab = (id: string) => {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === id));
    panels.forEach((p) => {
      const on = p.dataset.panel === id;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab ?? 'status'));
  });

  const refreshDeep = (next: Date) => {
    castAt = next;
    if (layers) layers.dataset.castIso = next.toISOString();
    const deep = root.querySelector<HTMLElement>('[data-deep-panel]');
    if (!deep) return;
    deep.innerHTML = renderDeepPanel(cast, next, question);
    bindDeepPanel(deep, cast, question, next, refreshDeep);
    activateTab('deep');
  };

  const deep = root.querySelector<HTMLElement>('[data-deep-panel]');
  if (deep) bindDeepPanel(deep, cast, question, castAt, refreshDeep);

  return {
    getCastAt: () => castAt,
  };
}

export const NOTE_TAG_OPTIONS = ['心态记录', '事后反馈', '古书对照', '工作', '感情', '考试'] as const;
