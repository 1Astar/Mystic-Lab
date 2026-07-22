import { describe, expect, it } from 'vitest';
import { castBaziChart, compareHepan } from './cast.ts';
import { parseBirthHour } from './parse-birth.ts';
import { describeBranchRelations } from './relations.ts';
import { toTrueSolarDate } from './true-solar.ts';
import { EMPTY_PROFILE } from '../life/types.ts';
import { shenshaForBranch } from './shensha.ts';
import { ziZuoOf } from './pillar-meta.ts';

describe('parseBirthHour', () => {
  it('parses clock and shichen', () => {
    expect(parseBirthHour('14:30').kind).toBe('clock');
    expect(parseBirthHour('午时').kind).toBe('shichen');
    expect(parseBirthHour('').kind).toBe('none');
  });
});

describe('true solar', () => {
  it('shifts west cities earlier than CST meridian', () => {
    const clock = new Date(2000, 0, 1, 12, 0, 0);
    const chengdu = toTrueSolarDate(clock, 104.07, { applyEquationOfTime: false });
    expect(chengdu.getTime()).toBeLessThan(clock.getTime());
  });
});

describe('castBaziChart', () => {
  it('casts extended rows', () => {
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
    );
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const year = chart.pillars[0]!;
    expect(year.nayin).toBeTruthy();
    expect(year.xunKong).toBeTruthy();
    expect(year.diShi).toBeTruthy();
    expect(year.ziZuo).toBeTruthy();
    expect(Array.isArray(year.shensha)).toBe(true);
    expect(chart.pillars).toHaveLength(5);
  });

  it('leaves hour empty when missing', () => {
    const chart = castBaziChart(
      {
        ...EMPTY_PROFILE,
        birthYear: '1996',
        birthMonth: '8',
        birthDay: '12',
        birthHour: '',
        birthPlace: '',
      },
      2026,
    );
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    expect(chart.hasHour).toBe(false);
    expect(chart.pillars.find((p) => p.key === 'hour')?.empty).toBe(true);
  });

  it('compares hepan day masters', () => {
    const a = castBaziChart(
      { ...EMPTY_PROFILE, birthYear: '2005', birthMonth: '12', birthDay: '23', birthHour: '8:37' },
      2025,
      { includeLiunian: false },
    );
    const b = castBaziChart(
      { ...EMPTY_PROFILE, birthYear: '1996', birthMonth: '8', birthDay: '12', birthHour: '午时' },
      2025,
      { includeLiunian: false },
    );
    expect('error' in a || 'error' in b).toBe(false);
    if ('error' in a || 'error' in b) return;
    const cmp = compareHepan(a, b);
    expect(cmp.selfToPartner).toBeTruthy();
    expect(cmp.partnerToSelf).toBeTruthy();
  });
});

describe('branch relations', () => {
  it('detects half combine and clash', () => {
    const lines = describeBranchRelations(['卯', '未', '戌', '寅']);
    expect(lines.some((l) => l.includes('半合') || l.includes('三合'))).toBe(true);
  });
});

describe('shensha & zizuo', () => {
  it('marks tianyi for jia day', () => {
    const list = shenshaForBranch({
      branch: '丑',
      dayStem: '甲',
      yearBranch: '酉',
      dayBranch: '巳',
    });
    expect(list).toContain('天乙贵人');
  });

  it('returns changsheng label', () => {
    expect(ziZuoOf('甲', '亥')).toMatch(/长生|沐浴|冠带|临官|帝旺|衰|病|死|墓|绝|胎|养/);
  });
});
