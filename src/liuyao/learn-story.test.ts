import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  renderLearnChapter1,
  renderLearnChaptersBody,
  renderFiveStepSheetHtml,
} from './learn-story.ts';

function castYu() {
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

describe('learn-chapters', () => {
  it('chapter 1 is ritual: plaque + hex + question, not essay', () => {
    const cast = castYu();
    const html = renderLearnChapter1(cast, '他还会回来吗', new Date('2026-07-21T10:00:00'));
    expect(html).toMatch(/ly-q-card/);
    expect(html).toMatch(/他还会回来吗/);
    expect(html).toMatch(/一步步解读/);
    expect(html).not.toMatch(/推导过程/);
  });

  it('chapters 2–4 cover conflict, story, action', () => {
    const cast = castYu();
    const html = renderLearnChaptersBody(cast, '他还会回来吗', new Date('2026-07-21T10:00:00'));
    expect(html).toMatch(/冲突与转机/);
    expect(html).toMatch(/你（世爻）/);
    expect(html).toMatch(/翻译卦象的故事/);
    expect(html).toMatch(/查阅古书原话/);
    expect(html).toMatch(/给你的行动指南/);
    expect(html).toMatch(/一句话总结/);
  });

  it('five-step sheet is compact reference', () => {
    const cast = castYu();
    const html = renderFiveStepSheetHtml(cast, '要不要冲');
    expect(html).toMatch(/ly-help-fab/);
    expect(html).toMatch(/五步法/);
    expect(html).toMatch(/Step 1/);
  });
});
