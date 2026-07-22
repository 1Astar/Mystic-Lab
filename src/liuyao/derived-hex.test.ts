import { describe, expect, it } from 'vitest';
import { HEXAGRAMS, hexagramByKingWen, linesFromHexagram } from './hexagrams.ts';
import {
  derivedHexagramsOf,
  invertedLines,
  mutualLines,
  oppositeLines,
  renderDerivedHexSectionHtml,
} from './derived-hex.ts';
import { TERM_GLOSS, renderTermLabelHtml } from './term-gloss.ts';

describe('derived-hex', () => {
  it('互卦：蒙 → 复（二三四／三四五）', () => {
    const meng = HEXAGRAMS.find((h) => h.name === '蒙')!;
    const lines = linesFromHexagram(meng);
    // 坎下艮上：0,1,0 + 0,0,1
    expect(lines).toEqual([0, 1, 0, 0, 0, 1]);
    expect(mutualLines(lines)).toEqual([1, 0, 0, 0, 0, 0]);
    const hu = derivedHexagramsOf(meng).find((d) => d.kind === 'hu')!;
    expect(hu.hex.name).toBe('复');
  });

  it('错卦：乾 ↔ 坤', () => {
    const qian = hexagramByKingWen(1)!;
    expect(oppositeLines(linesFromHexagram(qian))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(derivedHexagramsOf(qian).find((d) => d.kind === 'cuo')!.hex.name).toBe('坤');
  });

  it('综卦：泰 ↔ 否', () => {
    const tai = HEXAGRAMS.find((h) => h.name === '泰')!;
    const zong = derivedHexagramsOf(tai).find((d) => d.kind === 'zong')!;
    expect(zong.hex.name).toBe('否');
    expect(invertedLines(linesFromHexagram(tai))).toEqual(linesFromHexagram(zong.hex));
  });

  it('renders section with term gloss hooks', () => {
    const meng = HEXAGRAMS.find((h) => h.name === '蒙')!;
    const html = renderDerivedHexSectionHtml(meng);
    expect(html).toMatch(/data-term="hu-gua"/);
    expect(html).toMatch(/data-term="cuo-gua"/);
    expect(html).toMatch(/data-term="zong-gua"/);
    expect(html).toMatch(/复/);
  });
});

describe('term-gloss', () => {
  it('has 互卦 tip and renders clickable label', () => {
    expect(TERM_GLOSS['hu-gua']?.tip).toMatch(/二三四/);
    const html = renderTermLabelHtml('hu-gua');
    expect(html).toMatch(/ly-term-btn/);
    expect(html).toMatch(/详解/);
  });
});
