import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from './cast.ts';
import { buildLearnExplain, BRANCH_GRID, collectMutagenFlow } from './learn-explain.ts';
import { STATUS_DISCLAIMER } from './term-glossary.ts';

describe('learn-explain', () => {
  it('builds four-layer star explain with chart evidence', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    expect('error' in view).toBe(false);
    if ('error' in view) return;

    const soulMajor = view.soulPalace.majors[0]?.name ?? '紫微';
    const model = buildLearnExplain(view, {
      starName: soulMajor,
      palaceName: '命宫',
      kind: 'star',
    });
    expect(model.title).toContain(soulMajor);
    expect(model.category).toBe('star');
    expect(model.oneLiner.length).toBeGreaterThan(4);
    expect(model.inChart).toMatch(/命宫|落入/);
    expect(model.statusLink?.status || model.related.length).toBeTruthy();
    expect(model.related.length).toBeGreaterThan(0);
  });

  it('explains 星曜状态 without equating to luck', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;

    const model = buildLearnExplain(view, {
      kind: 'status',
      status: '平',
      starName: view.soulPalace.majors[0]?.name,
      palaceName: '命宫',
    });
    expect(model.category).toBe('status');
    expect(model.title).toMatch(/星曜状态/);
    expect(model.inChart).toContain(STATUS_DISCLAIMER.slice(0, 8));
  });

  it('builds palace relation map for 三方四正', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;

    const palace = buildLearnExplain(view, { kind: 'palace', palaceName: '夫妻宫' });
    expect(palace.category).toBe('palace');
    expect(palace.relationMap?.self).toMatch(/夫妻/);
    expect(palace.relationMap?.sanhe.length).toBe(2);

    const struct = buildLearnExplain(view, { kind: 'structure', term: '三方四正' });
    expect(struct.category).toBe('structure');
    expect(struct.oneLiner).toMatch(/三合|对宫/);
  });

  it('maps 12 earthly branches onto plate grid', () => {
    expect(Object.keys(BRANCH_GRID)).toHaveLength(12);
    expect(BRANCH_GRID.午).toEqual({ row: 0, col: 1 });
    expect(BRANCH_GRID.子).toEqual({ row: 3, col: 2 });
  });

  it('collects mutagen flow from chart', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;
    const flow = collectMutagenFlow(view.palaces);
    expect(Array.isArray(flow)).toBe(true);
  });
});
