import { cardBackArtHtml } from '../tarot/card-back.ts';

/** 屏幕上同时可见的牌数 */
export const DECK_FAN_VISIBLE = 17;
export const DECK_FAN_CENTER = Math.floor(DECK_FAN_VISIBLE / 2);
/** 虚拟牌堆总量（营造 78 张牌堆感） */
export const DECK_FAN_TOTAL = 78;

export function renderDeckFanHTML(): string {
  const cards = Array.from({ length: DECK_FAN_VISIBLE }, (_, i) => {
    return `
      <div class="fan-card" data-fan-index="${i}" data-deck-index="${i}">
        ${cardBackArtHtml('mystic-card-back fan-card-back')}
      </div>`;
  }).join('');

  return `
    <div class="tarot-draw-layout">
      <div class="tarot-draw-main" id="tarot-draw-main"></div>
      <div class="tarot-fan-wrap">
        <p class="tarot-fan-scroll-hint" aria-hidden="true">← 左右滑动浏览牌堆 →</p>
        <div class="tarot-fan" id="tarot-fan">
          <div class="tarot-fan-track">${cards}</div>
        </div>
      </div>
    </div>`;
}

export type DeckFanCallbacks = {
  onDraw: () => void;
  onProgress?: (message: string) => void;
};

const SWIPE_PX = 24;
const SWIPE_FLIP_PX = 36;
const LONG_PRESS_MS = 520;
const PRESS_CANCEL_PX = 30;

function layoutFanCards(
  cards: NodeListOf<HTMLElement>,
  selectedInWindow: number,
): void {
  cards.forEach((card, i) => {
    const offset = i - selectedInWindow;
    const abs = Math.abs(offset);
    const x = offset * 22;
    const rot = offset * 3.4;
    const y = -Math.min(abs * 2.5, 10) - (offset === 0 ? 16 : 0);
    const scale = offset === 0 ? 1.06 : Math.max(0.86, 1 - abs * 0.028);
    card.style.zIndex = String(120 - abs);
    card.style.transform = `translateX(calc(-50% + ${x}px)) rotate(${rot}deg) translateY(${y}px) scale(${scale})`;
    card.classList.toggle('is-selected', offset === 0);
  });
}

function updateDeckIndices(
  cards: NodeListOf<HTMLElement>,
  windowStart: number,
): void {
  cards.forEach((card, i) => {
    card.dataset.deckIndex = String(windowStart + i + 1);
  });
}

export function bindDeckFanInteraction(
  root: HTMLElement,
  callbacks: DeckFanCallbacks,
): () => void {
  const fan = root.querySelector('#tarot-fan') as HTMLElement | null;
  const cards = root.querySelectorAll<HTMLElement>('.fan-card');
  if (!fan || !cards.length) return () => {};

  let windowStart = Math.max(0, Math.floor((DECK_FAN_TOTAL - DECK_FAN_VISIBLE) / 2));
  let selectedInWindow = DECK_FAN_CENTER;
  let startX = 0;
  let startY = 0;
  let pressTimer: number | null = null;
  let charged = false;
  const cleanups: (() => void)[] = [];

  const on = (el: EventTarget, type: string, fn: EventListener): void => {
    el.addEventListener(type, fn);
    cleanups.push(() => el.removeEventListener(type, fn));
  };

  const once = (fn: () => void): void => {
    let called = false;
    const wrapped = (): void => {
      if (called) return;
      called = true;
      fn();
    };
    wrapped();
  };

  const refresh = (): void => {
    updateDeckIndices(cards, windowStart);
    layoutFanCards(cards, selectedInWindow);
  };
  refresh();

  const clearPress = (): void => {
    if (pressTimer !== null) {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    }
    cards.forEach((c) => c.classList.remove('is-charging', 'is-glowing'));
    charged = false;
  };

  const shiftSelection = (delta: -1 | 1): void => {
    if (delta === 1) {
      if (selectedInWindow < DECK_FAN_VISIBLE - 1) {
        selectedInWindow += 1;
      } else if (windowStart < DECK_FAN_TOTAL - DECK_FAN_VISIBLE) {
        windowStart += 1;
      } else {
        fan.classList.add('is-edge-bounce');
        window.setTimeout(() => fan.classList.remove('is-edge-bounce'), 280);
        return;
      }
    } else {
      if (selectedInWindow > 0) {
        selectedInWindow -= 1;
      } else if (windowStart > 0) {
        windowStart -= 1;
      } else {
        fan.classList.add('is-edge-bounce');
        window.setTimeout(() => fan.classList.remove('is-edge-bounce'), 280);
        return;
      }
    }
    refresh();
    callbacks.onProgress?.('继续滑动选牌');
  };

  const onDown = (e: PointerEvent): void => {
    const card = (e.target as HTMLElement).closest('.fan-card') as HTMLElement | null;
    if (card) {
      const idx = Number(card.dataset.fanIndex);
      if (!Number.isNaN(idx)) {
        selectedInWindow = idx;
        refresh();
      }
    }
    startX = e.clientX;
    startY = e.clientY;
    clearPress();
    cards[selectedInWindow]?.classList.add('is-charging');
    callbacks.onProgress?.('左右滑动选牌 · 上滑或长按抽出');
    pressTimer = window.setTimeout(() => {
      charged = true;
      cards[selectedInWindow]?.classList.add('is-glowing');
      callbacks.onProgress?.('松手抽牌');
    }, LONG_PRESS_MS);
    fan.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent): void => {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > PRESS_CANCEL_PX) {
      clearPress();
    }
  };

  const onUp = (e: PointerEvent): void => {
    const dx = e.clientX - startX;
    const dy = startY - e.clientY;

    if (charged && Math.hypot(dx, dy) < 40) {
      clearPress();
      once(callbacks.onDraw);
      return;
    }

    clearPress();

    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      shiftSelection(dx < 0 ? 1 : -1);
      return;
    }

    if (dy >= SWIPE_FLIP_PX && dy > Math.abs(dx)) {
      cards[selectedInWindow]?.classList.add('is-glowing');
      once(callbacks.onDraw);
    }
  };

  fan.classList.add('is-interactive');
  on(fan, 'pointerdown', onDown as EventListener);
  on(fan, 'pointermove', onMove as EventListener);
  on(fan, 'pointerup', onUp as EventListener);
  on(fan, 'pointercancel', clearPress);

  return () => {
    fan.classList.remove('is-interactive', 'is-edge-bounce');
    clearPress();
    cards.forEach((c) => c.classList.remove('is-charging', 'is-glowing', 'is-selected'));
    cleanups.forEach((fn) => fn());
  };
}
