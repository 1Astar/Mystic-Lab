import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, type YaoThrow } from './engine.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { buildCausalReading, buildLearnFaq } from './narrative-learn.ts';

const youngYang: YaoThrow = {
  coins: ['reverse', 'reverse', 'obverse'],
  sum: 7,
  kind: '少阳',
  bit: 1,
  changing: false,
};

const oldYang: YaoThrow = {
  coins: ['reverse', 'reverse', 'reverse'],
  sum: 9,
  kind: '老阳',
  bit: 1,
  changing: true,
};

const youngYin: YaoThrow = {
  coins: ['obverse', 'obverse', 'reverse'],
  sum: 8,
  kind: '少阴',
  bit: 0,
  changing: false,
};

describe('buildReadingFacts', () => {
  it('detects career domain and theme word', () => {
    const cast = buildCastFromThrows(Array(6).fill(youngYang) as YaoThrow[]);
    const facts = buildReadingFacts(cast, '我要不要接受这个offer？');
    expect(facts.domain).toBe('career');
    expect(facts.themeWord).toBeTruthy();
    expect(facts.shi.label).toBeTruthy();
    expect(facts.yong.name).toMatch(/官鬼/);
  });

  it('lists changing labels when there are moving lines', () => {
    const throws = [oldYang, youngYin, youngYin, youngYin, youngYin, youngYin];
    const cast = buildCastFromThrows(throws);
    const facts = buildReadingFacts(cast, '要不要继续？');
    expect(facts.changing.indexes).toEqual([0]);
    expect(facts.changing.labels.length).toBe(1);
    expect(facts.changed).not.toBeNull();
  });
});

describe('buildCausalReading', () => {
  it('uses short step cards + so narrative', () => {
    const throws = [oldYang, youngYin, youngYin, youngYin, youngYin, youngYin];
    const cast = buildCastFromThrows(throws);
    const facts = buildReadingFacts(cast, '停止还是前进？');
    const causal = buildCausalReading(facts);
    expect(causal.anchor).toBeTruthy();
    expect(causal.because).toHaveLength(3);
    expect(causal.because.every((s) => s.short && s.detail)).toBe(true);
    expect(causal.conclusion.length).toBeLessThan(80);
  });
});

describe('buildLearnFaq', () => {
  it('includes strategy why question when changed', () => {
    const throws = [oldYang, youngYin, youngYin, youngYin, youngYin, youngYin];
    const cast = buildCastFromThrows(throws);
    const facts = buildReadingFacts(cast, '要不要冲？');
    const faq = buildLearnFaq(facts);
    expect(faq.some((f) => f.q.includes('观察') || f.q.includes('稳住'))).toBe(true);
  });
});
