import { describe, expect, it } from 'vitest';
import { detectQuestionTheme } from '../codex/collection.ts';
import {
  assignCardsToQuestions,
  buildQuestionThread,
} from './question-thread.ts';
import { sanitizeTopicText } from './topic-sanitize.ts';
import type { CardReading } from './types.ts';

function fakeCard(name: string, i: number): CardReading {
  return {
    position: ['情况', '阻碍', '建议'][i] ?? `位${i}`,
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
    spreadType: 'past-present-future',
    cardPosition: '',
    topic: 'work',
    selectedCardId: `id-${i}`,
    readingContext: {
      question: '',
      spreadType: 'past-present-future',
      cardPosition: '',
      positionKey: '',
      topic: 'work',
      selectedCardId: `id-${i}`,
    },
    selectedCard: {
      id: `k${i}`,
      deckId: `d${i}`,
      nameCn: name,
      nameEn: name,
      arcana: 'minor',
      number: i,
      keywords: ['休战', '探索'],
      oneSentence: '一句',
      uprightMeaning: '',
      reversedMeaning: '',
      workMeaning: '职场',
      loveMeaning: '恋爱套话',
      studyMeaning: '',
      selfMeaning: '',
    },
    interpretationLayers: {
      standard: { keywords: ['休战'], oneSentence: '一句', reminder: '提醒' },
      contextualReading: '',
      selfReflection: ['?'],
    },
    encounterRecord: null,
    hasVisualHotspots: false,
    interpretationProvider: 'mock',
  };
}

describe('topic sanitize + question thread', () => {
  it('detects 转正/离职 as work', () => {
    expect(detectQuestionTheme('如果转正后继续留三个月')).toBe('work');
    expect(detectQuestionTheme('我现在真正想离开的原因')).toBe('work');
  });

  it('strips love sentences from work topic', () => {
    const raw =
      '你现在很累，需要休息。你是否有旧情人的遗憾。先把精力恢复再谈去留。';
    const out = sanitizeTopicText(raw, 'work');
    expect(out).not.toMatch(/旧情人/);
    expect(out).toMatch(/精力|休息|去留/);
  });

  it('assigns path questions to cards then risk/advice to combo', () => {
    const intents = [
      'reason',
      'leave_path',
      'stay_path',
      'risk',
      'advice',
    ] as const;
    const map = assignCardsToQuestions([...intents], 3);
    expect(map[0]).toEqual([0]);
    expect(map[1]).toEqual([1]);
    expect(map[2]).toEqual([2]);
    expect(map[3]).toEqual([1, 2]);
    expect(map[4]).toEqual([0, 1, 2]);
  });

  it('builds question-first thread without love leakage', () => {
    const cards = [
      fakeCard('宝剑四', 0),
      fakeCard('圣杯骑士', 1),
      fakeCard('圣杯六', 2),
    ];
    const q = `1. 我现在真正想离开的原因
2. 如果7月底离职，未来三个月走势
3. 如果转正后继续留三个月，走势
4. 我最需要防范的风险
5. 最终建议/行动策略`;
    const thread = buildQuestionThread(cards, q, 'mock');
    expect(thread).toBeTruthy();
    expect(thread!.answers).toHaveLength(5);
    expect(thread!.answers[0]!.heading).toMatch(/宝剑四/);
    expect(thread!.answers[3]!.heading).toMatch(/圣杯/);
    expect(thread!.oneLiner.length).toBeGreaterThan(8);
    const blob = JSON.stringify(thread);
    expect(blob).not.toMatch(/旧情人|恋爱|原生家庭/);
    expect(thread!.answers[1]!.insight).toMatch(/前期|中期|后期|前段|中后段/);
    expect(thread!.answers[2]!.insight).toMatch(/温水|画饼|理想/);
    expect(thread!.answers[3]!.insight).toMatch(/①|情绪化|画饼|断崖/);
    expect(thread!.answers[4]!.insight).toMatch(/休整|初心|体面/);
    expect(thread!.answers[1]!.insight.length).toBeGreaterThan(80);
    expect(thread!.overall).toMatch(/想走又纠结|先冷静休息|精神内耗/);
  });
});
