/**
 * 紫微盘面沉浸激活：本源已亮 vs 试炼点亮
 */
import { getStarLore } from '../ziwei/stars.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import {
  activateKey,
  gainsForStarName,
  isActivated,
  loadActivateStore,
} from './spirit-activate.ts';
import {
  axisForMajor,
  isShaStar,
  type AxisGain,
  type CraftAxisId,
} from './spirit-roots.ts';

/** 试炼加分 */
export const TRIAL_GAIN_MAJOR = 10;
export const TRIAL_GAIN_SHA = 20;
export const TRIAL_GAIN_MUTAGEN_JI = 15;
export const TRIAL_GAIN_SECONDARY = 10;

export type PlateStarKind = 'origin' | 'sealed' | 'awakened';

export type PlateStarRef = {
  palace: string;
  star: string;
  /** 化禄等四化卡片名；空则为主星/辅星本体 */
  mutagenCard?: string;
  isMajor: boolean;
};

function normPalace(name: string): string {
  return name.replace(/宫$/, '');
}

export function plateStarKey(ref: PlateStarRef): string {
  const label = ref.mutagenCard || ref.star;
  return activateKey(ref.palace, label);
}

/** 命宫主星/煞 + 命主/身主 → 本源初始点亮 */
export function collectOriginKeys(view: ZiweiChartView): Set<string> {
  const keys = new Set<string>();
  const soul = view.soulPalace;
  for (const s of soul.majors) {
    if (s.name) keys.add(activateKey(soul.name, s.name));
  }
  for (const s of [...soul.minors, ...soul.adjectives]) {
    if (s.name && (isShaStar(s.name) || s.name === '地空' || s.name === '地劫')) {
      keys.add(activateKey(soul.name, s.name));
    }
  }
  const markNamed = (starName: string) => {
    if (!starName) return;
    for (const p of view.palaces) {
      const hit = [...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === starName);
      if (hit) {
        keys.add(activateKey(p.name, starName));
        break;
      }
    }
  };
  markNamed(view.soul);
  markNamed(view.body);
  return keys;
}

export function classifyPlateStar(
  ref: PlateStarRef,
  view: ZiweiChartView,
  store = loadActivateStore(),
): PlateStarKind {
  const key = plateStarKey(ref);
  if (collectOriginKeys(view).has(key)) return 'origin';
  if (isActivated(key, store)) return 'awakened';
  return 'sealed';
}

/** 试炼加分表 */
export function trialGainsFor(ref: PlateStarRef): AxisGain[] {
  const name = ref.mutagenCard || ref.star;
  if (name === '化忌') {
    const soft = axisForMajor(ref.star) ?? 'tongbian';
    return [
      { axis: soft, gain: TRIAL_GAIN_SECONDARY },
      { axis: 'yeli', gain: TRIAL_GAIN_MUTAGEN_JI },
    ];
  }
  if (name === '化禄') {
    return [
      { axis: 'guangyao', gain: TRIAL_GAIN_MAJOR },
      { axis: 'lingyun', gain: TRIAL_GAIN_SECONDARY },
    ];
  }
  if (name === '化权') {
    return [
      { axis: 'guangyao', gain: TRIAL_GAIN_MAJOR },
      { axis: 'zhenshou', gain: TRIAL_GAIN_SECONDARY },
    ];
  }
  if (name === '化科') {
    return [
      { axis: 'tongbian', gain: TRIAL_GAIN_MAJOR },
      { axis: 'lingyun', gain: TRIAL_GAIN_SECONDARY },
    ];
  }
  if (isShaStar(name) || name === '地空' || name === '地劫') {
    return [{ axis: 'yeli', gain: TRIAL_GAIN_SHA }];
  }
  const major = axisForMajor(name);
  if (major) {
    if (name === '七杀' || name === '破军' || name === '贪狼') {
      return [
        { axis: major, gain: TRIAL_GAIN_MAJOR },
        { axis: 'yeli', gain: TRIAL_GAIN_SECONDARY },
      ];
    }
    return [{ axis: major, gain: TRIAL_GAIN_MAJOR }];
  }
  return gainsForStarName(name).map((g) => ({
    axis: g.axis,
    gain: Math.max(g.gain, TRIAL_GAIN_SECONDARY),
  }));
}

function axisLabel(id: CraftAxisId): string {
  const map: Record<CraftAxisId, string> = {
    guangyao: '光耀',
    tongbian: '通变',
    wenyang: '温养',
    zhenshou: '镇守',
    lingyun: '灵韵',
    yeli: '业力',
  };
  return map[id] ?? id;
}

export function formatTrialGainLine(gains: AxisGain[]): string {
  return gains.map((g) => `+${g.gain} ${axisLabel(g.axis)}`).join('，');
}

export type PlateAwakenCopy = {
  theme: 'origin' | 'trial' | 'awakened';
  title: string;
  body: string;
  gainLine?: string;
  karma: boolean;
  cta?: 'activate' | 'sanfang' | 'learn';
  ctaLabel?: string;
};

export function buildPlateAwakenCopy(
  ref: PlateStarRef,
  kind: PlateStarKind,
): PlateAwakenCopy {
  const lore = getStarLore(ref.star);
  const palace = normPalace(ref.palace);
  const display = ref.mutagenCard ? `${ref.star}·${ref.mutagenCard}` : ref.star;
  const karma =
    ref.mutagenCard === '化忌' ||
    isShaStar(ref.star) ||
    isShaStar(ref.mutagenCard || '') ||
    ref.star === '地空' ||
    ref.star === '地劫';

  if (kind === 'origin') {
    const epithet = lore?.epithet ? `（${lore.epithet}）` : '';
    return {
      theme: 'origin',
      title: '本源星曜',
      body: `你命盘本源自带【${ref.star}】${epithet}。这不仅是你的天赋，更是你终生修行的方向。${lore?.counsel ?? lore?.trait ?? '把它当成底色，而不是判决。'}——可领取「${ref.star}的落宫指南」，去看三方四正如何柔和或放大这份光芒。`,
      karma: false,
      cta: 'sanfang',
      ctaLabel: `领取「${ref.star}的落宫指南」`,
    };
  }

  if (kind === 'awakened') {
    return {
      theme: 'awakened',
      title: '已觉醒',
      body: `【${palace}宫 · ${display}】你已接纳这段剧本。可继续看星曜释义，或回到造命页查看雷达变化。`,
      karma,
      cta: 'learn',
      ctaLabel: '查看星曜释义',
    };
  }

  const gains = trialGainsFor(ref);
  const gainLine = formatTrialGainLine(gains);

  if (karma) {
    return {
      theme: 'trial',
      title: '试炼与机缘',
      body: `你发现了隐藏的业力之星【${display}】（${palace}宫）。它可能带来拉扯与内耗，也是让你变得缜密、抗压与未雨绸缪的关键。接纳你的业力，不是认栽，而是修心强化。—— ${gainLine}`,
      gainLine,
      karma: true,
      cta: 'activate',
      ctaLabel: '接纳并激活',
    };
  }

  return {
    theme: 'trial',
    title: '试炼与机缘',
    body: `你人生剧本里的【${palace}宫 · ${display}】尚未觉醒。${lore?.trait ?? '这象征一段待展开的人生领域。'}是否接纳并激活这段机缘？—— ${gainLine}`,
    gainLine,
    karma: false,
    cta: 'activate',
    ctaLabel: '接纳并激活',
  };
}

export function countSealedStars(view: ZiweiChartView, store = loadActivateStore()): {
  sealed: number;
  karmaSealed: number;
} {
  const origin = collectOriginKeys(view);
  let sealed = 0;
  let karmaSealed = 0;
  for (const p of view.palaces) {
    for (const s of p.majors) {
      if (!s.name) continue;
      const key = activateKey(p.name, s.name);
      if (origin.has(key) || store.activated.includes(key)) continue;
      sealed += 1;
      if (isShaStar(s.name)) karmaSealed += 1;
      if (s.mutagen === '忌') {
        const mk = activateKey(p.name, '化忌');
        if (!origin.has(mk) && !store.activated.includes(mk)) {
          sealed += 1;
          karmaSealed += 1;
        }
      }
    }
    for (const s of [...p.minors, ...p.adjectives]) {
      if (!s.name) continue;
      if (!(isShaStar(s.name) || s.name === '地空' || s.name === '地劫')) continue;
      const key = activateKey(p.name, s.name);
      if (origin.has(key) || store.activated.includes(key)) continue;
      sealed += 1;
      karmaSealed += 1;
    }
  }
  return { sealed, karmaSealed };
}
