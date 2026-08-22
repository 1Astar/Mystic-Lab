import { describe, expect, it } from 'vitest';
import { resolveReadingLens } from './card-psychology.ts';
import {
  buildNarrativeCardInsight,
  buildSpreadSynthesis,
  inferQuestionSubject,
  positionalFrame,
} from './tarot-narrative.ts';
import type { CardReading } from './types.ts';

function miniCard(
  name: string,
  position: string,
  orientation: 'upright' | 'reversed' = 'upright',
): CardReading {
  return {
    position,
    positionKey: 'p0',
    cardName: name,
    cardId: 'id-0',
    orientation,
    keywords: ['焦虑', '痛苦'],
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
    selectedCardId: 'id-0',
    readingContext: {
      question: '',
      spreadType: 'custom',
      cardPosition: '',
      positionKey: '',
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

describe('tarot-narrative', () => {
  it('inferQuestionSubject detects father from 我爸', () => {
    expect(inferQuestionSubject('为什么我爸想找我妈')).toBe('father');
  });

  it('positionalFrame maps past/present/future', () => {
    expect(positionalFrame(miniCard('宝剑九', '过去'), 0)).toBe('过去');
    expect(positionalFrame(miniCard('圣杯六', '现在'), 1)).toBe('现在');
    expect(positionalFrame(miniCard('倒吊人', '未来'), 2)).toBe('未来');
  });

  it('buildNarrativeCardInsight uses archetype for 宝剑九', () => {
    const card = miniCard('宝剑九', '第 1 张');
    const lens = resolveReadingLens('为什么我爸想找我妈', 'self');
    const insight = buildNarrativeCardInsight(
      card,
      '为什么我爸想找我妈',
      lens,
      [card],
      0,
    );
    expect(insight.meaningMap).toContain('宝剑九');
    expect(insight.insight).toContain('安全港湾');
  });

  it('buildSpreadSynthesis mentions trajectory for timeline spread', () => {
    const cards = [
      miniCard('宝剑王后', '过去'),
      miniCard('圣杯六', '现在', 'reversed'),
      miniCard('倒吊人', '未来'),
    ];
    const lens = resolveReadingLens('他会做什么后果', 'self');
    const body = buildSpreadSynthesis(cards, '他会做什么后果', lens);
    expect(body).toContain('轨迹');
    expect(body).toMatch(/倒吊人|后果/);
  });
});
