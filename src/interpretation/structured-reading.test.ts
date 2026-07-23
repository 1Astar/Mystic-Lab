import { describe, expect, it } from 'vitest';
import {
  buildActionTags,
  buildElementMappings,
  buildStructuredMockReading,
  parseStructuredReading,
} from './structured-reading.ts';
import type { CardKnowledge, ReadingContext } from '../knowledge/types.ts';
import { readingCoversDrawn } from './llm-provider.ts';
import type { ReadingResult } from './types.ts';

const knowledge = {
  id: 'swords_seven',
  deckId: 'swords-seven',
  nameCn: '宝剑七',
  nameEn: 'Seven of Swords',
  arcana: 'minor',
  number: 7,
  keywords: ['策略', '取舍', '潜行'],
  oneSentence: '策略与取舍。',
  uprightMeaning: '策略',
  reversedMeaning: '绕弯',
  workMeaning: '求职时要多线推进并核实信息。',
  loveMeaning: '感情',
  studyMeaning: '学业',
  selfMeaning: '自我',
} as CardKnowledge;

const workCtx: ReadingContext = {
  question: '什么时候能找到新工作？',
  spreadType: 'single',
  cardPosition: '情况',
  positionKey: 'situation',
  topic: 'work',
  selectedCardId: 'swords-seven',
  background: '已面了三家，有一家没回音',
};

describe('structured reading', () => {
  it('parses LLM json with element mappings and followUps', () => {
    const raw = JSON.stringify({
      overview: '整体结论',
      advice: '建议C',
      comfort: '疏导D',
      actionTags: ['广撒网', '挖内推'],
      elementMappings: [
        {
          label: '偷走的剑',
          title: '现实状况：「偷走的剑」意味着什么？',
          originalMeaning: '只拿走得动的那几把——资源有限，需取舍。',
          body: '求职里筹码有限，要多备选。',
        },
      ],
      followUps: ['面试要注意什么？', '海投还是定点？'],
    });
    const parsed = parseStructuredReading(raw);
    expect(parsed.sections.some((s) => s.title.includes('热点') || s.body.includes('整体'))).toBe(
      true,
    );
    expect(parsed.elementMappings[0]?.label).toBe('偷走的剑');
    expect(parsed.elementMappings[0]?.originalMeaning).toContain('资源有限');
    expect(parsed.elementMappings[0]?.body).toContain('求职');
    expect(parsed.followUps).toHaveLength(2);
    expect(parsed.actionTags).toEqual(['广撒网', '挖内推']);
  });

  it('builds mock hotspot overview and element mappings for work', () => {
    const mock = buildStructuredMockReading(workCtx, knowledge, false);
    expect(mock.sections[0]?.title).toBe('热点整体解读');
    expect(mock.plainText).toContain('已面了三家');
    expect(mock.elementMappings.length).toBeGreaterThanOrEqual(1);
    expect(mock.elementMappings.some((m) => m.label.includes('剑') || m.title.includes('意味着'))).toBe(
      true,
    );
    expect(mock.followUps.length).toBe(3);
    expect(mock.actionTags.join('')).toMatch(/休整|核实|边界|内耗|决策/);
  });

  it('builds per-question answers for multi-part work questions', () => {
    const multi: ReadingContext = {
      ...workCtx,
      question: `1. 我现在真正想离开的原因
2. 如果7月底离职，未来三个月走势
3. 我最需要防范的风险
4. 最终建议/行动策略`,
    };
    const mock = buildStructuredMockReading(multi, knowledge, false);
    expect(mock.questionAnswers.length).toBeGreaterThanOrEqual(4);
    expect(mock.questionAnswers[0]?.question).toMatch(/离开/);
    expect(mock.questionAnswers[0]?.insight).toMatch(/宝剑七/);
    expect(mock.plainText).toMatch(/【提问 1】/);
  });

  it('element mappings keep original meaning and add scene mapping', () => {
    const maps = buildElementMappings(workCtx, knowledge, false);
    expect(maps.length).toBeGreaterThan(0);
    expect(maps[0]?.originalMeaning.length).toBeGreaterThan(4);
    expect(maps[0]?.body).toMatch(/什么时候能找到新工作|求职|面试|筹码|窗口/);
    expect(maps[0]?.body).not.toBe(maps[0]?.originalMeaning);
  });

  it('action tags differ from abstract keywords for work', () => {
    const tags = buildActionTags(workCtx, knowledge, false);
    expect(tags.some((t) => t.includes('风') || t === '流动')).toBe(false);
  });

  it('readingCoversDrawn checks card id alignment', () => {
    const reading = {
      cards: [{ cardId: 'a' }, { cardId: 'b' }],
      summary: '',
      provider: 'llm',
    } as ReadingResult;
    expect(readingCoversDrawn(reading, ['a', 'b'])).toBe(true);
    expect(readingCoversDrawn(reading, ['a', 'c'])).toBe(false);
  });
});
