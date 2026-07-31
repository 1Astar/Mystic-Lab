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

  it('strips leaked prompt instructions from user-facing copy', () => {
    const raw =
      '放在「过去」位读【倒吊人逆位】：牌意必须落在这个位置功能上，禁止只背正位百科。整幅画面：暂停与换视角。';
    const polished = polishReadingCopy(raw);
    expect(polished).toMatch(/过去|倒吊人/);
    expect(polished).not.toMatch(/禁止只背|必须落在这个位置功能|正位百科/);
  });
});
