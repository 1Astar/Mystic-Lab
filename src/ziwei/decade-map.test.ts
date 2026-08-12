import { describe, expect, it } from 'vitest';
import {
  decadeUnlockLabel,
  decadeUnlockState,
  isDecadeUnlocked,
  virtualAgeAt,
} from './decade-map.ts';

describe('decade-map unlock', () => {
  it('virtual age uses year - birth + 1', () => {
    expect(virtualAgeAt(1996, new Date('2026-08-12'))).toBe(31);
  });

  it('locks future decades and marks current', () => {
    expect(decadeUnlockState(40, 49, 31)).toBe('locked');
    expect(decadeUnlockState(30, 39, 31)).toBe('current');
    expect(decadeUnlockState(20, 29, 31)).toBe('unlocked');
    expect(isDecadeUnlocked(40, 49, 31)).toBe(false);
    expect(isDecadeUnlocked(20, 29, 31)).toBe(true);
  });

  it('labels locked with age window', () => {
    expect(decadeUnlockLabel('locked', 40, 49)).toMatch(/40–49/);
    expect(decadeUnlockLabel('current', 30, 39)).toBe('进行中');
  });
});
