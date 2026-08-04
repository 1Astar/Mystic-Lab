import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildBaziAnswerPack } from './build-pack.ts';

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

describe('buildBaziAnswerPack', () => {
  it('builds full Offline pack for career question', () => {
    const chart = sampleChart();
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;

    const pack = buildBaziAnswerPack({
      question: '今天适合面试吗？',
      chart,
      gender: 'female',
      context: null,
    });

    expect(pack.intents.length).toBeGreaterThan(0);
    expect(pack.answers.length).toBe(pack.intents.length);
    expect(pack.answers[0]!.evidence.length).toBeGreaterThan(0);
    expect(pack.verdict.headline.length).toBeGreaterThan(4);
    expect(pack.decision.length).toBeGreaterThan(8);
    expect(pack.breakthrough.body.length).toBeGreaterThan(8);
    expect(pack.why.length).toBeGreaterThan(0);
    expect(pack.script?.beats.length).toBe(4);
    expect(pack.script?.synthesis.outcome.label).toBeTruthy();
    expect(pack.boardExpand).toMatch(/日主|四柱/);
    expect(pack.reassurance).toBeTruthy();
    expect(pack.coreMetaphor).toMatch(/核心隐喻/);
  });

  it('handles empty question with open explore fallback', () => {
    const chart = sampleChart();
    if ('error' in chart) return;
    const pack = buildBaziAnswerPack({
      question: '',
      chart,
      context: null,
    });
    expect(pack.verdict.headline).toBeTruthy();
    expect(pack.breakthrough.title).toBeTruthy();
  });
});
