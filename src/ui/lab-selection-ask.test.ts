import { describe, expect, it } from 'vitest';
import { formatSelectionAskSeed } from './lab-selection-ask.ts';

describe('formatSelectionAskSeed', () => {
  it('keeps short terms bare', () => {
    expect(formatSelectionAskSeed('食神')).toBe('食神');
  });

  it('wraps longer passages', () => {
    const seed = formatSelectionAskSeed('童子命多主早年奔波，需对照原局看喜忌。');
    expect(seed).toContain('这段话说的是什么意思');
    expect(seed).toContain('童子命');
  });
});
