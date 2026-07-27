import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  renderDressInfoCard,
  renderLearnTeachPageHtml,
  renderStepYaoPanelHtml,
} from './learn-shell.ts';
import { renderLearnNotesShellHtml } from './learn-course.ts';
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
    expect(html).not.toMatch(/点爻学爻/);
    expect(html).not.toMatch(/笔记与对照/);
    expect(html).not.toMatch(/data-learn-notes/);
    const notes = renderLearnNotesShellHtml(cast, '他还会回来吗', new Date('2026-07-21'));
    expect(notes).toMatch(/卦象解析/);
    expect(notes).toMatch(/专业排盘/);
    expect(notes).toMatch(/古籍解析/);
    expect(notes).toMatch(/个人沉淀/);
    expect(notes).not.toMatch(/>此刻解读</);
    expect(notes).toMatch(/本步笔记/);
    expect(notes).toMatch(/易学黑话翻译对照表/);
    expect(notes).toMatch(/data-drawer-pane="dress"/);
    expect(notes).toMatch(/data-study-note/);
  });

  it('step yao panel has position / state / life map', () => {
    const cast = castSample();
    const html = renderStepYaoPanelHtml(1, cast, '面试能过吗');
    expect(html).toMatch(/对应位置解析/);
    expect(html).toMatch(/位置：/);
    expect(html).toMatch(/状态：/);
    expect(html).toMatch(/生活映射：/);
  });

  it('dress archive has 本∥变 dual plates', () => {
    const cast = castSample();
    const html = renderDressArchiveHtml(cast, new Date());
    expect(html).toMatch(/data-dress-dual|ly-dress-switch|data-gua-switch/);
    expect(html).toMatch(/ly-dress-table/);
    expect(html).toMatch(/爻相/);
    expect(html).toMatch(/爻位/);
    expect(html).toMatch(/世应/);
    expect(html).toMatch(/六神/);
    expect(html).toMatch(/六亲/);
    expect(html).toMatch(/干支/);
    expect(html).toMatch(/本卦/);
    expect(html).toMatch(/变卦|无动则无变/);
    expect(html).toMatch(/ly-dress-xiang/);
    expect(html).toMatch(/data-dress-line/);
    expect(html).toMatch(/data-dress-side="primary"/);
    expect(html).toMatch(/data-yao-modal/);
    expect(renderDressInfoCard(cast, new Date())).toMatch(/爻相/);
  });
});
