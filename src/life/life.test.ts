import { describe, expect, it } from 'vitest';
import {
  parseArchiveResponse,
  parseForecastResponse,
  parsePortraitResponse,
  parseSimulationResponse,
} from './generate.ts';
import { buildDefaultWorlds } from './fork-presets.ts';
import { buildTemplateForecast, forecastStats } from './forecast-templates.ts';
import { buildTemplateSimulation } from './simulate-templates.ts';
import { buildTemplateArchive, buildTemplatePortrait } from './templates.ts';
import type { LifeForecast, LifeProfileInput } from './types.ts';

const sample: LifeProfileInput = {
  age: '29',
  occupation: '产品经理',
  city: '上海',
  birthYear: '1996',
  birthMonth: '8',
  birthDay: '12',
  birthHour: '午时',
  birthPlace: '杭州',
  confusion: '要不要离职去做 AI',
};

describe('life templates', () => {
  it('builds portrait from profile fields', () => {
    const p = buildTemplatePortrait(sample);
    expect(p.source).toBe('template');
    expect(p.tendencies.length).toBeGreaterThanOrEqual(2);
    expect(p.stageSummary).toMatch(/产品经理|上海|离职/);
    expect(p.stageHints.length).toBeGreaterThanOrEqual(2);
  });

  it('builds four default worlds', () => {
    const worlds = buildDefaultWorlds();
    expect(worlds.filter((w) => w.selected)).toHaveLength(4);
    expect(worlds[0]?.divergence).toMatch(/辞职/);
  });

  it('builds archive for a fork', () => {
    const a = buildTemplateArchive(sample, {
      id: 'startup',
      divergence: '创业的我',
    });
    expect(a.source).toBe('template');
    expect(a.title.length).toBeGreaterThan(2);
    expect(a.summary.length).toBeGreaterThan(20);
  });
});

describe('life generate parsers', () => {
  it('parses portrait json', () => {
    const parsed = parsePortraitResponse(
      JSON.stringify({
        tendencies: ['外柔内坚', '行动优先', '需要留白'],
        themes: ['稳定与突破'],
        stageTitle: '校准期',
        stageSummary: '你在上海做产品，对离职犹豫，正在对照可能性。',
        stageHints: ['记一周触发', '做一个小实验'],
      }),
    );
    expect(parsed.stageTitle).toBe('校准期');
    expect(parsed.tendencies).toHaveLength(3);
  });

  it('parses archive json with fence', () => {
    const parsed = parseArchiveResponse(
      '```json\n{"title":"跃迁","summary":"五年后你带着更大协作半径回看今天的犹豫。","work":"更复杂","lifestyle":"更快","relationships":"更广","growth":"更懂边界","tone":"锋利 · 扩展"}\n```',
    );
    expect(parsed.title).toBe('跃迁');
    expect(parsed.tone).toContain('锋利');
  });

  it('parses simulation json', () => {
    const parsed = parseSimulationResponse(
      JSON.stringify({
        question: '我要不要离职？',
        horizonLabel: '2026年8月',
        branches: [
          {
            id: 'a',
            label: '选择 A',
            title: '继续留下',
            trajectory: ['稳定积累', '技能增长缓慢', '1年后重评'],
            note: '先写清离开理由',
          },
          {
            id: 'b',
            title: '去新机会',
            trajectory: ['压力上升', '经验加速', '人脉扩展'],
            note: '设退出条件',
          },
        ],
      }),
      'fallback',
    );
    expect(parsed.horizonLabel).toBe('2026年8月');
    expect(parsed.branches).toHaveLength(2);
    expect(parsed.branches[0]?.trajectory).toHaveLength(3);
  });
});

describe('life choice simulation templates', () => {
  it('builds quit scene with three branches', () => {
    const sim = buildTemplateSimulation('我要不要离职？', sample, new Date('2026-08-01'));
    expect(sim.source).toBe('template');
    expect(sim.horizonLabel).toBe('2026年8月');
    expect(sim.branches).toHaveLength(3);
    expect(sim.branches[0]?.title).toMatch(/留下/);
    expect(sim.branches[0]?.trajectory.length).toBeGreaterThanOrEqual(2);
  });
});

describe('life forecast', () => {
  it('builds job forecast with checkBy', () => {
    const f = buildTemplateForecast(
      '猜猜我下一份工作在哪里？',
      '在看 AI 相关岗位',
      sample,
      new Date('2026-07-22'),
    );
    expect(f.source).toBe('template');
    expect(f.prediction.length).toBeGreaterThan(10);
    expect(f.rationale).toMatch(/依据/);
    expect(f.checkBy).toBe('2026-09-20');
  });

  it('parses forecast json', () => {
    const parsed = parseForecastResponse(
      JSON.stringify({
        question: '猜今天会不会有好事？',
        context: '面试后',
        prediction: '今天更可能收到一个小信号，而不是大转折。',
        rationale: '依据：短窗口应降低期望；面试后注意力会放大微事件。',
        checkBy: '2026-07-23',
      }),
      'q',
      'c',
    );
    expect(parsed.checkBy).toBe('2026-07-23');
    expect(parsed.prediction).toMatch(/小信号/);
  });

  it('computes forecast stats', () => {
    const list: LifeForecast[] = [
      {
        id: '1',
        question: 'a',
        context: '',
        prediction: 'p',
        rationale: 'r',
        checkBy: '2026-08-01',
        result: 'hit',
        reflection: '',
        source: 'template',
        createdAt: '',
      },
      {
        id: '2',
        question: 'b',
        context: '',
        prediction: 'p',
        rationale: 'r',
        checkBy: '2026-08-01',
        result: 'pending',
        reflection: '',
        source: 'template',
        createdAt: '',
      },
      {
        id: '3',
        question: 'c',
        context: '',
        prediction: 'p',
        rationale: 'r',
        checkBy: '2026-08-01',
        result: 'miss',
        reflection: '',
        source: 'ai',
        createdAt: '',
      },
    ];
    expect(forecastStats(list)).toEqual({
      total: 3,
      pending: 1,
      hit: 1,
      miss: 1,
    });
  });
});
