import { describe, expect, it } from 'vitest';
import type { QuestionThread } from '../interpretation/question-thread.ts';
import { renderQuestionThreadHtml } from './question-thread-panel.ts';

describe('renderQuestionThreadHtml layout', () => {
  it('puts cards before direct answer and hides generic overall', () => {
    const thread: QuestionThread = {
      empathyLead: '开场',
      overall: '先抓住方向，再下钻细节——牌在帮你看清局面。',
      oneLiner: '把下一步缩成一件今天就能做的小事。',
      provider: 'mock',
      perCardMode: true,
      synthesis: '他会先试探，后果取决于你是否先定边界。',
      answers: [
        {
          question: '他会做什么？',
          intent: 'general',
          cardIndexes: [0],
          heading: '【宝剑王后】· 过去',
          insight: '清醒切割',
          perCard: true,
        },
      ],
    };
    const html = renderQuestionThreadHtml(thread, []);
    const cardIdx = html.indexOf('thread-card-strip');
    const directIdx = html.indexOf('直接回答你的问题');
    const genericIdx = html.indexOf('整盘结论');
    expect(cardIdx).toBeGreaterThan(-1);
    expect(directIdx).toBeGreaterThan(cardIdx);
    expect(genericIdx).toBe(-1);
    expect(html).toContain('他会先试探');
  });
});
