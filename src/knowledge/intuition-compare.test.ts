import { describe, expect, it } from 'vitest';
import type { CardReading } from '../interpretation/types.ts';
import { buildIntuitionCompare } from './intuition-compare.ts';

function stubReading(over: Partial<CardReading> = {}): CardReading {
  return {
    position: '现在',
    positionKey: 'present',
    cardName: '星币四',
    cardId: 'c1',
    orientation: 'upright',
    keywords: ['守成', '防御'],
    positionMeaning: '',
    text: '',
    baseMeaning: '',
    inContext: '',
    learnTip: '',
    combined: '',
    question: '明天面试怎么样？',
    spreadType: 'single',
    cardPosition: '现在',
    topic: 'work',
    selectedCardId: 'c1',
    readingContext: {
      question: '明天面试怎么样？',
      spreadType: 'single',
      cardPosition: '现在',
      positionKey: 'present',
      topic: 'work',
      selectedCardId: 'c1',
    },
    selectedCard: {} as CardReading['selectedCard'],
    interpretationLayers: {
      standard: {
        keywords: ['守成', '防御'],
        oneSentence: '守住基本盘',
        reminder: '别收太紧',
      },
      answerTendency: {
        overall: '偏稳',
        tendency: '中性偏正',
        oneLiner: '整体偏稳，但容易因为保守而不够出彩。',
        actionTip: '准备 1 个案例讲清楚。',
      },
      contextualReading: '',
      selfReflection: ['你在防什么？'],
    },
    encounterRecord: null,
    hasVisualHotspots: false,
    interpretationProvider: 'mock',
    ...over,
  };
}

describe('buildIntuitionCompare', () => {
  it('returns undefined when intuition empty', () => {
    expect(buildIntuitionCompare(stubReading(), '  ')).toBeUndefined();
  });

  it('mentions both intuition and reading anchor', () => {
    const text = buildIntuitionCompare(stubReading(), '感觉自己在防守，不敢亮出来');
    expect(text).toContain('你写下');
    expect(text).toContain('防守');
    expect(text).toContain('解读更贴近');
    expect(text).toContain('偏稳');
  });
});
