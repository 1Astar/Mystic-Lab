import { describe, expect, it } from 'vitest';
import {
  classifySubQuestion,
  splitUserQuestions,
} from './question-parts.ts';

describe('question-parts', () => {
  it('splits numbered career questions', () => {
    const q = `1. 我现在真正想离开的原因
2. 如果7月底离职，未来三个月走势
3. 如果转正后继续留三个月，走势
4. 我最需要防范的风险
5. 最终建议/行动策略`;
    const parts = splitUserQuestions(q);
    expect(parts).toHaveLength(5);
    expect(parts[0]).toMatch(/离开的原因/);
    expect(classifySubQuestion(parts[0]!)).toBe('reason');
    expect(classifySubQuestion(parts[1]!)).toBe('leave_path');
    expect(classifySubQuestion(parts[2]!)).toBe('stay_path');
    expect(classifySubQuestion(parts[3]!)).toBe('risk');
    expect(classifySubQuestion(parts[4]!)).toBe('advice');
  });
});
