import { describe, expect, it } from 'vitest';
import { normalizeRewriteQuestion } from './question-rewrite-cache.ts';

describe('normalizeRewriteQuestion', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeRewriteQuestion('  找工作的  阻碍  \n是什么？ ')).toBe('找工作的 阻碍 是什么？');
  });

  it('matches identical intent after normalize', () => {
    const a = normalizeRewriteQuestion('我该不该换工作？');
    const b = normalizeRewriteQuestion('  我该不该换工作？  ');
    expect(a).toBe(b);
  });
});
