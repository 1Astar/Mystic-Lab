import { describe, expect, it } from 'vitest';
import type { JournalEntry } from './records.ts';
import {
  localDayKey,
  resolveReadingSeries,
  resolveReadingSeriesForEntry,
  scoreRelatedReading,
} from './reading-series.ts';

function entry(
  id: string,
  createdAt: string,
  question: string,
  extra: Partial<JournalEntry> = {},
): JournalEntry {
  return {
    id,
    createdAt,
    question,
    spreadType: 'single',
    cardIds: ['major-0'],
    cards: [{ name: '愚者', position: '', reversed: false }],
    summary: '测试',
    learningNote: '',
    reflection: '',
    status: 'complete',
    sceneTags: ['感情'],
    ...extra,
  };
}

describe('reading-series', () => {
  it('localDayKey uses local calendar date', () => {
    const k = localDayKey('2026-08-22T23:30:00+08:00');
    expect(k).toMatch(/^2026-08-2[12]$/);
  });

  it('scores related readings by theme and tags', () => {
    const a = entry('a', '2026-08-22T10:00:00+08:00', '他会不会回来找我？', {
      sceneTags: ['感情'],
    });
    const b = entry('b', '2026-08-22T11:00:00+08:00', '我们还有复合的可能吗', {
      sceneTags: ['感情'],
    });
    expect(scoreRelatedReading(a.question, undefined, a.sceneTags, b)).toBeGreaterThanOrEqual(4);
  });

  it('resolveReadingSeries links prior same-day episode', () => {
    const entries = [
      entry('j1', '2026-08-22T09:00:00+08:00', '他为什么联系我妈？', {
        sceneTags: ['家庭'],
        cards: [{ name: '宝剑九', position: '过去', reversed: false }],
      }),
      entry('j2', '2026-08-22T14:00:00+08:00', '他联系我妈是什么动机', {
        sceneTags: ['家庭'],
      }),
    ];
    const series = resolveReadingSeries({
      question: '他还会再找我爸吗',
      at: '2026-08-22T18:00:00+08:00',
      entryId: 'j-new',
      sceneTags: ['家庭'],
      entries,
    });
    expect(series).not.toBeNull();
    expect(series!.episodeIndex).toBe(2);
    expect(series!.lead).toContain('第 2 局');
    expect(series!.lead).toContain('上集');
    expect(series!.synthesisPrefix).toContain('【连载】');
  });

  it('resolveReadingSeriesForEntry positions episode in cluster', () => {
    const entries = [
      entry('j1', '2026-08-22T09:00:00+08:00', '这份工作要不要离职', {
        sceneTags: ['工作'],
      }),
      entry('j2', '2026-08-22T15:00:00+08:00', '离职后会不会后悔', {
        sceneTags: ['工作'],
      }),
    ];
    const first = resolveReadingSeriesForEntry(entries[0]!, entries);
    const second = resolveReadingSeriesForEntry(entries[1]!, entries);
    expect(first?.episodeIndex).toBe(1);
    expect(first?.lead).toContain('第一局');
    expect(second?.episodeIndex).toBe(2);
    expect(second?.priorEpisodes).toHaveLength(1);
  });
});
