import { describe, expect, it } from 'vitest';
import { getLunarConvertView } from './lunar-convert.ts';

describe('getLunarConvertView', () => {
  it('returns scroll flip fields', () => {
    const date = new Date(2026, 6, 9, 17, 59);
    const view = getLunarConvertView(date, '酉时');

    expect(view.solarDateTime).toBe('2026-07-09 17:59');
    expect(view.weekdayLabel).toMatch(/^星期/);
    expect(view.solarLabel).toMatch(/^公历 /);
    expect(view.lunarLabel).toMatch(/^农历 /);
    expect(view.ganzhiLine).toContain('酉时');
  });
});
