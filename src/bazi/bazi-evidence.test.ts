import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { buildBaziFacts } from './bazi-facts.ts';
import { detectBaziTone, mapBaziEvidence } from './bazi-evidence.ts';
import { castBaziChart } from './cast.ts';

function sampleChart() {
  return castBaziChart(
    {
      ...EMPTY_PROFILE,
      birthYear: '2005',
      birthMonth: '12',
      birthDay: '23',
      birthHour: '8:37',
      birthPlace: '北京',
    },
    2025,
    { includeLiunian: false },
  );
}

describe('buildBaziFacts + mapBaziEvidence', () => {
  it('extracts facts from chart', () => {
    const chart = sampleChart();
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const facts = buildBaziFacts(chart);
    expect(facts.dayMaster.length).toBeGreaterThan(0);
    expect(facts.dayMasterWx).toBeTruthy();
    expect(['旺', '相', '休', '囚', '死']).toContain(facts.dayStrength);
    expect(facts.labels.length).toBeGreaterThan(0);
  });

  it('maps evidence with factKeys and optional gloss', () => {
    const chart = sampleChart();
    if ('error' in chart) return;
    const ev = mapBaziEvidence(chart, { question: '今天适合面试吗？' });
    expect(ev.length).toBeGreaterThanOrEqual(2);
    expect(ev.length).toBeLessThanOrEqual(5);
    expect(ev[0]!.factKey).toBe('day_master_wx');
    expect(ev.every((e) => e.plain.length > 8)).toBe(true);
    expect(ev.some((e) => e.gloss?.term)).toBe(true);
  });

  it('adds career intent evidence when question is work', () => {
    const chart = sampleChart();
    if ('error' in chart) return;
    const ev = mapBaziEvidence(chart, { question: '我要不要离职？' });
    const keys = ev.map((e) => e.factKey);
    expect(keys[0]).toBe('day_master_wx');
  });

  it('detects tone from strength', () => {
    const chart = sampleChart();
    if ('error' in chart) return;
    const tone = detectBaziTone(buildBaziFacts(chart));
    expect(['soft', 'cut', 'neutral', 'hard', 'open', 'flow']).toContain(tone);
  });
});
