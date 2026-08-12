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
    expect(p.domains).toHaveLength(5);
    expect(p.domainsLead.length).toBeGreaterThan(12);
    for (const d of p.domains) {
      expect(d.lead.length).toBeGreaterThan(10);
      expect(d.tip.length).toBeGreaterThan(8);
      expect(d.watch.length).toBeGreaterThanOrEqual(8);
      expect(d.lead).not.toMatch(FORBIDDEN);
      expect(d.tip).not.toMatch(FORBIDDEN);
      expect(d.watch).not.toMatch(FORBIDDEN);
    }
    for (const text of [
      p.keyword,
      p.domainsLead,
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

  it('用法小心随日主五行分叉', () => {
    const wood = castBaziChart(
      {
        ...EMPTY_PROFILE,
        birthYear: '1984',
        birthMonth: '2',
        birthDay: '15',
        birthHour: '10:00',
        birthPlace: '北京',
      },
      2025,
      { includeLiunian: false },
    );
    const metal = castBaziChart(
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
    expect('error' in wood).toBe(false);
    expect('error' in metal).toBe(false);
    if ('error' in wood || 'error' in metal) return;
    const a = buildBaziPortrait(wood, { seed: 1 });
    const b = buildBaziPortrait(metal, { seed: 1 });
    const aTips = a.domains.map((d) => d.tip).join('|');
    const bTips = b.domains.map((d) => d.tip).join('|');
    expect(aTips).not.toBe(bTips);
    expect(a.domains[0]!.tip).toMatch(/这盘日主|伸展|点燃|承载|收束|流动/);
  });
});
