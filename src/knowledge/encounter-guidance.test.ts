import { describe, expect, it } from 'vitest';
import {
  buildEncounterGuidance,
  encounterPositionKind,
  encounterReflectPrompt,
  extractGuidanceFromCardReading,
} from './encounter-guidance.ts';
import type { CardReading, ReadingResult } from '../interpretation/types.ts';
import type { CardKnowledge } from './types.ts';

const knowledge = {
  id: 'cups_knight',
  deckId: 'cups-knight',
  nameCn: '圣杯骑士',
  nameEn: 'Knight of Cups',
  arcana: 'minor',
  number: 12,
  keywords: ['探索'],
  oneSentence: '跟着感觉走。',
  uprightMeaning: '正位',
  reversedMeaning: '逆位',
  workMeaning: '工作',
  loveMeaning: '感情',
  studyMeaning: '学业',
  selfMeaning: '自我',
} as CardKnowledge;

function stubCard(partial: Partial<CardReading> & Pick<CardReading, 'position'>): CardReading {
  return {
    cardId: 'cups-knight',
    cardName: '圣杯骑士',
    orientation: 'upright',
    position: partial.position,
    positionKey: '',
    positionMeaning: '',
    keywords: ['探索'],
    topic: 'work',
    spreadType: 'situation-obstacle-advice',
    inContext: '',
    selectedCard: knowledge,
    interpretationLayers: {
      standard: { keywords: ['探索'], oneSentence: '跟着感觉走。', reminder: '提醒' },
      contextualReading: '',
      selfReflection: [],
      ...partial.interpretationLayers,
    },
    readingContext: {
      question: '测试',
      spreadType: 'situation-obstacle-advice',
      cardPosition: partial.position,
      positionKey: '',
      topic: 'work',
      selectedCardId: 'cups-knight',
    },
    hasVisualHotspots: false,
    encounterRecord: null,
    ...partial,
  } as CardReading;
}

describe('encounter guidance', () => {
  it('maps position kinds and advice reflect prompt', () => {
    expect(encounterPositionKind('建议')).toBe('advice');
    expect(encounterPositionKind('阻碍')).toBe('obstacle');
    expect(encounterReflectPrompt('advice')).toBe(
      '当时的建议你还记得吗？现实中事情最终如何发展了？',
    );
  });

  it('extracts advice action for advice position', () => {
    const card = stubCard({
      position: '建议',
      interpretationLayers: {
        standard: { keywords: [], oneSentence: '', reminder: '' },
        contextualReading: '',
        selfReflection: [],
        questionAnswers: [
          { question: '怎么办', insight: '先休息', action: '『未来 1–2 周强制休整。』' },
        ],
      },
    });
    expect(extractGuidanceFromCardReading(card)).toContain('强制休整');
  });

  it('prefers thread advice when card is advice position', () => {
    const adviceCard = stubCard({ position: '建议' });
    const reading = {
      cards: [stubCard({ position: '情况' }), stubCard({ position: '阻碍' }), adviceCard],
      summary: '',
      learningNote: '',
      provider: 'mock',
      questionThread: {
        empathyLead: '',
        overall: '',
        oneLiner: '',
        provider: 'mock',
        answers: [
          {
            question: '最终建议',
            intent: 'advice',
            cardIndexes: [0, 1, 2],
            heading: '行动策略',
            insight: '先斩断内耗',
            action: '两边并行推进',
          },
        ],
      },
    } as ReadingResult;
    expect(buildEncounterGuidance(reading, 2)).toContain('两边并行');
  });
});
