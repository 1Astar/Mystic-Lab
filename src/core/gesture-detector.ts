export type Landmark = { x: number; y: number; z: number };

const PINCH_DISTANCE = 0.08;
const PINCH_HOLD_MS = 300;
const STABILITY_WINDOW = 8;
const STABILITY_MAX_MOVE = 0.045;
const SWIPE_MIN_DELTA = 0.1;
const SWIPE_WINDOW_MS = 600;
const HOLD_CONFIRM_MS = 1000;
const JOINED_PALMS_MS = 400;
const JOINED_PALMS_MAX_DIST = 0.32;
const HELD_GESTURE_MS = 700;

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function wristMove(samples: Landmark[]): number {
  if (samples.length < 2) return 0;
  const first = samples[0];
  const last = samples[samples.length - 1];
  return dist(first, last);
}

export class PinchDetector {
  private startAt: number | null = null;
  private wristSamples: Landmark[] = [];

  reset(): void {
    this.startAt = null;
    this.wristSamples = [];
  }

  update(landmarks: Landmark[] | null): 'pinching' | 'confirmed' | null {
    if (!landmarks || landmarks.length < 9) {
      this.reset();
      return null;
    }

    const thumb = landmarks[4];
    const index = landmarks[8];
    const wrist = landmarks[0];
    if (!thumb || !index || !wrist) return null;

    this.wristSamples.push(wrist);
    if (this.wristSamples.length > STABILITY_WINDOW) {
      this.wristSamples.shift();
    }

    const pinchDist = dist(thumb, index);
    const stable = wristMove(this.wristSamples) <= STABILITY_MAX_MOVE;

    if (pinchDist < PINCH_DISTANCE && stable) {
      if (!this.startAt) this.startAt = Date.now();
      if (Date.now() - this.startAt >= PINCH_HOLD_MS) return 'confirmed';
      return 'pinching';
    }

    this.startAt = null;
    return null;
  }
}

export class SwipeDetector {
  private samples: { x: number; t: number }[] = [];

  reset(): void {
    this.samples = [];
  }

  update(wrist: Landmark | null): 'left' | 'right' | 'up' | 'down' | null {
    if (!wrist) {
      this.reset();
      return null;
    }

    const now = Date.now();
    this.samples.push({ x: wrist.x, t: now });
    this.samples = this.samples.filter((s) => now - s.t <= SWIPE_WINDOW_MS);

    if (this.samples.length < 3) return null;

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dx = last.x - first.x;

    if (Math.abs(dx) >= SWIPE_MIN_DELTA) {
      this.reset();
      return dx > 0 ? 'right' : 'left';
    }
    return null;
  }
}

export class VerticalSwipeDetector {
  private samples: { y: number; t: number }[] = [];

  reset(): void {
    this.samples = [];
  }

  update(wrist: Landmark | null): 'up' | 'down' | null {
    if (!wrist) {
      this.reset();
      return null;
    }

    const now = Date.now();
    this.samples.push({ y: wrist.y, t: now });
    this.samples = this.samples.filter((s) => now - s.t <= SWIPE_WINDOW_MS);

    if (this.samples.length < 3) return null;

    const dy = this.samples[this.samples.length - 1].y - this.samples[0].y;
    if (Math.abs(dy) >= SWIPE_MIN_DELTA) {
      this.reset();
      return dy < 0 ? 'up' : 'down';
    }
    return null;
  }
}

export class HoldDetector {
  private startAt: number | null = null;

  reset(): void {
    this.startAt = null;
  }

  update(stable: boolean): boolean {
    if (!stable) {
      this.startAt = null;
      return false;
    }
    if (!this.startAt) this.startAt = Date.now();
    return Date.now() - this.startAt >= HOLD_CONFIRM_MS;
  }
}

export class JoinedPalmsDetector {
  private startAt: number | null = null;

  reset(): void {
    this.startAt = null;
  }

  update(hands: Landmark[][] | null): boolean {
    if (!hands || hands.length < 2) {
      this.reset();
      return false;
    }

    const w0 = hands[0][0];
    const w1 = hands[1][0];
    if (!w0 || !w1) return false;

    if (dist(w0, w1) <= JOINED_PALMS_MAX_DIST) {
      if (!this.startAt) this.startAt = Date.now();
      return Date.now() - this.startAt >= JOINED_PALMS_MS;
    }

    this.reset();
    return false;
  }
}

/** 单手保持某手势一段时间（如张掌进入仪式） */
export class HeldGestureDetector {
  private startAt: number | null = null;
  private lastGesture: string | null = null;

  reset(): void {
    this.startAt = null;
    this.lastGesture = null;
  }

  update(gesture: string | null, allowed: string[]): boolean {
    if (!gesture || !allowed.includes(gesture)) {
      this.reset();
      return false;
    }
    if (gesture !== this.lastGesture) {
      this.lastGesture = gesture;
      this.startAt = Date.now();
      return false;
    }
    if (!this.startAt) this.startAt = Date.now();
    return Date.now() - this.startAt >= HELD_GESTURE_MS;
  }
}

export function isHandStable(landmarks: Landmark[] | null): boolean {
  if (!landmarks?.[0]) return false;
  return true;
}

export const GESTURE_LABELS: Record<string, string> = {
  Closed_Fist: '握拳',
  Open_Palm: '张掌',
  Thumb_Up: '竖拇指',
  Victory: '比耶',
  Pointing_Up: '指向上',
  ILoveYou: '我爱你手势',
};
