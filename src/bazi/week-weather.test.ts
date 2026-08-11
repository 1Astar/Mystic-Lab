import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import {
  __resetBaziLearnForTest,
  collectKnowledge,
  markLearnInteraction,
  resolveBaziLearnTitle,
} from './learn-store.ts';
import { buildLiuriDay, mondayOfWeek, weekDates } from './sense-liuri.ts';
import {
  __resetWeekWeatherForTest,
  countFilledDays,
  countHits,
  loadWeekDoc,
  markWeekReconciled,
  saveDayMood,
} from './week-weather-store.ts';

const profile = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

const mem = new Map<string, string>();

describe('sense-liuri', () => {
  it('本周七天从周一开始', () => {
    const dates = weekDates(new Date(2026, 7, 11)); // Tue
    expect(dates).toHaveLength(7);
    expect(mondayOfWeek(new Date(2026, 7, 11)).getDay()).toBe(1);
    expect(dates[0]!.getDay()).toBe(1);
    expect(dates[6]!.getDay()).toBe(0);
  });

  it('流日带气候与对照提示', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const day = buildLiuriDay(chart, new Date(2026, 7, 11));
    expect(day.dateKey).toBe('2026-08-11');
    expect(day.ganZhi.length).toBeGreaterThanOrEqual(2);
    expect(day.climate.length).toBeGreaterThan(4);
    expect(day.moodHint.length).toBeGreaterThan(8);
    expect(day.matchHint.length).toBeGreaterThan(8);
  });
});

describe('week-weather-store', () => {
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
    __resetWeekWeatherForTest();
    __resetBaziLearnForTest();
  });

  it('记心态与对账', () => {
    const weekKey = '2026-W33';
    saveDayMood('2026-08-10', { text: '想躺平', match: 'hit' }, weekKey);
    saveDayMood('2026-08-11', { text: '想搞大事', match: 'miss' }, weekKey);
    saveDayMood('2026-08-12', { text: '扛压力', match: 'hit' }, weekKey);
    let doc = loadWeekDoc(weekKey);
    expect(countFilledDays(doc)).toBe(3);
    expect(countHits(doc)).toBe(2);
    expect(doc.reconciled).toBe(false);
    doc = markWeekReconciled(weekKey);
    expect(doc.reconciled).toBe(true);
  });

  it('周度复盘可走推演大师路径 B', () => {
    for (let i = 0; i < 5; i++) collectKnowledge(`why:week:${i}`);
    markLearnInteraction('lever:energy');
    expect(resolveBaziLearnTitle().id).toBe('zhiming');
    markLearnInteraction('review:week:2026-W33');
    expect(resolveBaziLearnTitle().id).toBe('tuiyan');
  });
});
