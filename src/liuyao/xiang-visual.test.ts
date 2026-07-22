import { describe, expect, it } from 'vitest';
import { TRIGRAMS } from './trigrams.ts';
import { renderXiangVisual } from './xiang-visual.ts';

describe('xiang-visual', () => {
  it('renders stacked trigram diagram instead of blur stage', () => {
    const html = renderXiangVisual(TRIGRAMS.离, TRIGRAMS.震);
    expect(html).toMatch(/ly-xiang-stage-diagram/);
    expect(html).toMatch(/上离·火/);
    expect(html).toMatch(/下震·雷/);
    expect(html).toMatch(/合成本卦/);
    expect(html).toMatch(/雷在下 · 火在上/);
    expect(html).not.toMatch(/ly-xiang-sky/);
  });
});
