import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import {
  baziCodexProgress,
  isBaziCodexUnlocked,
  notableWuxingFromChart,
  stemBranchIdsFromChart,
  unlockBaziCodexFromChart,
} from './codex.ts';
import { ALL_STEM_BRANCH, WUXING_ORDER } from './codex-lore.ts';

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

const profile = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

describe('bazi codex', () => {
  it('五行仅按偏旺/偏弱/缺点亮候选', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const notable = notableWuxingFromChart(chart);
    expect(notable.length).toBeGreaterThan(0);
    expect(notable.length).toBeLessThanOrEqual(5);
    for (const n of notable) {
      expect(['偏旺', '偏弱', '缺']).toContain(n.reason);
      expect(WUXING_ORDER).toContain(n.id);
    }
  });

  it('干支来自四柱', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: true });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const ids = stemBranchIdsFromChart(chart);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    for (const id of ids) {
      expect(ALL_STEM_BRANCH.some((x) => x.id === id)).toBe(true);
    }
  });

  it('unlock 写入探索并可累计', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;

    const first = unlockBaziCodexFromChart(chart);
    expect(first.newly.length).toBeGreaterThan(0);
    expect(first.total).toBe(first.newly.length);

    for (const e of first.newly) {
      expect(isBaziCodexUnlocked(e.id)).toBe(true);
    }

    const second = unlockBaziCodexFromChart(chart);
    expect(second.newly.length).toBe(0);
    expect(second.total).toBe(first.total);

    const wx = baziCodexProgress('wuxing');
    const gz = baziCodexProgress('stem-branch');
    const star = baziCodexProgress('star');
    expect(wx.total).toBe(5);
    expect(gz.total).toBe(22);
    expect(star.total).toBeGreaterThan(15);
    expect(wx.collected + gz.collected + star.collected).toBe(first.total);
  });
});
