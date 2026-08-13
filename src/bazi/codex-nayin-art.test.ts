import { describe, expect, it } from 'vitest';
import { NAYIN_ATLAS, nayinId } from './codex-atlas-catalog.ts';
import { listNayinArtNames, nayinArtSvg } from './codex-nayin-art.ts';
import { codexDetailArtHtml } from './codex-detail-art.ts';

describe('nayin cover art', () => {
  it('三十纳音均有专属 SVG 场景且无解释字', () => {
    expect(listNayinArtNames()).toHaveLength(30);
    for (const n of NAYIN_ATLAS) {
      const svg = nayinArtSvg(n.name);
      expect(svg, n.name).toContain('<svg');
      expect(svg, n.name).toContain('is-cover');
      expect(svg, n.name).toContain('bazi-art-nayin');
      expect(svg, n.name).not.toMatch(/蓄势|锤炼|森林|纳音|海中金|炉中火/);
    }
  });

  it('详情顶图对 ny:id 非空', () => {
    for (const n of NAYIN_ATLAS) {
      const html = codexDetailArtHtml(nayinId(n.name));
      expect(html, n.name).toMatch(/svg|bazi-art-cover/);
      expect(html.trim(), n.name).not.toBe('');
    }
  });

  it('列表拇指与详情同源：含 bazi-art-nayin', () => {
    for (const n of NAYIN_ATLAS) {
      const thumb = nayinArtSvg(n.name, { uid: `card-ny:${n.name}` });
      expect(thumb, n.name).toContain('bazi-art-nayin');
      expect(thumb, n.name).toContain('<svg');
    }
  });

  it('海中金有水波+金核，炉中火有容器轮廓', () => {
    const sea = nayinArtSvg('海中金');
    expect(sea).toMatch(/circle/);
    expect(sea).toMatch(/Q/);
    const furnace = nayinArtSvg('炉中火');
    expect(furnace).toMatch(/H112/);
    expect(furnace).toMatch(/Q80 52|Q48 58/);
  });
});
