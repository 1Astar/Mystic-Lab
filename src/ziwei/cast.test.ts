import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { clockToTimeIndex } from './time-index.ts';
import { castZiweiChart } from './cast.ts';

describe('ziwei time-index', () => {
  it('maps clock hours to iztro timeIndex', () => {
    expect(clockToTimeIndex(0)).toBe(0);
    expect(clockToTimeIndex(8, 37)).toBe(4);
    expect(clockToTimeIndex(12)).toBe(6);
    expect(clockToTimeIndex(23, 30)).toBe(0);
  });
});

describe('ziwei cast', () => {
  it('requires gender', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    const r = castZiweiChart(person);
    expect('error' in r).toBe(true);
  });

  it('builds theater with four pillars and lit majors', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const r = castZiweiChart(person, {
      intent: 'map',
      year: 2026,
      question: '我今年适合换工作吗？',
    });
    expect('error' in r).toBe(false);
    if ('error' in r) return;
    expect(r.theater.pillars).toHaveLength(4);
    expect(r.theater.pillars.map((p) => p.id)).toEqual([
      'core',
      'career',
      'bond',
      'lesson',
    ]);
    expect(r.theater.pillars[3]!.title).toBe('此生课题');
    expect(r.theater.soulCombo.line.length).toBeGreaterThan(10);
    expect(r.theater.annual.forecastGuide.length).toBeGreaterThan(20);
    expect(r.theater.decade.lead.length).toBeGreaterThan(10);
    expect(r.theater.decade.guide.length).toBeGreaterThan(20);
    expect(r.theater.decade.theme.length).toBeGreaterThan(0);
    expect(r.theater.decade.started).toBe(true);
    expect(r.theater.decade.ageTo).toBeGreaterThan(r.theater.decade.ageFrom);
    expect(r.soulPalace.name).toBe('命宫');
  });
});
