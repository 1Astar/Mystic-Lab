/**
 * 造命 · 灵根图谱（灵魂印记）定盘
 * 命宫主星/煞星 → 六维；福德+日主 → 灵韵；八字柱 → 五行磁场
 */
import type { BaziChart } from '../bazi/cast.ts';
import {
  BRANCH_WUXING,
  STEM_WUXING,
  type WuXing,
} from '../bazi/elements.ts';
import type { PersonProfile } from '../life/types.ts';
import { castBaziChart } from '../bazi/cast.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';

export type CraftAxisId =
  | 'guangyao'
  | 'tongbian'
  | 'wenyang'
  | 'zhenshou'
  | 'lingyun'
  | 'yeli';

export type CraftAxisDef = {
  id: CraftAxisId;
  label: string;
  sub: string;
};

export const CRAFT_AXES: readonly CraftAxisDef[] = [
  { id: 'guangyao', label: '光耀', sub: '输出/行动力' },
  { id: 'tongbian', label: '通变', sub: '策略/应变力' },
  { id: 'wenyang', label: '温养', sub: '感知/治愈力' },
  { id: 'zhenshou', label: '镇守', sub: '统筹/防御力' },
  { id: 'lingyun', label: '灵韵', sub: '灵感/精神内驱' },
  { id: 'yeli', label: '业力', sub: '挑战/破局力' },
] as const;

/** 命宫主星 → 轴；每星基础 +20 */
export const MAJOR_TO_AXIS: Readonly<Record<string, CraftAxisId>> = {
  太阳: 'guangyao',
  武曲: 'guangyao',
  七杀: 'guangyao',
  天机: 'tongbian',
  天梁: 'tongbian',
  廉贞: 'tongbian',
  太阴: 'wenyang',
  天同: 'wenyang',
  天相: 'wenyang',
  紫微: 'zhenshou',
  天府: 'zhenshou',
  巨门: 'zhenshou',
};

export const SHA_STAR_NAMES = ['擎羊', '陀罗', '火星', '铃星'] as const;

export const AXIS_GAIN_MAJOR = 20;
export const AXIS_GAIN_FORTUNE = 10;
export const AXIS_GAIN_DAY_MASTER = 15;

export type CraftAxisScore = {
  id: CraftAxisId;
  label: string;
  sub: string;
  /** 展示用：有 Buff 时为有效分，否则=永久分 */
  value: number;
  lit: boolean;
  sources: string[];
  /** 定盘+点亮永久分 */
  permanentValue?: number;
  /** 流年限时乘子（1=无 Buff） */
  buffMult?: number;
};

export type AxisGain = { axis: CraftAxisId; gain: number };

export type ActivateCandidate = {
  /** `${palace}:${star}` */
  key: string;
  palace: string;
  star: string;
  kind: 'major' | 'aux' | 'sha' | 'mutagen' | 'other';
  gains: AxisGain[];
  gainLabel: string;
  /** 命宫定盘已计入，不可激活 */
  baselineLocked: boolean;
  activated: boolean;
  explored: boolean;
};

export type WuxingBar = {
  el: WuXing;
  count: number;
  pct: number;
  /** 日主所在行 */
  dayMaster: boolean;
};

import type { YearBuffPack } from './spirit-buff.ts';
import type { CraftComboAchState } from './combo-achievements.ts';

export type SpiritRootPanel = {
  axes: CraftAxisScore[];
  litCount: number;
  soulMajors: string[];
  tagline: string;
  dayMasterLine: string;
  wuxing: WuxingBar[];
  /** β 点亮候选（含已激活 / 命宫锁定） */
  candidates: ActivateCandidate[];
  pendingCount: number;
  activatedCount: number;
  /** 流年 Buff 包（方案2） */
  yearBuff?: YearBuffPack;
  /** 图鉴组合成就 C */
  comboAchievements?: CraftComboAchState[];
};

function findPalace(view: ZiweiChartView, name: string): PalaceSnap | undefined {
  const key = name.replace(/宫$/, '');
  return view.palaces.find((p) => p.name === name || p.name.replace(/宫$/, '') === key);
}

function allStarNames(palace: PalaceSnap | undefined): string[] {
  if (!palace) return [];
  return [...palace.majors, ...palace.minors, ...palace.adjectives]
    .map((s) => s.name)
    .filter(Boolean);
}

export function axisForMajor(star: string): CraftAxisId | undefined {
  return MAJOR_TO_AXIS[star];
}

export function isShaStar(name: string): boolean {
  return (SHA_STAR_NAMES as readonly string[]).includes(name);
}

/** 纯规则：命宫主星/煞 + 福德主星 + 日主五行 → 六轴 */
export function scoreSpiritAxes(input: {
  soulMajors: string[];
  soulAllStars?: string[];
  fortuneMajors?: string[];
  dayMasterWx?: WuXing | '';
}): CraftAxisScore[] {
  const bags = new Map<CraftAxisId, { value: number; sources: string[] }>();
  for (const a of CRAFT_AXES) {
    bags.set(a.id, { value: 0, sources: [] });
  }

  const bump = (id: CraftAxisId, gain: number, source: string) => {
    const bag = bags.get(id)!;
    bag.value += gain;
    if (!bag.sources.includes(source)) bag.sources.push(source);
  };

  for (const star of input.soulMajors) {
    const axis = axisForMajor(star);
    if (axis) bump(axis, AXIS_GAIN_MAJOR, star);
  }

  const shaPool = input.soulAllStars?.length
    ? input.soulAllStars
    : input.soulMajors;
  for (const name of shaPool) {
    if (isShaStar(name)) bump('yeli', AXIS_GAIN_MAJOR, name);
  }

  for (const star of input.fortuneMajors ?? []) {
    bump('lingyun', AXIS_GAIN_FORTUNE, `福德·${star}`);
  }

  if (input.dayMasterWx) {
    bump('lingyun', AXIS_GAIN_DAY_MASTER, `日主${input.dayMasterWx}`);
  }

  return CRAFT_AXES.map((def) => {
    const bag = bags.get(def.id)!;
    return {
      id: def.id,
      label: def.label,
      sub: def.sub,
      value: bag.value,
      lit: bag.value > 0,
      sources: bag.sources,
    };
  });
}

const WX_ORDER: WuXing[] = ['木', '火', '土', '金', '水'];

export function buildWuxingBars(chart: BaziChart): WuxingBar[] {
  const counts: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of chart.pillars) {
    if (p.empty) continue;
    if (p.key === 'liunian') continue;
    const sw = STEM_WUXING[p.stem];
    const bw = BRANCH_WUXING[p.branch];
    if (sw) counts[sw] += 1;
    if (bw) counts[bw] += 1;
  }
  if (chart.dayMasterWx) counts[chart.dayMasterWx] += 2;
  const max = Math.max(1, ...WX_ORDER.map((el) => counts[el]));
  return WX_ORDER.map((el) => ({
    el,
    count: counts[el],
    pct: Math.round((counts[el] / max) * 100),
    dayMaster: chart.dayMasterWx === el,
  }));
}

export function applyActivationGains(
  axes: CraftAxisScore[],
  activatedKeys: string[],
  candidates: ActivateCandidate[],
): CraftAxisScore[] {
  const byKey = new Map(candidates.map((c) => [c.key, c]));
  const mutable = new Map(
    axes.map((a) => [a.id, { value: a.value, sources: [...a.sources] }]),
  );

  for (const key of activatedKeys) {
    const c = byKey.get(key);
    if (!c || c.baselineLocked) continue;
    for (const g of c.gains) {
      const bag = mutable.get(g.axis);
      if (!bag) continue;
      bag.value += g.gain;
      const src = `激活·${c.palace.replace(/宫$/, '')}·${c.star}`;
      if (!bag.sources.includes(src)) bag.sources.push(src);
    }
  }

  return CRAFT_AXES.map((def) => {
    const bag = mutable.get(def.id)!;
    return {
      id: def.id,
      label: def.label,
      sub: def.sub,
      value: bag.value,
      lit: bag.value > 0,
      sources: bag.sources,
    };
  });
}

export function applyQuestAttrGains(
  axes: CraftAxisScore[],
  attrByAxis: Partial<Record<CraftAxisId, number>>,
): CraftAxisScore[] {
  return axes.map((a) => {
    const gain = attrByAxis[a.id] ?? 0;
    if (!gain) return a;
    const src = `本周打卡 +${gain}`;
    return {
      ...a,
      value: a.value + gain,
      lit: true,
      sources: a.sources.includes(src) ? a.sources : [...a.sources, src],
      permanentValue: (a.permanentValue ?? a.value) + gain,
    };
  });
}

export function buildSpiritRootPanel(
  view: ZiweiChartView,
  chart: BaziChart | null,
  activation?: {
    candidates: ActivateCandidate[];
    activatedKeys: string[];
  },
  questAttrByAxis?: Partial<Record<CraftAxisId, number>>,
): SpiritRootPanel {
  const soul = view.soulPalace;
  const fortune = findPalace(view, '福德');
  const soulMajors = soul.majors.map((s) => s.name).filter(Boolean);
  let axes = scoreSpiritAxes({
    soulMajors,
    soulAllStars: allStarNames(soul),
    fortuneMajors: fortune?.majors.map((s) => s.name).filter(Boolean) ?? [],
    dayMasterWx: chart?.dayMasterWx || '',
  });

  const candidates = activation?.candidates ?? [];
  if (activation?.activatedKeys?.length && candidates.length) {
    axes = applyActivationGains(axes, activation.activatedKeys, candidates);
  }

  if (questAttrByAxis && Object.keys(questAttrByAxis).length) {
    axes = applyQuestAttrGains(axes, questAttrByAxis);
  }

  const litCount = axes.filter((a) => a.lit).length;
  const pendingCount = candidates.filter((c) => !c.activated && !c.baselineLocked).length;
  const activatedCount = candidates.filter((c) => c.activated).length;
  const dayMasterLine = chart
    ? `日主 ${chart.dayMaster}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''}`
    : '八字未排入 · 灵韵仅看福德宫';

  return {
    axes,
    litCount,
    soulMajors,
    tagline: '这就是你出生时的初始天赋',
    dayMasterLine,
    wuxing: chart ? buildWuxingBars(chart) : [],
    candidates,
    pendingCount,
    activatedCount,
  };
}

export function resolveSpiritRootPanel(
  person: PersonProfile,
):
  | { ok: true; panel: SpiritRootPanel; view: ZiweiChartView }
  | { ok: false; error: string } {
  const view = castZiweiChart(person, { intent: 'map' });
  if ('error' in view) return { ok: false, error: view.error };

  let chart: BaziChart | null = null;
  const bazi = castBaziChart(person, new Date().getFullYear(), {
    includeLiunian: false,
    gender: person.gender,
  });
  if (!('error' in bazi)) chart = bazi;

  // 动态 import 会变异步；此处用延迟 require 的替代：在调用方注入。
  // 由 spirit-activate 的 attachGrowth 包装，默认无成长。
  return { ok: true, panel: buildSpiritRootPanel(view, chart), view };
}

/** 六维雷达：顶点顺序与 CRAFT_AXES 一致，从正上顺时针 */
export function radarPolygonPoints(
  values: number[],
  cx = 100,
  cy = 100,
  maxR = 72,
  scaleMax = 100,
): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const r = (Math.min(Math.max(v, 0), scaleMax) / scaleMax) * maxR;
      const x = cx + Math.cos(t) * r;
      const y = cy + Math.sin(t) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function radarGuidePoints(cx = 100, cy = 100, r = 72, n = 6): string {
  return Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return `${(cx + Math.cos(t) * r).toFixed(1)},${(cy + Math.sin(t) * r).toFixed(1)}`;
  }).join(' ');
}

export function radarLabelPos(
  index: number,
  n = 6,
  cx = 100,
  cy = 100,
  r = 88,
): { x: number; y: number } {
  const t = -Math.PI / 2 + (index * 2 * Math.PI) / n;
  return { x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r };
}
