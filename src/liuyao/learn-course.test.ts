import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildCourseLessons,
  renderLearnCourseHtml,
  renderLearnNotesShellHtml,
  saveCourseNote,
  loadCourseNote,
  collectCourseNotes,
  noteDrawerTabForStep,
} from './learn-course.ts';
import { renderMovingYaoCards } from './learn-studio.ts';

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
  it('builds 6 lessons with short names', () => {
    const cast = castSample();
    const lessons = buildCourseLessons(cast, '他还会回来吗');
    expect(lessons).toHaveLength(6);
    expect(lessons[0]!.shortName).toMatch(/世应/);
    expect(lessons[0]!.crumbName).toMatch(/寻己/);
    expect(lessons[0]!.crumbAnno).toMatch(/查灵魂/);
    expect(lessons[0]!.crumbHint).toMatch(/我站在哪里/);
    expect(lessons[1]!.shortName).toMatch(/用神/);
    expect(lessons[1]!.crumbName).toMatch(/锁用神|用神/);
    expect(lessons[1]!.title).toMatch(/锁定用神/);
    expect(lessons[1]!.toolHtml).toMatch(/ly-yong-focus|核心点位/);
    expect(lessons[1]!.yaoFocus?.length).toBeGreaterThan(0);
    expect(lessons[2]!.crumbHint).toMatch(/哪里在动/);
    expect(lessons[3]!.crumbHint).toMatch(/上下卦|实际|自问|场/);
    expect(lessons[4]!.crumbHint).toMatch(/本卦走向变卦/);
    expect(lessons[5]!.crumbHint).toMatch(/落到现实/);
    expect(lessons[0]!.title).toMatch(/查灵魂/);
    expect(lessons[0]!.lookAt).toMatch(/世（我）/);
    expect(lessons[0]!.methodHtml).toBeUndefined();
    expect(lessons[0]!.vernacular).toBe('');
    expect(lessons[0]!.yaoFocus?.[0]?.why).toMatch(/八宫|世爻|金色|我/);
    expect(lessons[0]!.yaoFocus?.[1]?.why).toMatch(/应|隔三|外界/);
    expect(lessons[0]!.yaoFocus?.[0]?.life).toMatch(/状态|世应/);
    expect(lessons[0]!.classicBai).toMatch(/白话|自我状态|外部环境|世在/);
    expect(lessons[0]!.noteHint).toMatch(/例如/);
    expect(lessons[0]!.yaoFocus?.length).toBeGreaterThan(0);
    expect(lessons[0]!.yaoFocus?.[0]?.mark).toMatch(/世/);
    expect(lessons[2]!.title).toMatch(/抓重点 · 动爻/);
    expect(lessons[3]!.title).toMatch(/看根基 · 取象/);
    expect(lessons[3]!.toolHtml).toMatch(/为什么形成这个卦|ly-gua-card/);
    expect(lessons[3]!.toolHtml).toMatch(/根基 × 实际|ly-foundation-bridge/);
    expect(lessons[3]!.toolHtml).not.toMatch(/ly-scene-block-title/);
    expect(lessons[4]!.title).toMatch(/看过程 · 本/);
    expect(lessons[4]!.lookAt).toMatch(/→|无变/);
    expect(lessons[4]!.toolHtml).toMatch(/生克星图|ly-sk-panel/);
    expect(lessons[4]!.toolHtml).toMatch(/进阶|用\/元\/忌|变卦实战|无变卦/);
    expect(lessons[5]!.title).toMatch(/连生活 · 策略/);
    expect(lessons[5]!.toolHtml).toMatch(
      /ly-question-briefing|格局摘要|ly-pattern-summary|卦象依据|ly-final-loop|结合问题|行动建议/,
    );
    expect(lessons[5]!.basics).toMatch(/推演闭环|此刻解读/);
    expect(lessons[5]!.vernacular).toBe('');
    expect(lessons[5]!.classicBai).toMatch(/一句话/);
  });

  it('renders progress and bottom nav', () => {
    const cast = castSample();
    const html = renderLearnCourseHtml(cast, '面试能过吗');
    expect(html).toMatch(/ly-course-trail/);
    expect(html).toMatch(/寻己/);
    expect(html).toMatch(/锁用神|用神/);
    expect(html).toMatch(/找转机/);
    expect(html).toMatch(/看根基/);
    expect(html).toMatch(/看演变/);
    expect(html).toMatch(/入生活/);
    expect(html).toMatch(/data-course-trail-tip/);
    expect(html).toMatch(/查灵魂·世应（找你和外界）/);
    expect(html).toMatch(/我站在哪里？我是谁？/);
    expect(html).not.toMatch(/ly-course-crumb-anno/);
    expect(html).not.toMatch(/ly-course-crumb-look/);
    expect(html).toMatch(/is-now/);
    expect(html).toMatch(/上一步/);
    expect(html).toMatch(/解读笔记/);
    expect(html).not.toMatch(/ly-course-bookmark/);
    expect(html).not.toMatch(/data-learn-notes/);
    expect(html).toMatch(/本步注解对应|ly-course-yao-focus/);
    expect(html).toMatch(/data-ask-line/);
    expect(html).toMatch(/为何是它|点爻/);
    expect(html).not.toMatch(/教你找位置/);
    expect(html).toMatch(/下一步/);
  });

  it('notes shell is shared outside course (expand only, no 此刻解读)', () => {
    const cast = castSample();
    const html = renderLearnNotesShellHtml(cast, '面试能过吗');
    expect(html).toMatch(/data-learn-notes/);
    expect(html).toMatch(/ly-course-bookmark/);
    expect(html).not.toMatch(/data-drawer-tab="reading"/);
    expect(html).not.toMatch(/>此刻解读</);
    expect(html).toMatch(/卦象解析/);
    expect(html).toMatch(/专业排盘/);
    expect(html).toMatch(/古籍解析/);
    expect(html).toMatch(/本卦辞 · 六爻/);
    expect(html).toMatch(/变卦辞/);
    expect(html).toMatch(/data-gua-switch/);
    expect(html).toMatch(/传统解卦全书/);
    expect(html).toMatch(/象曰/);
    expect(html).toMatch(/决策/);
    expect(html).toMatch(/ly-guide-snippet|图鉴 ·/);
    expect(html).toMatch(/分域注解/);
    expect(html).toMatch(/个人沉淀/);
    expect(html).toMatch(/实际落点|工作上|感情上/);
    expect(html).not.toMatch(/为什么形成这个卦/);
    expect(html).toMatch(/能量现状推演|核心聚焦（用神）|核心目标（用神）/);
    expect(html).toMatch(/当下能量聚焦表|data-energy-focus/);
    expect(html).toMatch(/卦象核心释义/);
    expect(html).toMatch(/易学黑话翻译对照表/);
    expect(html).toMatch(/data-study-note/);
    expect(html).toMatch(/data-drawer-pane="xiang"/);
    expect(html).toMatch(/data-drawer-pane="journal"/);
    expect(html).toMatch(/data-drawer-pane="books"/);
  });

  it('persists notes per step', () => {
    const cast = castSample();
    saveCourseNote(cast, 1, '我觉得世爻说得对');
    expect(loadCourseNote(cast, 1)).toMatch(/世爻/);
    expect(collectCourseNotes(cast)).toMatch(/Step 1/);
  });

  it('maps each step to a note drawer tab (点哪学哪)', () => {
    expect(noteDrawerTabForStep(1)).toBe('books');
    expect(noteDrawerTabForStep(2)).toBe('dress');
    expect(noteDrawerTabForStep(3)).toBe('books');
    expect(noteDrawerTabForStep(4)).toBe('xiang');
    expect(noteDrawerTabForStep(5)).toBe('xiang');
    expect(noteDrawerTabForStep(6)).toBe('xiang');
  });

  it('moving yao action tip has quote mark', () => {
    const cast = castSample();
    const html = renderMovingYaoCards(cast, 'career');
    expect(html).toMatch(/ly-move-action/);
    expect(html).toMatch(/行动建议/);
    expect(html).toMatch(/稳住底盘与情绪|切忌强行突破|可验证的一小步/);
  });
});
