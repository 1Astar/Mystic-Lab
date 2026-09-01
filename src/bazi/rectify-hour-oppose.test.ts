import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import {
  applyDetectiveAnswer,
  createDetectiveEngine,
  rankDetectiveBranches,
} from './rectify-detective-engine.ts';
import { buildHourOpposePairs } from './rectify-hour-oppose.ts';
import { IDEAL_EVENT_GUIDES, createEmptyEvent } from './rectify-events.ts';

const base = {
  ...EMPTY_PROFILE,
  birthYear: '1970',
  birthMonth: '3',
  birthDay: '29',
  birthPlace: '北京',
};

describe('rectify-hour-oppose', () => {
  it('builds opposing pairs for top2 branches', () => {
    let state = createDetectiveEngine(base)!;
    for (const [q, o] of [
      ['obj-slot', 'unknown'],
      ['obj-daynight', 'unsure'],
      ['obj-meal', 'no'],
      ['per-weather', 'fire'],
      ['per-work', 'create'],
      ['per-family', 'express'],
      ['per-anger', 'burst'],
      ['per-social', 'center'],
    ] as const) {
      ({ state } = applyDetectiveAnswer(state, q, o));
    }
    const ranked = rankDetectiveBranches(state);
    const pairs = buildHourOpposePairs(ranked[0]!.profile, ranked[1]!.profile);
    expect(pairs.length).toBeGreaterThanOrEqual(3);
    for (const p of pairs) {
      expect(p.left).not.toBe(p.right);
      expect(p.topic.length).toBeGreaterThan(2);
    }
  });
});

describe('ideal event guides', () => {
  it('lists core ideal event types', () => {
    expect(IDEAL_EVENT_GUIDES.length).toBeGreaterThanOrEqual(5);
    expect(IDEAL_EVENT_GUIDES.some((g) => g.type === 'enroll')).toBe(true);
    expect(createEmptyEvent().precision).toBe('ymd');
  });
});
