import { describe, expect, it } from 'vitest';
import { computeLesson } from './engine.ts';
import { getChineseHour } from './chinese-hour.ts';
import { buildPhaseTeach, monthGodName } from './lesson-copy.ts';

describe('xiaoliuren lesson-copy L2', () => {
  const hour = getChineseHour(new Date('2026-07-15T14:00:00'));

  it('maps lunar month cycle: 正月大安 · 六月空亡', () => {
    expect(monthGodName(1)).toBe('大安');
    expect(monthGodName(6)).toBe('空亡');
    expect(monthGodName(7)).toBe('大安');
  });

  it('month step teaches 从月起 and lands for 六月', () => {
    const lunar = {
      year: 2026,
      month: 6,
      day: 2,
      isLeapMonth: false,
      label: '六月初二',
      monthLabel: '六月',
      dayLabel: '初二',
    };
    const lesson = computeLesson(lunar, hour);
    expect(lesson.steps[0].title).toBe('第一步：从月起');
    expect(lesson.steps[0].landingIndex).toBe(5);

    const teach = buildPhaseTeach('month', lunar, hour, lesson.steps);
    expect(teach.conclusion).toContain('空亡');
    expect(teach.rules[0]).toContain('正月起大安');
  });

  it('day step continues from month landing', () => {
    const lunar = {
      year: 2026,
      month: 6,
      day: 2,
      isLeapMonth: false,
      label: '六月初二',
      monthLabel: '六月',
      dayLabel: '初二',
    };
    const lesson = computeLesson(lunar, hour);
    // 六月空亡为第1，初二→大安
    expect(lesson.steps[1].title).toBe('第二步：从日起');
    expect(lesson.steps[1].landingIndex).toBe(0);

    const teach = buildPhaseTeach('day', lunar, hour, lesson.steps);
    expect(teach.lead).toContain('上一');
    expect(teach.conclusion).toContain('大安');
  });

  it('hour step uses 从时起', () => {
    const lunar = {
      year: 2026,
      month: 1,
      day: 1,
      isLeapMonth: false,
      label: '正月初一',
      monthLabel: '正月',
      dayLabel: '初一',
    };
    const lesson = computeLesson(lunar, hour);
    expect(lesson.steps[2].title).toBe('第三步：从时起');
    const teach = buildPhaseTeach('hour', lunar, hour, lesson.steps);
    expect(teach.rules.join('')).toContain('子时');
  });
});
