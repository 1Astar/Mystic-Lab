import { describe, expect, it } from 'vitest';
import { parseRewriteResponse } from './question-rewrite.ts';

describe('parseRewriteResponse', () => {
  it('parses plain json', () => {
    const raw = JSON.stringify({
      candidates: [
        { label: '看阻碍', question: '找工作的阻碍是什么？' },
        { label: '看行动', question: '我下一步可以怎么调整？' },
        { label: '看两面', question: '阻碍和机会分别是什么？' },
      ],
    });
    expect(parseRewriteResponse(raw)).toHaveLength(3);
  });

  it('strips markdown fence', () => {
    const raw = '```json\n{"candidates":[{"label":"a","question":"开放问题一？"},{"label":"b","question":"开放问题二？"},{"label":"c","question":"开放问题三？"}]}\n```';
    expect(parseRewriteResponse(raw)[0].question).toContain('开放问题一');
  });

  it('throws on invalid payload', () => {
    expect(() => parseRewriteResponse('not json')).toThrow();
  });
});
