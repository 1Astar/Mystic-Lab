import type { CardKnowledge } from '../knowledge/types.ts';
import {
  resolveAlertMisreading,
  resolveDailyPractice,
  resolveLifeScenes,
  resolveReversedBrief,
  resolveUprightBrief,
} from '../knowledge/codex-learn.ts';
import { formatMisreadingFriendly } from '../knowledge/misreading-copy.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatParagraph(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function accordionBlock(title: string, body: string, open = false): string {
  if (!body.trim()) return '';
  return `
    <details class="reading-accordion codex-learn-fold"${open ? ' open' : ''}>
      <summary class="reading-accordion-summary">
        <span class="reading-accordion-title">${title}</span>
        <span class="reading-accordion-chevron" aria-hidden="true"></span>
      </summary>
      <div class="reading-accordion-body">${body}</div>
    </details>`;
}

/** 生活中的现实映射卡片列表 */
export function renderLifeScenesHtml(knowledge: CardKnowledge): string {
  const scenes = resolveLifeScenes(knowledge);
  if (!scenes.length) {
    return '<p class="codex-quick-muted">这张牌的现实情境还在整理中。</p>';
  }
  return `<div class="codex-life-scenes">${scenes
    .map(
      (s) => `
      <article class="codex-life-scene-card">
        <h4 class="codex-life-scene-title">
          <span class="codex-life-scene-icon" aria-hidden="true">${s.icon}</span>
          <span>${escapeHtml(s.when)}</span>
        </h4>
        <p class="codex-life-scene-body">${escapeHtml(s.body)}</p>
      </article>`,
    )
    .join('')}</div>`;
}

export function renderDailyPracticeHtml(knowledge: CardKnowledge): string {
  return `
    <article class="codex-practice-card">
      <p class="codex-practice-kicker">🔮 日常练习</p>
      <p class="codex-practice-body">${formatParagraph(resolveDailyPractice(knowledge))}</p>
    </article>`;
}

export function renderAlertMisreadHtml(knowledge: CardKnowledge): string {
  const text = resolveAlertMisreading(knowledge);
  return `
    <aside class="codex-alert-card" role="note">
      <p class="codex-alert-kicker">⚠️ 特别提醒 · 最需警惕的误区</p>
      <p class="codex-alert-body">${escapeHtml(text)}</p>
    </aside>`;
}

function orientationBriefInner(knowledge: CardKnowledge): string {
  const upKw = (knowledge.uprightKeywords ?? knowledge.keywords).slice(0, 5);
  const revKw = (knowledge.reversedKeywords ?? knowledge.keywords).slice(0, 5);
  const kw = (list: string[], cls: string) =>
    list.length
      ? `<div class="codex-kw-tags ${cls}">${list
          .map((k) => `<span class="codex-kw-tag">${escapeHtml(k)}</span>`)
          .join('')}</div>`
      : '';

  return `
    <div class="codex-orient-brief">
      <h5 class="codex-orient-h">正位</h5>
      ${kw(upKw, 'is-upright')}
      <p>${escapeHtml(resolveUprightBrief(knowledge))}</p>
      <h5 class="codex-orient-h">逆位</h5>
      ${kw(revKw, 'is-reversed')}
      <p>${escapeHtml(resolveReversedBrief(knowledge))}</p>
    </div>`;
}

/** 完整图鉴：正逆位直接展示，无需点击展开 */
export function renderOrientationBriefHtml(knowledge: CardKnowledge): string {
  return `
    <section class="codex-orient-panel">
      <h3 class="codex-orient-panel-title">📖 正逆位详解</h3>
      ${orientationBriefInner(knowledge)}
    </section>`;
}

/**
 * 图鉴学习折叠。完整图鉴有独立「现实映射」Tab 时，基础牌义只留正逆位，避免重复。
 */
export type LearnFoldsOptions = {
  includeOrientation?: boolean;
  includeLifeScenes?: boolean;
  includePractice?: boolean;
};

export function renderCodexLearnFoldsHtml(
  knowledge: CardKnowledge,
  options?: LearnFoldsOptions,
): string {
  const includeOrientation = options?.includeOrientation !== false;
  const includeLifeScenes = options?.includeLifeScenes !== false;
  const includePractice = options?.includePractice !== false;

  const blocks = [
    includeOrientation
      ? accordionBlock('📖 正逆位详解', orientationBriefInner(knowledge), false)
      : '',
    includeLifeScenes
      ? accordionBlock('📍 生活中的现实映射', renderLifeScenesHtml(knowledge), false)
      : '',
    includePractice
      ? accordionBlock('🧠 用来做自我察觉的练习', renderDailyPracticeHtml(knowledge), false)
      : '',
  ].filter(Boolean);

  if (!blocks.length) return '';
  return `<div class="codex-learn-folds">${blocks.join('')}</div>`;
}

/** @deprecated 旧「感情/工作/财富」平铺；保留导出以免外部引用断裂 */
export function renderCodexSceneCardsHtml(knowledge: CardKnowledge): string {
  return renderLifeScenesHtml(knowledge);
}

export function formatExtraMisreadingsList(
  knowledge: CardKnowledge,
  nameCn: string,
): string {
  const rest = (knowledge.misreadings ?? []).slice(1);
  if (!rest.length) return '';
  return `<ul class="codex-misread-list">${rest
    .map((m) => `<li>${escapeHtml(formatMisreadingFriendly(nameCn, m))}</li>`)
    .join('')}</ul>`;
}
