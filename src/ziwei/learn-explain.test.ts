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

    const struct = buildLearnExplain(view, {
      kind: 'structure',
      term: '三方四正',
      palaceName: '命宫',
    });
    expect(struct.category).toBe('structure');
    expect(struct.oneLiner).toMatch(/三合|对宫/);
    expect(struct.inChart).toMatch(/官禄|财帛/);
    expect(struct.inChart).toMatch(/迁移|对宫/);
    expect(struct.relationMap?.note).toMatch(/官禄|财帛|迁移/);
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

  it('explains 四化 with chart star mapping and impact', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '2003',
      birthMonth: '2',
      birthDay: '11',
      birthHour: '20:00',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;
    const flow = collectMutagenFlow(view.palaces);
    expect(flow.length).toBeGreaterThan(0);

    const sihua = buildLearnExplain(view, { kind: 'mutagen', term: '四化' });
    expect(sihua.oneLiner).toMatch(/化禄|化权|化科|化忌/);
    expect(sihua.inChart).toMatch(/生年四化|四化徽章/);
    expect(sihua.mutagenMap?.length).toBeGreaterThan(0);
    for (const f of flow) {
      expect(sihua.mutagenMap?.some((m) => m.star === f.star)).toBe(true);
    }

    const first = flow[0]!;
    const one = buildLearnExplain(view, {
      kind: 'mutagen',
      term: `化${first.mutagen}`,
    });
    expect(one.mutagenMap?.[0]?.star).toBe(first.star);
    expect(one.mutagenMap?.[0]?.effect.length).toBeGreaterThan(4);
  });

  it('explains plate 神煞 / 十二神 via shensha lore', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '2003',
      birthMonth: '2',
      birthDay: '11',
      birthHour: '20:00',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;

    const tianguan = buildLearnExplain(view, { kind: 'star', starName: '天官' });
    expect(tianguan.oneLiner).toMatch(/官贵|名位/);
    expect(tianguan.traditional).not.toMatch(/尚未收录/);

    const seriesName = view.palaces.find((p) => p.series?.length)?.series?.[0]?.name;
    expect(seriesName).toBeTruthy();
    if (seriesName) {
      const series = buildLearnExplain(view, { kind: 'star', starName: seriesName });
      expect(series.oneLiner.length).toBeGreaterThan(4);
      expect(series.traditional.length).toBeGreaterThan(8);
    }
  });

  it('explains 地支关系 with chart branch map and impact', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '2003',
      birthMonth: '2',
      birthDay: '11',
      birthHour: '20:00',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) return;

    const dizhi = buildLearnExplain(view, {
      kind: 'structure',
      term: '地支关系',
      palaceName: view.soulPalace.name,
    });
    expect(dizhi.oneLiner).toMatch(/冲|合|刑/);
    expect(dizhi.branchMap?.length).toBeGreaterThan(0);
    expect(dizhi.branchMap?.some((r) => r.kind === '冲')).toBe(true);
    expect(dizhi.inChart).toMatch(/地支关系|冲\/合\/刑/);
    for (const row of dizhi.branchMap ?? []) {
      expect(row.effect.length).toBeGreaterThan(4);
      expect(row.label.length).toBeGreaterThan(1);
    }

    const chong = buildLearnExplain(view, {
      kind: 'structure',
      term: '六冲',
      palaceName: view.soulPalace.name,
    });
    expect(chong.branchMap?.every((r) => r.kind === '冲')).toBe(true);
  });
});
