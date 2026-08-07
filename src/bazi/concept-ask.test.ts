import { describe, expect, it } from 'vitest';
import { answerBaziConcept } from './concept-ask.ts';

describe('bazi concept ask', () => {
  it('hits tengod by name', () => {
    const r = answerBaziConcept('食神是什么');
    expect(r.hit).toBe(true);
    expect(r.answer).toMatch(/食神/);
  });

  it('miss returns soft copy', () => {
    const r = answerBaziConcept('宇宙黑洞如何排盘');
    expect(r.hit).toBe(false);
    expect(r.answer).toMatch(/词库/);
  });
});
