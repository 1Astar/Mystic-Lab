import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildEnergyBalance } from './sense-energy.ts';
import { buildYearForecast } from './sense-forecast.ts';
import { buildRealityInsight } from './sense-insight.ts';
import { buildTraditionOrigin } from './sense-origin.ts';
import { buildSeasonTone } from './sense-season.ts';
import { buildShenShaMarks } from './sense-shensha.ts';

const FORBIDDEN =
  /[甲乙丙丁戊己庚辛壬癸]|[子丑寅卯辰巳午未申酉戌亥]|正官|七杀|正财|偏财|正印|偏印|食神|伤官|比肩|劫财|日主|日元|天乙|羊刃|华盖/;

function forJargonCheck(s: string): string {
  return s.replace(/自己/g, '··');
}

const profile = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

describe('bazi sense · 规则拟人 A', () => {
  it('季节定调无术语', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const tone = buildSeasonTone(chart);
    expect(tone.title).toMatch(/你是一年中的/);
    expect(forJargonCheck(`${tone.title}${tone.body}${tone.tagline}`)).not.toMatch(FORBIDDEN);
  });

  it('能量环有五柱且有气象喻', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const e = buildEnergyBalance(chart);
    expect(e.bars).toHaveLength(5);
    expect(e.weatherMeta.length).toBeGreaterThan(2);
    expect(forJargonCheck(`${e.headline}${e.body}${e.remedy}${e.weatherMeta}`)).not.toMatch(
      FORBIDDEN,
    );
  });

  it('年预报用生活场景', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: true });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const f = buildYearForecast(chart, profile, { gender: 'female', year: 2026 });
    expect(f.year).toBe(2026);
    expect(
      forJargonCheck(`${f.title}${f.weather}${f.scene}${f.advice}${f.decadeNote ?? ''}`),
    ).not.toMatch(FORBIDDEN);
  });

  it('现实感悟口语化', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const i = buildRealityInsight(chart);
    expect(i.hook.length).toBeGreaterThan(8);
    expect(forJargonCheck(`${i.hook}${i.story}`)).not.toMatch(FORBIDDEN);
  });

  it('神煞减量改名', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const marks = buildShenShaMarks(chart, 5);
    expect(marks.length).toBeLessThanOrEqual(5);
    for (const m of marks) {
      expect(m.label).not.toMatch(/天乙|羊刃|华盖|文昌/);
      expect(m.traditional.length).toBeGreaterThan(0);
    }
  });

  it('溯源层允许术语', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: true });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const marks = buildShenShaMarks(chart);
    const o = buildTraditionOrigin(chart, profile, marks, { gender: 'female', year: 2026 });
    expect(o.paragraphs.length).toBeGreaterThan(0);
    expect(o.paragraphs.join('')).toMatch(/日主|流年|大运/);
  });
});
