import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  artSizeForClass,
  cfImageResizeEnabled,
  ziweiArtDisplayUrl,
} from './cf-image-resize.ts';

describe('cf-image-resize', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps CSS classes to size presets', () => {
    expect(artSizeForClass('ziwei-codex-short-thumb-img')).toBe('thumb');
    expect(artSizeForClass('ziwei-combo-stack-img')).toBe('stack');
    expect(artSizeForClass('ziwei-detail-hero-img')).toBe('hero');
    expect(artSizeForClass('other')).toBe('full');
  });

  it('returns raw path when resize disabled', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    expect(cfImageResizeEnabled()).toBe(false);
    expect(ziweiArtDisplayUrl('/ziwei/stars/天机.webp', 'thumb')).toBe('/ziwei/stars/天机.webp');
  });

  it('builds cdn-cgi URL on production host when ready', () => {
    vi.stubGlobal('window', {
      location: { hostname: 'mystic.starry-studio.cn' },
      localStorage: { getItem: () => null },
    });
    expect(cfImageResizeEnabled()).toBe(true);
    expect(ziweiArtDisplayUrl('/ziwei/combos/%E6%9D%80%E7%A0%B4%E7%8B%BC%E6%A0%BC.webp', 'hero')).toBe(
      '/cdn-cgi/image/width=640,quality=85,format=webp/ziwei/combos/%E6%9D%80%E7%A0%B4%E7%8B%BC%E6%A0%BC.webp',
    );
  });

  it('stays off on pages.dev even with override host check', () => {
    vi.stubGlobal('window', {
      location: { hostname: 'foo.pages.dev' },
      localStorage: { getItem: () => '1' },
    });
    expect(cfImageResizeEnabled()).toBe(false);
  });
});
