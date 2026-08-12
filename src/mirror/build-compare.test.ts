import { describe, expect, it } from 'vitest';
import { castBaziChart } from '../bazi/cast.ts';
import { buildLuckCycles } from '../bazi/luck-cycles.ts';
import { createEmptyPerson } from '../life/types.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { buildMirrorCompare, getMirrorTheme } from './build-compare.ts';
import { buildMirrorTimeline } from './build-timeline.ts';

describe('buildMirrorCompare', () => {
  it('builds six themes with shared / different / synthesis grounded in chart', () => {
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

    const luck = buildLuckCycles(person, person.gender, 2026);
    const pack = buildMirrorCompare(chart, ziwei, {
      personName: person.nickname,
      gender: person.gender,
      person,
      luck,
      focusYear: 2026,
      nowYear: 2026,
      timelineRadius: 2,
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
      expect(t.shared.length).toBeGreaterThan(20);
      expect(t.different.length).toBeGreaterThan(20);
      expect(t.synthesis.length).toBeGreaterThan(16);
      expect(t.baziEvidence.length).toBeGreaterThan(0);
      expect(t.ziweiEvidence.length).toBeGreaterThan(0);
      expect(t.shared).toMatch(/共同指向/);
      expect(t.different).toMatch(/不同角度|八字|紫微/);
      expect(t.changeNote.length).toBeGreaterThan(8);
    }
    expect(getMirrorTheme(pack, 'career')?.title).toBe('事业');
    expect(pack.timeline.length).toBeGreaterThanOrEqual(3);
    expect(pack.timeline.some((r) => r.year === 2026)).toBe(true);
  });
});

describe('buildMirrorTimeline', () => {
  it('aligns bazi luck and ziwei year palace per year', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'male',
      birthYear: '1988',
      birthMonth: '3',
      birthDay: '8',
      birthHour: '09:00',
      birthPlace: '上海',
    });
    const rows = buildMirrorTimeline({
      person,
      gender: 'male',
      birthYear: 1988,
      centerYear: 2026,
      radius: 1,
      nowYear: 2026,
    });
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.baziDayun.length).toBeGreaterThan(2);
      expect(r.baziLiunian.length).toBeGreaterThan(2);
      expect(r.compare).toMatch(String(r.year));
    }
    const cur = rows.find((r) => r.current);
    expect(cur?.year).toBe(2026);
  });
});
