import { describe, expect, it } from 'vitest';
import { EMPTY_PERSONAL_CONTEXT } from '../liuyao/personal-context.ts';
import { EMPTY_PROFILE, type PersonProfile } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import { buildBaziDeepPrompt, buildBaziFollowupPresets, buildBaziFollowupSystemPrompt } from './deep-prompt.ts';
import { buildLuckCycles } from './luck-cycles.ts';

const PROFILE = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

const PERSON: PersonProfile = {
  ...PROFILE,
  id: 'self',
  nickname: '测试',
  gender: 'female',
  relation: 'self',
  lifeTags: [],
};

describe('buildBaziDeepPrompt', () => {
  it('includes pillars, strength, luck, and soft tone rules', () => {
    const chart = castBaziChart(PROFILE, 2026, {
      includeLiunian: false,
      gender: 'female',
    });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const luck = buildLuckCycles(PROFILE, 'female', 2026);
    const { system, user } = buildBaziDeepPrompt({
      chart,
      person: PERSON,
      question: '今年适合换工作吗？',
      ctx: EMPTY_PERSONAL_CONTEXT,
      luck,
      headline: '测试定调',
    });
    expect(system).toMatch(/日主/);
    expect(system).toMatch(/四柱/);
    expect(system).toMatch(/大运|流年/);
    expect(system).toMatch(/测试定调/);
    expect(system).toMatch(/禁止绝对吉凶|缺什么/);
    expect(user).toMatch(/换工作/);
    expect(user).toMatch(/暂未补充/);
  });

  it('folds personal context into user message', () => {
    const chart = castBaziChart(PROFILE, 2026, { includeLiunian: false });
    if ('error' in chart) return;
    const { user } = buildBaziDeepPrompt({
      chart,
      person: PERSON,
      question: '感情',
      ctx: {
        experience: '刚分手',
        goal: '想稳住自己',
        events: '',
        worry: '怕再陷进去',
      },
    });
    expect(user).toMatch(/刚分手|稳住|怕再陷/);
  });

  it('buildBaziFollowupSystemPrompt stays soft and short-form', () => {
    const chart = castBaziChart(PROFILE, 2026, {
      includeLiunian: false,
      gender: 'female',
    });
    if ('error' in chart) return;
    const system = buildBaziFollowupSystemPrompt({
      chart,
      person: PERSON,
      question: '今年适合换工作吗？',
      deepReading: '这是一篇深度解读正文。',
    });
    expect(system).toMatch(/150–280|追问/);
    expect(system).toMatch(/禁止绝对吉凶|缺什么/);
    expect(system).toMatch(/深度解读正文/);
    const presets = buildBaziFollowupPresets({
      chart,
      question: '今年适合换工作吗？',
    });
    expect(presets.length).toBeGreaterThanOrEqual(2);
    expect(presets.join('')).toMatch(/工作|喜用/);
  });
});
