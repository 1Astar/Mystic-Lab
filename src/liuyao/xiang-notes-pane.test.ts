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

  it('shows 本卦 / 变卦 switch in 意象 when there is a change', () => {
    const cast = castSample();
    expect(cast.changed).toBeTruthy();
    const html = renderXiangNotesPaneHtml(cast, '对方对我什么感觉');
    expect(html).toMatch(/data-xiang-hex-switch/);
    expect(html).toMatch(/data-gua-side="primary"/);
    expect(html).toMatch(/data-gua-side="changed"/);
    expect(html).toMatch(new RegExp(`本卦 · ${cast.primary.name}`));
    expect(html).toMatch(new RegExp(`变卦 · ${cast.changed!.name}`));
    expect(html).toMatch(new RegExp(`图鉴 · ${cast.primary.fullName}`));
    expect(html).toMatch(new RegExp(`图鉴 · ${cast.changed!.fullName}`));
  });

  it('分域也有本卦 / 变卦切换与完整变卦分域', () => {
    const cast = castSample();
    expect(cast.changed).toBeTruthy();
    const html = renderXiangNotesPaneHtml(cast, '面试能过吗');
    expect(html).toMatch(/data-xiang-domain-switch/);
    expect(html).toMatch(new RegExp(`本卦【${cast.primary.fullName}】`));
    expect(html).toMatch(new RegExp(`变卦【${cast.changed!.fullName}】`));
    expect(html).toMatch(/相对本卦/);
    // 意象 + 分域各一套本/变 tab
    expect(html.match(/本卦 \/ 变卦分域切换/g)?.length).toBe(1);
    expect(html.match(/data-xiang-hex-switch/g)?.length).toBe(2);
  });
});
