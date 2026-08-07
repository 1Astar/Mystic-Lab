import { describe, expect, it } from 'vitest';
import {
  BAZI_ENCYCLOPEDIA,
  BAZI_ENCYCLOPEDIA_IDS,
  getBaziEncyclopedia,
  isAtlasLibraryKind,
} from './codex-encyclopedia.ts';
import {
  LUCK_ATLAS,
  NAYIN_ATLAS,
  RELATION_ATLAS,
  SHENSHA_ATLAS,
  SHENSHA_CATEGORIES,
  assertNayinCoverage,
  listSixtyJiazi,
  nayinId,
  jiaziId,
} from './codex-atlas-catalog.ts';
import { CODEX_DETAIL_PANES } from './codex-encyclopedia-types.ts';
import { buildCodexDossier } from './codex-dossier.ts';
import { buildChartLinkReport } from './codex-chart-link.ts';
import { renderWuxingShengKeMapHtml } from './codex-wuxing-map.ts';
import { renderBaziCodexDetailHtml } from '../ui/bazi-codex-detail.ts';

describe('bazi encyclopedia', () => {
  it('core kinds still present', () => {
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'wuxing')).toHaveLength(5);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'stem')).toHaveLength(10);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'branch')).toHaveLength(12);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'tengod')).toHaveLength(10);
  });

  it('atlas shells: nayin30 jiazi60 shensha80+ relation luck', () => {
    expect(NAYIN_ATLAS).toHaveLength(30);
    expect(listSixtyJiazi()).toHaveLength(60);
    expect(SHENSHA_ATLAS.length).toBeGreaterThanOrEqual(80);
    expect(SHENSHA_CATEGORIES).toHaveLength(10);
    expect(RELATION_ATLAS.length).toBeGreaterThanOrEqual(10);
    expect(LUCK_ATLAS.length).toBeGreaterThanOrEqual(6);
    expect(BAZI_ENCYCLOPEDIA_IDS.length).toBeGreaterThan(49 + 30 + 60);
    expect(getBaziEncyclopedia(nayinId('海中金'))?.kind).toBe('nayin');
    expect(getBaziEncyclopedia(jiaziId('甲子'))?.kind).toBe('jiazi');
    expect(assertNayinCoverage().ok).toBe(true);
  });

  it('library kinds are browsable without unlock', () => {
    expect(isAtlasLibraryKind('nayin')).toBe(true);
    expect(isAtlasLibraryKind('stem')).toBe(false);
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

  it('甲木 dossier matches 详解模板', () => {
    const d = buildCodexDossier('甲')!;
    expect(d.whatIs).toMatch(/参天大树|栋梁/);
    expect(d.likes).toEqual(expect.arrayContaining(['水滋养', '火温暖', '金修剪']));
    expect(d.dislikes.some((x) => x.includes('土'))).toBe(true);
    expect(d.pillarMeaning.year).toMatch(/年柱/);
    expect(d.combos.some((c) => c.peer.includes('庚'))).toBe(true);
    expect(d.combos.some((c) => c.peer.includes('壬'))).toBe(true);
    expect(d.memory).toMatch(/甲木/);
  });

  it('detail html includes 基础/表现/生克/命盘 tabs', () => {
    const html = renderBaziCodexDetailHtml('甲', {
      artHtml: '<svg></svg>',
      lit: true,
      chartLink: buildChartLinkReport('甲', null),
    });
    for (const pane of CODEX_DETAIL_PANES) {
      expect(html).toContain(`data-enc-tab="${pane}"`);
      expect(html).toContain(`data-enc-pane="${pane}"`);
    }
    expect(html).toContain('甲木');
    expect(html).toContain('生克');
    expect(html).toContain('命盘');
    expect(html).toContain('水滋养');
    expect(html).toContain('data-shengke-map');
    expect(html).toMatch(/data-enc-pane="express"[^>]*hidden/);
  });

  it('shengke map renders five nodes and edges', () => {
    const html = renderWuxingShengKeMapHtml();
    expect(html).toContain('data-shengke-map');
    for (const wx of ['木', '火', '土', '金', '水']) {
      expect(html).toContain(`data-codex-id="${wx}"`);
    }
  });

  it('shensha shell reminds usage boundary', () => {
    const d = buildCodexDossier('ss:天乙贵人')!;
    expect(d.chartRole).toMatch(/辅助|不能脱离/);
  });
});
