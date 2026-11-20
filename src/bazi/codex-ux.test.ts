import { describe, expect, it, beforeEach } from 'vitest';
import {
  getBaziCodexMarks,
  hasBaziCodexMark,
  listBaziCodexMarkedIds,
  toggleBaziCodexMark,
} from './codex-favorites.ts';
import {
  chartPresenceBrief,
  formatCodexBriefHtml,
} from './codex-presence-brief.ts';
import { findCodexInsightTip } from './codex-insight-tip.ts';
import { castBaziChart } from './cast.ts';
import { buildLuckCycles } from './luck-cycles.ts';
import { EMPTY_PROFILE } from '../life/types.ts';
import { saveBaziJournalEntry } from './journal.ts';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
});

describe('bazi codex favorites', () => {
  it('toggles fire and useful marks', () => {
    expect(toggleBaziCodexMark('寅', 'fire')).toBe(true);
    expect(hasBaziCodexMark('寅', 'fire')).toBe(true);
    expect(toggleBaziCodexMark('寅', 'useful')).toBe(true);
    expect(getBaziCodexMarks('寅').sort()).toEqual(['fire', 'useful']);
    expect(listBaziCodexMarkedIds('fire')).toContain('寅');
    expect(toggleBaziCodexMark('寅', 'fire')).toBe(false);
    expect(hasBaziCodexMark('寅', 'fire')).toBe(false);
  });
});

describe('presence brief', () => {
  it('builds natal brief when branch sits on chart', () => {
    const profile = {
      ...EMPTY_PROFILE,
      birthYear: '1990',
      birthMonth: '2',
      birthDay: '15',
      birthHour: '10:00',
    };
    const chart = castBaziChart(profile, 2026, { gender: 'male', includeLiunian: true });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const month = chart.pillars.find((p) => p.key === 'month');
    expect(month?.branch).toBeTruthy();
    const brief = chartPresenceBrief(month!.branch, chart, buildLuckCycles(profile, 'male', 2026));
    expect(brief).toMatch(/^【你的原局】\n/);
    expect(brief).toMatch(/月支见|地支/);
    expect(brief).toMatch(/\n/);
  });

  it('天干「在你身上」分行且写清落柱与对日主关系', () => {
    const profile = {
      ...EMPTY_PROFILE,
      birthYear: '1990',
      birthMonth: '2',
      birthDay: '15',
      birthHour: '10:00',
    };
    const chart = castBaziChart(profile, 2026, { gender: 'male', includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const yearStem = chart.pillars.find((p) => p.key === 'year')?.stem;
    expect(yearStem).toBeTruthy();
    const brief = chartPresenceBrief(yearStem!, chart, null);
    expect(brief).toMatch(/^【你的原局】\n/);
    expect(brief).toMatch(/年柱见|出现在年|相对日主|此即日主/);
    expect(brief.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  it('十神「在你身上」分行且带具体落柱含义', () => {
    const profile = {
      ...EMPTY_PROFILE,
      birthYear: '1990',
      birthMonth: '2',
      birthDay: '15',
      birthHour: '10:00',
    };
    const chart = castBaziChart(profile, 2026, { gender: 'male', includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    // 此盘年干庚为劫财
    expect(chart.pillars.find((p) => p.key === 'year')?.stemGod).toBe('劫财');
    const brief = chartPresenceBrief('tg:劫财', chart, null);
    expect(brief).toMatch(/^【你的原局】\n/);
    expect(brief).toMatch(/年柱见劫财：/);
    expect(brief).toMatch(/\n/);
    expect(brief).toMatch(/争夺|拆借|分走|边界/);
    expect(brief).not.toMatch(/过旺为压、有制为用/);
    expect(brief).not.toMatch(/职业底色与社会角色/);
  });

  it('神煞「在你身上」用落柱释义，不落空兜底句', () => {
    const profile = {
      ...EMPTY_PROFILE,
      birthYear: '1990',
      birthMonth: '2',
      birthDay: '15',
      birthHour: '10:00',
    };
    const chart = castBaziChart(profile, 2026, { gender: 'male', includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const hit = chart.pillars.find((p) => p.shensha?.includes('天乙贵人'));
    expect(hit).toBeTruthy();
    const brief = chartPresenceBrief('ss:天乙贵人', chart, null);
    expect(brief).toMatch(/^【你的原局】\n/);
    expect(brief).toMatch(/年柱见天乙|月柱见天乙|日柱见天乙|时柱见天乙/);
    expect(brief).toMatch(/天乙|贵人|助力|扶持|解救/);
    expect(brief).not.toMatch(/不作单一定论/);
  });
});

describe('formatCodexBriefHtml', () => {
  it('把落柱小标题标成金色类名', () => {
    const html = formatCodexBriefHtml(
      '【你的原局】\n月柱见正财：做事与收入底色偏正职。\n正财稳，但过稳会怕变。',
    );
    expect(html).toContain('bazi-enc-presence-lead');
    expect(html).toContain('bazi-enc-presence-k');
    expect(html).toMatch(/月柱见正财：/);
    expect(html).toContain('bazi-enc-presence-v');
    expect(html).toContain('bazi-enc-presence-note');
  });
});

describe('insight tip', () => {
  it('matches journal mention of entry title', () => {
    saveBaziJournalEntry({ body: '今天觉得自己像顺藤攀缘的藤花', reflection: '' });
    const tip = findCodexInsightTip('卯');
    expect(tip?.text).toMatch(/卯|藤|手札/);
  });

  it('hard-binds reality insight to day master entry', () => {
    const profile = {
      ...EMPTY_PROFILE,
      birthYear: '1990',
      birthMonth: '2',
      birthDay: '15',
      birthHour: '10:00',
    };
    const chart = castBaziChart(profile, 2026, { gender: 'male', includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const tip = findCodexInsightTip(chart.dayMaster, chart);
    expect(tip?.source).toBe('reality');
    expect(tip?.text).toMatch(/现实感悟/);
    expect(tip?.text).toContain(chart.dayMaster);
  });
});
