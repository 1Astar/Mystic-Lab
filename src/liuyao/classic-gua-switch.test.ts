import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  renderClassicGuaSwitchHtml,
  renderClassicGuaTextHtml,
} from './classic-gua-switch.ts';

function castWithChange() {
  // 至少一动：三枚同面 → 动
  const throws = [
    facesToThrow(['obverse', 'obverse', 'obverse']), // 动阳
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

function castNoChange() {
  const throws = [
    facesToThrow(['obverse', 'obverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('classic-gua-switch', () => {
  it('renders 本卦 / 变卦 tabs when there is a change', () => {
    const cast = castWithChange();
    expect(cast.changed).toBeTruthy();
    const html = renderClassicGuaSwitchHtml(cast);
    expect(html).toMatch(/data-gua-switch/);
    expect(html).toMatch(/本卦辞 · /);
    expect(html).toMatch(/变卦辞/);
    expect(html).toMatch(/data-gua-side="primary"/);
    expect(html).toMatch(/data-gua-side="changed"/);
    expect(html).toMatch(/data-book-line=/);
    expect(html).not.toMatch(/disabled/);
  });

  it('disables 变卦辞 when no moving lines', () => {
    const cast = castNoChange();
    expect(cast.changed).toBeFalsy();
    const html = renderClassicGuaSwitchHtml(cast);
    expect(html).toMatch(/disabled/);
    expect(html).toMatch(/无动则无变/);
  });

  it('renders gua text with judgment and lines', () => {
    const html = renderClassicGuaTextHtml('乾');
    expect(html).toMatch(/卦辞|六爻|乾/);
  });
});
