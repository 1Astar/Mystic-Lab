import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import {
  formatYaoInlineHead,
  renderYaoInlineTipHtml,
  lineTipTopPercent,
} from './yao-inline-tip.ts';

function castSample() {
  const throws = [
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
    facesToThrow([3, 3, 3]),
    facesToThrow([2, 2, 2]),
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('yao-inline-tip', () => {
  it('formats head like 初爻：白虎 · 官鬼巳火 · 应', () => {
    const cast = castSample();
    const rows = dressHexagram(cast, siZhuFromDate(new Date('2026-07-21')).dayStem).rows;
    const ying = rows.find((r) => r.isYing) ?? rows[0]!;
    const head = formatYaoInlineHead(ying);
    expect(head).toMatch(/爻：/);
    expect(head).toMatch(/·/);
    expect(head).toMatch(new RegExp(`${ying.liuqin}${ying.branch}${ying.wuxing}`));
  });

  it('renders structured tip html', () => {
    const cast = castSample();
    const row = dressHexagram(cast, '甲').rows[0]!;
    const html = renderYaoInlineTipHtml(row, 'general');
    expect(html).toMatch(/ly-yao-inline-head/);
    expect(html).toMatch(/ly-yao-inline-kw/);
    expect(html).toMatch(/ly-yao-inline-meta/);
    expect(html).toMatch(/六亲|地支|能量/);
    expect(html).toMatch(/ly-qin-facets/);
    expect(html).toMatch(/人物/);
    expect(html).toMatch(/心态/);
    expect(html).toMatch(/data-open-qin-dict/);
    expect(lineTipTopPercent(0)).toBeGreaterThan(50);
    expect(lineTipTopPercent(5)).toBeLessThan(50);
  });
});
