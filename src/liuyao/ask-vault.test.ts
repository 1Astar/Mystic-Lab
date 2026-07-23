import { describe, expect, it, beforeEach } from 'vitest';
import {
  normalizeAskQuestion,
  upsertAskEntry,
  voteAskUseful,
  voteAskUnclear,
  listPromotedAsks,
  findAskEntry,
  ASK_PROMOTE_MIN_ASKS,
  ASK_PROMOTE_MIN_USEFUL,
} from './ask-vault.ts';

const KEY = 'mystic-ly-ask-vault';

function installMemoryStorage(): void {
  const map = new Map<string, string>();
  const memory = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
  });
}

describe('ask-vault', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('normalizes question variants to same key', () => {
    expect(normalizeAskQuestion('  动爻在哪？  ')).toBe(normalizeAskQuestion('动爻在哪?'));
    expect(normalizeAskQuestion('用神是什么')).toBe(normalizeAskQuestion('用神是什么？'));
  });

  it('rejects empty or too-short questions', () => {
    expect(normalizeAskQuestion('')).toBe('');
    expect(normalizeAskQuestion('啊？')).toBe('');
  });

  it('increments askCount on same hex+qKey and promotes only at 5 asks + 3 useful', () => {
    const base = {
      q: '动爻对我有什么影响？',
      a: '动爻提示当下变心的层面。',
      hexName: '夬',
      domain: 'career',
      source: 'rule' as const,
    };
    let e = upsertAskEntry(base);
    expect(e.askCount).toBe(1);
    expect(listPromotedAsks('夬')).toHaveLength(0);

    for (let i = 0; i < 4; i++) e = upsertAskEntry(base);
    expect(e.askCount).toBe(5);
    expect(listPromotedAsks('夬')).toHaveLength(0);

    voteAskUseful(e.id);
    voteAskUseful(e.id);
    expect(listPromotedAsks('夬')).toHaveLength(0);

    voteAskUseful(e.id);
    const promoted = listPromotedAsks('夬');
    expect(promoted).toHaveLength(1);
    expect(promoted[0]!.usefulVotes).toBe(ASK_PROMOTE_MIN_USEFUL);
    expect(promoted[0]!.askCount).toBeGreaterThanOrEqual(ASK_PROMOTE_MIN_ASKS);
    expect(promoted[0]!.source).toBe('promoted');
  });

  it('scopes promotion per hexName', () => {
    const q = '用神是什么？';
    for (let i = 0; i < 5; i++) {
      upsertAskEntry({
        q,
        a: '看世应与所问六亲。',
        hexName: '夬',
        domain: 'general',
        source: 'ai',
      });
    }
    const e = findAskEntry('夬', q)!;
    voteAskUseful(e.id);
    voteAskUseful(e.id);
    voteAskUseful(e.id);
    expect(listPromotedAsks('夬')).toHaveLength(1);
    expect(listPromotedAsks('大有')).toHaveLength(0);
  });

  it('voteAskUnclear increments unclearVotes', () => {
    const e = upsertAskEntry({
      q: '为什么叫泽天夬？',
      a: '泽在上、天在下。',
      hexName: '夬',
      domain: 'general',
      source: 'rule',
    });
    voteAskUnclear(e.id);
    expect(findAskEntry('夬', e.q)?.unclearVotes).toBe(1);
  });

  it('persists to localStorage key', () => {
    upsertAskEntry({
      q: '如果结果不理想还能做什么？',
      a: '先对齐世应。',
      hexName: '夬',
      domain: 'career',
      source: 'rule',
    });
    const raw = localStorage.getItem(KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).length).toBe(1);
  });
});
