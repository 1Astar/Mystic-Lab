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
  it('builds Step1–4 basis + question + actions + oneLiner', () => {
    const cast = castSample();
    const loop = buildFinalLoop(cast, '这次投标能中吗', new Date('2026-07-21'));
    expect(loop.steps).toHaveLength(4);
    expect(loop.steps[0]!.tag).toMatch(/Step1 世应/);
    expect(loop.steps[0]!.body).toMatch(/世在.+应在.+/);
    expect(loop.steps[1]!.tag).toMatch(/Step2 动爻/);
    expect(loop.steps[2]!.tag).toMatch(/Step3 取象/);
    expect(loop.steps[2]!.body).toMatch(/若偏事务/);
    expect(loop.steps[2]!.body).toMatch(/若偏关系/);
    expect(loop.steps[3]!.tag).toMatch(/Step4 过程/);
    expect(loop.steps.every((s) => !/不要只拿|交差|策略清单/.test(s.body))).toBe(true);
    expect(loop.questionBody).toMatch(/这次投标能中吗/);
    expect(loop.actions.length).toBeGreaterThan(0);
    expect(loop.relationLabel).toMatch(/Step 1/);
    expect(loop.focusLabel).toMatch(/Step 2/);
    expect(loop.trajectoryLabel).toMatch(/Step 4/);
    expect(loop.conclusion.length).toBeGreaterThan(8);
    expect(loop.action.length).toBeGreaterThan(8);
    expect(loop.oneLiner.length).toBeGreaterThan(8);
    expect(loop.oneLiner.length).toBeLessThanOrEqual(72);
  });

  it('renders 卦象依据 / 结合问题 / 行动建议', () => {
    const cast = castSample();
    const loop = buildFinalLoop(cast, '面试能过吗');
    const html = renderFinalLoopHtml(loop);
    expect(html).toMatch(/卦象依据/);
    expect(html).toMatch(/Step1 世应/);
    expect(html).toMatch(/Step3 取象/);
    expect(html).toMatch(/结合问题/);
    expect(html).toMatch(/行动建议/);
    expect(html).toMatch(/ly-final-loop/);
    expect(html).toMatch(/ly-final-action-list/);
  });
});
