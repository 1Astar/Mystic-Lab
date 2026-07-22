import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  renderDressInfoCard,
  renderLearnTeachPageHtml,
  renderStepYaoPanelHtml,
} from './learn-shell.ts';
import { renderDressArchiveHtml } from './dress-archive.ts';

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

describe('learn-shell', () => {
  it('renders five-step with drawer tabs for books and dress', () => {
    const cast = castSample();
    const html = renderLearnTeachPageHtml(cast, '他还会回来吗', new Date('2026-07-21'));
    expect(html).toMatch(/你问的是/);
    expect(html).toMatch(/五步学习/);
    expect(html).toMatch(/点爻学爻/);
    expect(html).toMatch(/笔记与对照/);
    expect(html).toMatch(/书籍注解/);
    expect(html).toMatch(/专业排盘/);
    expect(html).toMatch(/本步笔记/);
    expect(html).toMatch(/data-drawer-pane="dress"/);
  });

  it('step yao panel has position / state / life map', () => {
    const cast = castSample();
    const html = renderStepYaoPanelHtml(1, cast, '面试能过吗');
    expect(html).toMatch(/对应位置解析/);
    expect(html).toMatch(/位置：/);
    expect(html).toMatch(/状态：/);
    expect(html).toMatch(/生活映射：/);
  });

  it('dress archive has 爻相 for notes tab', () => {
    const cast = castSample();
    const html = renderDressArchiveHtml(cast, new Date());
    expect(html).toMatch(/ly-dress-table/);
    expect(html).toMatch(/爻相/);
    expect(html).toMatch(/ly-dress-xiang/);
    expect(renderDressInfoCard(cast, new Date())).toMatch(/爻相/);
  });
});
