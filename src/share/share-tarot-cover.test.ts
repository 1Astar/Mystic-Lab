import { describe, expect, it } from 'vitest';
import { buildShareCoverInnerHtml } from './cover.ts';
import { draftFromTarot } from './drafts.ts';
import type { ReadingResult } from '../interpretation/types.ts';

describe('draftFromTarot', () => {
  it('lists all cards and per-card sections on back', () => {
    const reading = {
      summary: '把下一步缩成一件今天就能做的小事。',
      cards: [],
      questionThread: {
        perCardMode: true,
        overall: '三张牌指向行动与后果的两面。',
        synthesis: '他会先试探，后果取决于你是否先定边界。',
        oneLiner: '把下一步缩成一件今天就能做的小事。',
        answers: [
          {
            heading: '【宝剑九】的提示',
            question: '过去',
            meaningMap: '焦虑与失眠',
            insight: '他早有念头',
            action: '先稳住自己',
          },
          {
            heading: '【宝剑王后】的提示',
            question: '现在',
            meaningMap: '清醒切割',
            insight: '他在权衡措辞',
            action: '把底线写清楚',
          },
        ],
        adviceLines: ['本周只做一件可验证的小事'],
      },
    } as ReadingResult;

    const draft = draftFromTarot({
      question: '他会做什么？',
      cards: [
        {
          card: { id: 'swords_09', name: 'Nine of Swords', symbol: '⚔' },
          cardName: '宝剑九',
          position: '过去',
          reversed: false,
        },
        {
          card: { id: 'swords_queen', name: 'Queen of Swords', symbol: '⚔' },
          cardName: '宝剑王后',
          position: '现在',
          reversed: false,
        },
      ] as never,
      reading,
    });

    expect(draft.headline).toContain('他会先试探');
    expect(draft.sections.some((s) => s.heading === '本局牌阵')).toBe(true);
    expect(draft.sections.filter((s) => s.heading.includes('宝剑')).length).toBe(2);
    expect(draft.sections.some((s) => s.heading === '综合结论')).toBe(true);
  });
});

describe('buildShareCoverInnerHtml tarot front', () => {
  it('shows card visuals instead of lab poster for tarot', () => {
    const html = buildShareCoverInnerHtml(
      {
        system: 'tarot',
        headline: '综合结论示例',
        summary: '摘要',
        questionDisplay: '测试问题',
        visual: {
          kind: 'tarot',
          cards: [
            { name: '宝剑九', position: '过去', cardId: 'swords_09' },
            { name: '宝剑王后', position: '现在', cardId: 'swords_queen' },
          ],
        },
        createdAt: '2026-08-22T00:00:00.000Z',
        invitePosterPath: '/share/tarot-invite.png',
        invitePosterSrc: 'data:image/png;base64,abc',
      },
      'front',
    );

    expect(html).toContain('ms-cover-cards');
    expect(html).toContain('宝剑九');
    expect(html).not.toContain('ms-cover-lab-poster');
  });
});
