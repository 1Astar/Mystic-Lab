import { describe, expect, it } from 'vitest';
import { CARD_HOTSPOTS } from './cards/hotspots/index.ts';
import { buildVisualQuestionBridge } from './answer-tendency.ts';
import { getVisualOverview } from './registry.ts';
import type { CardKnowledge, ReadingContext } from './types.ts';

const knowledge = {
  id: 'swords_seven',
  deckId: 'swords-seven',
  nameCn: '宝剑七',
  nameEn: 'Seven of Swords',
  arcana: 'minor',
  keywords: ['策略', '取舍'],
  oneSentence: '策略与取舍。',
  uprightMeaning: '策略',
  reversedMeaning: '绕弯',
  visualOverview: '测试总览备用',
} as CardKnowledge;

describe('visual hotspot overall reading', () => {
  it('gives every hotspot card a handcrafted overview', () => {
    expect(CARD_HOTSPOTS.length).toBe(78);
    for (const card of CARD_HOTSPOTS) {
      expect(card.overview?.trim().length, card.deckId).toBeGreaterThan(20);
      expect(card.overview!, card.deckId).not.toMatch(/^画面里可一起看/);
      expect(card.overview!, card.deckId).not.toMatch(/围绕坚持与考验展开/);
    }
  });

  it('exposes a concrete overview for swords-seven', () => {
    const overview = getVisualOverview('swords-seven');
    expect(overview).toBeTruthy();
    expect(overview!).toMatch(/潜行|剑|营帐|取舍/);
    expect(overview!).not.toMatch(/围绕坚持与考验展开/);
  });

  it('builds question-tied overall bridge instead of empty preamble', () => {
    const context: ReadingContext = {
      question: '什么时候能找到下一份工作？',
      spreadType: 'past-present-future',
      cardPosition: '现在',
      positionKey: 'present',
      topic: 'work',
      selectedCardId: 'swords-seven',
    };
    const bridge = buildVisualQuestionBridge(
      context,
      knowledge,
      false,
      getVisualOverview('swords-seven'),
    );
    expect(bridge).toBeTruthy();
    expect(bridge!).toContain('什么时候能找到下一份工作');
    expect(bridge!).toMatch(/整体画面|潜行|取舍/);
    expect(bridge!).toMatch(/求职|工作|策略/);
    expect(bridge!).not.toContain('下面每处符号都在补充这个语境');
  });
});
