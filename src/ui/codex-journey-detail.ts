import { isCardCollected } from '../codex/collection.ts';
import {
  FOOL_JOURNEY_STEPS,
  getJourneyChapterForStep,
  getJourneyStep,
  getNextJourneyStep,
  type JourneyMapStep,
} from '../knowledge/fool-journey.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { TAROT_DECK } from '../tarot/deck.ts';

const JOURNEY_PROGRESS_KEY = 'mystic-lab-journey-progress';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getJourneyProgressOrder(): number {
  try {
    const raw = localStorage.getItem(JOURNEY_PROGRESS_KEY);
    if (raw == null) return -1;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : -1;
  } catch {
    return -1;
  }
}

export function setJourneyProgressOrder(order: number): void {
  try {
    const prev = getJourneyProgressOrder();
    if (order > prev) {
      localStorage.setItem(JOURNEY_PROGRESS_KEY, String(order));
    }
  } catch {
    /* ignore */
  }
}

export function getContinueJourneyStep(): JourneyMapStep {
  const progress = getJourneyProgressOrder();
  const next = FOOL_JOURNEY_STEPS.find((s) => s.order > progress);
  return next ?? FOOL_JOURNEY_STEPS[0]!;
}

export type JourneyDetailCallbacks = {
  onClose: () => void;
  onContinue: (deckId: string) => void;
  onOpenCodex: (deckId: string) => void;
};

export function mountJourneyDetail(
  container: HTMLElement,
  deckId: string,
  callbacks: JourneyDetailCallbacks,
): void {
  const step = getJourneyStep(deckId);
  if (!step) return;

  setJourneyProgressOrder(step.order);

  const card = TAROT_DECK.find((c) => c.id === deckId);
  const chapter = getJourneyChapterForStep(deckId);
  const next = getNextJourneyStep(deckId);
  const collected = isCardCollected(deckId);
  const nameCn = card ? formatCardNameZh(card) : step.nameCn;

  container.className = 'codex-detail journey-detail';
  container.innerHTML = `
    <button type="button" class="codex-detail-close" aria-label="关闭">✕</button>
    <header class="journey-detail-head">
      <p class="journey-detail-chapter">${escapeHtml(chapter?.title ?? '愚人之旅')} · 第 ${step.order} 站</p>
      <h2 class="journey-detail-name">${escapeHtml(nameCn)}<span class="journey-detail-title">${escapeHtml(step.title)}</span></h2>
    </header>
    <div class="journey-detail-hero">
      <div class="journey-detail-face ${collected ? 'is-lit' : 'is-dim'}">
        ${cardFaceImageHtml(deckId, nameCn, 'journey-detail-img')}
        ${collected ? '<span class="journey-detail-lit">已点亮</span>' : '<span class="journey-detail-lit is-dim">尚未相遇</span>'}
      </div>
    </div>
    <section class="journey-detail-section">
      <h3>故事位置</h3>
      <p>${escapeHtml(chapter?.subtitle ?? '')} — 你正站在「${escapeHtml(step.title)}」这一站。</p>
    </section>
    <section class="journey-detail-section">
      <h3>核心成长主题</h3>
      <p>${escapeHtml(step.theme)}</p>
    </section>
    <section class="journey-detail-section">
      <h3>牌面象征</h3>
      <p>${escapeHtml(step.symbolism ?? step.theme)}</p>
    </section>
    <section class="journey-detail-section">
      <h3>人生阶段对应</h3>
      <p>${escapeHtml(step.lifeStage ?? '对照你此刻的人生议题，看这张牌落在旅程的哪一段。')}</p>
    </section>
    ${
      next
        ? `<section class="journey-detail-section journey-detail-next">
      <h3>下一站</h3>
      <p><strong>${escapeHtml(next.nameCn)} · ${escapeHtml(next.title)}</strong> — ${escapeHtml(next.theme)}</p>
    </section>`
        : `<section class="journey-detail-section journey-detail-complete">
      <h3>旅程圆满</h3>
      <p>你已走完大阿卡那的一整圈。世界之后，新的愚者之旅又会开始。</p>
    </section>`
    }
    <div class="journey-detail-actions">
      ${
        collected
          ? '<button type="button" class="btn btn-secondary journey-open-codex">查看完整牌义</button>'
          : '<p class="journey-detail-unlock">故事可随时阅读；四 Tab 深度牌义需抽到此牌后解锁。</p>'
      }
      ${
        next
          ? `<button type="button" class="btn journey-continue">继续旅程 → ${escapeHtml(next.nameCn)}</button>`
          : '<button type="button" class="btn journey-continue">从头再走一遍</button>'
      }
    </div>
  `;

  container.querySelector('.codex-detail-close')?.addEventListener('click', callbacks.onClose);

  container.querySelector('.journey-open-codex')?.addEventListener('click', () => {
    callbacks.onOpenCodex(deckId);
  });

  container.querySelector('.journey-continue')?.addEventListener('click', () => {
    callbacks.onContinue(next?.deckId ?? FOOL_JOURNEY_STEPS[0]!.deckId);
  });
}
