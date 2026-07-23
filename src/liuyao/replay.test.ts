import { describe, expect, it } from 'vitest';
import { HEXAGRAMS, linesFromHexagram } from './hexagrams.ts';
import { buildCastFromThrows, type CastResult } from './engine.ts';
import type { LiuyaoJournalEntry } from './journal.ts';
import { reconstructCastFromEntry, resolveLiuyaoCast } from './replay.ts';

function makeEntry(partial: Partial<LiuyaoJournalEntry>): LiuyaoJournalEntry {
  const primary = HEXAGRAMS.find((h) => h.name === '夬')!;
  return {
    id: 't1',
    createdAt: '2026-07-22T13:00:00.000Z',
    question: '求职如何',
    method: 'coin',
    primaryName: primary.name,
    primaryFullName: primary.fullName,
    changedFullName: null,
    changingLabels: ['五爻'],
    shiLine: primary.shiLine,
    yingLine: 2,
    summary: '核心在于决断',
    reading: { summary: '核心在于决断', basis: 'b', context: 'c', action: 'a' },
    reflection: '',
    tags: [],
    ...partial,
  };
}

describe('liuyao replay', () => {
  it('reconstructs cast from hex name + changing labels', () => {
    const entry = makeEntry({});
    const cast = reconstructCastFromEntry(entry);
    expect(cast).not.toBeNull();
    expect(cast!.primary.fullName).toBe(entry.primaryFullName);
    expect(cast!.changingIndexes).toEqual([4]);
  });

  it('prefers castSnapshot when present', () => {
    const primary = HEXAGRAMS.find((h) => h.name === '乾')!;
    const lines = linesFromHexagram(primary);
    const throws = lines.map((bit) => ({
      coins: ['reverse', 'reverse', 'obverse'] as const,
      sum: 7 as const,
      kind: '少阳' as const,
      bit,
      changing: false,
    }));
    const snapshot = buildCastFromThrows([...throws], 'random') satisfies CastResult;
    const resolved = resolveLiuyaoCast(
      makeEntry({
        castSnapshot: snapshot,
        primaryName: primary.name,
        primaryFullName: primary.fullName,
        changingLabels: [],
      }),
    );
    expect(resolved?.regenerated).toBe(false);
    expect(resolved?.cast.method).toBe('random');
  });
});
