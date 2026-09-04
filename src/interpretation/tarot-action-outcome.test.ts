import { describe, expect, it } from 'vitest';
import {
  buildQuestionThread,
  isQuestionThreadStale,
  shouldUsePerCardThread,
} from './question-thread.ts';
import { resolveReadingScene } from './reading-scene.ts';
import { buildSpreadSynthesis } from './tarot-narrative.ts';
import type { CardReading } from './types.ts';
import type { ReadingSeriesContext } from '../journal/reading-series.ts';

function ppfCard(
  name: string,
  position: string,
  orientation: 'upright' | 'reversed',
  cardId: string,
): CardReading {
  return {
    position,
    positionKey: position,
    cardName: name,
    cardId,
    orientation,
    keywords: [name],
    positionMeaning: '',
    text: '',
    baseMeaning: '',
    inContext: '',
    learnTip: '',
    combined: '',
    question: '',
    spreadType: 'past-present-future',
    cardPosition: position,
    topic: 'self',
    selectedCardId: cardId,
    readingContext: {
      question: '',
      spreadType: 'past-present-future',
      cardPosition: position,
      positionKey: position,
      topic: 'self',
    },
    selectedCard: {
      deckId: cardId.includes('major') ? 'major' : 'minor',
      arcana: cardId.startsWith('major') ? 'major' : 'minor',
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
  };
}

const SERIES: ReadingSeriesContext = {
  dayKey: '2026-09-03',
  theme: 'family',
  themeLabel: '个人成长',
  episodeIndex: 2,
  totalEpisodes: 2,
  priorEpisodes: [
    {
      entryId: 'e1',
      createdAt: '2026-09-03T10:00:00',
      question: '为什么我爸想找我妈',
      cardSummary: '愚者',
    },
  ],
  lead: '今天关于「个人成长」的第 2 局——接上上集。',
  synthesisPrefix: '【连载】相较今天早些时候（愚者）',
};

describe('reading-scene carry from series', () => {
  it('「他会做什么」+ 上集爸妈 → family + father + action_outcome', () => {
    const scene = resolveReadingScene({
      question: '那他会做些什么 会有什么后果吗？',
      series: SERIES,
    });
    expect(scene.isFamily).toBe(true);
    expect(scene.isActionOutcome).toBe(true);
    expect(scene.lens).toBe('family');
    expect(scene.subject).toBe('father');
  });
});

describe('tarot action/outcome whole-spread', () => {
  const cards = [
    ppfCard('宝剑王后', '过去', 'upright', 'swords-queen'),
    ppfCard('圣杯六', '现在', 'reversed', 'cups-six'),
    ppfCard('倒吊人', '未来', 'upright', 'major-12'),
  ];
  const q = '那他会做些什么 会有什么后果吗？';

  it('forces per-card for past-present-future', () => {
    expect(shouldUsePerCardThread(cards, q, 'past-present-future')).toBe(true);
  });

  it('synthesis answers 做什么 + 后果 with all three cards', () => {
    const synth = buildSpreadSynthesis(cards, q, 'family', undefined, SERIES);
    expect(synth).toMatch(/会做什么|更可能/);
    expect(synth).toMatch(/后果/);
    expect(synth).toMatch(/宝剑王后|圣杯六|倒吊人/);
    expect(synth).not.toMatch(/先看清局面/);
  });

  it('thread binds 3 cards, family lens actions, no hexagram jargon', () => {
    const thread = buildQuestionThread(cards, q, 'mock', {
      spreadType: 'past-present-future',
      series: SERIES,
    });
    expect(thread?.perCardMode).toBe(true);
    expect(thread?.answers.length).toBe(3);
    expect(thread?.overall).toMatch(/会做什么|后果|更可能/);
    expect(thread?.overall).not.toMatch(/关系题先看对方/);
    expect(thread?.overall).not.toMatch(/先看清局面/);
    const actions = thread!.answers.map((a) => a.action || '').join('｜');
    expect(actions).not.toMatch(/卦|用神|世应|六爻/);
    expect(thread?.adviceLines?.some((l) => /边界|共情|当事人|家人/.test(l))).toBe(
      true,
    );
  });
});

describe('safety / entanglement whole-spread', () => {
  const cards = [
    ppfCard('权杖五', '过去', 'upright', 'wands-five'),
    ppfCard('权杖三', '现在', 'reversed', 'wands-three'),
    ppfCard('圣杯王牌', '未来', 'reversed', 'cups-ace'),
  ];
  const q = '我妈和我未来的长期生活安全吗？我们能彻底摆脱他的纠缠吗？';

  it('binds all 3 cards and prefers card synthesis over single-card tip', () => {
    expect(shouldUsePerCardThread(cards, q, 'past-present-future')).toBe(true);
    const thread = buildQuestionThread(cards, q, 'mock', {
      spreadType: 'past-present-future',
    });
    expect(thread?.perCardMode).toBe(true);
    expect(thread?.answers.length).toBe(3);
    expect(thread?.answers.map((a) => a.heading).join('|')).toMatch(/权杖五/);
    expect(thread?.answers.map((a) => a.heading).join('|')).toMatch(/权杖三/);
    expect(thread?.answers.map((a) => a.heading).join('|')).toMatch(/圣杯王牌/);
    expect(thread?.overall).toMatch(/安全|摆脱/);
    expect(thread?.overall).toMatch(/①|②/);
    expect(thread?.overall).not.toMatch(/先看清局面/);
    expect(thread?.overall).not.toMatch(/你父亲更可能做的/);
    expect(thread?.overall).not.toMatch(/不是不可更改的宿命/);
    expect(thread?.empathyLead).not.toMatch(/答案最终仍在你心里/);
    // 三张牌的可执行建议不应完全相同
    const actions = thread!.answers.map((a) => a.action || '');
    expect(new Set(actions).size).toBeGreaterThan(1);
    expect(thread!.answers.every((a) => /牵动全家的边界/.test(a.insight))).toBe(
      false,
    );
  });

  it('marks one-card thread as stale for rebuild', () => {
    const stale = {
      empathyLead: 'x',
      overall: 'y',
      answers: [
        {
          question: q,
          intent: 'general' as const,
          cardIndexes: [0],
          heading: '【权杖五】的提示',
          insight: '先看清局面，再谈下一步。',
        },
      ],
      oneLiner: 'z',
      provider: 'mock' as const,
    };
    expect(isQuestionThreadStale(stale, cards, q, 'past-present-future')).toBe(true);
  });
});
