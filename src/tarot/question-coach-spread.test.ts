import { describe, expect, it } from 'vitest';
import { analyzeQuestion } from './question-coach.ts';
import { recommendSpread } from './spread-recommend.ts';

describe('question-coach family patterns', () => {
  it('detects family motive for 为什么我爸想找我妈', () => {
    const r = analyzeQuestion('为什么我爸想找我妈');
    expect(r?.pattern).toBe('family_motive');
    expect(r?.angles.some((a) => a.id === 'psyche')).toBe(true);
    expect(r?.angles.find((a) => a.id === 'psyche')?.question).toContain('你父亲');
  });

  it('detects family action outcome for 他会做什么后果', () => {
    const r = analyzeQuestion('那他会做些什么 会有什么后果吗？');
    expect(r?.pattern).toBe('family_action_outcome');
    expect(r?.angles.some((a) => a.id === 'consequence')).toBe(true);
  });
});

describe('spread-recommend', () => {
  it('recommends past-present-future for action/consequence', () => {
    const rec = recommendSpread('那他会做些什么 会有什么后果吗？');
    expect(rec.spreadType).toBe('past-present-future');
    expect(rec.reason).toMatch(/轨迹|后果|未来/);
  });

  it('recommends situation-obstacle-advice for family motive', () => {
    const rec = recommendSpread('为什么我爸想找我妈');
    expect(rec.spreadType).toBe('situation-obstacle-advice');
    expect(rec.reason).toMatch(/情况|阻碍|建议|边界/);
  });
});
