import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { TAROT_DECK } from '../tarot/deck.ts';
import type { JournalEntry } from './records.ts';
import {
  buildResumeSession,
  canResumePartial,
  fillRemainingCardPool,
  stashResumeJournalId,
  consumeResumeJournalId,
  RESUME_JOURNAL_KEY,
} from './resume.ts';
import { reconstructDrawnCards } from './replay.ts';

function mockSessionStorage() {
  const map = new Map<string, string>();
  const api = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
  };
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: api,
    configurable: true,
  });
}

function partialEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  const c0 = TAROT_DECK[0]!;
  const c1 = TAROT_DECK[1]!;
  return {
    id: 'j-resume-test',
    createdAt: new Date().toISOString(),
    question: '工作机会如何',
    spreadType: 'past-present-future',
    cardIds: [c0.id, c1.id],
    cards: [
      { name: c0.nameZh, position: '过去', reversed: false },
      { name: c1.nameZh, position: '现在', reversed: true },
    ],
    summary: '已抽 2/3 张 · 占问未完成',
    learningNote: '',
    reflection: '',
    status: 'partial',
    ...overrides,
  };
}

describe('tarot resume partial', () => {
  beforeEach(() => {
    mockSessionStorage();
  });
  afterEach(() => {
    sessionStorage.removeItem(RESUME_JOURNAL_KEY);
  });

  it('canResumePartial requires partial with cards', () => {
    expect(canResumePartial(partialEntry())).toBe(true);
    expect(canResumePartial(partialEntry({ status: 'complete' }))).toBe(false);
    expect(canResumePartial(partialEntry({ cardIds: [], cards: [] }))).toBe(false);
  });

  it('fillRemainingCardPool appends unused cards for remaining slots', () => {
    const entry = partialEntry();
    const drawn = reconstructDrawnCards(entry);
    const pool = fillRemainingCardPool(drawn, 'past-present-future');
    expect(pool).toHaveLength(3);
    expect(pool.slice(0, 2).map((d) => d.card.id)).toEqual(drawn.map((d) => d.card.id));
    const ids = pool.map((d) => d.card.id);
    expect(new Set(ids).size).toBe(3);
    expect(pool[2]!.position).toBeTruthy();
  });

  it('buildResumeSession lands on next index with revealed drawn cards', () => {
    const r = buildResumeSession(partialEntry());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.drawnCards).toHaveLength(2);
    expect(r.session.cardPool).toHaveLength(3);
    expect(r.session.currentIndex).toBe(2);
    expect(r.session.revealedFlags).toEqual([true, true]);
    expect(r.session.readyForResult).toBe(false);
  });

  it('readyForResult when drawn already fills spread', () => {
    const c0 = TAROT_DECK[0]!;
    const c1 = TAROT_DECK[1]!;
    const c2 = TAROT_DECK[2]!;
    const r = buildResumeSession(
      partialEntry({
        cardIds: [c0.id, c1.id, c2.id],
        cards: [
          { name: c0.nameZh, position: '过去', reversed: false },
          { name: c1.nameZh, position: '现在', reversed: false },
          { name: c2.nameZh, position: '未来', reversed: false },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.readyForResult).toBe(true);
    expect(r.session.cardPool).toHaveLength(3);
  });

  it('stash/consume resume id is one-shot', () => {
    stashResumeJournalId('j-1');
    expect(consumeResumeJournalId()).toBe('j-1');
    expect(consumeResumeJournalId()).toBeNull();
  });
});
