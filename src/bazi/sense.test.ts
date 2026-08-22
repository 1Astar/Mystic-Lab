import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildEnergyBalance, energyLeverTip } from './sense-energy.ts';
import { buildYearForecast } from './sense-forecast.ts';
import { buildRealityInsight } from './sense-insight.ts';
import { buildTraditionOrigin } from './sense-origin.ts';
import { buildSeasonTone } from './sense-season.ts';
import { buildShenShaMarks, markSourceBody } from './sense-shensha.ts';

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

  it('能量天平有五球、季节色与杠杆文案', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const e = buildEnergyBalance(chart);
    expect(e.bars).toHaveLength(5);
    expect(e.weatherMeta.length).toBeGreaterThan(2);
    expect(e.balanceHint).toMatch(/天性|不得令/);
    for (const b of e.bars) {
      expect(b.strength).toMatch(/旺|相|休|囚|死/);
      expect(b.seasonTip.length).toBeGreaterThan(8);
      expect(b.seasonTip).toMatch(/盘上这季/);
    }
    expect(forJargonCheck(`${e.headline}${e.body}${e.remedy}${e.weatherMeta}`)).not.toMatch(
      FORBIDDEN,
    );
    const lever = energyLeverTip('木');
    expect(lever).toMatch(/土/);
    expect(lever).toMatch(/削弱/);
  });

  it('年预报用生活场景', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: true });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const f = buildYearForecast(chart, profile, { gender: 'female', year: 2026 });
    expect(f.year).toBe(2026);
    // 流年生活场景禁术语；大运 decadeNote 已同源甲子专篇，允许干支画面词
    expect(
      forJargonCheck(
        `${f.title}${f.tone}${f.weather}${f.scene}${f.advice}${f.dos.join('')}${f.donts.join('')}${f.chartCta}`,
      ),
    ).not.toMatch(FORBIDDEN);
    expect(f.tone.length).toBeGreaterThan(8);
    expect(f.dos.length).toBeGreaterThanOrEqual(2);
    expect(f.donts.length).toBeGreaterThanOrEqual(2);
    if (f.decadeNote) {
      expect(f.decadeNote).toMatch(/这段大运/);
    }
  });

  it('现实感悟口语化', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const i = buildRealityInsight(chart);
    expect(i.hook.length).toBeGreaterThan(8);
    expect(forJargonCheck(`${i.hook}${i.story}`)).not.toMatch(FORBIDDEN);
    expect(i.links.length).toBeGreaterThanOrEqual(2);
    expect(i.links.some((l) => l.codexId === chart.dayMaster)).toBe(true);
    if (chart.dayMasterWx) {
      expect(i.links.some((l) => l.codexId === chart.dayMasterWx)).toBe(true);
    }
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
      expect(m.traditionals.length).toBeGreaterThan(0);
      expect(m.pillars.length).toBeGreaterThan(0);
      expect(m.placements.length).toBeGreaterThan(0);
      const src = markSourceBody(m);
      expect(src).toMatch(/「.+」/);
      expect(src).not.toMatch(/学习名映射|白话标签/);
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
