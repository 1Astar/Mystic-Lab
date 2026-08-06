import { describe, expect, it } from 'vitest';
import { wuxingArtSvg, stemBranchArtSvg, tengodArtSvg } from './codex-art.ts';
import { STEM_LORE, BRANCH_LORE, WUXING_ORDER } from './codex-lore.ts';

describe('bazi codex cover art', () => {
  it('记忆图是纯意象封面，不含解释文案', () => {
    for (const wx of WUXING_ORDER) {
      const svg = wuxingArtSvg(wx);
      expect(svg).toContain('<svg');
      expect(svg).toContain('is-cover');
      expect(svg).not.toMatch(/生发|照耀|承载|收敛|流动|阳木|阴火|夜半|规则秩序/);
    }
  });

  it('甲木像高树，乙木像藤蔓，图上无标签字', () => {
    const jia = stemBranchArtSvg(STEM_LORE[0]!);
    const yi = stemBranchArtSvg(STEM_LORE[1]!);
    expect(jia).toContain('is-cover');
    expect(jia).not.toContain('阳木');
    expect(yi).not.toContain('阴木');
    // 甲有竖直主干，乙有曲线攀附
    expect(jia).toMatch(/M80 112 L80/);
    expect(yi).toMatch(/Q/);
  });

  it('地支封面无时序文字', () => {
    const zi = stemBranchArtSvg(BRANCH_LORE[0]!);
    expect(zi).toContain('is-cover');
    expect(zi).not.toContain('夜半');
    expect(zi).not.toContain('子时');
  });

  it('十神角色封面无说明字', () => {
    expect(tengodArtSvg('正官')).toContain('is-cover');
    expect(tengodArtSvg('正官')).not.toContain('规则秩序');
    expect(tengodArtSvg('偏财')).not.toContain('流动机会');
    expect(tengodArtSvg('七杀')).not.toContain('压力挑战');
  });
});
