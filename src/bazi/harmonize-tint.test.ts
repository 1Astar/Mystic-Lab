import { describe, expect, it } from 'vitest';
import { castBaziChart } from './cast.ts';
import {
  buildDoubaoPortraitPrompt,
  climateOfMonth,
  resolveAccentWx,
  resolveHarmonizeTint,
} from './harmonize-tint.ts';
import { scoreChartWx } from './sense-energy.ts';
import { EMPTY_PROFILE, type LifeProfileInput } from '../life/types.ts';

/** 春月乙木旺盘：木水偏多，调和宜见土 */
const woodWaterProfile: LifeProfileInput = {
  ...EMPTY_PROFILE,
  birthYear: '2003',
  birthMonth: '2',
  birthDay: '12',
  birthHour: '17:30',
  birthPlace: '北京',
};

describe('harmonize tint', () => {
  it('reads climate from month branch', () => {
    expect(climateOfMonth('寅')).toEqual(['暖', '湿']);
    expect(climateOfMonth('午')).toEqual(['暖', '燥']);
    expect(climateOfMonth('子')).toEqual(['寒', '湿']);
  });

  it('does not invent yellow from wood+water alone without accent rule', () => {
    const chart = castBaziChart(woodWaterProfile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const scores = scoreChartWx(chart);
    const tint = resolveHarmonizeTint(chart);
    // 构成色来自旺衰统计
    expect(['木', '水', '火', '土', '金']).toContain(tint.composePrimary);
    // 若出现土/金辅助，必须有 reason（喜用/调候）
    if (tint.accent === '土' || tint.accent === '金') {
      expect(tint.accentReason.length).toBeGreaterThan(0);
      expect(tint.accentReason).toMatch(/调和|调候/);
    }
    const accent = resolveAccentWx(
      chart,
      tint.composePrimary,
      tint.composeSecondary,
      scores,
    );
    if (accent.accent) expect(accent.reason).not.toBe('');
  });

  it('builds doubao prompt with temperament and no free yellow', () => {
    const chart = castBaziChart(woodWaterProfile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const prompt = buildDoubaoPortraitPrompt(chart);
    expect(prompt).toMatch(/命盘气质|个人命理肖像/);
    expect(prompt).toMatch(/低饱和|深色底/);
    const tint = resolveHarmonizeTint(chart);
    if (!tint.accent) {
      expect(prompt).toMatch(/不要额外加入无依据的黄色/);
    } else {
      expect(prompt).toMatch(/调和点缀/);
    }
  });
});
