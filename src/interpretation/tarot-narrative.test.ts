import { describe, expect, it } from 'vitest';
import { matchCardArchetype } from './card-archetypes.ts';
import { empathyNarrativeLead } from './tarot-narrative.ts';
import type { CardReading } from './types.ts';

function mockCard(partial: Partial<CardReading> & Pick<CardReading, 'cardId' | 'cardName'>): CardReading {
  return {
    position: '',
    positionKey: '',
    orientation: 'upright',
    keywords: [],
    positionMeaning: '',
    text: '',
    baseMeaning: '',
    inContext: '',
    learnTip: '',
    combined: '',
    question: '测试',
    spreadType: 'single',
    cardPosition: '',
    topic: 'self',
    selectedCardId: partial.cardId,
    readingContext: { topic: 'self' },
    selectedCard: { deckId: partial.cardId, arcana: 'major' } as CardReading['selectedCard'],
    interpretationLayers: { standard: {}, contextualReading: '', selfReflection: '' } as CardReading['interpretationLayers'],
    encounterRecord: null,
    hasVisualHotspots: false,
    interpretationProvider: 'mock',
    ...partial,
  };
}

describe('card-archetypes', () => {
  it('matches major arcana by cardId', () => {
    const arch = matchCardArchetype(mockCard({ cardId: 'major-0', cardName: '愚者' }));
    expect(arch?.theme).toContain('冒险');
  });

  it('matches reversed fool', () => {
    const arch = matchCardArchetype(
      mockCard({ cardId: 'major-0', cardName: '愚者', orientation: 'reversed' }),
    );
    expect(arch?.theme).toContain('逃避');
  });

  it('falls back to minor suit template', () => {
    const arch = matchCardArchetype(
      mockCard({ cardId: 'cups-two', cardName: '圣杯二' }),
    );
    expect(arch?.theme).toContain('情绪');
    expect(arch?.questionHook).toBeTruthy();
  });

  it('keeps notable minor swords-nine narrative', () => {
    const arch = matchCardArchetype(
      mockCard({ cardId: 'swords-nine', cardName: '宝剑九' }),
    );
    expect(arch?.questionHook).toContain('安全港湾');
  });
});

describe('empathyNarrativeLead with series', () => {
  it('prefers series lead over generic copy', () => {
    const lead = empathyNarrativeLead(
      [mockCard({ cardId: 'major-12', cardName: '倒吊人' })],
      '他还会联系吗',
      'family',
      {
        dayKey: '2026-08-22',
        theme: 'love',
        themeLabel: '感情',
        episodeIndex: 2,
        totalEpisodes: 2,
        priorEpisodes: [],
        lead: '今天关于「感情」的第 2 局——接上上集。',
        synthesisPrefix: '【连载】相较今天早些时候',
      },
    );
    expect(lead).toContain('第 2 局');
  });
});
