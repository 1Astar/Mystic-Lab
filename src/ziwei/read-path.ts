/**
 * 紫微读盘路径（薄引导）：本周只啃一宫 + 先命再财短链。
 * 不是知识树，只给「这一周先看哪」的系统感。
 */
import { weekStartMonday } from '../craft/daily-quest-store.ts';
import { getPalaceLore } from './palace-lore.ts';
import type { ZiweiChartView } from './types.ts';

/** 入门短链：先立「我」，再资源，再事业，再亲密 */
export const READ_PATH_TRAIL_IDS = ['命宫', '财帛', '官禄', '夫妻'] as const;

/** 本周可轮换的「只啃一宫」池 */
const WEEKLY_FOCUS_POOL = [
  '命宫',
  '财帛',
  '官禄',
  '夫妻',
  '福德',
  '迁移',
  '疾厄',
  '子女',
] as const;

export type ReadPathStep = {
  palaceId: string;
  title: string;
  hint: string;
};

export type ZiweiReadPath = {
  weekStart: string;
  /** 本周只啃这一宫 */
  focus: ReadPathStep;
  /** 先命 → 再财 → … */
  trail: ReadPathStep[];
  /** 焦点在短链中的步序（1-based）；不在短链则为 null */
  trailStep: number | null;
  lead: string;
};

function palaceKey(name: string): string {
  return name.replace(/宫$/, '').trim();
}

function stepOf(id: string): ReadPathStep {
  const lore = getPalaceLore(id) ?? getPalaceLore(palaceKey(id));
  const palaceId = lore?.id ?? id;
  return {
    palaceId,
    title: lore?.title ?? id,
    hint: lore?.hint ?? '',
  };
}

function weekIndex(weekStart: string): number {
  const n = Number(weekStart.replace(/-/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function resolveLoreId(raw: string): string {
  const key = palaceKey(raw);
  return getPalaceLore(raw)?.id ?? getPalaceLore(key)?.id ?? getPalaceLore(`${key}宫`)?.id ?? key;
}

/**
 * 优先：流年焦点宫若在池内，本周就啃它；
 * 否则按周轮换。
 */
export function resolveZiweiReadPath(
  view: ZiweiChartView | null | undefined,
  now = new Date(),
): ZiweiReadPath {
  const weekStart = weekStartMonday(now);
  let focusId: string = WEEKLY_FOCUS_POOL[weekIndex(weekStart) % WEEKLY_FOCUS_POOL.length]!;

  const annualFocus = view?.theater?.annual?.focusPalaces ?? [];
  for (const raw of annualFocus) {
    const key = palaceKey(raw);
    const hit = WEEKLY_FOCUS_POOL.find((p) => palaceKey(p) === key);
    if (hit) {
      focusId = hit;
      break;
    }
  }

  const focus = stepOf(resolveLoreId(focusId));
  const trail = READ_PATH_TRAIL_IDS.map((id) => stepOf(id));
  const trailIdx = trail.findIndex((s) => palaceKey(s.palaceId) === palaceKey(focus.palaceId));
  const trailStep = trailIdx >= 0 ? trailIdx + 1 : null;

  const lead =
    trailStep != null
      ? `本周只啃一宫：${focus.title}（短链第 ${trailStep}/${trail.length} 步）`
      : `本周只啃一宫：${focus.title} · 别一次摊开十二宫`;

  return { weekStart, focus, trail, trailStep, lead };
}

export function formatReadPathTrailLine(path: ZiweiReadPath): string {
  return `建议顺序：${path.trail.map((s) => s.title.replace(/宫$/, '')).join(' → ')} · 一次只深挖当前宫`;
}
