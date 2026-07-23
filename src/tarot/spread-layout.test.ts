import { describe, expect, it } from 'vitest';
import {
  defaultLayoutsForCount,
  isFreeArrangeSpread,
  layoutsForSpread,
} from './spread-layout.ts';
import { SPREADS } from './spreads.ts';

describe('spread-layout', () => {
  it('five-lens uses cross layout', () => {
    const layout = layoutsForSpread(SPREADS['five-lens']);
    expect(layout).toHaveLength(5);
    expect(layout[0]?.y).toBeLessThan(layout[2]!.y);
    expect(layout[4]?.y).toBeGreaterThan(layout[2]!.y);
  });

  it('three-card spreads sit in a row', () => {
    const layout = layoutsForSpread(SPREADS['situation-obstacle-advice']);
    expect(layout.map((p) => p.y)).toEqual([46, 46, 46]);
    expect(layout[0]!.x).toBeLessThan(layout[1]!.x);
  });

  it('custom is free-arrange', () => {
    expect(isFreeArrangeSpread('custom')).toBe(true);
    expect(isFreeArrangeSpread('five-lens')).toBe(false);
    expect(defaultLayoutsForCount(4)).toHaveLength(4);
  });
});
