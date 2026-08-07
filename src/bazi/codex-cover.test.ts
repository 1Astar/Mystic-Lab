import { describe, expect, it } from 'vitest';
import {
  ALL_COVER_PROMPTS,
  BRANCH_COVER_PROMPTS,
  SHENSHA_COVER_PROMPTS,
  STEM_COVER_PROMPTS,
  TENGOD_COVER_PROMPTS,
  buildCoverPrompt,
  coverPublicPath,
} from './codex-cover-prompts.ts';
import {
  getCodexCoverSrc,
  memoryCoverHtml,
  shenshaBadgeArtHtml,
} from './codex-cover.ts';
import { renderBaziCodexDetailHtml } from '../ui/bazi-codex-detail.ts';

describe('codex cover prompts', () => {
  it('has 10+12+10+12 prompt entries', () => {
    expect(STEM_COVER_PROMPTS).toHaveLength(10);
    expect(BRANCH_COVER_PROMPTS).toHaveLength(12);
    expect(TENGOD_COVER_PROMPTS).toHaveLength(10);
    expect(SHENSHA_COVER_PROMPTS).toHaveLength(12);
    expect(ALL_COVER_PROMPTS).toHaveLength(44);
    expect(
      ALL_COVER_PROMPTS.filter((p) => p.kind !== 'shensha' || p.id !== 'ss:劫煞').every(
        (p) => p.assetReady,
      ),
    ).toBe(true);
    expect(ALL_COVER_PROMPTS.find((p) => p.id === 'ss:劫煞')?.assetReady).toBe(false);
  });

  it('builds stem prompts with negative constraints', () => {
    const p = buildCoverPrompt(STEM_COVER_PROMPTS[0]!);
    expect(p).toMatch(/Jia Wood|甲木|tall ancient tree/i);
    expect(p).toMatch(/no text/);
    expect(p).toMatch(/deep indigo/i);
  });

  it('kind frames differentiate branch / tengod / shensha', () => {
    const branch = buildCoverPrompt(BRANCH_COVER_PROMPTS[0]!);
    const tengod = buildCoverPrompt(TENGOD_COVER_PROMPTS[0]!);
    const shensha = buildCoverPrompt(SHENSHA_COVER_PROMPTS[0]!);
    expect(branch).toMatch(/Earthly Branch|season|earth-qi/i);
    expect(tengod).toMatch(/Ten God|personality|archetyp/i);
    expect(shensha).toMatch(/Shen Sha|badge|amulet|footnote/i);
    expect(shensha).toMatch(/talisman|seal|compact|30%|BADGE/i);
  });

  it('all ready covers resolve webp paths', () => {
    for (const s of ALL_COVER_PROMPTS.filter((p) => p.assetReady)) {
      expect(getCodexCoverSrc(s.id)).toBe(coverPublicPath(s.slug));
      expect(coverPublicPath(s.slug)).toMatch(/\.webp$/);
      expect(memoryCoverHtml(s.id, '<svg></svg>')).toContain('bazi-art-cover');
    }
  });

  it('shensha detail uses small badge not full cover', () => {
    const badge = shenshaBadgeArtHtml('ss:天乙贵人', '贵');
    expect(badge).toContain('bazi-ss-badge-stage');
    expect(badge).toContain('bazi-enc-badge');
    expect(badge).toContain('tianyi.webp');
    expect(badge).not.toContain('bazi-art-cover');

    const html = renderBaziCodexDetailHtml('ss:天乙贵人', {
      artHtml: badge,
      lit: true,
    });
    expect(html).toContain('is-badge');
    expect(html).toContain('is-shensha');
    expect(html).toContain('bazi-enc-badge');
  });
});
