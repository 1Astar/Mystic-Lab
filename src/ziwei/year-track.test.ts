import { describe, expect, it } from 'vitest';
import { buildYearTrack } from './year-track.ts';
import type { PersonProfile } from '../life/types.ts';

const person = {
  id: 't',
  nickname: '测',
  relation: 'self',
  gender: 'female',
  birthYear: '2003',
  birthMonth: '2',
  birthDay: '11',
  birthHour: '12',
  lifeTags: [],
} as PersonProfile;

describe('buildYearTrack', () => {
  it('builds past/present/future tones around now', () => {
    const items = buildYearTrack({
      person,
      birthYear: 2003,
      centerYear: 2026,
      nowYear: 2026,
      radius: 2,
    });
    expect(items.map((i) => i.year)).toEqual([2024, 2025, 2026, 2027, 2028]);
    expect(items.find((i) => i.year === 2025)?.tense).toBe('past');
    expect(items.find((i) => i.year === 2026)?.tense).toBe('present');
    expect(items.find((i) => i.year === 2027)?.tense).toBe('future');
    expect(items.find((i) => i.year === 2026)?.tenseLabel).toBe('正在经历');
    expect(items.find((i) => i.year === 2025)?.tenseLabel).toBe('人生回顾');
    expect(items.find((i) => i.year === 2027)?.tenseLabel).toBe('趋势预览');
  });

  it('includes year palace and mutagen for selected years', () => {
    const items = buildYearTrack({
      person,
      birthYear: 2003,
      centerYear: 2026,
      nowYear: 2026,
      radius: 1,
    });
    const y26 = items.find((i) => i.year === 2026)!;
    expect(y26.yearPalace.length).toBeGreaterThan(0);
    expect(y26.chipLabel.length).toBeGreaterThan(0);
    expect(y26.theme.length).toBeGreaterThan(4);
    expect(y26.possibles.length).toBeGreaterThanOrEqual(2);
    expect(y26.watchFocus.length).toBeGreaterThan(4);
  });
});
