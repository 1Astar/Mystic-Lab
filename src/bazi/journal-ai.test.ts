import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendBaziAiTurns,
  createBaziAiJournalEntry,
  loadBaziJournal,
  saveBaziAiDeepReadingToJournal,
  saveBaziJournalEntry,
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

describe('bazi journal ai sessions', () => {
  it('createBaziAiJournalEntry stores deep reading on a new hand note', () => {
    const linked = createBaziAiJournalEntry({
      deepReading: '这是一段八字深度解读。',
      question: '今年事业怎么走',
      snapshot: {
        dayMaster: '甲',
        dayMasterWx: '木',
        patternName: '正官格',
        bodyBand: '身弱',
        yongWx: ['水'],
        jiWx: ['金'],
        dayunGanZhi: '乙亥',
        dayunHint: '',
        liunianLabel: '2026丙午',
      },
    });
    expect(linked?.journalId).toBeTruthy();
    expect(linked?.sessionId).toBeTruthy();
    const entry = loadBaziJournal()[0]!;
    expect(entry.body).toMatch(/AI 深度解读/);
    expect(entry.aiSessions).toHaveLength(1);
    expect(entry.aiSessions![0]!.deepReading).toMatch(/八字深度解读/);
    expect(entry.aiSessions![0]!.turns[0]!.role).toBe('assistant');
  });

  it('appends follow-up turns to the same session', () => {
    const entry = saveBaziJournalEntry({ body: '手写一条' });
    const sid = saveBaziAiDeepReadingToJournal(entry.id, '深度正文');
    appendBaziAiTurns(entry.id, sid, [
      { role: 'user', content: '那我下周怎么办？' },
      { role: 'assistant', content: '先核对一件事。' },
    ]);
    const loaded = loadBaziJournal()[0]!;
    expect(loaded.aiSessions![0]!.turns.length).toBeGreaterThanOrEqual(3);
  });

  it('handwritten notes stay without aiSessions noise', () => {
    saveBaziJournalEntry({ body: '今天想少开坑' });
    expect(loadBaziJournal()[0]!.aiSessions).toEqual([]);
  });
});
