import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildQuestionBriefing,
  renderQuestionBriefingHtml,
} from './question-briefing.ts';

function castGuaiSample() {
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
  it('uses emoji section titles instead of numbered layers', () => {
    const cast = castGuaiSample();
    const q =
      '我在2026年7月底主动离开目前公司，未来三个月的求职、收入与整体发展如何？';
    const b = buildQuestionBriefing(cast, q, new Date('2026-07-22T20:50:00'));
    expect(b.questionLead).toMatch(/结合你问的问题/);
    expect(b.questionLead).toMatch(/离开目前公司/);
    expect(b.layer1.title).toMatch(/现状与转折点/);
    expect(b.layer2.title).toMatch(/努力的方向/);
    expect(b.layer3.title).toMatch(/行动清单/);
    expect(b.layer3.quote).toBeTruthy();
    expect(b.layer1.body).not.toMatch(/对应你的问题：就「/);
    expect(b.layer2.body).not.toMatch(/就「/);
    expect(b.layer4.body).not.toMatch(/^就「/);
  });

  it('puts the key action insight in a quote card in html', () => {
    const cast = castGuaiSample();
    const b = buildQuestionBriefing(
      cast,
      '离职后三个月求职发展如何',
      new Date('2026-07-22T20:50:00'),
    );
    const html = renderQuestionBriefingHtml(b);
    expect(html).toMatch(/ly-question-briefing/);
    expect(html).toMatch(/ly-briefing-quote/);
    expect(html).toMatch(/现状与转折点/);
    expect(html).not.toMatch(/第一层/);
    expect(html).not.toMatch(/破局策略/);
    // question lead once
    const leads = html.match(/结合你问的问题/g) ?? [];
    expect(leads.length).toBe(1);
  });
});
