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
  it('builds 4 deep lessons', () => {
    const cast = castSample();
    const lessons = buildDeepLessons(cast, '节制还是推进？', new Date('2026-07-21'));
    expect(lessons).toHaveLength(4);
    expect(lessons[0]!.shortName).toMatch(/卦象/);
    expect(lessons[1]!.shortName).toMatch(/能量/);
    expect(lessons[1]!.bodyHtml).toMatch(/ly-sk-course|能量现状/);
  });

  it('renders course nav and notes tabs', () => {
    const cast = castSample();
    const at = new Date('2026-07-21');
    expect(renderDeepCourseHtml(cast, '问财运', at)).toMatch(/四步精读/);
    expect(renderDeepCourseHtml(cast, '问财运', at)).toMatch(/下一步/);
    const notes = renderDeepNotesBlockHtml(cast);
    expect(notes).toMatch(/我的笔记/);
    expect(notes).toMatch(/典故古籍/);
    expect(notes).toMatch(/专业排盘/);
    expect(notes).toMatch(/黑话词典/);
    expect(notes).toMatch(/爻相/);
  });
});
