import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildQuestionBriefing,
  renderQuestionBriefingHtml,
} from './question-briefing.ts';

function castGuaiSample() {
  // Prefer a cast with change for layer1 metaphor
  const throws = [
    facesToThrow(['obverse', 'obverse', 'obverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
    facesToThrow(['obverse', 'reverse', 'reverse']),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('question-briefing', () => {
  it('builds four layers + strategy tied to question', () => {
    const cast = castGuaiSample();
    const q =
      '我在2026年7月底主动离开目前公司，未来三个月的求职、收入与整体发展如何？';
    const b = buildQuestionBriefing(cast, q, new Date('2026-07-22T20:50:00'));
    expect(b.layer1.title).toMatch(/核心大方向/);
    expect(b.layer1.body).toMatch(/本卦|对应你的问题|核心隐喻/);
    expect(b.layer2.title).toMatch(/能量状态|求职|薪资/);
    expect(b.layer2.body).toMatch(/世爻|现状/);
    expect(b.layer3.title).toMatch(/行动建议/);
    expect(b.layer3.body).toMatch(/翻译成人话|具体做法/);
    expect(b.layer4.title).toMatch(/古籍|对照/);
    expect(b.strategy.title).toMatch(/破局策略/);
    expect(b.strategy.body).toMatch(/1\.|2\./);
  });

  it('renders html panel', () => {
    const cast = castGuaiSample();
    const html = renderQuestionBriefingHtml(
      buildQuestionBriefing(cast, '面试能过吗', new Date('2026-07-22')),
    );
    expect(html).toMatch(/ly-question-briefing/);
    expect(html).toMatch(/第一层/);
    expect(html).toMatch(/破局策略/);
  });
});
