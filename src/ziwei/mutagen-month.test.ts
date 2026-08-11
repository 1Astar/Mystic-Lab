import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from './cast.ts';
import { resolveHoroscopeLimits } from './horoscope-limits.ts';
import {
  formatMutagenWithPalaces,
  parseMutagenLine,
} from './mutagen-format.ts';
import { buildMonthScope } from './time-scope.ts';
import { buildYearDeepPack } from './year-deep.ts';
import { buildYearTrack } from './year-track.ts';

describe('mutagen + month deepen', () => {
  const person = (() => {
    const p = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    p.gender = 'female';
    return p;
  })();

  it('formats mutagen with palace arrows', () => {
    const view = castZiweiChart(person, { year: 2026 });
    if ('error' in view) throw new Error(view.error);
    expect(view.theater.annual.mutagenLine).toMatch(/化[禄权科忌]/);
    expect(view.theater.annual.mutagenLine).not.toMatch(/暂缺/);
    const pieces = parseMutagenLine('天同化禄→财帛 · 天机化权');
    expect(pieces.length).toBe(2);
    expect(pieces[0]?.palace).toMatch(/财帛/);
    const withPalace = formatMutagenWithPalaces(
      ['天同', '天机', '文昌', '廉贞'],
      view.palaces,
    );
    expect(withPalace).toMatch(/化禄/);
  });

  it('exposes month mutagen from horoscope limits', () => {
    const snap = resolveHoroscopeLimits(person, { year: 2026, month: 6, day: 15 });
    expect(snap?.monthMutagenLine).toMatch(/化[禄权科忌]/);
    expect(snap?.monthGZ.length).toBeGreaterThanOrEqual(2);
    expect(snap?.yearMutagenLine).toMatch(/化[禄权科忌]/);
  });

  it('month scope carries lead + mutagen', () => {
    const m = buildMonthScope(person, 2026, 6);
    expect(m.mutagenLine).toMatch(/化/);
    expect(m.lead.length).toBeGreaterThan(12);
    expect(m.yearPalace).toBeTruthy();
  });

  it('year deep month level includes month mutagen chain', () => {
    const view = castZiweiChart(person, { year: 2026 });
    if ('error' in view) throw new Error(view.error);
    const track = buildYearTrack({
      person,
      birthYear: 1996,
      centerYear: 2026,
      radius: 0,
    });
    const item = track.find((t) => t.year === 2026) ?? track[0]!;
    const pack = buildYearDeepPack(view, person, item, { level: 'month', month: 6 });
    expect(pack.chain.some((c) => c.title.includes('流月四化'))).toBe(true);
    expect(pack.mutagen.length).toBeGreaterThan(0);
    expect(pack.conclusion).toMatch(/本月|流月|推进/);
  });
});
