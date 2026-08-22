import { describe, expect, it } from 'vitest';
import { jiaziId } from './codex-atlas-catalog.ts';
import { shenshaCardId } from './codex-tags.ts';
import { codexDetailArtHtml } from './codex-detail-art.ts';
import {
  listShenshaBadgeArtNames,
  shenshaBadgeSvg,
} from './codex-shensha-badge-art.ts';
import { shenshaBadgeArtHtml } from './codex-cover.ts';
import { nayinOf } from './pillar-meta.ts';

describe('jiazi detail art', () => {
  it('六十甲子详情顶图复用纳音 SVG', () => {
    for (const gz of ['甲子', '乙丑', '丙寅', '庚午', '癸亥']) {
      const html = codexDetailArtHtml(jiaziId(gz));
      expect(html, gz).toMatch(/bazi-art-nayin|svg/);
      expect(html.trim(), gz).not.toBe('');
      expect(nayinOf(gz).length, gz).toBeGreaterThan(0);
    }
  });
});

describe('shensha badge svg', () => {
  it('扩展神煞均有 SVG 章面', () => {
    const names = listShenshaBadgeArtNames();
    expect(names.length).toBeGreaterThanOrEqual(75);
    for (const name of names) {
      const svg = shenshaBadgeSvg(name);
      expect(svg, name).toContain('bazi-art-ss-badge');
      expect(svg, name).toContain('<circle');
    }
  });

  it('详情 / 徽章 HTML 对扩展神煞非空', () => {
    for (const name of ['天德', '学堂', '空亡', '病符', '天医', '魁罡']) {
      const id = shenshaCardId(name);
      const badge = shenshaBadgeArtHtml(id, name.slice(0, 1));
      expect(badge, name).toContain('bazi-ss-badge-stage');
      expect(badge, name).toMatch(/svg|webp/);
      const detail = codexDetailArtHtml(id);
      expect(detail.trim(), name).not.toBe('');
    }
  });
});
