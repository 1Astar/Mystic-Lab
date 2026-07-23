import { describe, expect, it, beforeEach } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { answerAskByRules, answerAndStoreAsk } from './ask-answer.ts';
import { findAskEntry, listPromotedAsks } from './ask-vault.ts';

function installMemoryStorage(): void {
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => map.set(k, String(v)),
      removeItem: (k: string) => map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    },
    configurable: true,
  });
}

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

describe('ask-answer', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('rule answer is non-empty and stores into vault', async () => {
    const cast = castSample();
    const rule = answerAskByRules(cast, '面试能过吗', '动爻在哪对我有什么影响');
    expect(rule.answer.length).toBeGreaterThan(10);

    const res = await answerAndStoreAsk({
      cast,
      question: '面试能过吗',
      userAsk: '动爻在哪对我有什么影响',
    });
    expect(res.answer.length).toBeGreaterThan(10);
    expect(res.source === 'rule' || res.source === 'ai' || res.source === 'cached').toBe(true);
    expect(findAskEntry(cast.primary.name, '动爻在哪对我有什么影响')?.askCount).toBe(1);
    expect(listPromotedAsks(cast.primary.name)).toHaveLength(0);
  });

  it('second ask caches and increments count', async () => {
    const cast = castSample();
    await answerAndStoreAsk({
      cast,
      question: '面试能过吗',
      userAsk: '用神是什么我该看哪一类',
    });
    const again = await answerAndStoreAsk({
      cast,
      question: '面试能过吗',
      userAsk: '用神是什么我该看哪一类？',
    });
    expect(again.source).toBe('cached');
    expect(again.entry.askCount).toBe(2);
  });
});
