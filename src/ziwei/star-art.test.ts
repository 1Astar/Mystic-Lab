import { describe, expect, it } from 'vitest';
import { majorStarArtUrl, starListThumbInnerHtml } from './star-art.ts';
import {
  collectStateLabel,
  resolveCodexCollectState,
  type ChartStarHit,
} from './codex-collect.ts';

describe('star-art', () => {
  it('maps major stars to webp path', () => {
    expect(majorStarArtUrl('天机')).toBe('/ziwei/stars/%E5%A4%A9%E6%9C%BA.webp');
    expect(majorStarArtUrl('文昌')).toBeNull();
  });

  it('falls back to glyph for shensha/minor', () => {
    expect(starListThumbInnerHtml('红鸾', { tone: 'shensha' })).toContain('ziwei-codex-short-glyph');
    expect(starListThumbInnerHtml('红鸾', { tone: 'shensha' })).toContain('红');
    expect(starListThumbInnerHtml('天机')).toContain('.webp');
  });
});

describe('codex-collect', () => {
  it('prefers awakened when star is on chart', () => {
    const hits = new Map<string, ChartStarHit>([
      ['天机', { palace: '命宫', isSoulMajor: true }],
    ]);
    expect(resolveCodexCollectState('天机', hits)).toBe('awakened');
    expect(collectStateLabel('awakened')).toMatch(/已觉醒/);
  });

  it('marks absent when unlocked-like but not on chart map empty', () => {
    // without localStorage unlock stub, unlocked=false → pending
    expect(resolveCodexCollectState('紫微', new Map())).toBe('pending');
  });
});
