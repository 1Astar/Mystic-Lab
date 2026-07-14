import { describe, expect, it } from 'vitest';
import { analyzeQuestion } from './question-coach.ts';

describe('analyzeQuestion', () => {
  it('maps 找到下一份工作 timing questions to job_search angles', () => {
    const result = analyzeQuestion('什么时候能找到下一份工作');
    expect(result).not.toBeNull();
    expect(result!.pattern).toBe('job_search');
    expect(result!.angles.some((a) => a.label === '看阻碍')).toBe(true);
    expect(result!.angles.some((a) => a.question.includes('找工作路上'))).toBe(true);
    expect(result!.angles.every((a) => a.question === '我现在需要看清什么？')).toBe(false);
  });

  it('maps promotion questions', () => {
    const result = analyzeQuestion('我这次能升职吗');
    expect(result!.pattern).toBe('promotion');
    expect(result!.angles.some((a) => a.label === '看卡点')).toBe(true);
  });

  it('maps study exam questions', () => {
    const result = analyzeQuestion('这次考试能过吗');
    expect(result!.pattern).toBe('study_exam');
    expect(result!.angles.some((a) => a.label === '看重点')).toBe(true);
  });
});
