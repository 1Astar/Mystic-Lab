import { describe, expect, it } from 'vitest';
import { castBaziChart } from '../bazi/cast.ts';
import { createEmptyPerson } from '../life/types.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { buildMirrorCompare, getMirrorTheme } from './build-compare.ts';

describe('buildMirrorCompare', () => {
  it('builds six themes with shared / different / synthesis', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const chart = castBaziChart(person, 2026, {
      includeLiunian: false,
      gender: person.gender,
    });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const ziwei = castZiweiChart(person);
    expect('error' in ziwei).toBe(false);
    if ('error' in ziwei) return;

    const pack = buildMirrorCompare(chart, ziwei, {
      personName: person.nickname,
      gender: person.gender,
    });
    expect(pack.themes).toHaveLength(6);
    expect(pack.themes.map((t) => t.id)).toEqual([
      'personality',
      'career',
      'love',
      'wealth',
      'family',
      'health',
    ]);
    for (const t of pack.themes) {
      expect(t.shared.length).toBeGreaterThan(8);
      expect(t.different.length).toBeGreaterThan(8);
      expect(t.synthesis.length).toBeGreaterThan(8);
      expect(t.baziEvidence.length).toBeGreaterThan(0);
      expect(t.ziweiEvidence.length).toBeGreaterThan(0);
    }
    expect(getMirrorTheme(pack, 'career')?.title).toBe('事业');
  });
});
