import {
  hexagramFromLines,
  linesFromHexagram,
  yingLineOf,
  type Hexagram,
  type LineBit,
} from './hexagrams.ts';
import { upperLowerFromLines } from './hexagrams.ts';

/** 三钱法：字=2（阴面），背=3（阳面） */
export type CoinFace = 'obverse' | 'reverse'; // 字 | 背

export type YaoKind = '少阳' | '少阴' | '老阳' | '老阴';

export interface YaoThrow {
  coins: [CoinFace, CoinFace, CoinFace];
  sum: 6 | 7 | 8 | 9;
  kind: YaoKind;
  /** 本卦爻值：1阳 0阴 */
  bit: LineBit;
  changing: boolean;
}

export interface CastResult {
  throws: YaoThrow[];
  /** 自下而上六爻 */
  primaryLines: LineBit[];
  changedLines: LineBit[];
  primary: Hexagram;
  changed: Hexagram | null;
  changingIndexes: number[];
  shiLine: 1 | 2 | 3 | 4 | 5 | 6;
  yingLine: 1 | 2 | 3 | 4 | 5 | 6;
  method: 'coin' | 'random';
}

function sumToYao(sum: 6 | 7 | 8 | 9): Omit<YaoThrow, 'coins'> {
  if (sum === 6) return { sum, kind: '老阴', bit: 0, changing: true };
  if (sum === 7) return { sum, kind: '少阳', bit: 1, changing: false };
  if (sum === 8) return { sum, kind: '少阴', bit: 0, changing: false };
  return { sum, kind: '老阳', bit: 1, changing: true };
}

export function facesToThrow(coins: [CoinFace, CoinFace, CoinFace]): YaoThrow {
  let total = 0;
  for (const c of coins) total += c === 'reverse' ? 3 : 2;
  const sum = total as 6 | 7 | 8 | 9;
  return { coins, ...sumToYao(sum) };
}

export function rollOneYao(random = Math.random): YaoThrow {
  const coins: [CoinFace, CoinFace, CoinFace] = [
    random() < 0.5 ? 'obverse' : 'reverse',
    random() < 0.5 ? 'obverse' : 'reverse',
    random() < 0.5 ? 'obverse' : 'reverse',
  ];
  return facesToThrow(coins);
}

export function buildCastFromThrows(
  throws: YaoThrow[],
  method: CastResult['method'] = 'coin',
): CastResult {
  if (throws.length !== 6) throw new Error('需要六次投掷');
  const primaryLines = throws.map((t) => t.bit);
  const changingIndexes = throws
    .map((t, i) => (t.changing ? i : -1))
    .filter((i) => i >= 0);
  const changedLines: LineBit[] = primaryLines.map((bit, i) => {
    if (!throws[i]!.changing) return bit;
    return bit === 1 ? 0 : 1;
  });
  const primary = hexagramFromLines(primaryLines);
  const changed =
    changingIndexes.length > 0 ? hexagramFromLines(changedLines) : null;
  const shiLine = primary.shiLine;
  return {
    throws,
    primaryLines,
    changedLines,
    primary,
    changed,
    changingIndexes,
    shiLine,
    yingLine: yingLineOf(shiLine),
    method,
  };
}

/** 铜钱六次 / 随机六次 */
export function castSixYao(
  method: 'coin' | 'random' = 'coin',
  random = Math.random,
): CastResult {
  const throws = Array.from({ length: 6 }, () => rollOneYao(random));
  return buildCastFromThrows(throws, method);
}

export function describeTrigramCombo(lines: LineBit[]): string {
  const { upper, lower } = upperLowerFromLines(lines);
  return `上${upper.id}${upper.symbol}（${upper.nature}）+ 下${lower.id}${lower.symbol}（${lower.nature}）`;
}

export function lineBitLabel(bit: LineBit): string {
  return bit === 1 ? '阳 ━━━' : '阴 ━━ ━━';
}

export { linesFromHexagram, upperLowerFromLines };
