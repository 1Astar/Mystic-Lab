import { describe, expect, it } from 'vitest';
import {
  buildCustomPositions,
  clampCustomCount,
  drawSpread,
  resolveSpread,
  setSessionCustomPositions,
  SPREADS,
} from './spreads.ts';

describe('spreads', () => {
  it('five-lens has five positions', () => {
    expect(SPREADS['five-lens'].positions).toHaveLength(5);
    expect(SPREADS['five-lens'].positions.map((p) => p.label)).toEqual([
      '情况',
      '阻碍',
      '建议',
      '外在',
      '结果',
    ]);
  });

  it('drawSpread five-lens returns five cards with labels', () => {
    const cards = drawSpread('five-lens');
    expect(cards).toHaveLength(5);
    expect(cards.map((c) => c.position)).toEqual([
      '情况',
      '阻碍',
      '建议',
      '外在',
      '结果',
    ]);
  });

  it('builds and resolves custom positions', () => {
    const positions = buildCustomPositions(['本我', '对方', '关系', '建议']);
    expect(positions).toHaveLength(4);
    expect(positions[0]?.label).toBe('本我');
    setSessionCustomPositions(positions);
    const def = resolveSpread('custom', positions);
    expect(def.name).toBe('自定义牌阵');
    expect(def.positions.map((p) => p.label)).toEqual(['本我', '对方', '关系', '建议']);
    const drawn = drawSpread('custom');
    expect(drawn).toHaveLength(4);
    expect(drawn[2]?.position).toBe('关系');
    setSessionCustomPositions(null);
  });

  it('custom spread copy is free-place, not form editor', () => {
    expect(SPREADS.custom.description).toMatch(/抽牌|摆/);
    expect(SPREADS.custom.lightHint).not.toMatch(/位置叫什么|起名/);
    expect(SPREADS.custom.moreHint).toMatch(/翻开|摆/);
  });

  it('clamps custom count', () => {
    expect(clampCustomCount(1)).toBe(2);
    expect(clampCustomCount(9)).toBe(7);
    expect(clampCustomCount(4)).toBe(4);
  });
});
