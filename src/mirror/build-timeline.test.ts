import { describe, expect, it } from 'vitest';
import { createEmptyPerson } from '../life/types.ts';
import { buildMirrorTimeline } from './build-timeline.ts';

describe('buildMirrorTimeline', () => {
  it('builds year rows with dual-system compare lines', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1992',
      birthMonth: '11',
      birthDay: '3',
      birthHour: '16:20',
      birthPlace: '杭州',
    });
    const rows = buildMirrorTimeline({
      person,
      gender: 'female',
      birthYear: 1992,
      centerYear: 2025,
      radius: 1,
      nowYear: 2026,
    });
    expect(rows.map((r) => r.year)).toEqual([2024, 2025, 2026]);
    expect(rows.every((r) => r.compare.includes('八字'))).toBe(true);
  });
});
