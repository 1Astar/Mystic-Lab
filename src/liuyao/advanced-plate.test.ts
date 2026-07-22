import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { dressHexagram } from './najia.ts';
import {
  buildAdvancedPlate,
  buildFuShen,
  buildShenSha,
  buildXunKong,
  pureHexagramOfPalace,
  PURE_HEX_BRANCHES,
  renderAdvancedPlateFoldHtml,
} from './advanced-plate.ts';

function castFromBits(bits: number[]) {
  const throws: YaoThrow[] = bits.map((bit) => {
    const coins =
      bit === 1
        ? (['reverse', 'obverse', 'obverse'] as const)
        : (['obverse', 'reverse', 'reverse'] as const);
    return facesToThrow([...coins] as [typeof coins[0], typeof coins[1], typeof coins[2]]);
  });
  return buildCastFromThrows(throws, 'random');
}

describe('advanced-plate', () => {
  it('resolves palace pure hexagram', () => {
    expect(pureHexagramOfPalace('坤')).toBe('坤');
    expect(pureHexagramOfPalace('乾')).toBe('乾');
    expect(PURE_HEX_BRANCHES['坤']).toEqual(['未', '巳', '卯', '丑', '亥', '酉']);
  });

  it('builds fushen for missing liuqin', () => {
    const cast = castFromBits([1, 1, 1, 1, 1, 0]);
    const plate = buildAdvancedPlate(cast, new Date('2026-07-21T10:00:00'));
    const dressed = dressHexagram(cast, '甲');
    const fu = buildFuShen(dressed);
    const present = new Set(dressed.rows.map((r) => r.liuqin));
    for (const item of fu) {
      expect(present.has(item.qin)).toBe(false);
      expect(item.label).toMatch(/爻/);
      expect(item.branch.length).toBe(1);
    }
    if (present.size === 5) {
      expect(fu).toHaveLength(0);
    } else {
      expect(fu.length).toBeGreaterThan(0);
    }
    expect(plate.palaceName).toMatch(/宫/);
  });

  it('marks xunkong rows by day void branches', () => {
    const cast = castFromBits([1, 0, 1, 0, 1, 0]);
    const rows = dressHexagram(cast, '甲').rows;
    const info = buildXunKong(rows, '戌亥');
    expect(info.text).toBe('戌亥');
    for (const r of info.rows) {
      expect(['戌', '亥']).toContain(r.branch);
    }
  });

  it('hits shensha on matching branches', () => {
    const cast = castFromBits([1, 0, 1, 0, 1, 0]);
    const rows = dressHexagram(cast, '甲').rows;
    const hits = buildShenSha(rows, '甲', '子');
    expect(hits.every((h) => h.rows.length > 0)).toBe(true);
    expect(hits.length).toBeGreaterThan(0);
  });

  it('renders advanced fold html', () => {
    const cast = castFromBits([1, 0, 1, 0, 1, 0]);
    const html = renderAdvancedPlateFoldHtml(cast, new Date('2026-07-21T10:00:00'));
    expect(html).toMatch(/ly-teach-fold/);
    expect(html).toMatch(/伏神 \/ 旬空 \/ 神煞/);
    expect(html).toMatch(/旬空|日旬空/);
  });
});
