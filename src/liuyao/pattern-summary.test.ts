import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildPatternSummary,
  renderPatternSummaryHtml,
} from './pattern-summary.ts';

function castSample() {
  const throws = [
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
    facesToThrow([3, 3, 3]),
    facesToThrow([2, 2, 2]),
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('pattern-summary', () => {
  it('builds 持世 + 世应 chips', () => {
    const cast = castSample();
    const summary = buildPatternSummary(cast, '面试能过吗', new Date('2026-07-21'));
    expect(summary.chips.some((c) => /持世/.test(c.label))).toBe(true);
    expect(summary.chips.some((c) => /世应/.test(c.label))).toBe(true);
    const html = renderPatternSummaryHtml(summary);
    expect(html).toMatch(/ly-pattern-summary/);
    expect(html).toMatch(/格局摘要/);
    expect(html).toMatch(/持世/);
  });

  it('marks 六冲 for pure hexagrams', () => {
    // 乾为天：六阳
    const yang = () => facesToThrow(['obverse', 'obverse', 'reverse']);
    const throws = [yang(), yang(), yang(), yang(), yang(), yang()] as YaoThrow[];
    const cast = buildCastFromThrows(throws, 'random');
    expect(cast.primary.name).toBe('乾');
    const summary = buildPatternSummary(cast, '', new Date('2026-07-21'));
    expect(summary.chips.some((c) => c.label === '六冲卦')).toBe(true);
  });
});
