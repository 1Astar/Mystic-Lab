import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildBaziSuggestion } from './interpret.ts';

describe('buildBaziSuggestion', () => {
  it('guides when question empty', () => {
    expect(buildBaziSuggestion('')).toMatch(/写下|最在意/);
  });

  it('uses intent actions for career question', () => {
    const s = buildBaziSuggestion('今天适合面试吗？');
    expect(s).toMatch(/条款|核对|清单/);
  });

  it('accepts chart for tone-aware actions', () => {
    const chart = castBaziChart(
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
    if ('error' in chart) return;
    const s = buildBaziSuggestion('我要不要离职？', chart);
    expect(s).toMatch(/：/);
    expect(s.length).toBeGreaterThan(12);
  });
});
