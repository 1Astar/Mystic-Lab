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
    expect(d.frame).toMatch(/huàn/);
    expect(d.frame).toMatch(/巽为风/);
    expect(d.frame).not.toMatch(/xùn/);
    expect(d.verdict).toMatch(/8k|心累|费劲/);
    expect(d.analysis).toMatch(/本卦/);
    expect(d.analysis).toMatch(/对应你的问题/);
    expect(d.analysis).toMatch(/核心隐喻/);
    expect(d.analysis).toMatch(/涣/);
    expect(d.analysis).toMatch(/巽/);
    expect(d.analysis).toMatch(/冠英|核心隐喻/);
    expect(d.analysis.length).toBeGreaterThan(80);
    expect(d.decision).toMatch(/不建议|死磕|机会/);
    expect(d.nextSteps).toMatch(/红线|期限|口风|两手/);
    expect(d.why).toMatch(/你的现状|物质根基|目标系统/);
    expect(d.reassurance).toMatch(/不是生死判决|有主见/);
    expect(d.partLeans.length).toBeGreaterThanOrEqual(2);
  });
});

describe('question-briefing', () => {
  it('uses OfflineAnswerPack script sections', () => {
    const cast = castHuanToXun();
    const q = '我要不要留在冠英？8月初要不要离职？转正能拿到8k吗？';
    const b = buildQuestionBriefing(cast, q, new Date('2026-07-24T14:56:00'));
    expect(b.questionLead).toMatch(/基于/);
    expect(b.layer1.title).toMatch(/卦象定调/);
    expect(b.pack.script?.beats).toHaveLength(4);
    expect(b.pack.verdict.headline.length).toBeGreaterThan(8);
    expect(b.pack.answers.length).toBeGreaterThanOrEqual(2);
    expect(b.layer2.title).toMatch(/现状真相/);
    expect(b.layer3.title).toMatch(/具体动作/);
    expect(b.layer4.title).toMatch(/定心丸/);
    expect(b.pack.breakthrough.body).not.toMatch(/只选一个可验证动作/);
  });

  it('renders briefing with answer pack', () => {
    const cast = castHuanToXun();
    const html = renderQuestionBriefingForCast(
      cast,
      '离职后三个月求职发展如何',
      new Date('2026-07-24T14:56:00'),
    );
    expect(html).toMatch(/ly-question-briefing/);
    expect(html).toMatch(/卦象定调/);
    expect(html).toMatch(/给你的核心定心丸|现状真相|具体动作|底线与防备/);
    expect(html).toMatch(/ly-layer-card/);
    expect(html).toMatch(/盘面辅读|世在/);
    expect(html).toMatch(/ly-classic-fold/);
    expect(html).not.toMatch(/爻相细说/);
    expect(html).not.toMatch(/为什么这么判断？/);
  });
});
