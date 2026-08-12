/**
 * Daily_Quest 结算：属性周帽、溢出 1:1→XP、done 锁、同步 craft XP + user XP
 */
import { checkKey, deductXp, loadCraftXp, markChecked } from './xp.ts';
import {
  DAILY_ATTR,
  DAILY_XP,
  STREAK_XP_FROM_DAY,
  STREAK_XP_MULT,
  WEEK_ATTR_CAP,
  WEEKLY_ATTR,
  WEEKLY_XP,
  type DailyQuest,
  type SettleResult,
} from './daily-quest-types.ts';
import {
  getQuestById,
  loadUserXp,
  pruneWeekData,
  saveAllQuests,
  saveUserXp,
  saveWeekSummary,
  toYmd,
  upsertQuest,
  weekStartMonday,
} from './daily-quest-store.ts';

function baseRewards(q: DailyQuest): { attr: number; xp: number } {
  if (q.cadence === 'weekly') {
    return { attr: q.rewardValue || WEEKLY_ATTR, xp: q.xpValue || WEEKLY_XP };
  }
  return { attr: q.rewardValue || DAILY_ATTR, xp: q.xpValue || DAILY_XP };
}

/** 打开清单 / 点「去做」→ 进行中 */
export function markQuestDoing(questId: string): boolean {
  const q = getQuestById(questId);
  if (!q || q.isSettled || q.status === 'done' || q.status === 'dismissed') {
    return false;
  }
  if (q.status === 'doing') return true;
  upsertQuest({ ...q, status: 'doing' });
  return true;
}

/**
 * 原子结算：任务行 + 周汇总 + user XP + craft XP。
 * status=done / isSettled 时绝对不再加分。
 */
export function settleQuest(questId: string, now = new Date()): SettleResult {
  const quest = getQuestById(questId);
  if (!quest) return { ok: false, reason: 'not_found' };
  if (quest.status === 'dismissed') return { ok: false, reason: 'dismissed' };
  if (quest.status === 'done' || quest.isSettled) {
    return { ok: false, reason: 'already_settled' };
  }

  const week = pruneWeekData(quest.userId, now);
  const { attr: baseAttr, xp: baseXp0 } = baseRewards(quest);
  let baseXp = baseXp0;
  let xpMult = 1;

  if (quest.cadence === 'daily') {
    const today = toYmd(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const ymdY = toYmd(yesterday);
    let streak = week.weekDailyStreak;
    if (week.lastDailyDoneDate === today) {
      /* 同日不应有第二条日常，streak 不动 */
    } else if (week.lastDailyDoneDate === ymdY) {
      streak += 1;
    } else {
      streak = 1;
    }
    week.weekDailyStreak = streak;
    week.lastDailyDoneDate = today;
    if (streak >= STREAK_XP_FROM_DAY) {
      xpMult = STREAK_XP_MULT;
      baseXp = Math.floor(baseXp0 * STREAK_XP_MULT);
    }
  }

  const room = Math.max(0, WEEK_ATTR_CAP - week.weekAttrGained);
  const attrApplied = Math.min(baseAttr, room);
  const overflowAttr = baseAttr - attrApplied;
  const xpGain = baseXp + overflowAttr;

  week.weekAttrGained = Math.min(WEEK_ATTR_CAP, week.weekAttrGained + attrApplied);
  week.weekXpGained += xpGain;
  if (attrApplied > 0) {
    const prev = week.attrByAxis[quest.rewardType] ?? 0;
    week.attrByAxis = {
      ...week.attrByAxis,
      [quest.rewardType]: prev + attrApplied,
    };
  }

  const settled: DailyQuest = {
    ...quest,
    status: 'done',
    isSettled: true,
    settledAt: now.toISOString(),
  };

  // craft XP 去重键
  const ws = weekStartMonday(now);
  const craft = loadCraftXp();
  const ck = checkKey(ws, settled.id);
  if (!craft.checked.includes(ck)) {
    markChecked(ws, settled.id, xpGain);
  }

  const userXp = loadUserXp(quest.userId);
  const craftAfter = loadCraftXp();
  userXp.totalXp = craftAfter.xp;
  userXp.lastUpdated = toYmd(now);

  upsertQuest(settled);
  saveWeekSummary(week);
  saveUserXp(userXp);

  return {
    ok: true,
    already: false,
    attrApplied,
    overflowAttr,
    xpGain,
    xpBase: baseXp0,
    xpMult,
    weekAttrGained: week.weekAttrGained,
    weekXpGained: week.weekXpGained,
    weekDailyStreak: week.weekDailyStreak,
    totalXp: userXp.totalXp,
    rewardType: quest.rewardType,
    attrCapped: week.weekAttrGained >= WEEK_ATTR_CAP,
    cadence: quest.cadence,
  };
}

/** 换任务扣 XP；不足返回 false */
export function spendXpForSwap(userId: string, cost: number): boolean {
  const res = deductXp(cost);
  if (!res.ok) return false;
  saveUserXp({
    userId,
    totalXp: res.state.xp,
    lastUpdated: toYmd(),
  });
  return true;
}

export function dismissQuest(questId: string): boolean {
  const q = getQuestById(questId);
  if (!q || q.isSettled || q.status === 'done') return false;
  upsertQuest({ ...q, status: 'dismissed' });
  return true;
}

/** 测试/调试：直接写入一批任务 */
export function replaceAllQuestsForTest(quests: DailyQuest[]): void {
  saveAllQuests(quests);
}

export function clearQuestTablesForTest(): void {
  localStorage.removeItem('mystic-lab-daily-quest-v1');
  localStorage.removeItem('mystic-lab-daily-quest-week-v1');
  localStorage.removeItem('mystic-lab-user-xp-v1');
}
