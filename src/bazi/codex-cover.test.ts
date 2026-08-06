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
import { getCodexCoverSrc, memoryCoverHtml } from './codex-cover.ts';

describe('codex cover prompts', () => {
  it('has 10+12+10+12 prompt entries all assetReady', () => {
    expect(STEM_COVER_PROMPTS).toHaveLength(10);
    expect(BRANCH_COVER_PROMPTS).toHaveLength(12);
    expect(TENGOD_COVER_PROMPTS).toHaveLength(10);
    expect(SHENSHA_COVER_PROMPTS).toHaveLength(12);
    expect(ALL_COVER_PROMPTS).toHaveLength(44);
    expect(ALL_COVER_PROMPTS.every((p) => p.assetReady)).toBe(true);
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
    expect(shensha).toMatch(/talisman|seal|compact/i);
  });

  it('all covers resolve webp paths', () => {
    for (const s of ALL_COVER_PROMPTS) {
      expect(getCodexCoverSrc(s.id)).toBe(coverPublicPath(s.slug));
      expect(coverPublicPath(s.slug)).toMatch(/\.webp$/);
      expect(memoryCoverHtml(s.id, '<svg></svg>')).toContain('bazi-art-cover');
    }
  });
});
