import { describe, expect, it } from 'vitest';
import { LAB_PICK_CARDS, LAB_SYSTEM_GUIDE } from './lab-guide-modal.ts';

describe('lab-guide-modal', () => {
  it('opens with scene picks and system strengths', () => {
    expect(LAB_SYSTEM_GUIDE.some((g) => g.focus.includes('看人'))).toBe(true);
    expect(LAB_SYSTEM_GUIDE.some((g) => g.focus.includes('看事'))).toBe(true);
    expect(LAB_SYSTEM_GUIDE.filter((g) => g.system === '塔罗')).toHaveLength(2);
    expect(LAB_SYSTEM_GUIDE.every((g) => g.focus && g.system)).toBe(true);
    expect(LAB_PICK_CARDS).toHaveLength(4);
    expect(LAB_PICK_CARDS.every((c) => c.strength && c.forYou && c.notFor)).toBe(true);
    expect(LAB_PICK_CARDS.find((c) => c.key === 'liuyao')?.strength).toMatch(/谈薪|offer|官司/);
  });
});
