import { describe, expect, it } from 'vitest';
import { castSixYao, facesToThrow, buildCastFromThrows, type YaoThrow } from './engine.ts';
import { HEXAGRAMS, hexagramFromLines, linesFromHexagram, yingLineOf, explainShiYingWhy, palaceStageOfHexagram } from './hexagrams.ts';
import { buildFourLayerReading } from './interpret.ts';

describe('liuyao engine', () => {
  it('maps three tails (背) to 老阳', () => {
    const y = facesToThrow(['reverse', 'reverse', 'reverse']);
    expect(y.sum).toBe(9);
    expect(y.kind).toBe('老阳');
    expect(y.bit).toBe(1);
    expect(y.changing).toBe(true);
  });

  it('maps three heads (字) to 老阴', () => {
    const y = facesToThrow(['obverse', 'obverse', 'obverse']);
    expect(y.sum).toBe(6);
    expect(y.kind).toBe('老阴');
    expect(y.changing).toBe(true);
  });

  it('builds 乾为天 from six young yang', () => {
    const youngYang: YaoThrow = {
      coins: ['reverse', 'reverse', 'obverse'],
      sum: 7,
      kind: '少阳',
      bit: 1,
      changing: false,
    };
    const cast = buildCastFromThrows(Array(6).fill(youngYang) as YaoThrow[]);
    expect(cast.primary.name).toBe('乾');
    expect(cast.changed).toBeNull();
    expect(cast.shiLine).toBe(6);
    expect(cast.yingLine).toBe(3);
  });

  it('changes 老阳 to yin in changed hexagram', () => {
    const oldYang: YaoThrow = {
      coins: ['reverse', 'reverse', 'reverse'],
      sum: 9,
      kind: '老阳',
      bit: 1,
      changing: true,
    };
    const youngYin: YaoThrow = {
      coins: ['obverse', 'obverse', 'reverse'],
      sum: 8,
      kind: '少阴',
      bit: 0,
      changing: false,
    };
    // 初爻老阳，余少阴 → 本卦类似... just check bit flip
    const throws = [oldYang, youngYin, youngYin, youngYin, youngYin, youngYin];
    const cast = buildCastFromThrows(throws);
    expect(cast.primaryLines[0]).toBe(1);
    expect(cast.changedLines[0]).toBe(0);
    expect(cast.changingIndexes).toEqual([0]);
    expect(cast.changed).not.toBeNull();
  });

  it('has 64 hexagrams and round-trips lines', () => {
    expect(HEXAGRAMS).toHaveLength(64);
    for (const h of HEXAGRAMS) {
      const lines = linesFromHexagram(h);
      expect(hexagramFromLines(lines).kingWen).toBe(h.kingWen);
    }
  });

  it('ying is opposite of shi', () => {
    expect(yingLineOf(1)).toBe(4);
    expect(yingLineOf(6)).toBe(3);
  });

  it('explains shi/ying from palace stage', () => {
    const stage = palaceStageOfHexagram('晋');
    expect(stage?.palace).toBe('乾');
    expect(stage?.stageLabel).toBe('游魂');
    expect(stage?.shiLine).toBe(4);
    const why = explainShiYingWhy('晋', 4, 1);
    expect(why.shiWhy).toMatch(/乾宫游魂|四爻/);
    expect(why.yingWhy).toMatch(/初爻|隔三/);
  });

  it('castSixYao returns six throws', () => {
    const cast = castSixYao('random', () => 0.1);
    expect(cast.throws).toHaveLength(6);
    expect(cast.primary.fullName).toBeTruthy();
  });

  it('builds four-layer reading without 吉凶', () => {
    const cast = castSixYao('random', () => 0.2);
    const reading = buildFourLayerReading(cast, '我要不要接受这个offer？');
    expect(reading.summary).toBeTruthy();
    expect(reading.basis).toMatch(/卦象|动爻|世应|世爻|应爻/);
    expect(reading.context).toMatch(/所以|offer|工作|你问的是/);
    expect(reading.action).toBeTruthy();
    expect(reading.summary).not.toMatch(/大吉|大凶/);
  });
});
