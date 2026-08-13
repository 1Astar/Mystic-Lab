import { describe, expect, it, beforeEach, vi } from 'vitest';
import { majorStarArtUrl, starListThumbInnerHtml } from './star-art.ts';
import {
  collectStateLabel,
  resolveCodexCollectState,
  type ChartStarHit,
} from './codex-collect.ts';

vi.mock('../craft/spirit-activate.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../craft/spirit-activate.ts')>();
  return {
    ...mod,
    loadActivateStore: () => ({
      activated: [] as string[],
      explored: [] as string[],
      updatedAt: new Date().toISOString(),
    }),
  };
});

describe('star-art', () => {
  it('maps major and lucky stars to webp path', () => {
    expect(majorStarArtUrl('天机')).toBe('/ziwei/stars/%E5%A4%A9%E6%9C%BA.webp');
    expect(majorStarArtUrl('文昌')).toBe('/ziwei/stars/%E6%96%87%E6%98%8C.webp');
    expect(majorStarArtUrl('左辅')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('擎羊')).toBeNull();
  });

  it('falls back to glyph for shensha/minor; lucky uses poster', () => {
    expect(starListThumbInnerHtml('红鸾', { tone: 'shensha' })).toContain('ziwei-codex-short-glyph');
    expect(starListThumbInnerHtml('红鸾', { tone: 'shensha' })).toContain('红');
    expect(starListThumbInnerHtml('天机')).toContain('.webp');
    expect(starListThumbInnerHtml('文昌', { tone: 'lucky' })).toContain('.webp');
  });
});

describe('codex-collect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks in-chart unpowered star as met (相遇)', () => {
    const hits = new Map<string, ChartStarHit>([
      ['天机', { palace: '财帛宫' }],
    ]);
    expect(resolveCodexCollectState('天机', hits, { hasChart: true })).toBe('met');
    expect(collectStateLabel('met')).toMatch(/相遇/);
  });

  it('marks pending when not on chart and not unlocked', () => {
    expect(resolveCodexCollectState('紫微', new Map())).toBe('pending');
  });

  it('marks absent when chart exists but star missing', () => {
    expect(
      resolveCodexCollectState('紫微', new Map(), { hasChart: true }),
    ).toBe('absent');
  });
});
