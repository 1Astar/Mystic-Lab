import { describe, expect, it } from 'vitest';
import { buildSuitNumberQuiz, optionLabel } from './suit-number-quiz.ts';

describe('suit-number-quiz', () => {
  it('builds option labels from domain + stage', () => {
    expect(optionLabel('行动、热情、创造力', '推进、变化、加速')).toBe('行动 + 推进');
  });

  it('builds a quiz with one correct option', () => {
    let i = 0;
    const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.15, 0.25, 0.35];
    const quiz = buildSuitNumberQuiz(() => seq[i++ % seq.length]!);
    expect(quiz).not.toBeNull();
    expect(quiz!.options.length).toBeGreaterThanOrEqual(2);
    expect(quiz!.options.filter((o) => o.correct)).toHaveLength(1);
    expect(quiz!.prompt).toContain('领域');
    expect(quiz!.suitLabel.length).toBeGreaterThan(0);
  });
});
