/**
 * Daily_Quest 存储 · pruneWeekData · user XP 聚合
 */
import {
  DAILY_QUEST_KEY,
  DAILY_QUEST_WEEK_KEY,
  USER_XP_KEY,
  type DailyQuest,
  type UserXpAgg,
  type WeekQuestSummary,
} from './daily-quest-types.ts';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYmd(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 本周周一（本地日历）YYYY-MM-DD */
export function weekStartMonday(d = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay() || 7;
  x.setDate(x.getDate() - (day - 1));
  return toYmd(x);
}

function weekMapKey(userId: string, weekStart: string): string {
  return `${userId}:${weekStart}`;
}

function emptyWeek(userId: string, weekStart: string): WeekQuestSummary {
  return {
    userId,
    weekStart,
    weekAttrGained: 0,
    weekXpGained: 0,
    weekDailyStreak: 0,
    swapCountDaily: 0,
    swapCountWeekly: 0,
    attrByAxis: {},
  };
}

export function loadAllQuests(): DailyQuest[] {
  try {
    const raw = localStorage.getItem(DAILY_QUEST_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as { quests?: DailyQuest[] } | DailyQuest[];
    const list = Array.isArray(p) ? p : Array.isArray(p.quests) ? p.quests : [];
    return list.filter((q) => q && typeof q.id === 'string');
  } catch {
    return [];
  }
}

export function saveAllQuests(quests: DailyQuest[]): void {
  localStorage.setItem(DAILY_QUEST_KEY, JSON.stringify({ quests: quests.slice(-400) }));
}

function loadWeekBag(): Record<string, WeekQuestSummary> {
  try {
    const raw = localStorage.getItem(DAILY_QUEST_WEEK_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, WeekQuestSummary>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function saveWeekBag(map: Record<string, WeekQuestSummary>): void {
  localStorage.setItem(DAILY_QUEST_WEEK_KEY, JSON.stringify(map));
}

export function loadWeekSummary(userId: string, weekStart?: string): WeekQuestSummary {
  const ws = weekStart ?? weekStartMonday();
  const map = loadWeekBag();
  return map[weekMapKey(userId, ws)] ?? emptyWeek(userId, ws);
}

export function saveWeekSummary(summary: WeekQuestSummary): void {
  const map = loadWeekBag();
  map[weekMapKey(summary.userId, summary.weekStart)] = summary;
  saveWeekBag(map);
}

function loadUserXpMap(): Record<string, UserXpAgg> {
  try {
    const raw = localStorage.getItem(USER_XP_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, UserXpAgg> | UserXpAgg;
    if (p && typeof p === 'object' && 'userId' in p && 'totalXp' in p) {
      const one = p as UserXpAgg;
      return { [one.userId]: one };
    }
    return (p as Record<string, UserXpAgg>) ?? {};
  } catch {
    return {};
  }
}

function saveUserXpMap(map: Record<string, UserXpAgg>): void {
  localStorage.setItem(USER_XP_KEY, JSON.stringify(map));
}

export function loadUserXp(userId: string): UserXpAgg {
  const map = loadUserXpMap();
  return (
    map[userId] ?? {
      userId,
      totalXp: 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }
  );
}

export function saveUserXp(agg: UserXpAgg): void {
  const map = loadUserXpMap();
  map[agg.userId] = agg;
  saveUserXpMap(map);
}

/**
 * 生成任务前必跑：跨周则清零周属性/连续/换次。
 * 不把跨周判断散落在别处。
 */
export function pruneWeekData(userId: string, now = new Date()): WeekQuestSummary {
  const currentStart = weekStartMonday(now);
  const map = loadWeekBag();
  const key = weekMapKey(userId, currentStart);
  let week = map[key];

  // 找该用户任意旧周记录（若当前周还没有）
  if (!week) {
    const oldKeys = Object.keys(map).filter((k) => k.startsWith(`${userId}:`));
    const stale = oldKeys
      .map((k) => map[k]!)
      .filter((w) => w.weekStart !== currentStart)
      .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))[0];

    if (stale && stale.weekStart !== currentStart) {
      week = emptyWeek(userId, currentStart);
      // 跨周：属性与连续重置；周一开周时 streak 从 0 起，首日打卡再 +1
      week.weekAttrGained = 0;
      week.weekDailyStreak = 0;
      map[key] = week;
      saveWeekBag(map);
      return week;
    }

    week = emptyWeek(userId, currentStart);
    map[key] = week;
    saveWeekBag(map);
    return week;
  }

  if (week.weekStart !== currentStart) {
    week = emptyWeek(userId, currentStart);
    map[key] = week;
    saveWeekBag(map);
  }
  return week;
}

export function getQuestById(id: string): DailyQuest | undefined {
  return loadAllQuests().find((q) => q.id === id);
}

export function upsertQuest(quest: DailyQuest): void {
  const all = loadAllQuests();
  const i = all.findIndex((q) => q.id === quest.id);
  if (i >= 0) all[i] = quest;
  else all.push(quest);
  saveAllQuests(all);
}

export function listActiveQuests(
  userId: string,
  opts: { cadence?: DailyQuest['cadence']; questDate?: string; weekStart?: string },
): DailyQuest[] {
  const all = loadAllQuests().filter((q) => q.userId === userId);
  return all.filter((q) => {
    if (opts.cadence && q.cadence !== opts.cadence) return false;
    if (q.status === 'dismissed') return false;
    if (opts.questDate && q.questDate !== opts.questDate) return false;
    if (opts.weekStart && q.cadence === 'weekly' && q.questDate !== opts.weekStart) {
      return false;
    }
    if (opts.weekStart && q.cadence === 'daily') {
      // 本周日常：questDate >= weekStart
      if (q.questDate < opts.weekStart) return false;
    }
    return true;
  });
}

/** 本周已完成且贡献某轴的任务 */
export function listSettledQuestsForAxis(
  userId: string,
  axis: string,
  weekStart = weekStartMonday(),
): DailyQuest[] {
  return loadAllQuests().filter(
    (q) =>
      q.userId === userId &&
      q.isSettled &&
      q.status === 'done' &&
      q.rewardType === axis &&
      (q.cadence === 'weekly'
        ? q.questDate === weekStart
        : q.questDate >= weekStart),
  );
}

/** 最近几周做过的 topic（含 dismissed/done），供 CD */
export function recentTopics(userId: string, weekCount = 3): string[] {
  const starts: string[] = [];
  const d = new Date();
  for (let i = 0; i < weekCount; i++) {
    const x = new Date(d);
    x.setDate(x.getDate() - i * 7);
    starts.push(weekStartMonday(x));
  }
  const minStart = starts[starts.length - 1]!;
  const topics = new Set<string>();
  for (const q of loadAllQuests()) {
    if (q.userId !== userId) continue;
    if (q.status === 'todo' && !q.isSettled) continue;
    const ws = q.cadence === 'weekly' ? q.questDate : weekStartMonday(new Date(q.questDate));
    if (ws < minStart) continue;
    if (q.topic) topics.add(q.topic.replace(/宫$/, ''));
  }
  // 上周总结里也可记 last — 用任务表即可
  return [...topics];
}

export function lastWeekTopics(userId: string, now = new Date()): string[] {
  const thisStart = weekStartMonday(now);
  const prev = new Date(now);
  prev.setDate(prev.getDate() - 7);
  const prevStart = weekStartMonday(prev);
  return loadAllQuests()
    .filter((q) => {
      if (q.userId !== userId) return false;
      if (q.status === 'dismissed' && !q.isSettled) {
        /* 换掉的也占 CD */
      }
      const ws = q.cadence === 'weekly' ? q.questDate : weekStartMonday(new Date(q.questDate + 'T12:00:00'));
      return ws === prevStart || (ws < thisStart && ws >= prevStart);
    })
    .map((q) => q.topic.replace(/宫$/, ''));
}
