export type RitualInputStep =
  | 'ritual'
  | 'shuffle'
  | 'cut'
  | 'draw'
  | 'flip'
  | 'reading'
  | 'readingZoom'
  | 'confirm';

export type RitualInputCallbacks = {
  onRitualTap: () => void;
  onShuffle: () => void;
  onCut: () => void;
  onDraw: () => void;
  onFlip: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onConfirm: () => void;
  onProgress?: (text: string) => void;
};

const SWIPE_CUT_PX = 72;
const SWIPE_FLIP_PX = 56;
const SHUFFLE_DISTANCE_PX = 140;
const LONG_PRESS_MS = 800;
const HOLD_CONFIRM_MS = 1000;

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function bindRitualInput(
  container: HTMLElement,
  step: RitualInputStep,
  callbacks: RitualInputCallbacks,
): () => void {
  const cleanups: (() => void)[] = [];
  let fired = false;

  function once(cb: () => void): void {
    if (fired) return;
    fired = true;
    cb();
  }

  function on(el: HTMLElement | Document, type: string, handler: EventListener, opts?: AddEventListenerOptions): void {
    el.addEventListener(type, handler, opts);
    cleanups.push(() => el.removeEventListener(type, handler, opts));
  }

  if (step === 'ritual') {
    const ritual = container.querySelector('.ritual-enter');
    const target = ritual ?? container;
    target.classList.add('is-tappable');
    on(target as HTMLElement, 'click', () => once(callbacks.onRitualTap));
    on(target as HTMLElement, 'touchend', (e) => {
      e.preventDefault();
      once(callbacks.onRitualTap);
    }, { passive: false });
    return () => {
      target.classList.remove('is-tappable');
      cleanups.forEach((fn) => fn());
    };
  }

  if (step === 'shuffle') {
    const deck = container.querySelector('#tarot-deck') as HTMLElement | null;
    if (!deck) return () => {};

    let startX = 0;
    let startY = 0;
    let totalDist = 0;
    let angleSum = 0;
    let lastAngle: number | null = null;
    let centerX = 0;
    let centerY = 0;

    const reset = (): void => {
      totalDist = 0;
      angleSum = 0;
      lastAngle = null;
    };

    const onDown = (e: PointerEvent): void => {
      deck.setPointerCapture(e.pointerId);
      const rect = deck.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      startX = e.clientX;
      startY = e.clientY;
      reset();
    };

    const onMove = (e: PointerEvent): void => {
      totalDist += dist(startX, startY, e.clientX, e.clientY);
      startX = e.clientX;
      startY = e.clientY;

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      if (lastAngle !== null) {
        let delta = angle - lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        angleSum += Math.abs(delta);
      }
      lastAngle = angle;

      deck.style.transform = `rotate(${Math.sin(totalDist / 30) * 12}deg) translateX(${Math.sin(totalDist / 20) * 8}px)`;
      callbacks.onProgress?.('继续滑动或画圈…');

      if (totalDist >= SHUFFLE_DISTANCE_PX || angleSum >= Math.PI * 1.5) {
        deck.style.transform = '';
        once(callbacks.onShuffle);
      }
    };

    const onUp = (): void => {
      deck.style.transform = '';
      reset();
    };

    deck.classList.add('is-interactive');
    on(deck, 'pointerdown', onDown as EventListener);
    on(deck, 'pointermove', onMove as EventListener);
    on(deck, 'pointerup', onUp);
    on(deck, 'pointercancel', onUp);
    return () => {
      deck.classList.remove('is-interactive');
      deck.style.transform = '';
      cleanups.forEach((fn) => fn());
    };
  }

  if (step === 'cut') {
    const deck = container.querySelector('#tarot-deck') as HTMLElement | null;
    if (!deck) return () => {};

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onDown = (e: PointerEvent): void => {
      tracking = true;
      startX = e.clientX;
      startY = e.clientY;
      deck.setPointerCapture(e.pointerId);
    };

    const onUp = (e: PointerEvent): void => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) >= SWIPE_CUT_PX && Math.abs(dx) > Math.abs(dy)) {
        deck.classList.add('is-cut-triggered');
        once(callbacks.onCut);
      }
    };

    deck.classList.add('is-interactive');
    on(deck, 'pointerdown', onDown as EventListener);
    on(deck, 'pointerup', onUp as EventListener);
    on(deck, 'pointercancel', onUp as EventListener);
    return () => {
      deck.classList.remove('is-interactive', 'is-cut-triggered');
      cleanups.forEach((fn) => fn());
    };
  }

  if (step === 'draw') {
    const cards = container.querySelectorAll<HTMLElement>('.fan-card');
    if (!cards.length) return () => {};

    cards.forEach((card) => {
      let pressTimer: number | null = null;
      let charged = false;
      let startX = 0;
      let startY = 0;

      const clear = (): void => {
        if (pressTimer !== null) {
          window.clearTimeout(pressTimer);
          pressTimer = null;
        }
        card.classList.remove('is-charging', 'is-glowing');
        charged = false;
      };

      const onDown = (e: PointerEvent): void => {
        startX = e.clientX;
        startY = e.clientY;
        card.classList.add('is-charging');
        callbacks.onProgress?.('长按中…');
        pressTimer = window.setTimeout(() => {
          charged = true;
          card.classList.add('is-glowing');
          callbacks.onProgress?.('松手抽牌');
        }, LONG_PRESS_MS);
        card.setPointerCapture(e.pointerId);
      };

      const onUp = (e: PointerEvent): void => {
        const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
        const ok = charged && moved < 32;
        clear();
        if (ok) once(callbacks.onDraw);
      };

      card.classList.add('is-interactive');
      on(card, 'pointerdown', onDown as EventListener);
      on(card, 'pointerup', onUp as EventListener);
      on(card, 'pointercancel', clear);
    });

    return () => {
      cards.forEach((c) => c.classList.remove('is-interactive', 'is-charging', 'is-glowing'));
      cleanups.forEach((fn) => fn());
    };
  }

  if (step === 'flip') {
    const cardSlot = container.querySelector('.tarot-slot-single') as HTMLElement | null;
    if (!cardSlot) return () => {};

    let startY = 0;

    const onDown = (e: PointerEvent): void => {
      startY = e.clientY;
      cardSlot.setPointerCapture(e.pointerId);
    };

    const onUp = (e: PointerEvent): void => {
      if (startY - e.clientY >= SWIPE_FLIP_PX) {
        once(callbacks.onFlip);
      }
    };

    cardSlot.classList.add('is-interactive');
    on(cardSlot, 'pointerdown', onDown as EventListener);
    on(cardSlot, 'pointerup', onUp as EventListener);
    on(cardSlot, 'dblclick', () => once(callbacks.onFlip));
    return () => {
      cardSlot.classList.remove('is-interactive');
      cleanups.forEach((fn) => fn());
    };
  }

  if (step === 'reading' || step === 'readingZoom') {
    const view = container.querySelector('.reading-view') as HTMLElement | null;
    if (!view) return () => {};

    let startY = 0;

    const onDown = (e: PointerEvent): void => {
      startY = e.clientY;
      view.setPointerCapture(e.pointerId);
    };

    const onUp = (e: PointerEvent): void => {
      const dy = startY - e.clientY;
      if (dy >= SWIPE_FLIP_PX && step === 'reading') once(callbacks.onZoomIn);
      if (dy <= -SWIPE_FLIP_PX && step === 'readingZoom') once(callbacks.onZoomOut);
    };

    view.classList.add('is-interactive');
    on(view, 'pointerdown', onDown as EventListener);
    on(view, 'pointerup', onUp as EventListener);
    return () => {
      view.classList.remove('is-interactive');
      cleanups.forEach((fn) => fn());
    };
  }

  if (step === 'confirm') {
    let holdTimer: number | null = null;

    const onDown = (): void => {
      callbacks.onProgress?.('按住确认…');
      holdTimer = window.setTimeout(() => once(callbacks.onConfirm), HOLD_CONFIRM_MS);
    };

    const onUp = (): void => {
      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    container.classList.add('is-interactive');
    on(container, 'pointerdown', onDown);
    on(container, 'pointerup', onUp);
    on(container, 'pointercancel', onUp);
    return () => {
      container.classList.remove('is-interactive');
      if (holdTimer !== null) window.clearTimeout(holdTimer);
      cleanups.forEach((fn) => fn());
    };
  }

  return () => cleanups.forEach((fn) => fn());
}
