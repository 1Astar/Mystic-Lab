import { describe, expect, it } from 'vitest';
import { getHuangliBrief } from './huangli.ts';

describe('getHuangliBrief', () => {
  it('returns core v1 fields for a fixed date', () => {
    const date = new Date(2026, 6, 9, 16, 15);
    const brief = getHuangliBrief(date, '申时', '申');

    expect(brief.solarLabel).toBe('2026年7月9日');
    expect(brief.lunarLabel).toMatch(/^农历/);
    expect(brief.hourLabel).toBe('申时');
    expect(brief.yiPreview.length).toBeGreaterThan(0);
    expect(brief.wuxingNayin.length).toBeGreaterThan(0);
    expect(brief.chongsha).toMatch(/冲|煞|—/);
    expect(brief.chongShort.length).toBeGreaterThan(0);
    expect(brief.caiShen.length).toBeGreaterThan(0);
    expect(brief.xiShen.length).toBeGreaterThan(0);
    expect(brief.mood.length).toBeGreaterThan(4);
  });
});
