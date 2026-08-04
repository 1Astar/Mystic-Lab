import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildBaziPortrait } from './portrait-template.ts';

const FORBIDDEN =
  /[甲乙丙丁戊己庚辛壬癸]|[子丑寅卯辰巳午未申酉戌亥]|正官|七杀|正财|偏财|正印|偏印|食神|伤官|比肩|劫财|藏干|长生|帝旺|纳音/;

describe('buildBaziPortrait', () => {
  it('returns plain-language cards without jargon', () => {
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
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const p = buildBaziPortrait(chart, { gender: 'female', seed: 1 });
    expect(p.keyword.length).toBeGreaterThan(4);
    expect(p.themes).toHaveLength(3);
    for (const text of [
      p.keyword,
      p.personality,
      p.career,
      p.relationship,
      p.wealth,
      p.innerWork,
      ...p.themes,
    ]) {
      expect(text).not.toMatch(FORBIDDEN);
    }
  });
});
