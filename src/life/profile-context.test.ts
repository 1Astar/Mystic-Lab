import { describe, expect, it } from 'vitest';
import {
  formatProfileBrief,
  formatProfileReadingContext,
  mergeReadingBackground,
} from './profile-context.ts';
import { createSelfPerson, type LifeProfileInput } from './types.ts';

const sample: LifeProfileInput = {
  age: '29',
  occupation: '产品经理',
  city: '上海',
  birthYear: '1996',
  birthMonth: '8',
  birthDay: '12',
  birthHour: '',
  birthPlace: '',
  confusion: '要不要离职',
};

describe('lab profile context', () => {
  it('formats brief and reading context', () => {
    expect(formatProfileBrief(sample)).toBe('29岁 · 产品经理 · 上海');
    const person = createSelfPerson(sample);
    const ctx = formatProfileReadingContext(
      sample,
      {
        tendencies: ['a', 'b'],
        themes: ['稳定与突破'],
        stageTitle: '承重与重配期',
        stageSummary: 'x',
        stageHints: ['y'],
        source: 'template',
        generatedAt: '',
      },
      person,
    );
    expect(ctx).toMatch(/所问对象：自己/);
    expect(ctx).toMatch(/现状：29岁/);
    expect(ctx).toMatch(/当前困惑：要不要离职/);
    expect(ctx).toMatch(/承重与重配期/);
  });

  it('merges manual background with profile', () => {
    const person = createSelfPerson(sample);
    const merged = mergeReadingBackground('刚面了两家', true, {
      profile: sample,
      person,
      ready: true,
      brief: '29岁 · 产品经理 · 上海',
      readingContext: formatProfileReadingContext(sample, undefined, person),
      displayName: '自己',
    });
    expect(merged).toMatch(/刚面了两家/);
    expect(merged).toMatch(/档案 · 自己/);
    expect(merged).toMatch(/产品经理/);
  });
});
