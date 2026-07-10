import { describe, expect, it } from 'vitest';
import { computeLesson } from './engine.ts';
import { getChineseHour } from './chinese-hour.ts';
import { solarToLunar } from './lunar.ts';

describe('xiaoliuren engine', () => {
  it('counts month → day → hour on six positions', () => {
    const date = new Date('2026-07-09T14:06:00');
    const lunar = solarToLunar(date);
    const hour = getChineseHour(date);
    const lesson = computeLesson(lunar, hour);

    expect(lesson.steps).toHaveLength(3);
    expect(lesson.steps[0].phase).toBe('month');
    expect(lesson.steps[1].fromIndex).toBe(lesson.steps[0].landingIndex);
    expect(lesson.steps[2].fromIndex).toBe(lesson.steps[1].landingIndex);
    expect(lesson.result.name).toBeTruthy();
    expect(lesson.basisLabel).toContain(hour.label);
  });

  it('maps month 1 to 大安', () => {
    const lunar = { year: 2026, month: 1, day: 1, isLeapMonth: false, label: '正月初一', monthLabel: '正月', dayLabel: '初一' };
    const hour = getChineseHour(new Date('2026-01-01T12:00:00'));
    const lesson = computeLesson(lunar, hour);
    expect(lesson.steps[0].landingIndex).toBe(0);
  });
});
