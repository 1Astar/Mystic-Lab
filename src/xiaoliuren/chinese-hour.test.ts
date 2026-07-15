import { describe, expect, it } from 'vitest';
import {
  CHINESE_HOURS,
  formatHourMemory,
  getChineseHour,
} from './chinese-hour.ts';

describe('chinese hour aliases', () => {
  it('covers twelve hours with traditional aliases', () => {
    expect(CHINESE_HOURS).toHaveLength(12);
    expect(CHINESE_HOURS.map((h) => h.alias)).toEqual([
      '夜半',
      '鸡鸣',
      '平旦',
      '日出',
      '食时',
      '隅中',
      '日中',
      '日昳',
      '晡时',
      '日入',
      '黄昏',
      '人定',
    ]);
  });

  it('formats memory with alias', () => {
    const zi = CHINESE_HOURS[0]!;
    expect(formatHourMemory(zi)).toContain('夜半');
    expect(getChineseHour(new Date('2026-07-15T00:30:00')).alias).toBe('夜半');
    expect(getChineseHour(new Date('2026-07-15T12:00:00')).alias).toBe('日中');
  });
});
