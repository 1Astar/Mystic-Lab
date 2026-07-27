import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildDeepLessons,
  renderDeepCourseHtml,
  renderDeepNotesBlockHtml,
} from './deep-course.ts';

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

describe('deep-course', () => {
  it('builds 3 deep lessons', () => {
    const cast = castSample();
    const lessons = buildDeepLessons(cast, '节制还是推进？', new Date('2026-07-21'));
    expect(lessons).toHaveLength(3);
    expect(lessons[0]!.shortName).toMatch(/卦象/);
    expect(lessons[1]!.shortName).toMatch(/能量/);
    expect(lessons[1]!.bodyHtml).toMatch(/ly-sk-course|能量现状/);
  });

  it('renders course nav and notes tabs', () => {
    const cast = castSample();
    const at = new Date('2026-07-21');
    expect(renderDeepCourseHtml(cast, '问财运', at)).toMatch(/三步精读/);
    expect(renderDeepCourseHtml(cast, '问财运', at)).toMatch(/下一步/);
    const notes = renderDeepNotesBlockHtml(cast, at, '问财运');
    expect(notes).not.toMatch(/>此刻解读</);
    expect(notes).not.toMatch(/data-note-tab="reading"/);
    expect(notes).toMatch(/卦象解析/);
    expect(notes).toMatch(/古籍解析/);
    expect(notes).toMatch(/本卦辞 · /);
    expect(notes).toMatch(/data-gua-switch/);
    expect(notes).toMatch(/传统解卦全书/);
    expect(notes).toMatch(/ly-guide-snippet|图鉴 ·/);
    expect(notes).toMatch(/个人沉淀/);
    expect(notes).toMatch(/专业排盘/);
    expect(notes).toMatch(/用神状态|ly-spirit-nar|data-dress-energy/);
    expect(notes).toMatch(/ly-oracle-tags|ly-domain-card/);
    expect(notes).not.toMatch(/ly-scene-block-title/);
    expect(notes).not.toMatch(/为什么形成这个卦/);
    expect(notes).toMatch(/核心聚焦（用神）|核心目标（用神）/);
    expect(notes).toMatch(/ly-spirit-nar|data-dress-energy|用神状态/);
    expect(notes).toMatch(/卦象核心释义/);
    expect(notes).toMatch(/用神/);
    expect(notes).not.toMatch(/data-note-tab="dict"/);
    expect(notes).toMatch(/易学黑话翻译对照表/);
    expect(notes).toMatch(/ly-qin-dict/);
    expect(notes).toMatch(/边看边问/);
    expect(notes).toMatch(/data-ask-panel|data-note-tab="ask"/);
    expect(notes).toMatch(/我还想问/);
    expect(notes).not.toMatch(/data-learn-faq/);
    expect(notes).toMatch(/爻相/);
  });
});
