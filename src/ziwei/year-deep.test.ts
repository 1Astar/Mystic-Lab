import { describe, expect, it } from 'vitest';
import { castZiweiChart } from './cast.ts';
import { buildYearDeepPack } from './year-deep.ts';
import { buildYearTrack } from './year-track.ts';
import type { PersonProfile } from '../life/types.ts';

const person = {
  id: 't-deep',
  nickname: '测',
  relation: 'self',
  gender: 'female',
  birthYear: '2003',
  birthMonth: '2',
  birthDay: '11',
  birthHour: '12',
  lifeTags: [],
} as PersonProfile;

describe('buildYearDeepPack', () => {
  it('builds deduction chain with conclusion and mutagen', () => {
    const view = castZiweiChart(person, { year: 2026 });
    if ('error' in view) throw new Error(view.error);
    const item = buildYearTrack({
      person,
      birthYear: 2003,
      centerYear: 2026,
      nowYear: 2026,
      radius: 0,
    })[0]!;
    const pack = buildYearDeepPack(view, person, item);
    expect(pack.year).toBe(2026);
    expect(pack.conclusion.length).toBeGreaterThan(4);
    expect(pack.chain.length).toBeGreaterThanOrEqual(4);
    expect(pack.chain.some((c) => c.title.includes('流年命宫'))).toBe(true);
    expect(pack.chain.some((c) => c.title.includes('三方四正'))).toBe(true);
    expect(pack.relatedPalaces.length).toBeGreaterThan(0);
  });
});
