import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildSpiritNarrative,
  renderSpiritNarrativeHtml,
} from './spirit-narrative.ts';

function castYu() {
  const bits = [0, 0, 0, 1, 0, 0] as const;
  const throws: YaoThrow[] = bits.map((bit) => {
    const coins =
      bit === 1
        ? (['reverse', 'obverse', 'obverse'] as const)
        : (['obverse', 'reverse', 'reverse'] as const);
    return facesToThrow([...coins] as [typeof coins[0], typeof coins[1], typeof coins[2]]);
  });
  return buildCastFromThrows(throws, 'random');
}

describe('spirit-narrative', () => {
  it('builds 用元忌仇 paragraphs for exam question', () => {
    const cast = castYu();
    const n = buildSpiritNarrative(cast, '明天考试能不能成功', new Date('2026-07-21'));
    expect(n.paragraphs.some((p) => p.kind === 'yong')).toBe(true);
    expect(n.paragraphs.some((p) => p.kind === 'verdict')).toBe(true);
    expect(n.verdict.length).toBeGreaterThan(8);
    const html = renderSpiritNarrativeHtml(n);
    expect(html).toMatch(/核心聚焦 · 补给 \/ 耗散 \/ 拉扯/);
    expect(html).toMatch(/ly-spirit-nar/);
    expect(html).toMatch(/核心聚焦|补给|耗散|拉扯/);
    expect(html).toMatch(/谁克死谁/);
  });
});
