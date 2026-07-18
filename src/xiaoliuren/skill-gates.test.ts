import { describe, expect, it, beforeEach } from 'vitest';
import {
  getSkillGateStatus,
  isCorrectPracticeTap,
  isModeUnlocked,
  isPracticeUnlocked,
  isQuickUnlocked,
  loadSkillGates,
  markLearnClear,
  markPracticeClear,
  PRACTICE_CLEARS_TO_UNLOCK_QUICK,
  practiceTapHint,
} from './skill-gates.ts';

const KEY = 'mystic-lab-xiaoliuren-skill-gates';

function mockLocalStorage(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    },
  });
}

describe('skill gates', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.removeItem(KEY);
  });

  it('starts with only learn unlocked', () => {
    expect(isModeUnlocked('learn')).toBe(true);
    expect(isPracticeUnlocked()).toBe(false);
    expect(isQuickUnlocked()).toBe(false);
    expect(isModeUnlocked('beginner')).toBe(false);
  });

  it('unlocks practice after one learn clear', () => {
    markLearnClear();
    expect(isPracticeUnlocked()).toBe(true);
    expect(isQuickUnlocked()).toBe(false);
    expect(loadSkillGates().learnClears).toBe(1);
  });

  it('unlocks quick after enough practice clears', () => {
    markLearnClear();
    for (let i = 0; i < PRACTICE_CLEARS_TO_UNLOCK_QUICK; i++) {
      expect(isQuickUnlocked()).toBe(false);
      markPracticeClear();
    }
    expect(isQuickUnlocked()).toBe(true);
    const status = getSkillGateStatus();
    expect(status.beginner.unlocked).toBe(true);
    expect(status.beginner.remaining).toBe(0);
  });

  it('judges practice taps along hops', () => {
    const hops = [0, 1, 2, 3];
    expect(isCorrectPracticeTap(hops, 0, 0)).toBe(true);
    expect(isCorrectPracticeTap(hops, 0, 1)).toBe(false);
    expect(isCorrectPracticeTap(hops, 2, 2)).toBe(true);
  });

  it('builds phase hints', () => {
    expect(practiceTapHint('month', 7, 0)).toContain('7');
    expect(practiceTapHint('day', 3, 1)).toContain('还差');
  });
});
