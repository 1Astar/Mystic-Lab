import { describe, expect, it } from 'vitest';
import { stemBranchArtSvg, wuxingArtSvg } from './codex-art.ts';
import { STEM_LORE, BRANCH_LORE, WUXING_ORDER } from './codex-lore.ts';

describe('bazi codex art', () => {
  it('五行 SVG 含下属天干幽灵字', () => {
    const fire = wuxingArtSvg('火');
    expect(fire).toContain('<svg');
    expect(fire).toContain('丙');
    expect(fire).toContain('丁');
    for (const wx of WUXING_ORDER) {
      expect(wuxingArtSvg(wx).length).toBeGreaterThan(80);
    }
  });

  it('干支 SVG 区分天干地支标记', () => {
    const jia = stemBranchArtSvg(STEM_LORE[0]!);
    const zi = stemBranchArtSvg(BRANCH_LORE[0]!);
    expect(jia).toContain('天');
    expect(zi).toContain('地');
    expect(jia).not.toMatch(/老鼠|鼠|人物/);
  });
});
