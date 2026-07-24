import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { linesFromHexagram, HEXAGRAMS } from './hexagrams.ts';
import { buildDirectReading, splitQuestionParts } from './direct-reading.ts';
import {
  buildQuestionBriefing,
  renderQuestionBriefingForCast,
} from './question-briefing.ts';

function castHuanToXun(): ReturnType<typeof buildCastFromThrows> {
  const huan = HEXAGRAMS.find((h) => h.name === '涣')!;
  const lines = linesFromHexagram(huan);
  const throws = lines.map((bit, i) => {
    const changing = i === 2;
    if (changing && bit === 0) return facesToThrow(['obverse', 'obverse', 'obverse']);
    if (changing && bit === 1) return facesToThrow(['reverse', 'reverse', 'reverse']);
    if (bit === 1) return facesToThrow(['obverse', 'obverse', 'reverse']);
    return facesToThrow(['obverse', 'reverse', 'reverse']);
  }) as YaoThrow[];
  return buildCastFromThrows(throws, 'coin');
}

describe('direct-reading', () => {
  it('splits multi career questions', () => {
    const parts = splitQuestionParts(
      '我要不要留在冠英？8月初要不要离职？转正能拿到8k吗？',
    );
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts.some((p) => p.kind === 'salary')).toBe(true);
    expect(parts.some((p) => p.kind === 'stay' || p.kind === 'leave')).toBe(true);
  });

  it('translates 涣→巽 career multi-ask into direct verdict', () => {
    const cast = castHuanToXun();
    expect(cast.primary.name).toBe('涣');
    expect(cast.changed?.name).toBe('巽');
    const q = '我要不要留在冠英？8月初要不要离职？转正能拿到8k吗？';
    const d = buildDirectReading(cast, q);
    expect(d.frame).toMatch(/风水涣/);
    expect(d.frame).toMatch(/巽为风/);
    expect(d.verdict).toMatch(/8k|心累|费劲/);
    expect(d.analysis).toMatch(/涣/);
    expect(d.analysis).toMatch(/巽|柔|反复/);
    expect(d.decision).toMatch(/不建议|死磕|两手|机会/);
    expect(d.nextSteps).toMatch(/红线|期限|准备|口风/);
    expect(d.partLeans.length).toBeGreaterThanOrEqual(2);
  });
});

describe('question-briefing', () => {
  it('uses direct-reading section titles', () => {
    const cast = castHuanToXun();
    const q = '我要不要留在冠英？8月初要不要离职？转正能拿到8k吗？';
    const b = buildQuestionBriefing(cast, q, new Date('2026-07-24T14:56:00'));
    expect(b.questionLead).toMatch(/基于/);
    expect(b.layer1.title).toMatch(/核心判词/);
    expect(b.layer1.quote).toMatch(/8k|心累/);
    expect(b.layer2.title).toMatch(/解析/);
    expect(b.layer3.title).toMatch(/决策参考/);
    expect(b.layer4.title).toMatch(/为什么/);
    expect(b.layer4.body).toMatch(/三件事/);
  });

  it('renders briefing with verdict quote', () => {
    const cast = castHuanToXun();
    const html = renderQuestionBriefingForCast(
      cast,
      '离职后三个月求职发展如何',
      new Date('2026-07-24T14:56:00'),
    );
    expect(html).toMatch(/ly-question-briefing/);
    expect(html).toMatch(/ly-briefing-quote/);
    expect(html).toMatch(/核心判词/);
    expect(html).not.toMatch(/第一层/);
    expect(html).not.toMatch(/现状与转折点/);
  });
});
