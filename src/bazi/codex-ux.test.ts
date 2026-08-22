import { describe, expect, it, beforeEach } from 'vitest';
import {
  getBaziCodexMarks,
  hasBaziCodexMark,
  listBaziCodexMarkedIds,
  toggleBaziCodexMark,
} from './codex-favorites.ts';
import { chartPresenceBrief } from './codex-presence-brief.ts';
import { findCodexInsightTip } from './codex-insight-tip.ts';
import { castBaziChart } from './cast.ts';
import { buildLuckCycles } from './luck-cycles.ts';
import { EMPTY_PROFILE } from '../life/types.ts';
import { saveBaziJournalEntry } from './journal.ts';

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

describe('bazi codex favorites', () => {
  it('toggles fire and useful marks', () => {
    expect(toggleBaziCodexMark('寅', 'fire')).toBe(true);
    expect(hasBaziCodexMark('寅', 'fire')).toBe(true);
    expect(toggleBaziCodexMark('寅', 'useful')).toBe(true);
    expect(getBaziCodexMarks('寅').sort()).toEqual(['fire', 'useful']);
    expect(listBaziCodexMarkedIds('fire')).toContain('寅');
    expect(toggleBaziCodexMark('寅', 'fire')).toBe(false);
    expect(hasBaziCodexMark('寅', 'fire')).toBe(false);
  });
});

describe('presence brief', () => {
  it('builds natal brief when branch sits on chart', () => {
    const profile = {
      ...EMPTY_PROFILE,
      birthYear: '1990',
      birthMonth: '2',
      birthDay: '15',
      birthHour: '10:00',
    };
    const chart = castBaziChart(profile, 2026, { gender: 'male', includeLiunian: true });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const month = chart.pillars.find((p) => p.key === 'month');
    expect(month?.branch).toBeTruthy();
    const brief = chartPresenceBrief(month!.branch, chart, buildLuckCycles(profile, 'male', 2026));
    expect(brief).toMatch(/原局/);
  });
});

describe('insight tip', () => {
  it('matches journal mention of entry title', () => {
    saveBaziJournalEntry({ body: '今天觉得自己像顺藤攀缘的藤花', reflection: '' });
    const tip = findCodexInsightTip('卯');
    expect(tip?.text).toMatch(/卯|藤|手札/);
  });

  it('hard-binds reality insight to day master entry', () => {
    const profile = {
      ...EMPTY_PROFILE,
      birthYear: '1990',
      birthMonth: '2',
      birthDay: '15',
      birthHour: '10:00',
    };
    const chart = castBaziChart(profile, 2026, { gender: 'male', includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const tip = findCodexInsightTip(chart.dayMaster, chart);
    expect(tip?.source).toBe('reality');
    expect(tip?.text).toMatch(/现实感悟/);
    expect(tip?.text).toContain(chart.dayMaster);
  });
});
