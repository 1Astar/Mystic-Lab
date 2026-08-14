import { beforeEach, describe, expect, it } from 'vitest';
import {
  createLightGuessStore,
  lightGuessDayKey,
  pickDailyLightGuess,
} from './light-guess.ts';
import { ZIWEI_GUESS_CARDS } from '../ziwei/guess-pack.ts';
import { TAROT_GUESS_CARDS } from '../tarot/guess-pack.ts';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
});

describe('light-guess', () => {
  it('day key is yyyy-mm-dd', () => {
    expect(lightGuessDayKey(new Date(2026, 7, 14))).toBe('2026-08-14');
  });

  it('same day picks same ziwei card', () => {
    const a = pickDailyLightGuess(ZIWEI_GUESS_CARDS, '2026-08-14');
    const b = pickDailyLightGuess(ZIWEI_GUESS_CARDS, '2026-08-14');
    expect(a.id).toBe(b.id);
  });

  it('packs have unique ids and valid answers', () => {
    for (const pack of [ZIWEI_GUESS_CARDS, TAROT_GUESS_CARDS]) {
      const ids = new Set(pack.map((c) => c.id));
      expect(ids.size).toBe(pack.length);
      for (const c of pack) {
        expect(c.options.some((o) => o.id === c.answerId)).toBe(true);
        expect(c.clues.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('store saves one answer per day', () => {
    const key = 'mystic-lab-test-guess-v1';
    const store = createLightGuessStore(key);
    const card = ZIWEI_GUESS_CARDS[0]!;
    const rec = store.saveAnswer(card, card.answerId, '2026-08-14');
    expect(rec.correct).toBe(true);
    expect(store.getTodayRecord('2026-08-14')?.cardId).toBe(card.id);
    store.__resetForTest();
  });
});
