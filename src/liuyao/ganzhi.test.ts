import { describe, expect, it } from 'vitest';
import { siZhuFromDate, renderDateChongBarHtml, renderCastTimePlaque } from './ganzhi.ts';

describe('siZhuFromDate', () => {
  it('returns four pillars and day stem for a fixed local datetime', () => {
    const d = new Date(2026, 6, 17, 9, 34, 0);
    const sz = siZhuFromDate(d);
    expect(sz.year.length).toBe(2);
    expect(sz.month.length).toBe(2);
    expect(sz.day.length).toBe(2);
    expect(sz.hour.length).toBe(2);
    expect(sz.dayStem).toHaveLength(1);
    expect(sz.dayXunKong.length).toBeGreaterThan(0);
  });

  it('renders date chong bar with 月建/日建 and 冲 partners', () => {
    const d = new Date(2026, 6, 17, 9, 34, 0);
    const html = renderDateChongBarHtml(d);
    expect(html).toMatch(/data-date-chong/);
    expect(html).toMatch(/月建/);
    expect(html).toMatch(/日建/);
    expect(html).toMatch(/暗动|月破/);
    const plaque = renderCastTimePlaque(d);
    expect(plaque).toMatch(/冲看这里/);
  });
});
