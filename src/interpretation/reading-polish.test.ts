import { describe, expect, it } from 'vitest';
import { breakCategorizedProse, polishReadingCopy } from './reading-polish.ts';
import { mockLeavePhasedInsight } from './work-thread-gold.ts';

describe('breakCategorizedProse', () => {
  it('splits 前期/中期/后期 onto their own lines', () => {
    const dense =
      '总体可平稳过渡。前期：放松。中期：迷茫。后期：回到节奏。『预留情绪平复期。』';
    const out = breakCategorizedProse(dense);
    expect(out).toMatch(/\n前期：/);
    expect(out).toMatch(/\n中期：/);
    expect(out).toMatch(/\n后期：/);
  });

  it('polish keeps phase newlines from gold mock', () => {
    const raw = mockLeavePhasedInsight('宝剑四');
    const polished = polishReadingCopy(raw);
    expect(polished.split('\n').length).toBeGreaterThanOrEqual(4);
    expect(polished).toMatch(/\n前期：/);
  });
});
