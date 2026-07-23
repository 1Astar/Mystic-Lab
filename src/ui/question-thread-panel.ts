import type { QuestionThread, ThreadAnswer } from '../interpretation/question-thread.ts';
import type { CardReading, ReadingResult } from '../interpretation/types.ts';
import { polishInsightFields, polishReadingCopy } from '../interpretation/reading-polish.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import {
  defaultLayoutsForCount,
  layoutsForSpread,
} from '../tarot/spread-layout.ts';
import { SPREADS, isKnownSpreadType } from '../tarot/spreads.ts';
import { mountCardResultTabs } from './card-result-tabs.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 视觉层级：
 * - 『…』= 模型/规则标出的核心句 → 金色加粗
 * - 「不要/务必/先…」等结论口吻 → 金色加粗
 * - 标签后整句（注意/建议…）→ 金色加粗
 */
function formatHighlight(text: string): string {
  let escaped = escapeHtml(polishReadingCopy(text));

  escaped = escaped.replace(
    /『([^』]{2,80})』/g,
    '<strong class="thread-em">$1</strong>',
  );

  escaped = escaped.replace(
    /(注意[:：]|建议[:：]|核心[:：]|防风险重点[:：]|最终裁断[:：]|关键是[:：]?|情况[:：]|阻碍[:：])([^。\n＜]{2,40}[。]?)/g,
    '<strong class="thread-em">$1$2</strong>',
  );

  // 编号风险点：①②③ 或 1. 2. 整句标出
  escaped = escaped.replace(
    /([①②③④⑤][^①②③④⑤\n＜]{4,80})/g,
    '<strong class="thread-em thread-em--risk">$1</strong>',
  );

  escaped = escaped.replace(
    /(不要[^。\n＜]{2,28}[。！]?|务必[^。\n＜]{2,28}[。！]?|先[^。\n＜]{2,20}再[^。\n＜]{2,20}[。！]?|别再[^。\n＜]{2,24}[。！]?)/g,
    '<strong class="thread-em">$1</strong>',
  );

  return escaped.replace(/\n+/g, '<br/>');
}

function intentEmoji(intent: ThreadAnswer['intent']): string {
  if (intent === 'reason') return '💭';
  if (intent === 'leave_path') return '🚪';
  if (intent === 'stay_path') return '🏠';
  if (intent === 'risk') return '⚠️';
  if (intent === 'advice') return '✨';
  return '🔻';
}

function intentLabel(intent: ThreadAnswer['intent']): string {
  if (intent === 'advice') return '行动策略';
  if (intent === 'risk') return '情况 / 阻碍';
  if (intent === 'leave_path' || intent === 'stay_path') return '走势预测';
  if (intent === 'reason') return '深度剖析';
  return '深度剖析';
}

/** 牌阵位次标签：情况 / 阻碍 高亮标出 */
function positionBadgeClass(position: string | undefined): string {
  const p = (position || '').trim();
  if (p === '阻碍' || p.includes('阻碍')) return 'is-obstacle';
  if (p === '情况' || p.includes('情况')) return 'is-situation';
  if (p === '建议' || p.includes('建议')) return 'is-advice-pos';
  return '';
}

/** 按牌阵坐标摆放；居中放大 */
function renderCardStrip(cards: CardReading[]): string {
  if (!cards.length) return '';

  const spreadType = cards[0]?.spreadType;
  const layouts =
    spreadType && isKnownSpreadType(spreadType)
      ? layoutsForSpread(SPREADS[spreadType]).slice(0, cards.length)
      : defaultLayoutsForCount(cards.length);

  // 若牌数与预设不一致，回退均分布局
  const slots =
    layouts.length === cards.length ? layouts : defaultLayoutsForCount(cards.length);

  const boardH =
    cards.length <= 1 ? 220 : cards.length <= 3 ? 260 : cards.length <= 5 ? 320 : 360;

  const items = cards
    .map((c, i) => {
      const reversed = c.orientation === 'reversed';
      const alt = `${c.cardName}${reversed ? '（逆位）' : ''}`;
      const slot = slots[i] ?? { x: 50, y: 50 };
      return `
        <button type="button" class="thread-spread-card" data-peek="${i}"
          style="left:${slot.x}%;top:${slot.y}%"
          aria-label="查看${escapeHtml(alt)}">
          <span class="thread-card-face${reversed ? ' is-reversed' : ''}">
            ${cardFaceImageHtml(c.cardId, alt, 'thread-card-img')}
          </span>
          <span class="thread-card-pos ${positionBadgeClass(c.position)}">${escapeHtml(c.position || `第${i + 1}张`)}</span>
          <strong class="thread-card-name">${escapeHtml(c.cardName)}</strong>
          ${reversed ? '<span class="thread-card-orient">逆</span>' : ''}
        </button>`;
    })
    .join('');

  return `
    <section class="thread-card-strip" aria-label="本局抽到的牌">
      <h3 class="thread-section-title">本局牌阵 · 点牌弹窗查看</h3>
      <div class="thread-spread-board" style="--thread-board-h:${boardH}px" role="list">
        ${items}
      </div>
    </section>`;
}

function renderAnswerCards(cards: CardReading[], indexes: number[]): string {
  if (!indexes.length || !cards.length) return '';
  const multi = indexes.length > 1;
  return `<aside class="thread-q-visual${multi ? ' is-multi' : ''}" aria-label="相关牌">
    ${indexes
      .map((i) => {
        const c = cards[i];
        if (!c) return '';
        const reversed = c.orientation === 'reversed';
        const pos = (c.position || '').trim();
        const posCls = positionBadgeClass(pos);
        return `<button type="button" class="thread-q-visual-card" data-peek="${i}" title="${escapeHtml(c.cardName)}">
          ${
            pos
              ? `<span class="thread-q-pos-badge ${posCls}">${escapeHtml(pos)}</span>`
              : ''
          }
          <span class="thread-card-face${reversed ? ' is-reversed' : ''}">
            ${cardFaceImageHtml(c.cardId, c.cardName, 'thread-q-visual-img')}
          </span>
          <span class="thread-q-visual-name">${escapeHtml(c.cardName)}${reversed ? ' · 逆' : ''}</span>
        </button>`;
      })
      .join('')}
  </aside>`;
}

function renderAnswer(a: ThreadAnswer, index: number, cards: CardReading[]): string {
  const tone =
    a.intent === 'risk'
      ? 'is-risk'
      : a.intent === 'advice'
        ? 'is-advice'
        : a.intent === 'stay_path'
          ? 'is-stay'
          : a.intent === 'leave_path'
            ? 'is-leave'
            : 'is-insight';

  const jumpBtn =
    a.cardIndexes.length === 1
      ? `<button type="button" class="thread-hotspot-btn" data-peek="${a.cardIndexes[0]}">看这张牌详情</button>`
      : a.cardIndexes.length > 1
        ? `<div class="thread-hotspot-row">${a.cardIndexes
            .map(
              (i) =>
                `<button type="button" class="thread-hotspot-btn" data-peek="${i}">看${escapeHtml(cards[i]?.cardName ?? '相关牌')}</button>`,
            )
            .join('')}</div>`
        : '';

  return `
    <article class="thread-q-card ${tone}">
      <h4 class="thread-q-title">
        <span class="thread-q-emoji" aria-hidden="true">${intentEmoji(a.intent)}</span>
        <span class="thread-q-n">${index + 1}</span>
        <span class="thread-q-text">${escapeHtml(a.question)}</span>
      </h4>
      <div class="thread-q-body">
        ${renderAnswerCards(cards, a.cardIndexes)}
        <div class="thread-q-copy">
          <p class="thread-q-heading">${escapeHtml(a.heading)}</p>
          ${
            a.meaningMap
              ? `<p class="thread-meaning"><span class="thread-label">牌意映射</span>${formatHighlight(a.meaningMap)}</p>`
              : `<p class="thread-meaning"><span class="thread-label">牌意映射</span>${formatHighlight(
                  a.cardIndexes
                    .map((i) => cards[i])
                    .filter(Boolean)
                    .map((c) => `${c!.cardName}${c!.orientation === 'reversed' ? '逆位' : ''}：${(c!.keywords || []).slice(0, 3).join('、') || c!.cardName}`)
                    .join('；') || '结合本问绑定牌读。',
                )}</p>`
          }
          <p class="thread-insight${a.intent === 'risk' ? ' is-risk-block' : ''}"><span class="thread-label${a.intent === 'risk' ? ' is-risk-label' : ''}">${intentLabel(a.intent)}</span>${formatHighlight(a.insight)}</p>
          ${
            a.action
              ? `<p class="thread-action"><span class="thread-label">可执行</span>${formatHighlight(a.action)}</p>`
              : ''
          }
          ${jumpBtn}
        </div>
      </div>
    </article>`;
}

const BRIDGE_COPY =
  '以上是针对你问题的专属解读。想看牌面热点或图鉴，点上方牌面即可打开。';

export function renderQuestionThreadHtml(
  thread: QuestionThread,
  cards: CardReading[] = [],
  options?: { showCodexHint?: boolean; showBridge?: boolean },
): string {
  const answers = thread.answers.map((a, i) => renderAnswer(a, i, cards)).join('');
  const showBridge = options?.showBridge !== false && cards.length > 0;
  return `
    <div class="question-thread">
      <p class="thread-empathy">${escapeHtml(polishReadingCopy(thread.empathyLead))}</p>
      <section class="thread-overall-card">
        <h3 class="thread-section-title">整盘结论</h3>
        <p class="thread-overall-body">${formatHighlight(thread.overall)}</p>
      </section>
      ${renderCardStrip(cards)}
      <section class="thread-answers">
        <h3 class="thread-section-title">按你的问题</h3>
        ${answers}
      </section>
      <section class="thread-oneliner-card">
        <h3 class="thread-section-title">一句话破局</h3>
        <p class="thread-oneliner">${formatHighlight(thread.oneLiner)}</p>
      </section>
      ${
        showBridge
          ? `<p class="thread-bridge"><span class="thread-bridge-mark" aria-hidden="true">✦</span>${escapeHtml(BRIDGE_COPY)}</p>`
          : ''
      }
    </div>`;
}

function polishThread(thread: QuestionThread): QuestionThread {
  return {
    ...thread,
    empathyLead: polishReadingCopy(thread.empathyLead),
    overall: polishReadingCopy(thread.overall),
    oneLiner: polishReadingCopy(thread.oneLiner),
    answers: thread.answers.map((a) => polishInsightFields(a)),
  };
}

/** 点牌弹窗：大图 + 单卡解读 Tab */
export function openThreadCardPeek(
  card: CardReading,
  options?: {
    initialTab?: 'reading' | 'visual';
    onCardReadingChange?: (updated: CardReading) => void;
  },
): void {
  document.querySelector('.thread-card-peek')?.remove();
  document.documentElement.classList.remove('thread-peek-open');

  const reversed = card.orientation === 'reversed';
  const overlay = document.createElement('div');
  overlay.className = 'thread-card-peek';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', card.cardName);
  overlay.innerHTML = `
    <div class="thread-card-peek-backdrop" data-close></div>
    <div class="thread-card-peek-panel">
      <button type="button" class="thread-card-peek-close" data-close aria-label="关闭">✕</button>
      <header class="thread-card-peek-head thread-card-peek-head--minimal">
        <p class="thread-card-peek-pos">${escapeHtml(card.position || '')}${reversed ? ' · 逆位' : ' · 正位'}</p>
        <h2 class="thread-card-peek-name">${escapeHtml(card.cardName)}</h2>
      </header>
      <div class="thread-card-peek-tabs result-tabs-host"></div>
    </div>`;

  document.body.appendChild(overlay);
  document.documentElement.classList.add('thread-peek-open');
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const host = overlay.querySelector('.thread-card-peek-tabs') as HTMLElement | null;
  if (host) {
    mountCardResultTabs(host, card, options?.initialTab ?? 'visual', {
      hideReadingTab: true,
      onCardReadingChange: options?.onCardReadingChange,
    });
  }

  const close = (): void => {
    document.documentElement.classList.remove('thread-peek-open');
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 200);
  };

  overlay.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
}

export function mountQuestionThread(
  host: HTMLElement,
  reading: ReadingResult,
  onJumpCard?: (index: number) => void,
): boolean {
  const thread = reading.questionThread;
  if (!thread?.answers.length) return false;
  host.innerHTML = renderQuestionThreadHtml(polishThread(thread), reading.cards);

  const openPeek = (i: number, tab?: 'reading' | 'visual'): void => {
    const card = reading.cards[i];
    if (!card) return;
    openThreadCardPeek(card, {
      initialTab: tab ?? 'visual',
      onCardReadingChange: (updated) => {
        reading.cards[i] = updated;
      },
    });
  };

  host.querySelectorAll<HTMLButtonElement>('[data-peek]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.peek);
      if (Number.isNaN(i)) return;
      if (onJumpCard) onJumpCard(i);
      else openPeek(i);
    });
  });

  return true;
}
