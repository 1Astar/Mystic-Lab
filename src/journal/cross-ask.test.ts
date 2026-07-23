import { describe, expect, it } from 'vitest';
import {
  findSiblingJourneyItems,
  normalizeQuestionKey,
} from './cross-ask.ts';
import type { JourneyItem } from './journey.ts';

function item(
  partial: Pick<JourneyItem, 'id' | 'system' | 'question'> & Partial<JourneyItem>,
): JourneyItem {
  return {
    createdAt: '2026-07-16T00:00:00.000Z',
    summary: 's',
    reflection: '',
    ...partial,
  };
}

describe('cross-ask', () => {
  it('normalizes whitespace', () => {
    expect(normalizeQuestionKey('  今天  适合吗？  ')).toBe('今天 适合吗？');
  });

  it('finds sibling across systems with same question', () => {
    const a = item({ id: 't1', system: 'tarot', question: '今天适合推进吗？' });
    const b = item({ id: 'x1', system: 'xiaoliuren', question: '今天适合推进吗？' });
    const c = item({ id: 't2', system: 'tarot', question: '别的问题' });
    const d = item({ id: 'l1', system: 'liuyao', question: '今天适合推进吗？' });
    expect(findSiblingJourneyItems(a, [a, b, c, d]).map((i) => i.id)).toEqual(['x1', 'l1']);
    expect(findSiblingJourneyItems(b, [a, b, c, d]).map((i) => i.id)).toEqual(['t1', 'l1']);
  });

  it('ignores empty questions', () => {
    const a = item({ id: 't1', system: 'tarot', question: '   ' });
    const b = item({ id: 'x1', system: 'xiaoliuren', question: '' });
    expect(findSiblingJourneyItems(a, [a, b])).toEqual([]);
  });
});
