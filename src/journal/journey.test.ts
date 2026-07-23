import { describe, expect, it } from 'vitest';
import { filterJourneyItems, type JourneyItem } from './journey.ts';

function item(
  partial: Pick<JourneyItem, 'id' | 'system' | 'reflection'> & Partial<JourneyItem>,
): JourneyItem {
  return {
    createdAt: '2026-07-16T00:00:00.000Z',
    question: 'q',
    summary: 's',
    ...partial,
  };
}

describe('filterJourneyItems', () => {
  const sample: JourneyItem[] = [
    item({ id: 't1', system: 'tarot', reflection: '' }),
    item({ id: 'x1', system: 'xiaoliuren', reflection: '有应验' }),
    item({ id: 't2', system: 'tarot', reflection: '记下了' }),
    item({ id: 'l1', system: 'liuyao', reflection: '卦象回看' }),
  ];

  it('returns all for all filter', () => {
    expect(filterJourneyItems(sample, 'all')).toHaveLength(4);
  });

  it('filters by system', () => {
    expect(filterJourneyItems(sample, 'tarot').map((i) => i.id)).toEqual(['t1', 't2']);
    expect(filterJourneyItems(sample, 'xiaoliuren').map((i) => i.id)).toEqual(['x1']);
    expect(filterJourneyItems(sample, 'liuyao').map((i) => i.id)).toEqual(['l1']);
  });

  it('notes filter keeps non-empty reflection', () => {
    expect(filterJourneyItems(sample, 'notes').map((i) => i.id)).toEqual(['x1', 't2', 'l1']);
  });
});
