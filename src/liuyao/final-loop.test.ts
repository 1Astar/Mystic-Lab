import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { buildFinalLoop, renderFinalLoopHtml } from './final-loop.ts';

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

describe('final-loop', () => {
  it('builds emoji-titled basis + conclusion + actions + oneLiner', () => {
    const cast = castSample();
    const loop = buildFinalLoop(cast, '这次投标能中吗', new Date('2026-07-21'));
    expect(loop.steps).toHaveLength(4);
    expect(loop.steps[0]!.tag).toMatch(/你与外界/);
    expect(loop.steps[0]!.body).toMatch(/世在.+应在.+/);
    expect(loop.steps[1]!.tag).toMatch(/哪里在变/);
    expect(loop.steps[2]!.tag).toMatch(/卦象在说什么/);
    expect(loop.steps[2]!.body).toMatch(/若偏事务/);
    expect(loop.steps[2]!.body).toMatch(/若偏关系/);
    expect(loop.steps[3]!.tag).toMatch(/本变轨迹/);
    expect(loop.steps.every((s) => !/不要只拿|交差|策略清单/.test(s.body))).toBe(true);
    // 问题不再重复前缀，正文直接是结论
    expect(loop.questionBody).not.toMatch(/对照你问的/);
    expect(loop.questionBody.length).toBeGreaterThan(8);
    expect(loop.actions.length).toBeGreaterThan(0);
    expect(loop.conclusion.length).toBeGreaterThan(8);
    expect(loop.action.length).toBeGreaterThan(8);
    expect(loop.oneLiner.length).toBeGreaterThan(8);
    expect(loop.oneLiner.length).toBeLessThanOrEqual(72);
  });

  it('renders 卦象依据 / 落到结论 / 行动建议', () => {
    const cast = castSample();
    const loop = buildFinalLoop(cast, '面试能过吗');
    const html = renderFinalLoopHtml(loop);
    expect(html).toMatch(/卦象依据/);
    expect(html).toMatch(/你与外界/);
    expect(html).toMatch(/卦象在说什么/);
    expect(html).toMatch(/落到结论/);
    expect(html).toMatch(/行动建议/);
    expect(html).toMatch(/ly-final-loop/);
    expect(html).toMatch(/ly-final-action-list/);
  });
});
