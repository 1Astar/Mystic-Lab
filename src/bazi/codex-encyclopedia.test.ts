import { describe, expect, it } from 'vitest';
import {
  BAZI_ENCYCLOPEDIA,
  BAZI_ENCYCLOPEDIA_IDS,
} from './codex-encyclopedia-data.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { CODEX_DETAIL_PANES } from './codex-encyclopedia-types.ts';
import { renderWuxingShengKeMapHtml } from './codex-wuxing-map.ts';
import { renderBaziCodexDetailHtml } from '../ui/bazi-codex-detail.ts';

describe('bazi encyclopedia', () => {
  it('covers 5+10+12+10+12 entries', () => {
    expect(BAZI_ENCYCLOPEDIA_IDS).toHaveLength(49);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'wuxing')).toHaveLength(5);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'stem')).toHaveLength(10);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'branch')).toHaveLength(12);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'tengod')).toHaveLength(10);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'shensha')).toHaveLength(12);
  });

  it('甲木 has memory tags and four panes of content', () => {
    const e = getBaziEncyclopedia('甲')!;
    expect(e.title).toBe('甲木');
    expect(e.tags).toMatchObject({ wuxing: '木', yinyang: '阳', category: '天干' });
    expect(e.oneLiner).toMatch(/大树/);
    expect(e.structure.keywords.length).toBeGreaterThanOrEqual(3);
    expect(e.dimensions.personality).toBeTruthy();
    expect(e.relations.generates.length).toBeGreaterThan(0);
  });

  it('detail html includes four tab labels and hides non-active panes', () => {
    const html = renderBaziCodexDetailHtml('甲', {
      artHtml: '<svg></svg>',
      lit: true,
    });
    for (const pane of CODEX_DETAIL_PANES) {
      expect(html).toContain(`data-enc-tab="${pane}"`);
      expect(html).toContain(`data-enc-pane="${pane}"`);
    }
    expect(html).toContain('甲木');
    expect(html).toContain('生克');
    expect(html).toContain('data-shengke-map');
    expect(html).toMatch(/data-enc-pane="structure"[^>]*hidden/);
  });

  it('shengke map renders five nodes and edges', () => {
    const html = renderWuxingShengKeMapHtml();
    expect(html).toContain('data-shengke-map');
    for (const wx of ['木', '火', '土', '金', '水']) {
      expect(html).toContain(`data-codex-id="${wx}"`);
    }
    expect(html).toMatch(/is-sheng/);
    expect(html).toMatch(/is-ke/);
  });

  it('focused shengke highlights related edges', () => {
    const html = renderWuxingShengKeMapHtml({ focus: '木', compact: true });
    expect(html).toContain('is-focus');
    expect(html).toContain('它生');
    expect(html).toContain('火');
  });
});
