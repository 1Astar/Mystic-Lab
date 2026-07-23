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
    expect(atmosphereSrcFor(1)).toMatch(/hex-guide\/01\.png/);
    expect(pack.atmosphereSrc).toMatch(/01\.png/);
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
