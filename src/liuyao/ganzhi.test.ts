import { describe, expect, it } from 'vitest';
import { siZhuFromDate } from './ganzhi.ts';

describe('siZhuFromDate', () => {
  it('returns four pillars and day stem for a fixed local datetime', () => {
    const d = new Date(2026, 6, 17, 9, 34, 0);
    const sz = siZhuFromDate(d);
    expect(sz.year.length).toBe(2);
    expect(sz.month.length).toBe(2);
    expect(sz.day.length).toBe(2);
    expect(sz.hour.length).toBe(2);
    expect(sz.dayStem).toHaveLength(1);
    expect(sz.dayXunKong.length).toBeGreaterThan(0);
  });
});
