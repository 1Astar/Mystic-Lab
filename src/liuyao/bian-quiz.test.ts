import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, type YaoThrow } from './engine.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { buildBianQuiz } from './bian-quiz.ts';

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

describe('buildBianQuiz', () => {
  it('returns null without changing lines', () => {
    const youngYang: YaoThrow = {
      coins: ['reverse', 'reverse', 'obverse'],
      sum: 7,
      kind: '少阳',
      bit: 1,
      changing: false,
    };
    const cast = buildCastFromThrows(Array(6).fill(youngYang) as YaoThrow[]);
    const facts = buildReadingFacts(cast, '测试');
    expect(buildBianQuiz(facts)).toBeNull();
  });

  it('has exactly one correct option among three', () => {
    const throws = [oldYang, youngYin, youngYin, youngYin, youngYin, youngYin];
    const cast = buildCastFromThrows(throws);
    const facts = buildReadingFacts(cast, '要不要观察？');
    const quiz = buildBianQuiz(facts);
    expect(quiz).not.toBeNull();
    expect(quiz!.options).toHaveLength(3);
    expect(quiz!.options.filter((o) => o.correct)).toHaveLength(1);
    expect(quiz!.explain).toBeTruthy();
    expect(quiz!.action).toMatch(/行动/);
  });
});
