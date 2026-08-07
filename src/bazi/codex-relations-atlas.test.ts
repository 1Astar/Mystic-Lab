import { describe, expect, it } from 'vitest';
import { relationsForBranch, relationsForStem } from './relations.ts';
import {
  renderEntryRelationFragmentHtml,
  renderRelationsAtlasHtml,
} from './codex-relations-atlas.ts';
import { wuxingArtSvg, stemBranchArtSvg, tengodArtSvg } from './codex-art.ts';
import { STEM_LORE, BRANCH_LORE } from './codex-lore.ts';

describe('codex relations atlas', () => {
  it('lists 生克 六冲 六合 六害 刑 三合 天干五合', () => {
    const html = renderRelationsAtlasHtml({ skipWuxingPairs: false });
    expect(html).toContain('五行 · 相生');
    expect(html).toContain('地支 · 六冲');
    expect(html).toContain('地支 · 六害');
    expect(html).toContain('地支 · 刑');
    expect(html).toContain('地支 · 三合');
    expect(html).toContain('子午');
    expect(html).toContain('天干 · 五合');
    expect(html).toContain('甲己');
  });

  it('default atlas skips wuxing pair lists', () => {
    const html = renderRelationsAtlasHtml();
    expect(html).not.toContain('五行 · 相生');
    expect(html).toContain('地支 · 六冲');
  });

  it('can skip branch pair lists when ring is shown', () => {
    const html = renderRelationsAtlasHtml({
      skipWuxingPairs: true,
      skipBranchPairLists: true,
    });
    expect(html).not.toContain('地支 · 六冲');
    expect(html).toContain('天干 · 五合');
  });

  it('branch fragment includes 冲合', () => {
    const hits = relationsForBranch('子');
    expect(hits.some((h) => h.kind === '冲' && h.peers.includes('午'))).toBe(true);
    expect(hits.some((h) => h.kind === '合' && h.peers.includes('丑'))).toBe(true);
    const html = renderEntryRelationFragmentHtml('子');
    expect(html).toContain('子午相冲');
  });

  it('stem fragment includes 五合', () => {
    expect(relationsForStem('甲')[0]?.peers).toContain('己');
  });
});

describe('cover art smoke', () => {
  it('exports cover svgs', () => {
    expect(wuxingArtSvg('木')).toContain('is-cover');
    expect(stemBranchArtSvg(STEM_LORE[0]!)).toContain('is-cover');
    expect(stemBranchArtSvg(BRANCH_LORE[0]!)).toContain('is-cover');
    expect(tengodArtSvg('正官')).toContain('is-cover');
  });
});
