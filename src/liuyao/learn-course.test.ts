import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildCourseLessons,
  renderLearnCourseHtml,
  saveCourseNote,
  loadCourseNote,
  collectCourseNotes,
} from './learn-course.ts';

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

describe('learn-course', () => {
  it('builds 5 lessons with short names', () => {
    const cast = castSample();
    const lessons = buildCourseLessons(cast, '他还会回来吗');
    expect(lessons).toHaveLength(5);
    expect(lessons[0]!.shortName).toMatch(/位置/);
    expect(lessons[0]!.methodHtml).toMatch(/教你找位置/);
    expect(lessons[0]!.vernacular).toMatch(/结合你的问题/);
    expect(lessons[0]!.classicBai).toMatch(/白话|自我状态|外部环境|世在/);
    expect(lessons[0]!.noteHint).toMatch(/例如/);
    expect(lessons[1]!.shortName).toMatch(/动爻/);
    expect(lessons[3]!.shortName).toMatch(/能量/);
    expect(lessons[3]!.title).toMatch(/谁在帮你/);
    expect(lessons[3]!.toolHtml).toMatch(/ly-sk-course|能量现状/);
    expect(lessons[4]!.toolHtml).toMatch(/ly-faq-item|边看边问/);
    expect(lessons[4]!.vernacular.length).toBeGreaterThan(8);
  });

  it('renders progress and bottom nav', () => {
    const cast = castSample();
    const html = renderLearnCourseHtml(cast, '面试能过吗');
    expect(html).toMatch(/1 \/ 5/);
    expect(html).toMatch(/上一步/);
    expect(html).toMatch(/原文与笔记/);
    expect(html).toMatch(/ly-course-bookmark/);
    expect(html).toMatch(/白话翻译/);
    expect(html).toMatch(/书籍注解/);
    expect(html).toMatch(/专业排盘/);
    expect(html).toMatch(/data-drawer-pane="books"/);
    expect(html).toMatch(/下一步/);
  });

  it('persists notes per step', () => {
    const cast = castSample();
    saveCourseNote(cast, 1, '我觉得世爻说得对');
    expect(loadCourseNote(cast, 1)).toMatch(/世爻/);
    expect(collectCourseNotes(cast)).toMatch(/Step 1/);
  });
});
