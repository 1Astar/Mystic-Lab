import { describe, expect, it } from 'vitest';
import type { JournalEntry } from './records.ts';
import { isTarotDueForReview } from './review-remind.ts';

function entry(over: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'j1',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    question: '明天面试怎么样？',
    spreadType: 'single',
    cardIds: ['c1'],
    cards: [{ name: '恋人', position: '本牌', reversed: true }],
    summary: '摘要',
    learningNote: '',
    reflection: '',
    fulfilled: null,
    status: 'complete',
    ...over,
  };
}

describe('isTarotDueForReview', () => {
  it('is due after 3 days without reflection', () => {
    expect(isTarotDueForReview(entry())).toBe(true);
  });

  it('is not due when reflection written', () => {
    expect(isTarotDueForReview(entry({ reflection: '面试没过' }))).toBe(false);
  });

  it('is not due when fulfilled marked', () => {
    expect(isTarotDueForReview(entry({ fulfilled: true }))).toBe(false);
  });

  it('is not due for partial entries', () => {
    expect(isTarotDueForReview(entry({ status: 'partial' }))).toBe(false);
  });
});
