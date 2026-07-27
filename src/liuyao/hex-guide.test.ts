import { describe, expect, it } from 'vitest';
import { HEXAGRAMS } from './hexagrams.ts';
import {
  buildHexGuidePack,
  renderGuideXiangSnippetHtml,
  renderGuideArtHtml,
  renderHexGuideNotesHtml,
  atmosphereSrcFor,
} from './hex-guide.ts';

describe('hex-guide shared snippets', () => {
  it('builds pack with domains and atmosphere for early gua', () => {
    const qian = HEXAGRAMS.find((h) => h.name === '乾')!;
    const pack = buildHexGuidePack(qian);
    expect(pack.oneLiner.length).toBeGreaterThan(4);
    expect(pack.domains.length).toBeGreaterThanOrEqual(4);
    expect(atmosphereSrcFor(1)).toMatch(
      /r2\.dev\/webp\/atmosphere-01-08\/01-qian-%E4%B9%BE%E4%B8%BA%E5%A4%A9\.webp$/,
    );
    expect(pack.atmosphereSrc).toBe(atmosphereSrcFor(1));
    expect(atmosphereSrcFor(25)).toMatch(/atmosphere-25-32\/atm-25-wuwang\.webp$/);
    expect(atmosphereSrcFor(64)).toMatch(/atmosphere-57-64\/atm-64-weiji\.webp$/);
    expect(atmosphereSrcFor(0)).toBeNull();
    expect(atmosphereSrcFor(65)).toBeNull();
  });

  it('renders notes snippet with art + form + domains', () => {
    const pack = buildHexGuidePack(HEXAGRAMS.find((h) => h.name === '坤')!);
    const html = renderGuideXiangSnippetHtml(pack);
    expect(html).toMatch(/ly-guide-snippet/);
    expect(html).toMatch(/ly-guide-snippet-hero/);
    expect(html).toMatch(/ly-guide-snippet-related/);
    expect(html).toMatch(/data-guide-sub-host/);
    expect(html).toMatch(/成卦/);
    expect(html).toMatch(/整体意象/);
    expect(html).toMatch(/ly-guide-snippet-yao/);
    expect(html).toMatch(/上卦 ·/);
    expect(html).toMatch(/下卦 ·/);
    expect(html).toMatch(/分域/);
    expect(html).toMatch(/data-guide-domains/);
    expect(html).toMatch(/为什么叫/);
    expect(html).toMatch(/六十四卦图鉴/);
    expect(html.match(/整体意象/g)?.length).toBe(1);
  });

  it('guide notes domain pane mirrors notes structure', () => {
    const pack = buildHexGuidePack(HEXAGRAMS[3]!);
    const html = renderHexGuideNotesHtml(pack);
    expect(html).toMatch(/整体意象/);
    expect(html).toMatch(/ly-guide-snippet-related/);
    expect(html).toMatch(/上卦 ·/);
    expect(html).toMatch(/分域/);
    expect(html).toMatch(/data-guide-sub-host/);
    expect(renderGuideArtHtml(pack)).toMatch(/ly-guide-art/);
  });
});
