import { buildCastFromThrows, type CastResult, type YaoThrow } from './engine.ts';
import {
  HEXAGRAMS,
  LINE_LABELS,
  linesFromHexagram,
  type LineBit,
} from './hexagrams.ts';
import type { LiuyaoJournalEntry } from './journal.ts';

export type LiuyaoCastResolve = {
  cast: CastResult;
  /** 无 castSnapshot 时按卦名+动爻重建 */
  regenerated: boolean;
  entry: LiuyaoJournalEntry;
};

function syntheticThrow(bit: LineBit, changing: boolean): YaoThrow {
  if (changing && bit === 1) {
    return {
      coins: ['reverse', 'reverse', 'reverse'],
      sum: 9,
      kind: '老阳',
      bit: 1,
      changing: true,
    };
  }
  if (changing && bit === 0) {
    return {
      coins: ['obverse', 'obverse', 'obverse'],
      sum: 6,
      kind: '老阴',
      bit: 0,
      changing: true,
    };
  }
  if (bit === 1) {
    return {
      coins: ['reverse', 'reverse', 'obverse'],
      sum: 7,
      kind: '少阳',
      bit: 1,
      changing: false,
    };
  }
  return {
    coins: ['obverse', 'obverse', 'reverse'],
    sum: 8,
    kind: '少阴',
    bit: 0,
    changing: false,
  };
}

function changingIndexesFromLabels(labels: string[]): number[] {
  const indexes: number[] = [];
  for (const raw of labels) {
    const label = raw.trim();
    const i = (LINE_LABELS as readonly string[]).indexOf(label);
    if (i >= 0) indexes.push(i);
  }
  return indexes;
}

/** 旧手札无快照时：由本卦名 + 动爻标签重建盘面 */
export function reconstructCastFromEntry(entry: LiuyaoJournalEntry): CastResult | null {
  const primary =
    HEXAGRAMS.find((h) => h.fullName === entry.primaryFullName) ??
    HEXAGRAMS.find((h) => h.name === entry.primaryName);
  if (!primary) return null;

  const primaryLines = linesFromHexagram(primary);
  const changingIndexes = changingIndexesFromLabels(entry.changingLabels);
  const throws = primaryLines.map((bit, i) =>
    syntheticThrow(bit, changingIndexes.includes(i)),
  );
  try {
    return buildCastFromThrows(throws, entry.method ?? 'coin');
  } catch {
    return null;
  }
}

export function resolveLiuyaoCast(entry: LiuyaoJournalEntry): LiuyaoCastResolve | null {
  if (entry.castSnapshot?.primary && entry.castSnapshot.throws?.length === 6) {
    return { cast: entry.castSnapshot, regenerated: false, entry };
  }
  const cast = reconstructCastFromEntry(entry);
  if (!cast) return null;
  return { cast, regenerated: true, entry };
}

export function resolveLiuyaoLearnMode(entry: LiuyaoJournalEntry): boolean {
  return entry.learnMode !== false;
}
