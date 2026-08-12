import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import type { RectifyEvent } from '../bazi/rectify-events.ts';
import {
  dualProvisionalAdvice,
  scoreDualHourCandidates,
} from './dual-rectify-score.ts';

const base = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthPlace: '北京',
};

const events: RectifyEvent[] = [
  { id: '1', year: 2018, type: 'career', note: '', yearSlack: 0, precision: 'ymd' },
  { id: '2', year: 2020, type: 'move', note: '', yearSlack: 1, precision: 'year' },
  { id: '3', year: 2021, type: 'study', note: '', yearSlack: 0, precision: 'ymd' },
];

describe('scoreDualHourCandidates', () => {
  it('ranks with bazi + ziwei + combined confidence', () => {
    const ranked = scoreDualHourCandidates(base, 'female', { kind: 'afternoon' }, events);
    expect(ranked.length).toBe(3);
    for (const row of ranked) {
      expect(row.bazi.confidencePct).toBeGreaterThan(30);
      expect(row.ziweiPct).toBeGreaterThan(30);
      expect(row.combinedPct).toBeGreaterThan(30);
      expect(row.dualSummary).toMatch(/八字解释力/);
      expect(row.dualSummary).toMatch(/紫微解释力/);
    }
    expect(ranked[0]!.combinedPct).toBeGreaterThanOrEqual(
      ranked[ranked.length - 1]!.combinedPct,
    );
    expect(dualProvisionalAdvice(ranked)).toMatch(/双盘建议/);
  });

  it('returns empty without gender', () => {
    expect(scoreDualHourCandidates(base, '', { kind: 'afternoon' }, events)).toEqual([]);
  });

  it('returns empty when events insufficient', () => {
    expect(
      scoreDualHourCandidates(base, 'male', { kind: 'afternoon' }, events.slice(0, 1)),
    ).toEqual([]);
  });
});
