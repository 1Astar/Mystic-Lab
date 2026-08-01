import { describe, expect, it } from 'vitest';
import {
  LAB_ASK_PLACEHOLDERS,
  adviseSystemsForQuestion,
} from './lab-ask-recommend.ts';

describe('adviseSystemsForQuestion', () => {
  it('recommends tarot + meihua for relationship feelings', () => {
    const a = adviseSystemsForQuestion(
      '我最近谈了一个新对象，对方对我是什么感觉？',
    );
    expect(a.scene).toBe('relation');
    expect(a.options.map((o) => o.key)).toEqual(['tarot', 'meihua']);
    expect(a.message).toContain('【塔罗】（看见画面）');
    expect(a.message).toContain('【梅花易数】（关系气场）');
    expect(a.message).toMatch(/你想用哪个/);
  });

  it('recommends liuyao + xiaoliuren for interview offer', () => {
    const a = adviseSystemsForQuestion(
      '我下周去面试的那家公司，能给我发Offer吗？',
    );
    expect(a.scene).toBe('matter-offer');
    expect(a.options.map((o) => o.key)).toEqual(['liuyao', 'xiaoliuren']);
    expect(a.message).toContain('【六爻】（一事细看）');
    expect(a.message).toContain('【小六壬】（即时吉凶）');
  });

  it('has rotating placeholders in user voice', () => {
    expect(LAB_ASK_PLACEHOLDERS.some((p) => p.includes('测算'))).toBe(true);
    expect(LAB_ASK_PLACEHOLDERS.some((p) => p.includes('困惑'))).toBe(true);
  });
});
