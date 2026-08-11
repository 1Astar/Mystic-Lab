/**
 * 造命 · 流年 Buff（方案2）
 * 紫微流年四化 → 限时系数；永久分不变，有效分 = 永久 × 系数（夹紧 0.5～1.8）
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

export const BUFF_MULT_MIN = 0.5;
export const BUFF_MULT_MAX = 1.8;

export type BuffEffect = {
  axis: CraftAxisId;
  mult: number;
};

export type YearBuffEntry = {
  id: string;
  title: string;
  kind: MutagenKind;
  star: string;
  effects: BuffEffect[];
  effectLabel: string;
  advice: string;
};

export type YearBuffPack = {
  year: number;
  yearGZ: string;
  mutagenLine: string;
  entries: YearBuffEntry[];
  /** 六轴最终乘子（已夹紧） */
  multByAxis: Record<CraftAxisId, number>;
  /** 八字弱提示，不改系数 */
  baziHint: string;
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

/** 单条四化 → 轴乘子与白话（忌=考验，不说倒霉） */
export function effectsForYearMutagen(star: string, kind: MutagenKind): {
  effects: BuffEffect[];
  advice: string;
} {
  const home = axisForMajor(star);

  if (kind === '忌') {
    const soft = home ?? 'tongbian';
    return {
      effects: [
        { axis: soft, mult: 0.7 },
        { axis: 'yeli', mult: 1.6 },
      ],
      advice: `本年限时：${star}化忌——「${axisLabel(soft)}」不宜靠小聪明硬推；「业力」暴涨，适合硬扛复盘或向「温养」高的人求助。考验不是倒霉。`,
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
      advice: `本年限时：${star}化禄——资源与满足感更容易来，可主动推进，但仍留弹性。`,
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
      advice: `本年限时：${star}化权——适合站到台前拍板，也别一个人扛完。`,
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
    advice: `本年限时：${star}化科——名声与求教线索可借力，适合展示与学习。`,
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

export function composeMultByAxis(entries: YearBuffEntry[]): Record<CraftAxisId, number> {
  const mults = emptyMultByAxis();
  for (const e of entries) {
    for (const fx of e.effects) {
      mults[fx.axis] *= fx.mult;
    }
  }
  for (const a of CRAFT_AXES) {
    mults[a.id] = clampBuffMult(mults[a.id]);
  }
  return mults;
}

/** 从 iztro 流年 mutagen 数组（顺序禄权科忌）建词条 */
export function buildBuffEntriesFromMutagen(
  yearMutagen: string[],
  year: number,
): YearBuffEntry[] {
  const entries: YearBuffEntry[] = [];
  for (let i = 0; i < KIND_ORDER.length; i++) {
    const star = yearMutagen[i];
    const kind = KIND_ORDER[i]!;
    if (!star) continue;
    const { effects, advice } = effectsForYearMutagen(star, kind);
    entries.push({
      id: `${year}-${kind}-${star}`,
      title: `${star}化${kind}`,
      kind,
      star,
      effects,
      effectLabel: formatEffects(effects),
      advice,
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

export function resolveYearBuffPack(
  person: PersonProfile,
  year: number,
  baziHint = '',
): YearBuffPack {
  const snap = resolveHoroscopeLimits(person, { year, month: 6, day: 15 });
  const yearMutagen = snap?.yearMutagen ?? [];
  const entries = buildBuffEntriesFromMutagen(yearMutagen, year);
  return {
    year,
    yearGZ: snap?.yearGZ ?? '',
    mutagenLine: snap?.yearMutagenLine || (yearMutagen.length ? yearMutagen.join(' · ') : '流年四化未能排出'),
    entries,
    multByAxis: composeMultByAxis(entries),
    baziHint,
  };
}
