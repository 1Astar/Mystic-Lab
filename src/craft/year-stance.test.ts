import { beforeEach, describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { BUFF_MULT_MAX, resolveYearBuffPack } from './spirit-buff.ts';
import {
  applyStanceToYearBuffPack,
  buildYearMainline,
  deferYearStance,
  getYearStance,
  listYearTips,
  loadYearStanceStore,
  resolveYearJi,
  saveYearStance,
  shouldAutoOpenYearStance,
  YEAR_STANCE_KEY,
} from './year-stance.ts';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
});

describe('year-stance', () => {
  it('maps mainline title from ji star + palace', () => {
    const m = buildYearMainline('天机', '命宫');
    expect(m.title).toMatch(/思绪重塑/);
    expect(m.title).toMatch(/内核/);
  });

  it('resolves year ji from chart person', () => {
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
    const ji = resolveYearJi({ person, year: 2026, palaces: view.palaces });
    expect(ji?.jiStar).toBeTruthy();
    expect(ji!.jiStar.length).toBeGreaterThan(0);
  });

  it('auto-open only when has ji and not chosen/deferred', () => {
    expect(
      shouldAutoOpenYearStance({ personId: 'p1', year: 2026, hasJi: true }),
    ).toBe(true);
    expect(
      shouldAutoOpenYearStance({ personId: 'p1', year: 2026, hasJi: false }),
    ).toBe(false);

    deferYearStance('p1', 2026);
    expect(
      shouldAutoOpenYearStance({ personId: 'p1', year: 2026, hasJi: true }),
    ).toBe(false);

    mem.delete(YEAR_STANCE_KEY);
    saveYearStance({
      personId: 'p1',
      year: 2026,
      choice: 'accept',
      mainlineId: 'x',
      mainlineTitle: '【测试】',
      jiStar: '天机',
      jiPalace: '命宫',
      chosenAt: new Date().toISOString(),
    });
    expect(
      shouldAutoOpenYearStance({ personId: 'p1', year: 2026, hasJi: true }),
    ).toBe(false);
  });

  it('follow tips cover next 2 years; stance tweaks buff', () => {
    saveYearStance({
      personId: 'p1',
      year: 2026,
      choice: 'accept',
      mainlineId: 'mind',
      mainlineTitle: '【思绪重塑】',
      jiStar: '天机',
      jiPalace: '命宫',
      chosenAt: new Date().toISOString(),
    });
    expect(getYearStance('p1', 2026)?.choice).toBe('accept');
    const tips2027 = listYearTips({ personId: 'p1', year: 2027 });
    expect(tips2027.some((t) => t.kind === 'follow' && t.fromYear === 2026)).toBe(
      true,
    );
    const tips2028 = listYearTips({ personId: 'p1', year: 2028 });
    expect(tips2028.some((t) => t.fromYear === 2026)).toBe(true);
    const tips2029 = listYearTips({ personId: 'p1', year: 2029 });
    expect(tips2029.some((t) => t.fromYear === 2026)).toBe(false);

    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const base = resolveYearBuffPack(person, 2026);
    const withStance = applyStanceToYearBuffPack(base, 'accept');
    expect(withStance.entries.some((e) => e.id.includes('stance'))).toBe(true);
    if (base.multByAxis.yeli < BUFF_MULT_MAX - 1e-9) {
      expect(withStance.multByAxis.yeli).toBeGreaterThan(base.multByAxis.yeli);
    } else {
      expect(withStance.multByAxis.yeli).toBe(BUFF_MULT_MAX);
    }
    expect(loadYearStanceStore().records.length).toBe(1);
  });
});
