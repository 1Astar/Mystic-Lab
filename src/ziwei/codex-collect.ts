/**
 * 图鉴收集态：待觉醒 / 已觉醒 / 未入命盘
 */
import type { ZiweiChartView } from './types.ts';
import { isStarUnlocked } from './codex.ts';

export type CodexCollectState = 'pending' | 'awakened' | 'absent';

export type ChartStarHit = {
  palace: string;
  brightness?: string;
  mutagen?: string;
  isSoulMajor?: boolean;
};

export function indexChartStars(view: ZiweiChartView | null | undefined): Map<string, ChartStarHit> {
  const map = new Map<string, ChartStarHit>();
  if (!view || 'error' in view) return map;
  const soulName = view.soulPalace?.name;
  for (const p of view.palaces) {
    for (const s of [...p.majors, ...p.minors, ...(p.adjectives ?? [])]) {
      if (!map.has(s.name)) {
        map.set(s.name, {
          palace: p.name,
          brightness: s.brightness,
          mutagen: s.mutagen,
          isSoulMajor: p.name === soulName && p.majors.some((m) => m.name === s.name),
        });
      }
    }
  }
  return map;
}

export function resolveCodexCollectState(
  starId: string,
  chartHits: Map<string, ChartStarHit>,
  opts?: { hasChart?: boolean },
): CodexCollectState {
  const inChart = chartHits.has(starId);
  const unlocked = isStarUnlocked(starId);
  const hasChart = Boolean(opts?.hasChart);
  if (hasChart && !inChart) return 'absent';
  if (inChart && unlocked) return 'awakened';
  if (inChart && !unlocked) return 'awakened'; // 盘里有星即视为已觉醒（进盘会自动点亮）
  return unlocked ? 'awakened' : 'pending';
}

export function collectStateLabel(state: CodexCollectState): string {
  if (state === 'awakened') return '✨ 已觉醒';
  if (state === 'absent') return '🌫️ 未入命盘';
  return '🔒 待觉醒';
}

export function collectStateDetailBadge(
  state: CodexCollectState,
  hit?: ChartStarHit,
): string {
  if (state === 'awakened' && hit) {
    const role = hit.isSoulMajor ? '命宫主星' : `${hit.palace.replace(/宫$/, '')}宫`;
    return `⭐ 已觉醒 · ${role}`;
  }
  if (state === 'absent') return '🌫️ 未入命盘 · 可先预览';
  if (hit) return `🔒 待觉醒 · ${hit.palace.replace(/宫$/, '')}宫`;
  return '🔒 待觉醒 · 仍可预览';
}

/** 点小锁：如何点亮 */
export function unlockHowToHint(
  starId: string,
  state: CodexCollectState,
  opts?: { hasChart?: boolean },
): string {
  const name = starId.trim() || '这颗星';
  if (state === 'absent') {
    return `你的本命盘里没有「${name}」。图鉴仍可预览；点亮需盘里出现它（换人排盘或对照他人盘时也可能遇见）。`;
  }
  if (state === 'awakened') {
    return `「${name}」已在你盘中点亮。回完整命盘点它或所在宫，可看动态解释。`;
  }
  if (opts?.hasChart) {
    return `「${name}」尚未出现在你的本命盘。去「完整命盘」查看；当盘里出现它时会自动点亮。现在仍可预览图鉴。`;
  }
  return `先完善出生信息并打开「完整命盘」排盘。盘里出现「${name}」时会自动点亮。现在仍可预览图鉴。`;
}
