import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendZiweiAiTurns,
  createZiweiAiJournalEntry,
  loadZiweiJournal,
  saveZiweiAiDeepReadingToJournal,
  saveZiweiJournalEntry,
} from './journal.ts';

beforeEach(() => {
  const mem = new Map<string, string>();
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
});

describe('ziwei journal ai sessions', () => {
  it('createZiweiAiJournalEntry stores deep reading on a new hand note', () => {
    const linked = createZiweiAiJournalEntry({
      deepReading: '这是一段紫微深度解读。',
      question: '今年事业怎么走',
      snapshot: {
        fiveElementsClass: '水二局',
        soulMajors: '紫微、天府',
        headline: '定调一句',
        annualYear: '2026',
        annualAdvice: '先稳住',
      },
    });
    expect(linked?.journalId).toBeTruthy();
    expect(linked?.sessionId).toBeTruthy();
    const entry = loadZiweiJournal()[0]!;
    expect(entry.body).toMatch(/AI 深度解读/);
    expect(entry.aiSessions).toHaveLength(1);
    expect(entry.aiSessions![0]!.deepReading).toMatch(/紫微深度解读/);
  });

  it('appends follow-up turns to the same session', () => {
    const entry = saveZiweiJournalEntry({ body: '手写一条' });
    const sid = saveZiweiAiDeepReadingToJournal(entry.id, '深度正文');
    appendZiweiAiTurns(entry.id, sid, [
      { role: 'user', content: '那我下周怎么办？' },
      { role: 'assistant', content: '先核对一件事。' },
    ]);
    const loaded = loadZiweiJournal()[0]!;
    expect(loaded.aiSessions![0]!.turns.length).toBeGreaterThanOrEqual(3);
  });

  it('handwritten notes stay without aiSessions noise', () => {
    saveZiweiJournalEntry({ body: '今天想少开坑' });
    expect(loadZiweiJournal()[0]!.aiSessions).toEqual([]);
  });
});
