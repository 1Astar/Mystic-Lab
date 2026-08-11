import { describe, expect, it } from 'vitest';
import {
  SHENSHA_FEATURED,
  SHENSHA_MORE,
  SHENSHA_TAG,
  isFeaturedShensha,
  isTagShensha,
  shenshaTierOf,
} from './codex-shensha-tiers.ts';
import { getStarCardByName } from './codex-tags.ts';
import { baziCodexProgress } from './codex.ts';

describe('shensha tiers', () => {
  it('featured are curious / opaque names with star cards', () => {
    expect(SHENSHA_FEATURED.length).toBeGreaterThanOrEqual(10);
    expect(SHENSHA_FEATURED.length).toBeLessThanOrEqual(20);
    for (const name of SHENSHA_FEATURED) {
      expect(isFeaturedShensha(name)).toBe(true);
      expect(getStarCardByName('shensha', name)?.name).toBe(name);
    }
  });

  it('劫煞 is tag factor not featured', () => {
    expect(isTagShensha('劫煞')).toBe(true);
    expect(isFeaturedShensha('劫煞')).toBe(false);
    expect(shenshaTierOf('劫煞')).toBe('tag');
  });

  it('more catalog has glosses without requiring encyclopedia', () => {
    expect(SHENSHA_MORE.length).toBeGreaterThanOrEqual(8);
    expect(SHENSHA_MORE.every((e) => e.gloss.length > 4)).toBe(true);
    expect(shenshaTierOf('天德')).toBe('more');
  });

  it('shensha progress totals featured only', () => {
    const p = baziCodexProgress('shensha');
    expect(p.total).toBe(SHENSHA_FEATURED.length);
  });
});
