import { describe, expect, it } from 'vitest';
import {
  applyYongShenToAxes,
  JI_AXIS_DELTA,
  YONG_AXIS_DELTA,
  yongJiMultByAxis,
} from './spirit-yong-mult.ts';
import type { CraftAxisScore } from './spirit-roots.ts';

function axis(id: CraftAxisScore['id'], value: number): CraftAxisScore {
  return {
    id,
    label: id,
    sub: '',
    value,
    lit: true,
    sources: ['测'],
  };
}

describe('spirit-yong-mult', () => {
  it('boosts yong axes and softens ji', () => {
    const m = yongJiMultByAxis({ yongWx: ['火'], jiWx: ['金'] });
    expect(m.guangyao).toBeCloseTo(1 + YONG_AXIS_DELTA, 5);
    expect(m.yeli).toBeCloseTo(1 - JI_AXIS_DELTA, 5);
  });

  it('applies to permanent axis values', () => {
    const next = applyYongShenToAxes(
      [axis('guangyao', 100), axis('yeli', 100)],
      { yongWx: ['火'], jiWx: ['金'] },
    );
    expect(next.find((a) => a.id === 'guangyao')!.value).toBeGreaterThan(100);
    expect(next.find((a) => a.id === 'yeli')!.value).toBeLessThan(100);
    expect(next[0]!.sources).toContain('喜用叠乘');
  });
});
