import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { renderXiangNotesPaneHtml } from './xiang-notes-pane.ts';

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

describe('xiang-notes-pane', () => {
  it('renders guide + domain cards; no classic tag cloud on top', () => {
    const html = renderXiangNotesPaneHtml(castSample(), '面试能过吗');
    expect(html).toMatch(/data-xiang-notes/);
    expect(html).toMatch(/ly-xiang-rail/);
    expect(html).toMatch(/data-xiang-sec="guide"/);
    expect(html).toMatch(/data-xiang-sec="domain"/);
    expect(html).not.toMatch(/data-xiang-sec="energy"/);
    expect(html).not.toMatch(/data-classic-oracles/);
    expect(html).not.toMatch(/传统断语（标签/);
    expect(html).toMatch(/ly-domain-card/);
    expect(html).toMatch(/ly-domain-card-head/);
    expect(html).toMatch(/ly-oracle-tag/);
    expect(html).toMatch(/分域解说|卦象核心释义/);
  });
});
