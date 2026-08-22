/**
 * 图鉴收集态：待觉醒 / 相遇 / 激活 / 未入命盘
 * 激活 = 本源或盘面试炼已写入造命雷达；相遇 = 盘中有但未加成
 */
import { classifyPlateStar } from '../craft/plate-awaken.ts';
import { loadActivateStore } from '../craft/spirit-activate.ts';
import { isStarUnlocked } from './codex.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

export type CodexCollectState = 'pending' | 'met' | 'activated' | 'absent';

/** 相遇来源：杂曜/长生偏本命；岁前/将前/博士偏流年侧 */
export type ChartStarMeetSource = 'natal' | 'year';

export type ChartStarHit = {
  palace: string;
  brightness?: string;
  mutagen?: string;
  isSoulMajor?: boolean;
  meetSource?: ChartStarMeetSource;
  meetYear?: number;
};

export type ResolveCollectOpts = {
  hasChart?: boolean;
  view?: ZiweiChartView | null;
};

function isYearSeriesKind(
  kind: NonNullable<PalaceSnap['series']>[number]['kind'],
): boolean {
  return kind === 'boshi' || kind === 'jiangqian' || kind === 'suiqian';
}

function putChartHit(
  map: Map<string, ChartStarHit>,
  name: string,
  next: ChartStarHit,
): void {
  const prev = map.get(name);
  if (!prev) {
    map.set(name, next);
    return;
  }
  // 流年系可覆盖本命标注（同名神煞更贴近「今年遇上」）
  if (prev.meetSource !== 'year' && next.meetSource === 'year') {
    map.set(name, {
      ...prev,
      ...next,
      palace: next.palace || prev.palace,
      brightness: next.brightness ?? prev.brightness,
      mutagen: next.mutagen ?? prev.mutagen,
      isSoulMajor: prev.isSoulMajor || next.isSoulMajor,
    });
  }
}

export function indexChartStars(view: ZiweiChartView | null | undefined): Map<string, ChartStarHit> {
  const map = new Map<string, ChartStarHit>();
  if (!view || 'error' in view) return map;
  const soulName = view.soulPalace?.name;
  const year = view.theater?.annual?.year;
  for (const p of view.palaces) {
    for (const s of [...p.majors, ...p.minors, ...(p.adjectives ?? [])]) {
      putChartHit(map, s.name, {
        palace: p.name,
        brightness: s.brightness,
        mutagen: s.mutagen,
        isSoulMajor: p.name === soulName && p.majors.some((m) => m.name === s.name),
        meetSource: 'natal',
      });
    }
    for (const s of p.series ?? []) {
      const meetSource: ChartStarMeetSource = isYearSeriesKind(s.kind)
        ? 'year'
        : 'natal';
      putChartHit(map, s.name, {
        palace: p.name,
        meetSource,
        meetYear: meetSource === 'year' ? year : undefined,
      });
    }
  }
  return map;
}

/** 短卡落宫行：📍 相遇于：×宫 · 本命盘|流年YYYY（主星/吉煞/辅/杂/神煞统一） */
export function formatShenshaMeetAtLine(hit?: ChartStarHit | null): string | null {
  if (!hit?.palace) return null;
  const palace = hit.palace.endsWith('宫') ? hit.palace : `${hit.palace}宫`;
  if (hit.meetSource === 'year') {
    const y = hit.meetYear ?? new Date().getFullYear();
    return `📍 相遇于：${palace} · 流年${y}`;
  }
  return `📍 相遇于：${palace} · 本命盘`;
}

export const formatMeetAtLine = formatShenshaMeetAtLine;

/** 是否已写入造命雷达（本源 / 试炼激活） */
export function isStarCraftActivated(
  starId: string,
  hit: ChartStarHit | undefined,
  view?: ZiweiChartView | null,
): boolean {
  const store = loadActivateStore();
  if (view && !('error' in view) && hit?.palace) {
    const kind = classifyPlateStar(
      {
        palace: hit.palace,
        star: starId,
        isMajor: Boolean(hit.isSoulMajor),
      },
      view,
      store,
    );
    if (kind === 'origin' || kind === 'awakened') return true;
  }
  const suffix = `:${starId}`;
  return store.activated.some((k) => k.endsWith(suffix));
}

export function resolveCodexCollectState(
  starId: string,
  chartHits: Map<string, ChartStarHit>,
  opts?: ResolveCollectOpts,
): CodexCollectState {
  const hit = chartHits.get(starId);
  const inChart = Boolean(hit);
  const unlocked = isStarUnlocked(starId);
  const hasChart = Boolean(opts?.hasChart);
  const powered = isStarCraftActivated(starId, hit, opts?.view);

  if (hasChart && !inChart) return 'absent';
  if (inChart) return powered ? 'activated' : 'met';
  if (powered) return 'activated';
  if (unlocked) return 'met';
  return 'pending';
}

export function collectStateClass(state: CodexCollectState): string {
  if (state === 'activated') return 'is-activated is-awakened';
  if (state === 'met') return 'is-met';
  if (state === 'absent') return 'is-absent';
  return 'is-pending';
}

export function collectStateLabel(state: CodexCollectState): string {
  if (state === 'activated') return '⚡ 已激活';
  if (state === 'met') return '相遇 · 待激活';
  if (state === 'absent') return '🌫️ 未入命盘';
  return '🔒 待觉醒';
}

export function collectStateDetailBadge(
  state: CodexCollectState,
  hit?: ChartStarHit,
): string {
  if (state === 'activated' && hit) {
    const role = hit.isSoulMajor ? '命宫主星' : `${hit.palace.replace(/宫$/, '')}宫`;
    return `⚡ 已激活 · ${role} · 已写入造命雷达`;
  }
  if (state === 'met' && hit) {
    return `✨ 相遇 · ${hit.palace.replace(/宫$/, '')}宫 · 回盘面试炼可激活`;
  }
  if (state === 'activated') return '⚡ 已激活 · 已写入造命雷达';
  if (state === 'met') return '✨ 相遇 · 待试炼激活';
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
    return `你的本命盘里没有「${name}」。图鉴仍可预览；相遇需盘里出现它（换人排盘或对照他人盘时也可能遇见）。`;
  }
  if (state === 'activated') {
    return `「${name}」已吸纳进造命雷达。回完整命盘点它或所在宫，可看动态解释。`;
  }
  if (state === 'met') {
    return `「${name}」已在命盘相遇，但还没写入雷达。回完整命盘点它做试炼/激活，或从这里跳回盘面。`;
  }
  if (opts?.hasChart) {
    return `「${name}」尚未出现在你的本命盘。去「完整命盘」查看；盘里出现它时会进入相遇态。现在仍可预览图鉴。`;
  }
  return `先完善出生信息并打开「完整命盘」排盘。盘里出现「${name}」时会先相遇，再试炼激活写入雷达。`;
}
