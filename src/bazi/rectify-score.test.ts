import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { scoreHourCandidates } from './rectify-score.ts';
import type { RectifyEvent } from './rectify-events.ts';

const base = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthPlace: '北京',
};

const events: RectifyEvent[] = [
  { id: '1', year: 2018, type: 'career', note: '', yearSlack: 0 },
  { id: '2', year: 2020, type: 'move', note: '', yearSlack: 1 },
  { id: '3', year: 2021, type: 'study', note: '', yearSlack: 0 },
];

describe('scoreHourCandidates', () => {
  it('ranks afternoon candidates with reproducible scores', () => {
    const a = scoreHourCandidates(base, 'female', { kind: 'afternoon' }, events);
    const b = scoreHourCandidates(base, 'female', { kind: 'afternoon' }, events);
    expect(a.length).toBe(3);
    expect(a.map((r) => r.candidate.branch)).toEqual(b.map((r) => r.candidate.branch));
    expect(a.map((r) => r.score)).toEqual(b.map((r) => r.score));
    expect(a[0]!.score).toBeGreaterThanOrEqual(a[a.length - 1]!.score);
    expect(a[0]!.rationale.length).toBeGreaterThan(0);
  });

  it('returns empty when fewer than 3 events', () => {
    expect(scoreHourCandidates(base, '', { kind: 'morning' }, events.slice(0, 2))).toEqual([]);
  });
});
