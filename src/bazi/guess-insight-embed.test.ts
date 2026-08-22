import { describe, expect, it } from 'vitest';
import {
  INSIGHT_GUESS_CARDS,
  pickInsightGuessCard,
  shouldShowInsightGuess,
} from './guess-insight-embed.ts';
import { GUESS_CARDS } from './guess-pack.ts';

describe('guess-insight-embed', () => {
  it('题库含半真半假盘面线索', () => {
    expect(INSIGHT_GUESS_CARDS.length).toBeGreaterThanOrEqual(3);
    for (const c of INSIGHT_GUESS_CARDS) {
      expect(c.fakeChart.length).toBeGreaterThanOrEqual(2);
      expect(c.options.some((o) => o.id === c.answerId)).toBe(true);
    }
  });

  it('每天最多嵌一个表面（洞见或运势）', () => {
    const day = '2026-08-14';
    const insight = shouldShowInsightGuess('insight', day);
    const luck = shouldShowInsightGuess('luck', day);
    expect(Number(insight) + Number(luck)).toBeLessThanOrEqual(1);
  });

  it('该表面开启时能抽到题', () => {
    for (let d = 1; d <= 9; d++) {
      const day = `2026-08-0${d}`;
      if (shouldShowInsightGuess('insight', day)) {
        expect(pickInsightGuessCard('insight', day)?.surfaces).toContain('insight');
        return;
      }
      if (shouldShowInsightGuess('luck', day)) {
        expect(pickInsightGuessCard('luck', day)?.surfaces).toContain('luck');
        return;
      }
    }
    throw new Error('9 天内应至少出现一次嵌入');
  });

  it('全页猜命盘含半真半假盘题型', () => {
    expect(GUESS_CARDS.some((c) => c.id === 'gq-fake-chart')).toBe(true);
  });
});
