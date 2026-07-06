import type { RitualInputCallbacks, RitualInputStep } from './ritual-input.ts';

const SHAKE_THRESHOLD = 14;
const SHAKE_COOLDOWN_MS = 900;
const HOLD_DRAW_MS = 1200;
const MIN_PATH_LEN = 48;
const MIN_CIRCLE_ANGLE = Math.PI * 1.2;
const HORIZONTAL_LINE_RATIO = 2;

type Point = { x: number; y: number; t: number };

export function bindFreeDrawInput(
  container: HTMLElement,
  step: RitualInputStep,
  callbacks: RitualInputCallbacks,
  hasMotion: boolean,
): () => void {
  const cleanups: (() => void)[] = [];
  let fired = false;

  function once(cb: () => void): void {
    if (fired) return;
    fired = true;
    cb();
  }

  function on(el: HTMLElement | Window, type: string, handler: EventListener, opts?: AddEventListenerOptions): void {
    el.addEventListener(type, handler, opts);
    cleanups.push(() => el.removeEventListener(type, handler, opts));
  }

  if (step === 'ritual') {
    const ritual = container.querySelector('.ritual-enter');
    const target = (ritual ?? container) as HTMLElement;
    target.classList.add('is-tappable');
    const tap = (): void => once(callbacks.onRitualTap);
    on(target, 'click', tap);
    on(target, 'touchend', (e) => {
      e.preventDefault();
      tap();
    }, { passive: false });
    return () => {
      target.classList.remove('is-tappable');
      cleanups.forEach((fn) => fn());
    };
  }

  const overlay = document.createElement('div');
  overlay.className = 'free-draw-layer';
  const canvas = document.createElement('canvas');
  canvas.className = 'free-draw-canvas';
  const hint = document.createElement('p');
  hint.className = 'free-draw-hint';

  const resize = (): void => {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = Math.min(rect.height, 280);
  };
  resize();
  overlay.append(hint, canvas);
  container.prepend(overlay);

  const ctx = canvas.getContext('2d');
  let points: Point[] = [];
  let drawing = false;
  let holdTimer: number | null = null;
  let holdStart = 0;
  let lastShake = 0;

  function drawPath(): void {
    if (!ctx || points.length < 2) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  function pathLength(): number {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return len;
  }

  function pathIsCircle(): boolean {
    if (points.length < 8) return false;
    let cx = 0;
    let cy = 0;
    for (const p of points) {
      cx += p.x;
      cy += p.y;
    }
    cx /= points.length;
    cy /= points.length;
    const r = Math.hypot(points[0].x - cx, points[0].y - cy);
    if (r < 20) return false;
    let angleSum = 0;
    for (let i = 1; i < points.length; i++) {
      const a1 = Math.atan2(points[i - 1].y - cy, points[i - 1].x - cx);
      const a2 = Math.atan2(points[i].y - cy, points[i].x - cx);
      let d = a2 - a1;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      angleSum += Math.abs(d);
    }
    return angleSum >= MIN_CIRCLE_ANGLE;
  }

  function pathIsHorizontalLine(): boolean {
    if (points.length < 4) return false;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    return width >= MIN_PATH_LEN && width > height * HORIZONTAL_LINE_RATIO;
  }

  function onShake(): void {
    const now = Date.now();
    if (now - lastShake < SHAKE_COOLDOWN_MS) return;
    lastShake = now;
    overlay.classList.add('is-shaking');
    window.setTimeout(() => overlay.classList.remove('is-shaking'), 400);
    if (step === 'shuffle') {
      callbacks.onProgress?.('星尘震动…');
      once(callbacks.onShuffle);
    } else if (step === 'cut') {
      callbacks.onProgress?.('牌堆分开…');
      once(callbacks.onCut);
    }
  }

  if (hasMotion && (step === 'shuffle' || step === 'cut')) {
    const motionHandler = (e: Event): void => {
      const ev = e as DeviceMotionEvent;
      const a = ev.accelerationIncludingGravity;
      if (a?.x == null || a?.y == null || a?.z == null) return;
      const mag = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);
      if (mag > SHAKE_THRESHOLD) onShake();
    };
    on(window, 'devicemotion', motionHandler);
  }

  if (step === 'shuffle') {
    hint.textContent = hasMotion
      ? '摇一摇洗牌，或在屏幕上画一个圈'
      : '在屏幕上画一个圈完成洗牌';
  } else if (step === 'cut') {
    hint.textContent = hasMotion
      ? '再摇一次切牌，或横划一条线'
      : '横划一条线完成切牌';
  } else if (step === 'draw') {
    hint.textContent = '画下你此刻的念头，或按住觉得可以了就松开';
  } else {
    hint.remove();
    canvas.remove();
  }

  const local = (e: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, t: Date.now() };
  };

  const onDown = (e: PointerEvent): void => {
    if (step === 'draw') {
      holdStart = Date.now();
      holdTimer = window.setTimeout(() => {
        callbacks.onProgress?.('可以松手了…');
      }, HOLD_DRAW_MS * 0.7);
    }
    if (step === 'shuffle' || step === 'cut' || step === 'draw') {
      drawing = true;
      points = [local(e)];
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const onMove = (e: PointerEvent): void => {
    if (!drawing) return;
    points.push(local(e));
    drawPath();
  };

  const onUp = (): void => {
    if (holdTimer !== null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }

    if (step === 'draw') {
      const held = Date.now() - holdStart >= HOLD_DRAW_MS;
      const drew = pathLength() >= MIN_PATH_LEN;
      if (held || drew) {
        once(callbacks.onDraw);
        return;
      }
    }

    if (step === 'shuffle' && pathIsCircle()) {
      once(callbacks.onShuffle);
      return;
    }

    if (step === 'cut' && pathIsHorizontalLine()) {
      once(callbacks.onCut);
      return;
    }

    drawing = false;
    points = [];
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (step === 'shuffle' || step === 'cut' || step === 'draw') {
    on(canvas, 'pointerdown', onDown as EventListener);
    on(canvas, 'pointermove', onMove as EventListener);
    on(canvas, 'pointerup', onUp);
    on(canvas, 'pointercancel', onUp);
  }

  return () => {
    overlay.remove();
    if (holdTimer !== null) window.clearTimeout(holdTimer);
    cleanups.forEach((fn) => fn());
  };
}

/** 请求 iOS 设备运动权限（需在用户手势内调用） */
export async function requestMotionPermission(): Promise<boolean> {
  const dm = DeviceMotionEvent as typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  if (typeof dm.requestPermission !== 'function') return true;
  try {
    return (await dm.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}
