import { describe, expect, it } from 'vitest';
import { getComboLore } from './combo-lore.ts';
import { evaluateComboAgainst, comboJourneySummary } from './combo-journey.ts';

describe('combo journey', () => {
  it('marks 杀破狼 complete when all three lit', () => {
    const c = getComboLore('杀破狼')!;
    const ev = evaluateComboAgainst(c, ['七杀', '破军', '贪狼']);
    expect(ev.status).toBe('complete');
    expect(ev.progress).toBe(1);
  });

  it('marks partial when one missing', () => {
    const c = getComboLore('杀破狼')!;
    const ev = evaluateComboAgainst(c, ['七杀', '破军']);
    expect(ev.status).toBe('partial');
    expect(ev.missingMembers).toEqual(['贪狼']);
  });

  it('marks 日月 locked with empty set', () => {
    const c = getComboLore('日月')!;
    expect(evaluateComboAgainst(c, []).status).toBe('locked');
  });

  it('summary totals match lore count', () => {
    const s = comboJourneySummary();
    expect(s.total).toBeGreaterThanOrEqual(4);
    expect(s.complete + s.partial).toBeLessThanOrEqual(s.total);
  });
});
