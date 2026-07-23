import { describe, expect, it } from 'vitest';
import { polishReadingCopy } from './reading-polish.ts';

describe('reading polish', () => {
  it('fixes 岗位注意选择 typo pattern', () => {
    expect(polishReadingCopy('如果没有岗位，注意选择方向。')).toContain('注意转化');
  });

  it('collapses doubled words and punctuation', () => {
    expect(polishReadingCopy('不要不要冲动。！')).toMatch(/不要冲动。/);
  });
});
