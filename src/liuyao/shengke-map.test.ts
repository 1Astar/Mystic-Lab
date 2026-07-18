import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { dressHexagram } from './najia.ts';
import {
  JI_OF,
  YUAN_OF,
  buildShengKeMap,
  parseYongQinCandidates,
} from './shengke-map.ts';

function castYu(): ReturnType<typeof buildCastFromThrows> {
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

describe('shengke-map', () => {
  it('六亲原神忌神表', () => {
    expect(YUAN_OF.父母).toBe('官鬼');
    expect(JI_OF.父母).toBe('妻财');
    expect(YUAN_OF.官鬼).toBe('妻财');
    expect(JI_OF.官鬼).toBe('子孙');
  });

  it('parseYongQinCandidates', () => {
    expect(parseYongQinCandidates('父母爻')).toEqual(['父母']);
    expect(parseYongQinCandidates('妻财爻 / 官鬼爻')).toEqual(['官鬼', '妻财']);
  });

  it('考试问父母：豫卦能建用神节点', () => {
    const cast = castYu();
    const dressed = dressHexagram(cast, '壬');
    const map = buildShengKeMap(cast, dressed, '明天考试能不能成功');
    expect(map.yongQin).toBe('父母');
    expect(map.nodes.some((n) => n.role === '用神')).toBe(true);
    expect(map.edges.some((e) => e.kind === '生' || e.kind === '克' || map.nodes.length >= 1)).toBe(
      true,
    );
    expect(map.summary.includes('父母')).toBe(true);
  });
});
