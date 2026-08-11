import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { unlockBaziCodexFromChart, isBaziCodexUnlocked, baziCodexProgress } from './codex.ts';
import {
  SHENSHA_CARDS,
  getStarCard,
  shenshaCardId,
  starCardIdsFromChart,
  staticTagsForStem,
} from './codex-tags.ts';
import { shenshaHintsForStem } from './shensha.ts';

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

describe('bazi star atlas cards', () => {
  it('天乙贵人是独立卡而非干支附属', () => {
    const card = getStarCard(shenshaCardId('天乙贵人'));
    expect(card?.modern).toBe('贵人之星');
    expect(card?.impression.length).toBeGreaterThan(8);
    expect(card?.where.length).toBeGreaterThan(8);
    expect(card?.trap.length).toBeGreaterThan(8);
    expect(SHENSHA_CARDS.some((c) => c.name === '天乙贵人')).toBe(true);
  });

  it('甲木静态提示仍含天乙（知识关联，不进干支 UI）', () => {
    expect(shenshaHintsForStem('甲')).toContain('天乙贵人');
    expect(staticTagsForStem('甲').some((t) => t.name === '天乙贵人')).toBe(true);
  });

  it('排盘可点亮星煞独立卡', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const ids = starCardIdsFromChart(chart);
    expect(ids.length).toBeGreaterThan(0);
    const unlocked = unlockBaziCodexFromChart(chart);
    expect(unlocked.newly.some((e) => e.kind === 'shensha' || e.kind === 'tengod')).toBe(true);
    for (const id of ids) {
      expect(isBaziCodexUnlocked(id)).toBe(true);
    }
    const star = baziCodexProgress('star');
    expect(star.total).toBeGreaterThan(15);
    expect(star.collected).toBeGreaterThan(0);
  });
});
