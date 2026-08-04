import { describe, expect, it } from 'vitest';
import { SHENSHA_VISUALS, getShenshaVisual } from './codex-shensha-visual.ts';
import { SHENSHA_CARDS } from './codex-tags.ts';

describe('shensha visuals', () => {
  it('七张重点神煞均有独立插画路径', () => {
    const keys = ['天乙贵人', '桃花', '文昌', '驿马', '羊刃', '孤辰寡宿', '劫煞'];
    for (const k of keys) {
      const v = getShenshaVisual(k);
      expect(v?.src).toMatch(/^\/bazi\/shensha\/.+\.png$/);
      expect(v?.motif.length).toBeGreaterThan(4);
      expect(v?.literal.length).toBeGreaterThan(2);
    }
    expect(Object.keys(SHENSHA_VISUALS)).toHaveLength(7);
  });

  it('孤辰寡宿与劫煞已入库', () => {
    expect(SHENSHA_CARDS.some((c) => c.name === '孤辰寡宿')).toBe(true);
    expect(SHENSHA_CARDS.some((c) => c.name === '劫煞')).toBe(true);
    expect(getShenshaVisual('天乙贵人')?.light).toBe('warm');
    expect(getShenshaVisual('羊刃')?.light).toBe('cold');
  });
});
