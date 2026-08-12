import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildLuckCycles } from './luck-cycles.ts';
import {
  attitudeOfGod,
  buildShuttleFrame,
  clampShuttleYear,
  decadeShiftCard,
  ganZhiPlainHint,
  shuttleYearRange,
} from './sense-shuttle.ts';
import {
  dayunLoreDecadeNote,
  dayunLoreHint,
} from './codex-jiazi-dayun-lore.ts';

const profile = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

describe('sense-shuttle', () => {
  it('干支拼音翻译', () => {
    expect(ganZhiPlainHint('甲子')).toBe('阳木 + 阳水');
    expect(ganZhiPlainHint('乙丑')).toBe('阴木 + 阴土');
    expect(ganZhiPlainHint('')).toBe('');
  });

  it('换大运知识卡', () => {
    const card = decadeShiftCard('食神', '比肩');
    expect(card?.key).toBe('食神->比肩');
    expect(card?.body).toMatch(/十年大运/);
    expect(card?.body).toMatch(/求稳创造/);
    expect(card?.body).toMatch(/并肩硬刚/);
    expect(decadeShiftCard('食神', '食神')).toBeNull();
    expect(attitudeOfGod('伤官')).toBe('锋芒表达');
  });

  it('年份范围与夹取', () => {
    const range = shuttleYearRange(2005, new Date(2026, 7, 11), 10);
    expect(range.minYear).toBe(2005);
    expect(range.maxYear).toBe(2036);
    expect(clampShuttleYear(1999, range)).toBe(2005);
    expect(clampShuttleYear(2040, range)).toBe(2036);
  });

  it('年帧含天气旁白与云层字段', () => {
    const chart = castBaziChart(profile, 2026, { gender: 'female' });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const luck = buildLuckCycles(profile, 'female', 2026);
    expect(luck).toBeTruthy();
    if (!luck) return;
    const frame = buildShuttleFrame(chart, profile, luck, 2026, {
      gender: 'female',
      now: new Date(2026, 7, 11),
    });
    expect(frame.year).toBe(2026);
    expect(frame.isNow).toBe(true);
    expect(frame.weather.length).toBeGreaterThan(2);
    expect(frame.tone.length).toBeGreaterThan(8);
    expect(frame.shipMetaphor).toMatch(/船/);
    expect(frame.yearTag).toMatch(/今/);
    if (frame.dayunGanZhi) {
      expect(frame.dayunHint).toBe(dayunLoreHint(frame.dayunGanZhi));
      expect(frame.decadeNote).toBe(dayunLoreDecadeNote(frame.dayunGanZhi));
    }
  });
});
