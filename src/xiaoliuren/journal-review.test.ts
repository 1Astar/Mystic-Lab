import { describe, expect, it } from 'vitest';
import {
  REVIEW_AFTER_MS,
  isXiaoliurenDueForReview,
  type XiaoliurenJournalEntry,
} from './journal.ts';

function entry(
  partial: Partial<XiaoliurenJournalEntry> & Pick<XiaoliurenJournalEntry, 'createdAt'>,
): XiaoliurenJournalEntry {
  return {
    id: 'x1',
    question: 'q',
    solarLabel: '',
    lunar: { label: '', monthLabel: '', dayLabel: '', month: 1, day: 1 },
    hour: { name: '子', label: '子时', rangeLabel: '' },
    resultId: 'da-an',
    resultName: '大安',
    summary: 's',
    reflection: '',
    fulfilled: null,
    ...partial,
  };
}

describe('isXiaoliurenDueForReview', () => {
  const now = Date.parse('2026-07-16T12:00:00.000Z');

  it('false when younger than 3 days', () => {
    const e = entry({ createdAt: new Date(now - REVIEW_AFTER_MS + 60_000).toISOString() });
    expect(isXiaoliurenDueForReview(e, now)).toBe(false);
  });

  it('true when aged 3 days and unmarked', () => {
    const e = entry({ createdAt: new Date(now - REVIEW_AFTER_MS).toISOString() });
    expect(isXiaoliurenDueForReview(e, now)).toBe(true);
  });

  it('false when already marked', () => {
    const base = new Date(now - REVIEW_AFTER_MS).toISOString();
    expect(isXiaoliurenDueForReview(entry({ createdAt: base, fulfilled: true }), now)).toBe(false);
    expect(isXiaoliurenDueForReview(entry({ createdAt: base, fulfilled: false }), now)).toBe(false);
  });
});
