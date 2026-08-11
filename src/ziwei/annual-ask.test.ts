import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { formatAnnualRuleBrief, loadAnnualAskCache, saveAnnualAskCache } from './annual-ask.ts';
import { castZiweiChart } from './cast.ts';

describe('annual-ask', () => {
  it('rule brief includes mutagen and focus without job/love template', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, {
      year: 2026,
      question: '我今年适合换工作吗？',
    });
    if ('error' in view) throw new Error(view.error);
    const brief = formatAnnualRuleBrief(view, view.theater.annual);
    expect(brief).toMatch(/四化/);
    expect(brief).toMatch(/规则底稿/);
    expect(view.theater.annual.advice).not.toMatch(/适合主动试探新岗位/);
    expect(view.theater.annual.advice).toMatch(/化禄|化忌|干支|流年命宫/);
  });

  it('caches personalized answer by question', () => {
    saveAnnualAskCache('self', 2026, '换工作吗', '个性化答复');
    expect(loadAnnualAskCache('self', 2026, '换工作吗')).toBe('个性化答复');
    expect(loadAnnualAskCache('self', 2026, '别的问题')).toBeNull();
  });
});
