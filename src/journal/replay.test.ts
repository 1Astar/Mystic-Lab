import { describe, expect, it, beforeEach } from 'vitest';
import { findJournalForEncounter, resolveEncounterReplay } from '../journal/replay.ts';
import type { CodexEncounter } from '../codex/collection.ts';
import type { JournalEntry } from '../journal/records.ts';

const STORAGE_KEY = 'mystic-lab-journal';

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

describe('encounter replay linking', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('finds journal by journalId on encounter', () => {
    const entry: JournalEntry = {
      id: 'j-test-1',
      createdAt: '2026-07-14T06:52:00.000Z',
      question: '什么时候能找到下一份工作？',
      spreadType: 'single',
      cardIds: ['swords-seven'],
      cards: [{ name: '宝剑七', position: '当下', reversed: false }],
      summary: 'ok',
      learningNote: '',
      reflection: '',
      status: 'complete',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));

    const enc: CodexEncounter = {
      at: '2026-07-14T06:52:13.000Z',
      question: '什么时候能找到下一份工作？',
      summary: '正位',
      reversed: false,
      spreadLabel: '当下',
      journalId: 'j-test-1',
    };

    expect(findJournalForEncounter('swords-seven', enc)?.id).toBe('j-test-1');
  });

  it('falls back to question + time window match', () => {
    const entry: JournalEntry = {
      id: 'j-test-2',
      createdAt: '2026-07-14T06:50:00.000Z',
      question: '什么时候能找到下一份工作？',
      spreadType: 'single',
      cardIds: ['swords-seven'],
      cards: [{ name: '宝剑七', position: '当下', reversed: false }],
      summary: 'ok',
      learningNote: '',
      reflection: '',
      status: 'complete',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));

    const enc: CodexEncounter = {
      at: '2026-07-14T06:52:13.000Z',
      question: '什么时候能找到下一份工作？',
      summary: '倾向',
      reversed: false,
      spreadLabel: '当下',
    };

    expect(findJournalForEncounter('swords-seven', enc)?.id).toBe('j-test-2');
  });

  it('rebuilds single-card reading when no journal', () => {
    const enc: CodexEncounter = {
      at: '2026-07-14T06:52:13.000Z',
      question: '测试问题',
      summary: '摘要',
      reversed: false,
      spreadLabel: '当下',
    };
    const resolved = resolveEncounterReplay('swords-seven', enc);
    expect(resolved.regenerated).toBe(true);
    expect(resolved.reading.cards).toHaveLength(1);
    expect(resolved.reading.cards[0]?.cardId).toBe('swords-seven');
  });
});
