import { describe, expect, it, beforeEach } from 'vitest';
import { buildVaultSnapshot, meetLineFor } from './vault.ts';
import type { LiuyaoJournalEntry } from './journal.ts';

const KEY = 'mystic-lab-liuyao-journal';

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

function seed(entries: Partial<LiuyaoJournalEntry>[]): void {
  const list = entries.map((e, i) => ({
    id: e.id ?? `t${i}`,
    createdAt: e.createdAt ?? `2026-01-0${i + 1}T10:00:00.000Z`,
    castAt: e.castAt,
    question: e.question ?? '问工作',
    method: e.method ?? ('coin' as const),
    primaryName: e.primaryName ?? '乾',
    primaryFullName: e.primaryFullName ?? '乾为天',
    changedFullName: null,
    changingLabels: [],
    shiLine: 6,
    yingLine: 3,
    summary: '',
    reading: {} as LiuyaoJournalEntry['reading'],
    reflection: '',
    tags: [],
  }));
  localStorage.setItem(KEY, JSON.stringify(list));
}

describe('liuyao vault', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('aggregates encounter counts from journal', () => {
    seed([
      {
        primaryName: '乾',
        primaryFullName: '乾为天',
        question: '面试',
        createdAt: '2026-01-01T10:00:00.000Z',
      },
      { primaryName: '坤', primaryFullName: '坤为地', createdAt: '2026-02-01T10:00:00.000Z' },
      {
        primaryName: '乾',
        primaryFullName: '乾为天',
        question: '升职',
        createdAt: '2026-07-01T10:00:00.000Z',
      },
      {
        primaryName: '乾',
        primaryFullName: '乾为天',
        question: '跳槽',
        createdAt: '2026-07-20T10:00:00.000Z',
      },
    ]);
    const snap = buildVaultSnapshot();
    expect(snap.collected).toBe(2);
    expect(snap.total).toBe(64);
    expect(snap.mostMet?.name).toBe('乾');
    expect(snap.mostMet?.count).toBe(3);
    expect(meetLineFor(snap.mostMet)).toMatch(/第 3 次遇见/);
  });

  it('empty journal has zero collected', () => {
    const snap = buildVaultSnapshot();
    expect(snap.collected).toBe(0);
    expect(meetLineFor(null)).toMatch(/点亮图鉴/);
  });
});
