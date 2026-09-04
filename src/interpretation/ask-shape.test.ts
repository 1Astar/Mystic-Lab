import { describe, expect, it } from 'vitest';
import { resolveAskShape } from './ask-shape.ts';
import { buildQuestionThread } from './question-thread.ts';
import { resolveReadingScene } from './reading-scene.ts';
import type { CardReading } from './types.ts';

function ppf(
  names: [string, string, string],
  ids: [string, string, string],
  orients: Array<'upright' | 'reversed'> = ['upright', 'upright', 'upright'],
): CardReading[] {
  const pos = ['过去', '现在', '未来'] as const;
  return names.map((name, i) => ({
    position: pos[i]!,
    positionKey: pos[i]!,
    cardName: name,
    cardId: ids[i]!,
    orientation: orients[i]!,
    keywords: [name],
    positionMeaning: '',
    text: '',
    baseMeaning: '',
    inContext: '',
    learnTip: '',
    combined: '',
    question: '',
    spreadType: 'past-present-future',
    cardPosition: pos[i]!,
    topic: 'self' as const,
    selectedCardId: ids[i]!,
    readingContext: {
      question: '',
      spreadType: 'past-present-future',
      cardPosition: pos[i]!,
      positionKey: pos[i]!,
      topic: 'self',
    },
    selectedCard: {
      deckId: 'x',
      arcana: 'minor' as const,
      uprightMeaning: '',
      reversedMeaning: '',
      loveMeaning: '',
      workMeaning: '',
      studyMeaning: '',
      selfMeaning: '',
      visualOverview: '',
    },
    interpretationLayers: {
      standard: { oneSentence: name, reminder: '' },
      actionTags: [],
      elementMappings: [],
      followUps: [],
    },
  }));
}

describe('resolveAskShape — general slots, not case patches', () => {
  it('splits 做什么 + 后果', () => {
    const ask = resolveAskShape('那他会做些什么 会有什么后果吗？');
    expect(ask.slots.map((s) => s.kind)).toEqual(
      expect.arrayContaining(['will_do', 'consequence']),
    );
    expect(ask.needsWholeSpread).toBe(true);
  });

  it('splits 安全吗 + 摆脱吗 into yes_no slots', () => {
    const ask = resolveAskShape(
      '我妈和我未来的长期生活安全吗？我们能彻底摆脱他的纠缠吗？',
    );
    expect(ask.slots.every((s) => s.kind === 'yes_no')).toBe(true);
    expect(ask.slots.length).toBeGreaterThanOrEqual(2);
  });

  it('detects why', () => {
    expect(resolveAskShape('为什么我爸想找我妈').primary).toBe('why');
  });

  it('detects career choice', () => {
    const ask = resolveAskShape('我要不要离职？');
    expect(ask.primary).toBe('choice');
    expect(ask.needsWholeSpread).toBe(true);
  });

  it('detects love yes_no', () => {
    expect(resolveAskShape('他还喜欢我吗？').primary).toBe('yes_no');
  });
});

describe('slot-driven synthesis across domains', () => {
  it('family why → answers 动机槽', () => {
    const cards = ppf(
      ['宝剑九', '愚者', '倒吊人'],
      ['swords-nine', 'major-0', 'major-12'],
      ['upright', 'reversed', 'upright'],
    );
    const q = '为什么我爸想找我妈';
    const thread = buildQuestionThread(cards, q, 'mock', {
      spreadType: 'past-present-future',
    });
    expect(thread?.answers.length).toBe(3);
    expect(thread?.overall).toMatch(/为什么|动机/);
    expect(thread?.overall).not.toMatch(/先看清局面/);
    expect(resolveReadingScene({ question: q }).lens).toBe('family');
  });

  it('career choice → work lens + 选择槽', () => {
    const cards = ppf(
      ['权杖八', '星币四', '宝剑二'],
      ['wands-eight', 'pentacles-four', 'swords-two'],
    );
    const q = '我要不要离职？';
    const thread = buildQuestionThread(cards, q, 'mock', {
      spreadType: 'past-present-future',
    });
    expect(thread?.overall).toMatch(/选择|离职|要不要/);
    expect(thread?.overall).toMatch(/①/);
    expect(thread?.adviceLines?.some((l) => /职场|底线|节点/.test(l))).toBe(true);
  });

  it('love yes_no → answers 是否槽 with cards', () => {
    const cards = ppf(
      ['圣杯二', '宝剑三', '太阳'],
      ['cups-two', 'swords-three', 'major-19'],
      ['upright', 'reversed', 'upright'],
    );
    const q = '他还喜欢我吗？';
    const thread = buildQuestionThread(cards, q, 'mock', {
      spreadType: 'past-present-future',
    });
    expect(thread?.overall).toMatch(/喜欢|是否|判断/);
    expect(thread?.answers.length).toBe(3);
  });

  it('safety yes_no still works via slots (not special branch)', () => {
    const cards = ppf(
      ['权杖五', '权杖三', '圣杯王牌'],
      ['wands-five', 'wands-three', 'cups-ace'],
      ['upright', 'reversed', 'reversed'],
    );
    const q = '我妈和我未来的长期生活安全吗？我们能彻底摆脱他的纠缠吗？';
    const thread = buildQuestionThread(cards, q, 'mock', {
      spreadType: 'past-present-future',
    });
    expect(thread?.overall).toMatch(/安全|摆脱/);
    expect(thread?.overall).toMatch(/①/);
    expect(thread?.overall).toMatch(/②/);
    expect(thread?.empathyLead).toMatch(/安全|摆脱/);
  });
});
