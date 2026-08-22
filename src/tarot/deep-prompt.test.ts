import { describe, expect, it } from 'vitest';
import { buildTarotDeepPrompt, inferQuestionMode } from './deep-prompt.ts';

describe('inferQuestionMode', () => {
  it('detects action/outcome questions', () => {
    expect(inferQuestionMode('那他会做些什么 会有什么后果吗？')).toBe('action_outcome');
  });
});

describe('buildTarotDeepPrompt', () => {
  it('asks for causal narrative and bans template phrases', () => {
    const { system } = buildTarotDeepPrompt(
      {
        question: '他会做什么，后果怎样？',
        spreadType: 'three_card',
        cards: [
          { name: '宝剑王后', position: '过去', reversed: false },
          { name: '圣杯六', position: '现在', reversed: true },
          { name: '倒吊人', position: '未来', reversed: false },
        ],
        summary: '摘要',
      },
      { experience: '', goal: '', happened: '', concerns: '' },
    );
    expect(system).toContain('行为倾向');
    expect(system).toContain('因为…所以…');
    expect(system).toContain('都不算剧烈');
    expect(system).not.toContain('好，我们就按你这个问题直接看');
  });
});
