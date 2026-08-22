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
  it('maps major, lucky, sha, and featured aux/minor to webp', () => {
    expect(majorStarArtUrl('天机')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('文昌')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('擎羊')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('禄存')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('红鸾')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('咸池')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('龙池')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('三台')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('封诰')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天巫')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天寿')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('蜚廉')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天德')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('月德')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天空')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('岁破')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天官')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('将星')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('飞廉')).toBe(majorStarArtUrl('蜚廉'));
    expect(majorStarArtUrl('旬空')).toBeNull();
  });

  it('falls back to glyph when no poster; otherwise uses webp', () => {
    expect(starListThumbInnerHtml('旬空', { tone: 'shensha' })).toContain('ziwei-codex-short-glyph');
    expect(starListThumbInnerHtml('旬空', { tone: 'shensha' })).toContain('旬');
    expect(starListThumbInnerHtml('天机')).toContain('.webp');
    expect(starListThumbInnerHtml('岁破', { tone: 'shensha' })).toContain('.webp');
    expect(starListThumbInnerHtml('飞廉', { tone: 'shensha' })).toContain('.webp');
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
