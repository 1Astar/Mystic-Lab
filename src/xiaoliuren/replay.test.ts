import { describe, expect, it } from 'vitest';
import { CHINESE_HOURS } from './chinese-hour.ts';
import { solarToLunar } from './lunar.ts';
import { computeLesson } from './engine.ts';
import type { XiaoliurenJournalEntry } from './journal.ts';
import { resolveXiaoliurenLesson } from './replay.ts';

describe('xiaoliuren replay', () => {
  it('rebuilds lesson from journal lunar + hour', () => {
    const at = new Date('2026-07-22T13:00:00+08:00');
    const lunar = solarToLunar(at);
    const hour = CHINESE_HOURS.find((h) => h.name === '未')!;
    const expected = computeLesson(lunar, hour);

    const entry: XiaoliurenJournalEntry = {
      id: 'x1',
      createdAt: at.toISOString(),
      question: '今天适合面试吗',
      solarLabel: '2026/07/22',
      lunar: {
        label: lunar.label,
        monthLabel: lunar.monthLabel,
        dayLabel: lunar.dayLabel,
        month: lunar.month,
        day: lunar.day,
      },
      hour: {
        name: hour.name,
        label: hour.label,
        rangeLabel: hour.rangeLabel,
      },
      resultId: expected.result.id,
      resultName: expected.result.name,
      summary: '摘要',
      reflection: '',
      fulfilled: null,
    };

    const resolved = resolveXiaoliurenLesson(entry);
    expect(resolved).not.toBeNull();
    expect(resolved!.lesson.result.id).toBe(expected.result.id);
    expect(resolved!.lesson.resultIndex).toBe(expected.resultIndex);
  });
});
