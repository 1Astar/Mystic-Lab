import { describe, expect, it } from 'vitest';
import { getComboLore } from './combo-lore.ts';
import { evaluateCombo, comboJourneySummary } from './combo-journey.ts';
import { evaluateComboFormation } from './combo-formation.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

function formedView(stars: string[]): ZiweiChartView {
  const soul = {
    name: '命宫',
    earthlyBranch: '子',
    heavenlyStem: '甲',
    isSoul: true,
    isBody: false,
    majors: stars.map((name) => ({ name })),
    minors: [],
    adjectives: [],
  } as unknown as PalaceSnap;
  const rest = ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(
    (br, i) =>
      ({
        name: ['兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'][i]!,
        earthlyBranch: br,
        heavenlyStem: '甲',
        isSoul: false,
        isBody: false,
        majors: [],
        minors: [],
        adjectives: [],
      }) as unknown as PalaceSnap,
  );
  return {
    palaces: [soul, ...rest],
    soulPalace: soul,
    bodyPalace: soul,
    soul: '紫微',
    body: '天相',
    fiveElementsClass: '水二局',
    theater: { headline: '测' },
  } as unknown as ZiweiChartView;
}

describe('combo journey', () => {
  it('marks 杀破狼 complete when formed in sanfang/same palace', () => {
    const c = getComboLore('杀破狼')!;
    const ev = evaluateCombo(c, formedView(['七杀', '破军', '贪狼']));
    expect(ev.status).toBe('complete');
    expect(ev.progress).toBe(1);
  });

  it('marks partial when formation incomplete', () => {
    const c = getComboLore('杀破狼')!;
    const ev = evaluateCombo(c, formedView(['七杀', '破军']));
    expect(ev.status).toBe('partial');
    expect(ev.missingMembers).toEqual(['贪狼']);
  });

  it('marks locked without chart', () => {
    const c = getComboLore('日月')!;
    expect(evaluateCombo(c, null).status).toBe('locked');
    expect(evaluateComboFormation(c.members, null).status).toBe('locked');
  });

  it('summary totals match lore count', () => {
    const s = comboJourneySummary(null);
    expect(s.total).toBeGreaterThanOrEqual(4);
    expect(s.complete).toBe(0);
  });
});
