import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from './cast.ts';
import { buildLearnExplain } from './learn-explain.ts';
import { listChartShenshaOverview } from './shensha-policy.ts';
import { resolveDecoStarLore } from './shensha-resolve.ts';

describe('shensha resolve + overview', () => {
  it('prefers shensha lore over minor for shared names', () => {
    const deco = resolveDecoStarLore('红鸾');
    expect(deco?.kind).toBe('shensha');
    expect(deco?.oneLiner.length).toBeGreaterThan(4);
    expect(deco?.shenshaId).toBe('红鸾');
  });

  it('learn explain uses shensha oneLiner for deco stars', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { year: 2026 });
    if ('error' in view) throw new Error(view.error);
    const explain = buildLearnExplain(view, { starName: '红鸾', kind: 'star' });
    const deco = resolveDecoStarLore('红鸾');
    expect(explain.oneLiner).toBe(deco?.oneLiner);
    expect(explain.atlasHint?.path).toMatch(/bucket=shensha/);
  });

  it('lists plate overview hits from chart', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { year: 2026 });
    if ('error' in view) throw new Error(view.error);
    const rows = listChartShenshaOverview(view);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.name).toBeTruthy();
    expect(rows[0]?.palace).toMatch(/宫$/);
  });

  it('resolves 将星 without stripping to 将', () => {
    const deco = resolveDecoStarLore('将星');
    expect(deco?.id).toBe('将星');
    expect(deco?.oneLiner).toMatch(/台前|带队|统领/);
  });
});
