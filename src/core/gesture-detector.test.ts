import { describe, expect, it, beforeEach } from 'vitest';
import { PinchDetector, type Landmark } from './gesture-detector.ts';

function mockHand(pinchDist: number): Landmark[] {
  const hand: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  hand[0] = { x: 0.5, y: 0.5, z: 0 };
  hand[4] = { x: 0.5, y: 0.5, z: 0 };
  hand[8] = { x: 0.5 + pinchDist, y: 0.5, z: 0 };
  return hand;
}

describe('PinchDetector', () => {
  let detector: PinchDetector;

  beforeEach(() => {
    detector = new PinchDetector();
  });

  it('returns null when hand is far from pinch', () => {
    expect(detector.update(mockHand(0.2))).toBeNull();
  });

  it('requires hold duration before confirmed', () => {
    const hand = mockHand(0.02);
    for (let i = 0; i < 5; i++) {
      const result = detector.update(hand);
      expect(result === 'confirmed').toBe(false);
    }
  });
});
