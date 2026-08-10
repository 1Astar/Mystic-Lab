import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { scoreHourCandidates, provisionalAdvice } from './rectify-score.ts';
import type { RectifyEvent } from './rectify-events.ts';

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

describe('scoreHourCandidates', () => {
  it('ranks afternoon candidates with reproducible scores', () => {
    const a = scoreHourCandidates(base, 'female', { kind: 'afternoon' }, events);
    const b = scoreHourCandidates(base, 'female', { kind: 'afternoon' }, events);
    expect(a.length).toBe(3);
    expect(a.map((r) => r.candidate.branch)).toEqual(b.map((r) => r.candidate.branch));
    expect(a.map((r) => r.score)).toEqual(b.map((r) => r.score));
    expect(a[0]!.score).toBeGreaterThanOrEqual(a[a.length - 1]!.score);
    expect(a[0]!.rationale.length).toBeGreaterThan(0);
    expect(a[0]!.confidencePct).toBeGreaterThan(30);
    expect(a[0]!.summary.length).toBeGreaterThan(8);
  });

  it('filters keptBranches to 2–4', () => {
    const ranked = scoreHourCandidates(base, 'female', { kind: 'afternoon' }, events, {
      keptBranches: ['午', '未'],
    });
    expect(ranked.map((r) => r.candidate.branch).sort()).toEqual(['午', '未']);
  });

  it('returns empty when fewer than 3 events', () => {
    expect(scoreHourCandidates(base, '', { kind: 'morning' }, events.slice(0, 2))).toEqual([]);
  });

  it('allows ongoing mode with 1 event', () => {
    const one = [events[0]!];
    const ranked = scoreHourCandidates(base, 'female', { kind: 'afternoon' }, one, {
      mode: 'ongoing',
    });
    expect(ranked.length).toBe(3);
  });

  it('builds provisional advice', () => {
    const ranked = scoreHourCandidates(base, 'female', { kind: 'evening' }, events);
    const tip = provisionalAdvice(ranked);
    expect(tip).toMatch(/优先采用|暂无可用/);
  });
});
