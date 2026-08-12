/**
 * 造命 · 灵根 resolve（定盘 + 盘面激活成长 + 流年 Buff）
 */
import {
  applyBuffToAxes,
  resolveYearBuffPack,
  type YearBuffPack,
} from './spirit-buff.ts';
import {
  applyStanceToYearBuffPack,
  getYearStance,
  listYearTips,
} from './year-stance.ts';
import type { BaziChart } from '../bazi/cast.ts';
import { castBaziChart } from '../bazi/cast.ts';
import type { PersonProfile } from '../life/types.ts';
import { unlockStarsFromChart } from '../ziwei/codex.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { mutagenToCardId } from '../ziwei/stars.ts';
import type { PalaceSnap, StarSnap, ZiweiChartView } from '../ziwei/types.ts';
import {
  AXIS_GAIN_MAJOR,
  CRAFT_AXES,
  SHA_STAR_NAMES,
  axisForMajor,
  buildSpiritRootPanel,
  isShaStar,
  type ActivateCandidate,
  type AxisGain,
  type CraftAxisId,
  type SpiritRootPanel,
} from './spirit-roots.ts';
import { loadWeekSummary, pruneWeekData } from './daily-quest-store.ts';
import {
  applyFlatComboBonuses,
  applyYeHuoConditionalBurst,
  enrichCraftComboStates,
} from './combo-achievements.ts';

const STORAGE_KEY = 'mystic-lab-craft-activate-v1';

export type ActivateStore = {
  activated: string[];
  explored: string[];
  updatedAt: string;
};

export const AXIS_GAIN_ACTIVATE = 10;
export const AXIS_GAIN_SHA = 20;
export const AXIS_GAIN_JI = 15;

export function activateKey(palace: string, star: string): string {
  const p = palace.replace(/宫$/, '');
  return `${p}:${star}`;
}

function emptyStore(): ActivateStore {
  return { activated: [], explored: [], updatedAt: new Date().toISOString() };
}

export function loadActivateStore(): ActivateStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const p = JSON.parse(raw) as Partial<ActivateStore>;
    return {
      activated: Array.isArray(p.activated) ? p.activated.map(String).slice(-500) : [],
      explored: Array.isArray(p.explored) ? p.explored.map(String).slice(-500) : [],
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyStore();
  }
}

function saveStore(store: ActivateStore): ActivateStore {
  const next = { ...store, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isActivated(key: string, store = loadActivateStore()): boolean {
  return store.activated.includes(key);
}

export function isExplored(key: string, store = loadActivateStore()): boolean {
  return store.explored.includes(key) || store.activated.includes(key);
}

export function markExplored(key: string): ActivateStore {
  const store = loadActivateStore();
  if (store.explored.includes(key)) return store;
  return saveStore({
    ...store,
    explored: [...store.explored, key].slice(-500),
  });
}

export function gainsForStarName(star: string): AxisGain[] {
  if (star === '化忌' || isShaStar(star) || star === '地空' || star === '地劫') {
    if (star === '化忌') {
      return [
        { axis: 'tongbian', gain: AXIS_GAIN_ACTIVATE },
        { axis: 'yeli', gain: AXIS_GAIN_JI },
      ];
    }
    return [{ axis: 'yeli', gain: AXIS_GAIN_SHA }];
  }
  if (star === '化禄') {
    return [
      { axis: 'guangyao', gain: AXIS_GAIN_ACTIVATE },
      { axis: 'lingyun', gain: AXIS_GAIN_ACTIVATE },
    ];
  }
  if (star === '化权') {
    return [
      { axis: 'guangyao', gain: AXIS_GAIN_ACTIVATE },
      { axis: 'zhenshou', gain: AXIS_GAIN_ACTIVATE },
    ];
  }
  if (star === '化科') {
    return [
      { axis: 'tongbian', gain: AXIS_GAIN_ACTIVATE },
      { axis: 'lingyun', gain: AXIS_GAIN_ACTIVATE },
    ];
  }
  const major = axisForMajor(star);
  if (major) {
    if (star === '七杀' || star === '破军' || star === '贪狼') {
      return [
        { axis: major, gain: AXIS_GAIN_ACTIVATE },
        { axis: 'yeli', gain: AXIS_GAIN_ACTIVATE },
      ];
    }
    return [{ axis: major, gain: AXIS_GAIN_ACTIVATE }];
  }

  if (star === '文昌' || star === '文曲') {
    return [
      { axis: 'tongbian', gain: AXIS_GAIN_ACTIVATE },
      { axis: 'lingyun', gain: AXIS_GAIN_ACTIVATE },
    ];
  }
  if (star === '左辅' || star === '右弼' || star === '天魁' || star === '天钺') {
    return [{ axis: 'zhenshou', gain: AXIS_GAIN_ACTIVATE }];
  }
  return [{ axis: 'lingyun', gain: AXIS_GAIN_ACTIVATE }];
}

export function formatGainLabel(gains: AxisGain[]): string {
  const labelOf = (id: CraftAxisId) => CRAFT_AXES.find((a) => a.id === id)?.label ?? id;
  return gains.map((g) => `${labelOf(g.axis)}+${g.gain}`).join(' · ');
}

function classifyStar(star: string): ActivateCandidate['kind'] {
  if (star.startsWith('化')) return 'mutagen';
  if (isShaStar(star) || star === '地空' || star === '地劫') return 'sha';
  if (axisForMajor(star)) return 'major';
  if (['左辅', '右弼', '文昌', '文曲', '天魁', '天钺'].includes(star)) return 'aux';
  return 'other';
}

/** 命宫里已计入定盘的名字（主星映射表内 + 煞） */
export function soulBaselineStarNames(soul: PalaceSnap): Set<string> {
  const set = new Set<string>();
  for (const s of soul.majors) {
    if (axisForMajor(s.name)) set.add(s.name);
  }
  for (const s of [...soul.majors, ...soul.minors, ...soul.adjectives]) {
    if (isShaStar(s.name) || s.name === '地空' || s.name === '地劫') set.add(s.name);
  }
  return set;
}

function pushCandidate(
  list: ActivateCandidate[],
  seen: Set<string>,
  palace: string,
  star: string,
  baseline: Set<string>,
  store: ActivateStore,
  baselineLocked: boolean,
): void {
  const key = activateKey(palace, star);
  if (seen.has(key)) return;
  seen.add(key);
  const gains = gainsForStarName(star);
  void baseline;
  list.push({
    key,
    palace: palace.replace(/宫$/, '') + '宫',
    star,
    kind: classifyStar(star),
    gains,
    gainLabel: formatGainLabel(gains),
    baselineLocked,
    activated: store.activated.includes(key),
    explored: store.explored.includes(key) || store.activated.includes(key),
  });
}

function eachSnap(palace: PalaceSnap, fn: (snap: StarSnap) => void): void {
  for (const s of [...palace.majors, ...palace.minors, ...palace.adjectives]) {
    if (s.name) fn(s);
  }
}

export function listActivateCandidates(
  view: ZiweiChartView,
  store = loadActivateStore(),
): ActivateCandidate[] {
  // 延迟取本源键，避免与 plate-awaken 循环依赖：命宫主星名 + 命主身主
  const originKeys = new Set<string>();
  const soul = view.soulPalace;
  for (const s of soul.majors) {
    if (s.name) originKeys.add(activateKey(soul.name, s.name));
  }
  for (const s of [...soul.minors, ...soul.adjectives]) {
    if (s.name && (isShaStar(s.name) || s.name === '地空' || s.name === '地劫')) {
      originKeys.add(activateKey(soul.name, s.name));
    }
  }
  for (const starName of [view.soul, view.body]) {
    if (!starName) continue;
    for (const p of view.palaces) {
      if ([...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === starName)) {
        originKeys.add(activateKey(p.name, starName));
        break;
      }
    }
  }

  const baseline = soulBaselineStarNames(view.soulPalace);
  const list: ActivateCandidate[] = [];
  const seen = new Set<string>();

  for (const palace of view.palaces) {
    const isSoul =
      palace.isSoul || palace.name === '命宫' || palace.name.replace(/宫$/, '') === '命';
    eachSnap(palace, (snap) => {
      const key = activateKey(palace.name, snap.name);
      const locked = originKeys.has(key) || (isSoul && baseline.has(snap.name));
      pushCandidate(list, seen, palace.name, snap.name, baseline, store, locked);
      const mid = snap.mutagen ? mutagenToCardId(snap.mutagen) : null;
      if (mid) {
        const mk = activateKey(palace.name, mid);
        pushCandidate(list, seen, palace.name, mid, baseline, store, originKeys.has(mk));
      }
    });
  }

  return list.sort((a, b) => {
    if (a.baselineLocked !== b.baselineLocked) return a.baselineLocked ? 1 : -1;
    if (a.activated !== b.activated) return a.activated ? 1 : -1;
    return a.palace.localeCompare(b.palace, 'zh') || a.star.localeCompare(b.star, 'zh');
  });
}

export function activateStar(
  key: string,
  opts?: { starNameForCodex?: string; palace?: string },
): { ok: true; store: ActivateStore; already: boolean } | { ok: false; error: string } {
  const store = loadActivateStore();
  if (store.activated.includes(key)) {
    return { ok: true, store, already: true };
  }
  const next = saveStore({
    ...store,
    activated: [...store.activated, key].slice(-500),
    explored: store.explored.includes(key)
      ? store.explored
      : [...store.explored, key].slice(-500),
  });

  const starName = opts?.starNameForCodex ?? key.split(':')[1];
  if (starName) {
    unlockStarsFromChart([starName], opts?.palace ? { [starName]: opts.palace } : undefined);
  }

  return { ok: true, store: next, already: false };
}

/** 探索路径：标记已探索，并尝试点亮图鉴 */
export function exploreStar(
  key: string,
  opts?: { starNameForCodex?: string; palace?: string },
): ActivateStore {
  const store = markExplored(key);
  const starName = opts?.starNameForCodex ?? key.split(':')[1];
  if (starName) {
    unlockStarsFromChart([starName], opts?.palace ? { [starName]: opts.palace } : undefined);
  }
  return store;
}

export function codexPathForStar(star: string, palace?: string): string {
  const q = new URLSearchParams();
  if (star.startsWith('化')) {
    q.set('layer', 'mutagen');
    q.set('star', star);
  } else if (
    (SHA_STAR_NAMES as readonly string[]).includes(star) ||
    star === '地空' ||
    star === '地劫'
  ) {
    q.set('bucket', 'sha');
    q.set('star', star);
  } else if (axisForMajor(star)) {
    q.set('bucket', 'major');
    q.set('star', star);
  } else {
    q.set('star', star);
  }
  if (palace) q.set('palace', palace.replace(/宫$/, ''));
  q.set('craft', '1');
  return `/ziwei/tujian?${q.toString()}`;
}

/** 含 β 成长 + 流年×流月 Buff 有效分的灵根图谱 */
export function resolveSpiritRootWithGrowth(
  person: PersonProfile,
  opts?: { year?: number; month?: number },
):
  | { ok: true; panel: SpiritRootPanel; view: ZiweiChartView }
  | { ok: false; error: string } {
  const year = opts?.year ?? new Date().getFullYear();
  const month = opts?.month ?? new Date().getMonth() + 1;
  const view = castZiweiChart(person, { intent: 'map' });
  if ('error' in view) return { ok: false, error: view.error };

  let chart: BaziChart | null = null;
  const bazi = castBaziChart(person, year, {
    includeLiunian: true,
    gender: person.gender,
  });
  if (!('error' in bazi)) chart = bazi;

  const store = loadActivateStore();
  const candidates = listActivateCandidates(view, store);
  pruneWeekData(person.id);
  const week = loadWeekSummary(person.id);
  const panel = buildSpiritRootPanel(
    view,
    chart,
    {
      candidates,
      activatedKeys: store.activated,
    },
    week.attrByAxis,
  );

  let baziHint = '';
  if (chart) {
    const liu = chart.pillars.find((p) => p.key === 'liunian' && !p.empty);
    if (liu) {
      baziHint = `八字天气（不改系数）：流年 ${liu.stem}${liu.branch}${liu.stemGod && liu.stemGod !== '—' ? ` · ${liu.stemGod}` : ''}——大环境提示，紫微词条才改有效分。`;
    } else {
      baziHint = `八字天气（不改系数）：日主 ${chart.dayMaster}${chart.dayMasterWx || ''} · 流年柱未排出。`;
    }
  }

  const yearBuffBase: YearBuffPack = resolveYearBuffPack(
    person,
    year,
    baziHint,
    month,
  );
  const stance = getYearStance(person.id, year);
  const yearBuff = applyStanceToYearBuffPack(yearBuffBase, stance?.choice);
  const tips = listYearTips({ personId: person.id, year });
  panel.yearBuff = yearBuff;
  panel.yearTips = tips.map((t) => t.text);
  panel.axes = applyFlatComboBonuses(panel.axes);
  panel.axes = applyBuffToAxes(panel.axes, yearBuff.multByAxis);
  const ye = applyYeHuoConditionalBurst(panel.axes);
  panel.axes = ye.axes;
  panel.comboAchievements = enrichCraftComboStates(panel.axes, {
    yeHuoActive: ye.active,
  });

  return { ok: true, panel, view };
}

export { AXIS_GAIN_MAJOR };
