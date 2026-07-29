import { describe, expect, it } from 'vitest';
import { renderHexagramSvg } from './hexagram-view.ts';

function parseViewBox(svg: string): { w: number; h: number } {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!m) throw new Error('no viewBox');
  return { w: Number(m[1]), h: Number(m[2]) };
}

function firstYangCx(svg: string): number {
  const m = svg.match(/class="ly-yao-yang"[^>]*x1="([\d.]+)"[^>]*x2="([\d.]+)"/);
  if (!m) {
    const m2 = svg.match(/x1="([\d.]+)" y1="[^"]+" x2="([\d.]+)"/);
    if (!m2) throw new Error('no yang line');
    return (Number(m2[1]) + Number(m2[2])) / 2;
  }
  return (Number(m[1]) + Number(m[2])) / 2;
}

describe('renderHexagramSvg centering', () => {
  it('keeps line center at viewBox mid without annotations', () => {
    const svg = renderHexagramSvg({
      lines: [1, 0, 1, 0, 1, 0],
      compact: true,
      revealedCount: 6,
    });
    const { w } = parseViewBox(svg);
    expect(firstYangCx(svg)).toBeCloseTo(w / 2, 5);
  });

  it('keeps line center at viewBox mid with kind + coin labels (learn cast)', () => {
    const svg = renderHexagramSvg({
      lines: [0, 0, 1, 0, 1, 1],
      compact: true,
      revealedCount: 6,
      kindLabels: ['少阴', '少阴', '少阳', '少阴', '老阳', '少阳'],
      coinLabels: ['字字背', '字背字', '字背背', '背字字', '背背背', '字背背'],
      teachable: true,
    });
    const { w } = parseViewBox(svg);
    expect(svg).toContain('ly-hexagram-kinds');
    expect(firstYangCx(svg)).toBeCloseTo(w / 2, 5);
  });
});
