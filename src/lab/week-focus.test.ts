import { describe, expect, it } from 'vitest';
import {
  dominantLabel,
  pickFromPool,
  weekFocusIndex,
  WEEK_FOCUS_BASICS,
} from './week-focus.ts';

describe('week-focus', () => {
  it('weekFocusIndex is stable for same week and in range', () => {
    const a = weekFocusIndex('2026-08-10', 10);
    const b = weekFocusIndex('2026-08-10', 10);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(10);
  });

  it('different weeks often differ (smoke)', () => {
    const a = weekFocusIndex('2026-08-10', 10);
    const b = weekFocusIndex('2026-08-17', 10);
    // not a hard guarantee for all hashes, but these two should differ
    expect(a).not.toBe(b);
  });

  it('dominantLabel picks majority then first on tie', () => {
    expect(dominantLabel(['比肩', '食神', '比肩', '正印'])).toBe('比肩');
    expect(dominantLabel(['食神', '正印'])).toBe('食神');
    expect(dominantLabel([])).toBeNull();
  });

  it('pickFromPool returns null on empty', () => {
    expect(pickFromPool([], '2026-08-10')).toBeNull();
  });

  it('basics pool covers major systems', () => {
    const systems = new Set(WEEK_FOCUS_BASICS.map((x) => x.system));
    expect(systems.has('ziwei')).toBe(true);
    expect(systems.has('bazi')).toBe(true);
    expect(systems.has('tarot')).toBe(true);
    expect(systems.has('liuyao')).toBe(true);
  });

  it('same week picks same basics card', () => {
    const w = '2026-08-10';
    expect(pickFromPool(WEEK_FOCUS_BASICS, w)?.title).toBe(
      pickFromPool(WEEK_FOCUS_BASICS, w)?.title,
    );
  });
});
