import { describe, expect, it, beforeEach } from 'vitest';
import {
  appendTarotAiTurns,
  loadJournalEntries,
  saveJournalEntry,
  saveTarotAiDeepReading,
} from './records.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import type { ReadingResult } from '../interpretation/types.ts';

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

function sampleDrawn(): DrawnCard[] {
  const card = TAROT_DECK[0]!;
  return [
    {
      card,
      reversed: false,
      position: '当下',
      positionKey: 'focus',
    },
  ];
}

function sampleReading(cards: DrawnCard[]): ReadingResult {
  return {
    cards: cards.map((c) => ({
      position: c.position ?? '',
      positionKey: c.positionKey ?? 'focus',
      cardName: c.card.nameZh,
      cardId: c.card.id,
      orientation: c.reversed ? 'reversed' : 'upright',
      keywords: [],
      positionMeaning: '',
      text: '',
      baseMeaning: '',
      inContext: '',
      learnTip: '',
      combined: '',
      question: '今日提醒',
      spreadType: 'single',
      cardPosition: c.position ?? '',
      topic: 'general',
      selectedCardId: c.card.id,
      readingContext: { topic: 'general', question: '今日提醒' } as never,
      selectedCard: {} as never,
      interpretationLayers: {
        standard: { oneSentence: '一句' },
      } as never,
      encounterRecord: null,
      hasVisualHotspots: false,
      interpretationProvider: 'mock',
    })),
    summary: '这是一次单张提醒。',
    learningNote: '学习笔记',
    provider: 'mock',
  };
}

describe('tarot journal ai sessions', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('saves deep reading onto the journal entry', () => {
    const cards = sampleDrawn();
    const reading = sampleReading(cards);
    const entry = saveJournalEntry(
      '今日提醒',
      'single',
      cards,
      reading,
      '学习笔记',
    );
    expect(entry.aiSessions).toEqual([]);
    const sid = saveTarotAiDeepReading(entry.id, '这是一段塔罗深度解读正文。');
    expect(sid).toBeTruthy();
    const loaded = loadJournalEntries()[0]!;
    expect(loaded.aiSessions).toHaveLength(1);
    expect(loaded.aiSessions![0]!.deepReading).toMatch(/深度解读/);
    expect(loaded.aiSessions![0]!.turns[0]!.content).toMatch(/深度解读/);
  });

  it('appends follow-up turns to the same session', () => {
    const cards = sampleDrawn();
    const reading = sampleReading(cards);
    const entry = saveJournalEntry('面试', 'single', cards, reading, '笔记');
    const sid = saveTarotAiDeepReading(entry.id, '深度正文');
    appendTarotAiTurns(entry.id, sid, [
      { role: 'user', content: '那我下周怎么办？' },
      { role: 'assistant', content: '先核对一件事。' },
    ]);
    const loaded = loadJournalEntries()[0]!;
    expect(loaded.aiSessions![0]!.turns.length).toBeGreaterThanOrEqual(3);
  });

  it('old entries without AI stay empty aiSessions on load', () => {
    localStorage.setItem(
      'mystic-lab-journal',
      JSON.stringify([
        {
          id: 'j-old',
          createdAt: new Date().toISOString(),
          question: '旧记录',
          spreadType: 'single',
          cardIds: ['major-0'],
          cards: [{ name: '愚者', position: '当下', reversed: false }],
          summary: '旧摘要',
          learningNote: '旧笔记',
          reflection: '',
        },
      ]),
    );
    const loaded = loadJournalEntries()[0]!;
    expect(loaded.aiSessions).toEqual([]);
  });

  it('preserves aiSessions when re-saving the same journal entry', () => {
    const cards = sampleDrawn();
    const reading = sampleReading(cards);
    const entry = saveJournalEntry('保留', 'single', cards, reading, '笔记');
    saveTarotAiDeepReading(entry.id, '深度正文应保留');
    saveJournalEntry('保留', 'single', cards, reading, '笔记', '', entry.id);
    const loaded = loadJournalEntries()[0]!;
    expect(loaded.aiSessions).toHaveLength(1);
    expect(loaded.aiSessions![0]!.deepReading).toMatch(/应保留/);
  });
});
