import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildClassicCompendium,
  buildShiYue,
  renderClassicCompendiumHtml,
} from './classic-compendium.ts';
import { HEXAGRAMS } from './hexagrams.ts';

function castWithChange() {
  const throws = [
    facesToThrow(['obverse', 'obverse', 'obverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('classic-compendium', () => {
  it('builds 象曰/诗曰/断曰/决策 for primary', () => {
    const cast = castWithChange();
    const c = buildClassicCompendium(cast, '面试能过吗', new Date('2026-07-21'));
    expect(c.title).toBe('传统解卦全书');
    expect(c.blocks.map((b) => b.tag)).toEqual(['象曰', '诗曰', '断曰', '决策']);
    expect(c.blocks.find((b) => b.tag === '决策')!.text).toMatch(/面试/);
    expect(c.changed).toBeTruthy();
    expect(c.changed!.blocks.some((b) => b.tag === '象曰')).toBe(true);
  });

  it('shi yue uses keywords', () => {
    const qian = HEXAGRAMS.find((h) => h.name === '乾')!;
    expect(buildShiYue(qian)).toMatch(/开创|刚健|持续/);
  });

  it('renders html panel', () => {
    const cast = castWithChange();
    const html = renderClassicCompendiumHtml(
      buildClassicCompendium(cast, '考试', new Date('2026-07-21')),
    );
    expect(html).toMatch(/传统解卦全书/);
    expect(html).toMatch(/ly-compendium/);
    expect(html).toMatch(/data-compendium-primary/);
    expect(html).toMatch(/本卦 ·/);
    expect(html).toMatch(/data-compendium-changed/);
    expect(html).toMatch(/变卦 ·/);
    expect(html).toMatch(/本变对照/);
    expect(html).toMatch(/象曰/);
    expect(html).toMatch(/诗曰/);
    expect(html).toMatch(/断曰/);
    expect(html).toMatch(/决策/);
  });
});
