/**
 * 图鉴详情辅助：流年四化 / 本周任务 / 造命加成
 */
import { loadAllQuests, weekStartMonday } from '../craft/daily-quest-store.ts';
import type { DailyQuest } from '../craft/daily-quest-types.ts';
import type { PersonProfile } from '../life/types.ts';
import { resolveHoroscopeLimits } from './horoscope-limits.ts';
import type { ChartStarHit } from './codex-collect.ts';
import {
  AXIS_GAIN_MAJOR,
  CRAFT_AXES,
  axisForMajor,
} from '../craft/spirit-roots.ts';

const HUA_ORDER = ['禄', '权', '科', '忌'] as const;

export function yearHuaForStar(
  person: PersonProfile | null | undefined,
  starId: string,
): { year: number; kind: string; label: string } | null {
  if (!person) return null;
  const year = new Date().getFullYear();
  const snap = resolveHoroscopeLimits(person, { year });
  if (!snap?.yearMutagen?.length) return null;
  const idx = snap.yearMutagen.findIndex(
    (n) => n === starId || n.replace(/星$/, '') === starId.replace(/星$/, ''),
  );
  if (idx < 0 || idx > 3) return null;
  const kind = HUA_ORDER[idx]!;
  return { year, kind, label: `${year}流年化${kind}` };
}

export function findWeekQuestForStar(
  starId: string,
  userId: string,
): DailyQuest | null {
  const ws = weekStartMonday();
  const needle = starId.replace(/星$/, '');
  const pool = loadAllQuests().filter(
    (q) =>
      q.userId === userId &&
      q.cadence === 'weekly' &&
      (q.status === 'todo' || q.status === 'doing') &&
      (q.questDate === ws || q.questDate.startsWith(ws.slice(0, 7))),
  );
  const hit =
    pool.find((q) =>
      [q.topic, q.origin, q.taskTitle, q.taskDescription].some((t) =>
        String(t || '').includes(needle),
      ),
    ) ?? null;
  return hit;
}

export function craftBonusForStar(
  starId: string,
  hit?: ChartStarHit,
): { axisId: string; axisLabel: string; value: number } | null {
  if (!hit?.isSoulMajor) return null;
  const axisId = axisForMajor(starId);
  if (!axisId) return null;
  const def = CRAFT_AXES.find((a) => a.id === axisId);
  return {
    axisId,
    axisLabel: def?.label ?? axisId,
    value: AXIS_GAIN_MAJOR,
  };
}

export function questRelateLine(q: DailyQuest, starId: string): string {
  const origin = q.origin || q.topic;
  return `你正处于「${origin.includes(starId) ? origin : `${starId}·${origin}`}」的试炼中，点此查看本周任务`;
}
