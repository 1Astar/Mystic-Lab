import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from './cast.ts';
import {
  listBirthMutagenHits,
  listLimitMutagenHits,
  mutagenHitTitle,
} from './codex-mutagen-hits.ts';

describe('codex-mutagen-hits', () => {
  const person = createSelfPerson({
    ...EMPTY_PROFILE,
    birthYear: '1996',
    birthMonth: '8',
    birthDay: '12',
    birthHour: '8:37',
  });
  person.gender = 'female';

  it('lists birth mutagen as 化X · star · palace', () => {
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    expect('error' in view).toBe(false);
    if ('error' in view) return;
    const hits = listBirthMutagenHits(view);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0]!.label).toMatch(/^化[禄权科忌]$/);
    expect(mutagenHitTitle(hits[0]!)).toMatch(/化/);
  });

  it('lists year and decade limit mutagen', () => {
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;
    const { year, decade, yearNum } = listLimitMutagenHits(person, view, 2026);
    expect(yearNum).toBe(2026);
    expect(year.length + decade.length).toBeGreaterThan(0);
    if (year[0]) expect(year[0].scopeLabel).toContain('流年');
  });
});
