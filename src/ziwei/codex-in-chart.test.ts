import { describe, expect, it } from 'vitest';
import {
  buildCodexInChartView,
  palaceLifeLabel,
  ziweiChartJumpQs,
} from './codex-in-chart.ts';

describe('codex-in-chart', () => {
  it('builds chart jump query with mode palace star', () => {
    expect(ziweiChartJumpQs({ star: '龙池', palace: '财帛' })).toBe(
      'mode=chart&star=%E9%BE%99%E6%B1%A0&palace=%E8%B4%A2%E5%B8%9B',
    );
  });

  it('labels palace with life hint', () => {
    expect(palaceLifeLabel('命宫')).toMatch(/命宫/);
    expect(palaceLifeLabel('命宫')).toMatch(/我是谁|自我/);
  });

  it('describes major hit in plain explain blocks', () => {
    const v = buildCodexInChartView(
      '天机',
      { palace: '福德', brightness: '陷' },
      'major',
      {
        hasChart: true,
        yearHua: { year: 2026, kind: '权', label: '2026流年化权' },
      },
    );
    expect(v.inChart).toBe(true);
    expect(v.palace).toBe('福德');
    expect(v.placeLine).toMatch(/福德/);
    expect(v.explain.length).toBeGreaterThanOrEqual(4);
    expect(v.explain.some((l) => l.includes('天机') && l.includes('聪明'))).toBe(true);
    expect(v.explain.some((l) => l.includes('精神账户') || l.includes('福德'))).toBe(true);
    expect(v.explain.some((l) => l.includes('脑内有地图'))).toBe(true);
    expect(v.explain.some((l) => l.includes('陷'))).toBe(true);
    expect(v.explain.some((l) => l.includes('化权') || l.includes('拍板'))).toBe(true);
  });

  it('describes awakened hit with palace and jump', () => {
    const v = buildCodexInChartView(
      '龙池',
      { palace: '财帛' },
      'shensha',
      { hasChart: true },
    );
    expect(v.inChart).toBe(true);
    expect(v.palace).toBe('财帛');
    expect(v.placeLine).toMatch(/财帛/);
    expect(v.roleLine.length).toBeGreaterThan(8);
    expect(v.jumpQs).toContain('mode=chart');
    expect(v.jumpQs).toContain('star=');
    expect(v.jumpQs).toContain('palace=');
  });

  it('does not invent palace when absent', () => {
    const v = buildCodexInChartView('龙池', undefined, 'shensha', { hasChart: true });
    expect(v.inChart).toBe(false);
    expect(v.placeLine).toMatch(/没有它|没有/);
    expect(v.jumpQs).toBe('mode=chart');
  });
});
