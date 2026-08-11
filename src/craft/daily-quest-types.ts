/**
 * 造命 · Daily_Quest 类型与常量
 * 日常 + 周常；属性周帽；XP 聚合
 */
import type { CraftAxisId } from './spirit-roots.ts';

export const DAILY_QUEST_KEY = 'mystic-lab-daily-quest-v1';
export const DAILY_QUEST_WEEK_KEY = 'mystic-lab-daily-quest-week-v1';
export const USER_XP_KEY = 'mystic-lab-user-xp-v1';

export const WEEK_ATTR_CAP = 100;
export const SWAP_XP_COST = 15;
export const MAX_SWAPS_PER_CADENCE = 2;

export const DAILY_ATTR = 10;
export const DAILY_XP = 10;
export const WEEKLY_ATTR = 30;
export const WEEKLY_XP = 20;
export const STREAK_XP_MULT = 1.5;
export const STREAK_XP_FROM_DAY = 3;

export type QuestCadence = 'daily' | 'weekly';
export type QuestStatus = 'todo' | 'doing' | 'done' | 'dismissed';

export type DailyQuest = {
  id: string;
  userId: string;
  /** 日常=当天；周常=该周周一 */
  questDate: string;
  cadence: QuestCadence;
  topic: string;
  origin: string;
  taskTitle: string;
  taskDescription: string;
  rewardType: CraftAxisId;
  rewardValue: number;
  xpValue: number;
  status: QuestStatus;
  /** 结算锁：done 后必须为 true，禁止再结算 */
  isSettled: boolean;
  source: 'template' | 'ai';
  createdAt: string;
  settledAt?: string;
  swappedFrom?: string;
};

export type WeekQuestSummary = {
  userId: string;
  weekStart: string;
  weekAttrGained: number;
  weekXpGained: number;
  /** 本周连续完成日常的天数 */
  weekDailyStreak: number;
  lastDailyDoneDate?: string;
  swapCountDaily: number;
  swapCountWeekly: number;
  /** 本周打卡写入各轴的属性（≤周帽分配后） */
  attrByAxis: Partial<Record<CraftAxisId, number>>;
};

export type UserXpAgg = {
  userId: string;
  totalXp: number;
  lastUpdated: string;
};

export type SettleResult =
  | {
      ok: true;
      already: false;
      attrApplied: number;
      overflowAttr: number;
      xpGain: number;
      xpBase: number;
      xpMult: number;
      weekAttrGained: number;
      weekXpGained: number;
      weekDailyStreak: number;
      totalXp: number;
      rewardType: CraftAxisId;
      attrCapped: boolean;
      cadence: QuestCadence;
    }
  | { ok: false; reason: 'not_found' | 'already_settled' | 'dismissed' };

/** 宫位短名 → 雷达轴 */
export const TOPIC_TO_AXIS: Readonly<Record<string, CraftAxisId>> = {
  官禄: 'guangyao',
  迁移: 'tongbian',
  财帛: 'tongbian',
  夫妻: 'wenyang',
  仆役: 'wenyang',
  交友: 'wenyang',
  兄弟: 'wenyang',
  福德: 'lingyun',
  命宫: 'lingyun',
  子女: 'lingyun',
  田宅: 'zhenshou',
  父母: 'zhenshou',
  疾厄: 'yeli',
};

export function axisForTopic(topic: string): CraftAxisId {
  const key = topic.replace(/宫$/, '');
  return TOPIC_TO_AXIS[key] ?? 'wenyang';
}

export function shortTopic(name: string): string {
  return name.replace(/宫$/, '');
}

/** 任务 topic → 命盘宫名（交友/奴仆 → 仆役） */
export function chartPalaceName(topic: string): string {
  let t = shortTopic(topic);
  if (t === '交友' || t === '奴仆') t = '仆役';
  return `${t}宫`;
}

/** 完整命盘深链，打开并选中该宫 */
export function ziweiChartPalaceHref(topic: string): string {
  return `/ziwei/reading?mode=chart&palace=${encodeURIComponent(chartPalaceName(topic))}`;
}

/** 展示用宫名（仆役对外可写交友） */
export function displayPalaceLabel(topic: string): string {
  const t = shortTopic(topic);
  if (t === '仆役') return '交友宫';
  return `${t}宫`;
}
