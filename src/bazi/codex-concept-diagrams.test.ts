import { describe, expect, it } from 'vitest';
import {
  conceptDetailArtHtml,
  conceptThumbSvg,
  renderChongHeXingHaiConceptHtml,
  renderLuckScaleConceptHtml,
} from './codex-concept-diagrams.ts';
import { codexDetailArtHtml } from './codex-detail-art.ts';
import { LUCK_ATLAS, RELATION_ATLAS } from './codex-atlas-catalog.ts';

describe('合冲刑害概念图', () => {
  it('四象面板齐全且偏节奏文案', () => {
    const html = renderChongHeXingHaiConceptHtml();
    expect(html).toContain('bazi-cx-concept');
    for (const k of ['合', '冲', '刑', '害']) {
      expect(html).toContain(`data-cx-kind="${k}"`);
    }
    expect(html).toMatch(/节奏|行程/);
    expect(html).not.toMatch(/必凶|判决感/);
  });
});

describe('运程尺度概念图', () => {
  it('含原局 / 大运 / 流年 / 流月层级', () => {
    const html = renderLuckScaleConceptHtml();
    expect(html).toContain('bazi-lk-concept');
    expect(html).toContain('原局');
    expect(html).toContain('大运');
    expect(html).toContain('流年');
    expect(html).toContain('流月');
    expect(html).toMatch(/点醒|节奏/);
  });

  it('非 compact 标题旁 ? 含运程词条列表', () => {
    const html = renderLuckScaleConceptHtml();
    expect(html).toContain('bazi-br-help-list');
    expect(html).toContain('运程词条一览');
    expect(html).toContain('大运');
    expect(html).toContain('流年');
    expect(html).toMatch(/标题旁 \? 看词条/);
  });

  it('compact 模式可带当前运岁标注且不塞词条列表', () => {
    const html = renderLuckScaleConceptHtml({
      compact: true,
      uid: 'lk-chart',
      dayunGz: '甲子',
      liunianYear: 2026,
      liuyueJie: '惊蛰',
    });
    expect(html).toContain('is-compact');
    expect(html).toContain('甲子');
    expect(html).toContain('2026');
    expect(html).toContain('惊蛰');
    expect(html).toContain('lk-chart-band');
    expect(html).not.toContain('运程词条一览');
  });
});

describe('rel/luck 词条迷你图', () => {
  it('关系与运程词条均有 SVG 拇指图', () => {
    for (const r of RELATION_ATLAS) {
      const svg = conceptThumbSvg(r.id);
      expect(svg, r.id).toContain('bazi-art-concept');
      expect(codexDetailArtHtml(r.id).trim(), r.id).not.toBe('');
    }
    for (const l of LUCK_ATLAS) {
      const svg = conceptThumbSvg(l.id);
      expect(svg, l.id).toContain('bazi-art-concept');
      expect(conceptDetailArtHtml(l.id)).toContain('is-concept');
      expect(codexDetailArtHtml(l.id).trim(), l.id).not.toBe('');
    }
  });
});
