import { describe, expect, it } from 'vitest';
import {
  buildEngineFactsBlock,
  buildOfflineNarrate,
  buildRectifyNarratePrompt,
  cacheKeyForNarrate,
} from './rectify-personalize.ts';
import type { RankedHourCandidate } from './rectify-score.ts';
import type { RectifyEvent } from './rectify-events.ts';

const events: RectifyEvent[] = [
  {
    id: 'e1',
    year: 2020,
    type: 'job_in',
    note: '入职',
    yearSlack: 0,
    precision: 'ymd',
  },
  {
    id: 'e2',
    year: 2022,
    type: 'move',
    note: '搬家',
    yearSlack: 1,
    precision: 'year',
  },
];

const ranked: RankedHourCandidate[] = [
  {
    candidate: {
      branch: '戌',
      midHour: 20,
      birthHour: '20:00',
      label: '戌时（约19–21点）',
      hourPillar: '甲戌',
      dayMaster: '甲',
    },
    score: 3000,
    confidencePct: 78,
    confidenceLabel: '较高',
    rationale: '对照',
    summary: '戌时能较好解释 2020入职、2022搬家',
    hits: [
      {
        event: events[0]!,
        kind: 'hit',
        year: 2020,
        ganZhi: '庚子',
        stemGod: '偏财',
        reason: '合',
        points: 10,
      },
    ],
    misses: [
      {
        event: events[1]!,
        kind: 'miss',
        year: 2022,
        ganZhi: '',
        stemGod: '',
        reason: '弱',
        points: 1,
      },
    ],
    weaks: [],
    supportReasons: ['支持'],
    tieGroup: 0,
  },
  {
    candidate: {
      branch: '酉',
      midHour: 18,
      birthHour: '18:00',
      label: '酉时（约17–19点）',
      hourPillar: '癸酉',
      dayMaster: '甲',
    },
    score: 2000,
    confidencePct: 61,
    confidenceLabel: '中等',
    rationale: '对照',
    summary: '酉时对职业变化对应较弱',
    hits: [],
    misses: [],
    weaks: [],
    supportReasons: [],
    tieGroup: 1,
  },
];

describe('rectify-personalize', () => {
  it('prompt locks engine top hour and forbids rewriting rank', () => {
    const { system, user } = buildRectifyNarratePrompt({
      personName: '自己',
      birthBrief: '2005-12-23',
      events,
      ranked,
    });
    expect(system).toMatch(/改写引擎名次/);
    expect(system).toMatch(/戌时/);
    expect(user).toMatch(/78%/);
    expect(user).toMatch(/引擎排名/);
  });

  it('offline narrate keeps provisional tone', () => {
    const text = buildOfflineNarrate({
      personName: '自己',
      birthBrief: 'x',
      events,
      ranked,
    });
    expect(text).toMatch(/暂定/);
    expect(text).toMatch(/戌时/);
    expect(text).toMatch(/不是绝对答案/);
  });

  it('facts block includes hits and misses', () => {
    const block = buildEngineFactsBlock({
      personName: '自己',
      birthBrief: 'x',
      events,
      ranked,
    });
    expect(block).toMatch(/命中/);
    expect(block).toMatch(/未命中/);
  });

  it('cache key stable for same engine snapshot', () => {
    const a = cacheKeyForNarrate({
      personName: '自己',
      birthBrief: 'x',
      events,
      ranked,
    });
    const b = cacheKeyForNarrate({
      personName: '自己',
      birthBrief: 'x',
      events,
      ranked,
    });
    expect(a).toBe(b);
  });
});
