import { describe, expect, it } from 'vitest';
import { castBaziChart } from '../bazi/cast.ts';
import { EMPTY_PROFILE } from '../life/types.ts';
import { buildWardrobePack } from './build-pack.ts';

const PROFILE = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

describe('buildWardrobePack', () => {
  it('builds natal chips + today + 7 week days', () => {
    const chart = castBaziChart(PROFILE, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;

    const pack = buildWardrobePack(chart, new Date(2026, 7, 12));
    expect(pack.chips.some((c) => c.role === 'primary')).toBe(true);
    expect(pack.style.materials.length).toBeGreaterThan(0);
    expect(pack.style.summary).toBeTruthy();
    expect(pack.natalWhy.length).toBeGreaterThan(1);
    expect(pack.week).toHaveLength(7);
    expect(pack.today.tip).toBeTruthy();
    expect(pack.today.tag).toBeTruthy();
    expect(pack.natalWhy.join(' ')).not.toMatch(/忌穿|倒霉|缺什么/);
    expect(pack.today.tip).not.toMatch(/忌穿|倒霉/);
  });

  it('changes today tip across different dates', () => {
    const chart = castBaziChart(PROFILE, 2026, { includeLiunian: false });
    if ('error' in chart) return;
    const a = buildWardrobePack(chart, new Date(2026, 7, 10));
    const b = buildWardrobePack(chart, new Date(2026, 7, 12));
    expect(a.today.dateKey).not.toBe(b.today.dateKey);
    expect(a.today.ganZhi || a.today.tag).toBeTruthy();
  });
});
