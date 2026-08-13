import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import {
  listBaziCodexEntries,
  unlockBaziCodexFromChart,
} from './codex.ts';

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

describe('bazi codex encounters', () => {
  it('unlock with question creates encounters', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;

    const first = unlockBaziCodexFromChart(chart, {
      question: '要不要换工作？',
      summary: '排盘点亮',
    });
    expect(first.newly.length).toBeGreaterThan(0);
    for (const e of first.newly) {
      expect(e.encounters?.length).toBe(1);
      expect(e.encounters?.[0]?.question).toBe('要不要换工作？');
      expect(e.meetCount).toBe(1);
    }
  });

  it('reload persists encounters', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;

    unlockBaziCodexFromChart(chart, { question: '我适合什么？' });
    const before = listBaziCodexEntries();
    expect(before.some((e) => (e.encounters?.length ?? 0) > 0)).toBe(true);

    const after = listBaziCodexEntries();
    expect(after).toEqual(before);
  });

  it('dedupes same question within 8s', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;

    unlockBaziCodexFromChart(chart, { question: '重复问' });
    unlockBaziCodexFromChart(chart, { question: '重复问' });
    const entries = listBaziCodexEntries();
    for (const e of entries) {
      expect(e.encounters?.length).toBe(1);
    }
  });

  it('newly without question records 排盘遇见', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;

    const first = unlockBaziCodexFromChart(chart);
    expect(first.newly[0]?.encounters?.[0]?.question).toBe('（排盘遇见）');
  });
});
