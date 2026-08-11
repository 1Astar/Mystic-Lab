import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';
import {
  __resetBaziLearnForTest,
  collectKnowledge,
  loadBaziLearn,
  markGuessAnswer,
  markLearnInteraction,
  markWhyExpanded,
  resolveBaziLearnTitle,
} from './learn-store.ts';
import { buildLearnTreeView } from './learn-tree.ts';
import {
  buildLearnAchievements,
  countUnlockedAchievements,
  isAchievementUnlocked,
} from './learn-achievements.ts';
import { GUESS_CARDS, pickDailyGuessCard } from './guess-pack.ts';
import { buildYearForecast } from './sense-forecast.ts';
import { buildIfScenarios } from './sense-if.ts';
import {
  buildEnergyWhy,
  buildInsightWhy,
  buildSeasonWhy,
  buildYijiWhy,
} from './learn-why.ts';

const profile = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

const mem = new Map<string, string>();

function stubLearnStorage(): void {
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
  __resetBaziLearnForTest();
}

describe('bazi learn store', () => {
  beforeEach(() => {
    stubLearnStorage();
  });

  it('收集知识点升级称号门槛', () => {
    expect(resolveBaziLearnTitle().id).toBe('chugui');
    for (let i = 0; i < 5; i++) {
      collectKnowledge(`why:test:${i}`);
    }
    expect(loadBaziLearn().knowledgeIds).toHaveLength(5);
    expect(resolveBaziLearnTitle().id).toBe('chugui');
    markLearnInteraction('lever:energy');
    expect(resolveBaziLearnTitle().id).toBe('zhiming');
    collectKnowledge('why:test:0');
    expect(loadBaziLearn().knowledgeIds).toHaveLength(5);
  });

  it('展开 why 只加一次 XP', () => {
    const a = markWhyExpanded('why:season');
    expect(a.gained).toBe(5);
    const b = markWhyExpanded('why:season');
    expect(b.already).toBe(true);
    expect(b.gained).toBe(0);
  });
});

describe('bazi learn tree', () => {
  beforeEach(() => {
    stubLearnStorage();
  });

  it('汇总门槛与知识点目录', () => {
    const view = buildLearnTreeView();
    expect(view.gates).toHaveLength(3);
    expect(view.title.id).toBe('chugui');
    expect(view.knowledgeRows.length).toBeGreaterThanOrEqual(8);
    expect(view.nextHint).toMatch(/知命不惑/);
  });

  it('每条门槛含怎么升与跳转', () => {
    const view = buildLearnTreeView();
    for (const g of view.gates) {
      expect(g.howto.length).toBeGreaterThan(8);
      for (const c of g.checks) {
        expect(c.howto.length).toBeGreaterThan(8);
        expect(c.action?.path).toMatch(/^\/bazi/);
      }
    }
    const tuiyan = view.gates.find((g) => g.id === 'tuiyan');
    expect(tuiyan?.checks.map((c) => c.action?.path)).toEqual([
      '/bazi/guess',
      '/bazi/week',
      '/bazi/reading',
    ]);
  });
});

describe('bazi learn achievements', () => {
  beforeEach(() => {
    stubLearnStorage();
  });

  it('默认只亮初窥之印', () => {
    const list = buildLearnAchievements();
    expect(list.length).toBeGreaterThanOrEqual(10);
    expect(isAchievementUnlocked('chugui_seal')).toBe(true);
    expect(isAchievementUnlocked('why_first')).toBe(false);
    expect(countUnlockedAchievements().unlocked).toBe(1);
  });

  it('行为点亮对应徽章', () => {
    collectKnowledge('why:season');
    expect(isAchievementUnlocked('why_first')).toBe(true);
    markLearnInteraction('lever:energy');
    expect(isAchievementUnlocked('lever')).toBe(true);
    markLearnInteraction('shuttle:year');
    expect(isAchievementUnlocked('shuttle')).toBe(true);
    markGuessAnswer('guess:ach-1', true);
    expect(isAchievementUnlocked('guess_one')).toBe(true);
  });
});

describe('bazi guess pack', () => {
  beforeEach(() => {
    stubLearnStorage();
  });

  it('每日抽题稳定且选项合法', () => {
    expect(GUESS_CARDS.length).toBeGreaterThanOrEqual(5);
    const a = pickDailyGuessCard('2026-08-11');
    const b = pickDailyGuessCard('2026-08-11');
    expect(a.id).toBe(b.id);
    expect(a.options.some((o) => o.id === a.answerId)).toBe(true);
  });

  it('答对累计 guessWins', () => {
    const r1 = markGuessAnswer('guess:2026-08-11', true);
    expect(r1.gained).toBe(15);
    expect(loadBaziLearn().guessWins).toBe(1);
    const r2 = markGuessAnswer('guess:2026-08-11', true);
    expect(r2.already).toBe(true);
    markGuessAnswer('guess:2026-08-12', true);
    markGuessAnswer('guess:2026-08-13', true);
    for (let i = 0; i < 5; i++) collectKnowledge(`why:g:${i}`);
    markLearnInteraction('if:forecast');
    expect(resolveBaziLearnTitle().id).toBe('tuiyan');
  });
});

describe('bazi if scenarios', () => {
  it('生成如果剧本', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: true });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const forecast = buildYearForecast(chart, profile, { year: 2026 });
    const list = buildIfScenarios(chart, forecast);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.length).toBeLessThanOrEqual(3);
    for (const s of list) {
      expect(s.question).toMatch(/如果/);
      expect(s.outcome.length).toBeGreaterThan(12);
      expect(s.logic.length).toBeGreaterThan(8);
    }
  });
});

describe('bazi learn why', () => {
  it('生成可收集的理由文案', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const items = [
      buildInsightWhy(chart),
      buildSeasonWhy(chart),
      buildEnergyWhy(chart),
      buildYijiWhy(chart),
    ];
    for (const it of items) {
      expect(it.id.startsWith('why:')).toBe(true);
      expect(it.body.length).toBeGreaterThan(20);
      expect(it.body).not.toMatch(/日主/);
    }
  });
});
