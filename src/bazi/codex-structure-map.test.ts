import { describe, expect, it } from 'vitest';
import { renderStructureMapHtml } from './codex-structure-map.ts';
import { renderBaziCodexDetailHtml } from '../ui/bazi-codex-detail.ts';

describe('codex structure map', () => {
  it('甲木 shows 五行/阴阳/意象/气质/作用', () => {
    const html = renderStructureMapHtml('甲');
    expect(html).toContain('data-structure-map');
    expect(html).toContain('甲木');
    expect(html).toContain('五行 · 木');
    expect(html).toContain('阴阳 · 阳');
    expect(html).toContain('大树');
    expect(html).toContain('栋梁');
    expect(html).toContain('直');
    expect(html).toContain('原则');
    expect(html).toContain('在盘里的作用');
    expect(html).toContain('生');
    expect(html).toContain('火');
  });

  it('正官 shows 主题/环绕标签/对日主', () => {
    const html = renderStructureMapHtml('tg:正官');
    expect(html).toContain('正官');
    expect(html).toContain('规则');
    expect(html).toContain('目标');
    expect(html).toContain('责任');
    expect(html).toContain('上级');
    expect(html).toContain('KPI');
    expect(html).toContain('对日主');
    expect(html).toContain('立结构');
    expect(html).toContain('is-role');
  });

  it('detail express pane uses structure map not memory art reuse', () => {
    const html = renderBaziCodexDetailHtml('甲', {
      artHtml: '<svg class="memory-only"></svg>',
      lit: true,
    });
    expect(html).toContain('data-structure-map');
    expect(html).toContain('认知示意');
    const expressPane = html.match(
      /data-enc-pane="express"[\s\S]*?(?=data-enc-pane="relation")/,
    )?.[0];
    expect(expressPane).toBeTruthy();
    expect(expressPane).toContain('data-structure-map');
    expect(expressPane).not.toContain('memory-only');
  });
});
