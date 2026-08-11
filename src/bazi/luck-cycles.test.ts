import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { buildLuckCycles } from './luck-cycles.ts';

const profile = {
  ...EMPTY_PROFILE,
  birthYear: '2003',
  birthMonth: '2',
  birthDay: '11',
  birthHour: '19:00',
  birthPlace: '成都',
};

describe('buildLuckCycles', () => {
  it('排出大运流年流月且含选中年', () => {
    const luck = buildLuckCycles(profile, 'female', 2026, {
      now: new Date(2026, 5, 15),
    });
    expect(luck).not.toBeNull();
    if (!luck) return;
    expect(luck.dayun.length).toBeGreaterThan(3);
    expect(luck.liunian.some((c) => c.year === 2026 && c.selected)).toBe(true);
    expect(luck.liuyue.length).toBe(12);
    expect(luck.liuyue[0]?.jieQi).toBe('立春');
    expect(luck.qiYunLabel).toMatch(/起运/);
  });
});
