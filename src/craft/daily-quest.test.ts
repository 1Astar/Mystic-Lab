import { beforeEach, describe, expect, it } from 'vitest';
import {
  WEEK_ATTR_CAP,
  type DailyQuest,
} from './daily-quest-types.ts';
import {
  pruneWeekData,
  saveWeekSummary,
  loadWeekSummary,
  weekStartMonday,
  toYmd,
  upsertQuest,
  loadUserXp,
} from './daily-quest-store.ts';
import { settleQuest, clearQuestTablesForTest } from './daily-quest-settle.ts';
import { emptyCraftXp, loadCraftXp } from './xp.ts';

function installLocalStorage() {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

function makeQuest(partial: Partial<DailyQuest> & Pick<DailyQuest, 'id' | 'cadence'>): DailyQuest {
  return {
    userId: 'u1',
    questDate: toYmd(),
    topic: '仆役',
    origin: '仆役宫见红鸾',
    taskTitle: '认识新朋友',
    taskDescription: '今天去认识一位新朋友。',
    rewardType: 'wenyang',
    rewardValue: partial.cadence === 'weekly' ? 30 : 10,
    xpValue: partial.cadence === 'weekly' ? 20 : 10,
    status: 'todo',
    isSettled: false,
    source: 'template',
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe('daily-quest settle', () => {
  beforeEach(() => {
    installLocalStorage();
    clearQuestTablesForTest();
    localStorage.setItem('mystic-lab-craft-xp-v1', JSON.stringify(emptyCraftXp()));
  });

  it('pruneWeekData resets attr when weekStart mismatches', () => {
    const oldStart = '2020-01-06';
    saveWeekSummary({
      userId: 'u1',
      weekStart: oldStart,
      weekAttrGained: 90,
      weekXpGained: 50,
      weekDailyStreak: 4,
      swapCountDaily: 1,
      swapCountWeekly: 0,
      attrByAxis: { wenyang: 90 },
    });
    const week = pruneWeekData('u1', new Date());
    expect(week.weekStart).toBe(weekStartMonday());
    expect(week.weekAttrGained).toBe(0);
    expect(week.weekDailyStreak).toBe(0);
  });

  it('settles once then blocks double settle', () => {
    const q = makeQuest({ id: 'dq-1', cadence: 'daily' });
    upsertQuest(q);
    const a = settleQuest('dq-1');
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.attrApplied).toBe(10);
    expect(a.xpGain).toBe(10);
    expect(loadUserXp('u1').totalXp).toBe(loadCraftXp().xp);

    const b = settleQuest('dq-1');
    expect(b.ok).toBe(false);
    if (b.ok) return;
    expect(b.reason).toBe('already_settled');
  });

  it('caps weekly attr at 100 and overflows to xp 1:1', () => {
    saveWeekSummary({
      userId: 'u1',
      weekStart: weekStartMonday(),
      weekAttrGained: 95,
      weekXpGained: 0,
      weekDailyStreak: 0,
      swapCountDaily: 0,
      swapCountWeekly: 0,
      attrByAxis: {},
    });
    const q = makeQuest({
      id: 'dq-w',
      cadence: 'weekly',
      questDate: weekStartMonday(),
      rewardValue: 30,
      xpValue: 20,
    });
    upsertQuest(q);
    const res = settleQuest('dq-w');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.attrApplied).toBe(5);
    expect(res.overflowAttr).toBe(25);
    expect(res.xpGain).toBe(20 + 25);
    expect(res.weekAttrGained).toBe(WEEK_ATTR_CAP);
    expect(loadWeekSummary('u1').attrByAxis.wenyang).toBe(5);
  });
});

describe('palace href + reaccept', () => {
  beforeEach(() => {
    installLocalStorage();
    clearQuestTablesForTest();
  });

  it('maps 交友 topic to 仆役宫 chart href', async () => {
    const { chartPalaceName, ziweiChartPalaceHref, displayPalaceLabel } = await import(
      './daily-quest-types.ts'
    );
    expect(chartPalaceName('交友')).toBe('仆役宫');
    expect(displayPalaceLabel('仆役')).toBe('交友宫');
    const href = ziweiChartPalaceHref('仆役');
    expect(href.startsWith('/ziwei/reading?mode=chart&palace=')).toBe(true);
    expect(decodeURIComponent(href.split('palace=')[1]!)).toBe('仆役宫');
  });
});
