/**
 * 造命 · 流年 / 流月 Buff
 * 紫微四化 → 限时系数；永久分不变，有效分 = 永久 × 流年 × 流月（夹紧 0.5～1.8）
 */
import type { PersonProfile } from '../life/types.ts';
import { resolveHoroscopeLimits } from '../ziwei/horoscope-limits.ts';
import type { MutagenKind } from '../ziwei/mutagen-format.ts';
import {
  CRAFT_AXES,
  axisForMajor,
  type CraftAxisId,
  type CraftAxisScore,
} from './spirit-roots.ts';
import { buildBuffEntriesFromBazi } from './spirit-buff-bazi.ts';

export const BUFF_MULT_MIN = 0.5;
export const BUFF_MULT_MAX = 1.8;

export type BuffEffect = {
  axis: CraftAxisId;
  mult: number;
};

export type BuffScope = 'year' | 'month';

export type YearBuffEntry = {
  id: string;
  title: string;
  kind: MutagenKind;
  star: string;
  effects: BuffEffect[];
  effectLabel: string;
  advice: string;
  /** 流年 / 流月 */
  scope?: BuffScope;
  /** 紫微四化默认；八字十神为 bazi */
  lane?: 'ziwei' | 'bazi';
  /** 八字层 */
  baziLayer?: 'dayun' | 'liunian' | 'liuyue';
};

export type YearBuffPack = {
  year: number;
  /** 1–12，参与叠乘的流月 */
  month: number;
  yearGZ: string;
  monthGZ: string;
  /** 展示用总述（年+月） */
  mutagenLine: string;
  yearMutagenLine: string;
  monthMutagenLine: string;
  /** 流年词条（stance 会往这里追加） */
  entries: YearBuffEntry[];
  /** 流月词条 */
  monthEntries: YearBuffEntry[];
  /** 六轴最终乘子：年×月（已夹紧） */
  multByAxis: Record<CraftAxisId, number>;
  /** 八字弱提示，不改系数 / 或格局叙事 */
  baziHint: string;
  /** 同轴过叠已调和时的说明 */
  conflictNote?: string;
};

const KIND_ORDER: MutagenKind[] = ['禄', '权', '科', '忌'];

export function clampBuffMult(m: number): number {
  return Math.min(BUFF_MULT_MAX, Math.max(BUFF_MULT_MIN, m));
}

function axisLabel(id: CraftAxisId): string {
  return CRAFT_AXES.find((a) => a.id === id)?.label ?? id;
}

function formatEffects(effects: BuffEffect[]): string {
  return effects
    .map((e) => {
      const pct = Math.round((e.mult - 1) * 100);
      const sign = pct >= 0 ? `+${pct}%` : `${pct}%`;
      return `${axisLabel(e.axis)}${sign}`;
    })
    .join(' · ');
}

function periodWord(scope: BuffScope): string {
  return scope === 'month' ? '本月' : '本年';
}

/** 单条四化 → 轴乘子与白话（忌=考验，不说倒霉） */
export function effectsForYearMutagen(
  star: string,
  kind: MutagenKind,
  scope: BuffScope = 'year',
): {
  effects: BuffEffect[];
  advice: string;
} {
  const home = axisForMajor(star);
  const when = periodWord(scope);

  if (kind === '忌') {
    const soft = home ?? 'tongbian';
    return {
      effects: [
        { axis: soft, mult: 0.7 },
        { axis: 'yeli', mult: 1.6 },
      ],
      advice: `${when}限时：${star}化忌——「${axisLabel(soft)}」不宜靠小聪明硬推；「业力」暴涨，适合硬扛复盘或向「温养」高的人求助。考验不是倒霉。`,
    };
  }

  if (kind === '禄') {
    const effects: BuffEffect[] = home
      ? [
          { axis: home, mult: 1.2 },
          { axis: 'lingyun', mult: 1.15 },
        ]
      : [
          { axis: 'guangyao', mult: 1.2 },
          { axis: 'lingyun', mult: 1.2 },
        ];
    return {
      effects,
      advice: `${when}限时：${star}化禄——资源与满足感更容易来，可主动推进，但仍留弹性。`,
    };
  }

  if (kind === '权') {
    const effects: BuffEffect[] = home
      ? [
          { axis: home, mult: 1.15 },
          { axis: 'zhenshou', mult: 1.1 },
        ]
      : [
          { axis: 'guangyao', mult: 1.15 },
          { axis: 'zhenshou', mult: 1.15 },
        ];
    return {
      effects,
      advice: `${when}限时：${star}化权——适合站到台前拍板，也别一个人扛完。`,
    };
  }

  // 科
  const effects: BuffEffect[] = home
    ? [
        { axis: home, mult: 1.15 },
        { axis: 'lingyun', mult: 1.15 },
      ]
    : [
        { axis: 'tongbian', mult: 1.15 },
        { axis: 'lingyun', mult: 1.15 },
      ];
  return {
    effects,
    advice: `${when}限时：${star}化科——名声与求教线索可借力，适合展示与学习。`,
  };
}

export function emptyMultByAxis(): Record<CraftAxisId, number> {
  return {
    guangyao: 1,
    tongbian: 1,
    wenyang: 1,
    zhenshou: 1,
    lingyun: 1,
    yeli: 1,
  };
}

/** 同轴第 3 条起向 1.0 衰减，再夹紧 */
export const CONFLICT_FULL_STACK = 2;
export const CONFLICT_DAMP = 0.5;

export type ComposeMultResult = {
  multByAxis: Record<CraftAxisId, number>;
  harmonized: boolean;
  note: string;
};

/**
 * 叠乘词条乘子；同轴超过 2 条时后段衰减（冲突细则切片）。
 */
export function composeMultByAxisDetailed(
  entries: YearBuffEntry[],
): ComposeMultResult {
  const bags = new Map<CraftAxisId, number[]>();
  for (const a of CRAFT_AXES) bags.set(a.id, []);
  for (const e of entries) {
    for (const fx of e.effects) {
      bags.get(fx.axis)!.push(fx.mult);
    }
  }

  let harmonized = false;
  const mults = emptyMultByAxis();
  for (const a of CRAFT_AXES) {
    const list = bags.get(a.id)!;
    // 偏离 1 更大的优先保留满额
    list.sort((x, y) => Math.abs(y - 1) - Math.abs(x - 1));
    let m = 1;
    for (let i = 0; i < list.length; i++) {
      let factor = list[i]!;
      if (i >= CONFLICT_FULL_STACK) {
        factor = 1 + (factor - 1) * CONFLICT_DAMP;
        harmonized = true;
      }
      m *= factor;
    }
    mults[a.id] = clampBuffMult(m);
  }

  return {
    multByAxis: mults,
    harmonized,
    note: harmonized
      ? '同轴词条较多，已做衰减调和（仍夹紧），避免有效分被叠爆。'
      : '',
  };
}

export function composeMultByAxis(entries: YearBuffEntry[]): Record<CraftAxisId, number> {
  return composeMultByAxisDetailed(entries).multByAxis;
}

/** 从 iztro mutagen 数组（顺序禄权科忌）建词条 */
export function buildBuffEntriesFromMutagen(
  yearMutagen: string[],
  yearOrKey: number | string,
  scope: BuffScope = 'year',
): YearBuffEntry[] {
  const entries: YearBuffEntry[] = [];
  const keyBase = String(yearOrKey);
  for (let i = 0; i < KIND_ORDER.length; i++) {
    const star = yearMutagen[i];
    const kind = KIND_ORDER[i]!;
    if (!star) continue;
    const { effects, advice } = effectsForYearMutagen(star, kind, scope);
    entries.push({
      id: `${keyBase}-${kind}-${star}`,
      title: `${star}化${kind}`,
      kind,
      star,
      effects,
      effectLabel: formatEffects(effects),
      advice,
      scope,
    });
  }
  return entries;
}

export function applyBuffToAxes(
  permanentAxes: CraftAxisScore[],
  multByAxis: Record<CraftAxisId, number>,
): CraftAxisScore[] {
  return permanentAxes.map((a) => {
    const mult = clampBuffMult(multByAxis[a.id] ?? 1);
    const effective = Math.round(a.value * mult);
    return {
      ...a,
      permanentValue: a.value,
      buffMult: mult,
      value: effective,
      lit: effective > 0 || a.lit,
    };
  });
}

function clampMonth(m: number): number {
  if (!Number.isFinite(m)) return new Date().getMonth() + 1;
  return Math.min(12, Math.max(1, Math.floor(m)));
}

/**
 * 解析流年+流月 Buff 包。
 * @param month 1–12，默认当前月
 */
export function resolveYearBuffPack(
  person: PersonProfile,
  year: number,
  baziHint = '',
  month?: number,
): YearBuffPack {
  const mo = clampMonth(month ?? new Date().getMonth() + 1);
  const snap = resolveHoroscopeLimits(person, { year, month: mo, day: 15 });
  const yearMutagen = snap?.yearMutagen ?? [];
  const monthMutagen = snap?.monthMutagen ?? [];
  const yearEntries = buildBuffEntriesFromMutagen(yearMutagen, year, 'year');
  const monthEntries = buildBuffEntriesFromMutagen(
    monthMutagen,
    `${year}m${mo}`,
    'month',
  );
  const baziEntries = buildBuffEntriesFromBazi(person, year, mo, {
    layers: ['dayun', 'liunian', 'liuyue'],
  });
  const baziDayun = baziEntries.filter((e) => e.baziLayer === 'dayun');
  const baziYear = baziEntries.filter((e) => e.baziLayer === 'liunian');
  const baziMonth = baziEntries.filter((e) => e.baziLayer === 'liuyue');
  const yearMutagenLine =
    snap?.yearMutagenLine ||
    (yearMutagen.length ? yearMutagen.join(' · ') : '流年四化未能排出');
  const monthMutagenLine =
    snap?.monthMutagenLine ||
    (monthMutagen.length ? monthMutagen.join(' · ') : '流月四化未能排出');
  const allYear = [...yearEntries, ...baziDayun, ...baziYear];
  const allMonth = [...monthEntries, ...baziMonth];
  const composed = composeMultByAxisDetailed([...allYear, ...allMonth]);

  return {
    year,
    month: mo,
    yearGZ: snap?.yearGZ ?? '',
    monthGZ: snap?.monthGZ ?? '',
    mutagenLine: `流年 ${yearMutagenLine} · 流月 ${monthMutagenLine}`,
    yearMutagenLine,
    monthMutagenLine,
    entries: allYear,
    monthEntries: allMonth,
    multByAxis: composed.multByAxis,
    baziHint,
    conflictNote: composed.note || undefined,
  };
}
