import { describe, expect, it, beforeEach } from 'vitest';
import {
  appendLiuyaoAiTurns,
  loadLiuyaoJournal,
  saveLiuyaoAiDeepReading,
  saveLiuyaoJournalEntry,
} from './journal.ts';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { buildFourLayerReading } from './interpret.ts';

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

function sampleCast() {
  const throws = [
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
    facesToThrow([3, 3, 3]),
    facesToThrow([2, 2, 2]),
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'coin');
}

describe('liuyao journal ai sessions', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('saves deep reading onto the journal entry', () => {
    const cast = sampleCast();
    const reading = buildFourLayerReading(cast, '要不要离职');
    const entry = saveLiuyaoJournalEntry({
      question: '要不要离职',
      cast,
      reading,
      changingLabels: [],
    });
    const sid = saveLiuyaoAiDeepReading(entry.id, '这是一段深度解读正文。');
    expect(sid).toBeTruthy();
    const loaded = loadLiuyaoJournal()[0]!;
    expect(loaded.aiSessions).toHaveLength(1);
    expect(loaded.aiSessions![0]!.deepReading).toMatch(/深度解读/);
    expect(loaded.aiSessions![0]!.turns[0]!.content).toMatch(/深度解读/);
  });

  it('appends follow-up turns to the same session', () => {
    const cast = sampleCast();
    const reading = buildFourLayerReading(cast, '面试');
    const entry = saveLiuyaoJournalEntry({
      question: '面试',
      cast,
      reading,
      changingLabels: [],
    });
    const sid = saveLiuyaoAiDeepReading(entry.id, '深度正文');
    appendLiuyaoAiTurns(entry.id, sid, [
      { role: 'user', content: '那我下周怎么办？' },
      { role: 'assistant', content: '先核对一件事。' },
    ]);
    const loaded = loadLiuyaoJournal()[0]!;
    expect(loaded.aiSessions![0]!.turns.length).toBeGreaterThanOrEqual(3);
  });
});
