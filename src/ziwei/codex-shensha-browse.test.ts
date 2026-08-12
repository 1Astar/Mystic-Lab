import { describe, expect, it } from 'vitest';
import {
  filterShenshaForBrowse,
  listCodexShenshaFlat,
  shenshaBrowseMeta,
  SHENSHA_THEME_ORDER,
} from './codex-shensha-browse.ts';

describe('codex-shensha-browse', () => {
  it('assigns every codex shensha a theme + tone', () => {
    const list = listCodexShenshaFlat();
    expect(list.length).toBeGreaterThan(40);
    for (const s of list) {
      const m = shenshaBrowseMeta(s.id);
      expect(SHENSHA_THEME_ORDER).toContain(m.theme);
      expect(['support', 'neutral', 'caution']).toContain(m.tone);
    }
  });

  it('filters by meet + theme', () => {
    const all = filterShenshaForBrowse({
      meet: 'all',
      theme: 'romance',
      inChartIds: new Set(),
    });
    expect(all.some((s) => s.id === '红鸾')).toBe(true);
    expect(all.every((s) => shenshaBrowseMeta(s.id).theme === 'romance')).toBe(true);

    const inChart = filterShenshaForBrowse({
      meet: 'in_chart',
      theme: 'all',
      inChartIds: new Set(['红鸾', '天刑']),
    });
    expect(inChart.map((s) => s.id).sort()).toEqual(['天刑', '红鸾']);
  });
});
