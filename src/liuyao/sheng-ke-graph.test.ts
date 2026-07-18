import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { dressHexagram } from './najia.ts';
import { buildShengKeGraph } from './sheng-ke-graph.ts';
import { whatGenerates, whatOvercomes } from './wuxing.ts';

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

describe('sheng-ke-graph', () => {
  it('whatGenerates / whatOvercomes', () => {
    expect(whatGenerates('木')).toBe('水');
    expect(whatOvercomes('木')).toBe('金');
  });

  it('考试问父母：图含用神节点与两句结论', () => {
    const cast = castYu();
    const dressed = dressHexagram(cast, '壬');
    const graph = buildShengKeGraph(dressed.rows, '明天考试能不能成功');
    expect(graph.yongTargets).toContain('父母');
    expect(graph.nodes.some((n) => n.roles.includes('用神'))).toBe(true);
    expect(graph.nodes.some((n) => n.roles.includes('世'))).toBe(true);
    expect(graph.lines[0].length).toBeGreaterThan(8);
    expect(graph.lines[1].length).toBeGreaterThan(8);
  });
});
