import { describe, expect, it } from 'vitest';
import {
  buildQuestionThread,
  shouldUsePerCardThread,
} from './question-thread.ts';
import type { CardReading } from './types.ts';

function miniCard(name: string, i: number): CardReading {
  return {
    position: `第 ${i + 1} 张`,
    positionKey: `p${i}`,
    cardName: name,
    cardId: `id-${i}`,
    orientation: 'upright',
    keywords: ['测试'],
    positionMeaning: '',
    text: '',
    baseMeaning: '',
    inContext: '',
    learnTip: '',
    combined: '',
    question: '',
    spreadType: 'custom',
    cardPosition: '',
    topic: 'self',
    selectedCardId: `id-${i}`,
    readingContext: {
      question: '',
      spreadType: 'custom',
      cardPosition: '',
      positionKey: `p${i}`,
      topic: 'self',
    },
    selectedCard: {
      deckId: 'major',
      arcana: 'major',
      uprightMeaning: '',
      reversedMeaning: '',
      loveMeaning: '',
      workMeaning: '',
      studyMeaning: '',
      selfMeaning: '',
      visualOverview: '',
    },
    interpretationLayers: {
      standard: { oneSentence: '测试', reminder: '' },
      actionTags: [],
      elementMappings: [],
      followUps: [],
    },
  };
}

describe('question-thread per-card mode', () => {
  it('shouldUsePerCardThread for single question + 2 cards', () => {
    const cards = [miniCard('宝剑九', 0), miniCard('愚者', 1)];
    expect(shouldUsePerCardThread(cards, '为什么我爸想找我妈', 'custom')).toBe(true);
  });

  it('buildQuestionThread yields 2 answers for 2-card single question', () => {
    const cards = [miniCard('宝剑九', 0), miniCard('愚者', 1)];
    cards[1]!.orientation = 'reversed';
    const thread = buildQuestionThread(cards, '为什么我爸想找我妈', 'mock', {
      spreadType: 'custom',
      userIntuition: '感觉他在逃避',
    });
    expect(thread?.perCardMode).toBe(true);
    expect(thread?.answers.length).toBe(2);
    expect(thread?.synthesis).toBeTruthy();
    expect(thread?.adviceLines?.length).toBeGreaterThan(0);
  });
});
