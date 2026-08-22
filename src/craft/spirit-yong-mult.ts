/**
 * 造命 · 喜用/忌神弱叠乘六轴（不压过紫微主 Buff）
 */
import type { WuXing } from '../bazi/elements.ts';
import type { PatternYongshenPack } from '../bazi/pattern-yongshen.ts';
import {
  CRAFT_AXES,
  type CraftAxisId,
  type CraftAxisScore,
} from './spirit-roots.ts';
import { clampBuffMult } from './spirit-buff.ts';

/** 五行 → 主轴 */
export const WX_TO_AXIS: Record<WuXing, CraftAxisId> = {
  木: 'tongbian',
  火: 'guangyao',
  土: 'zhenshou',
  金: 'yeli',
  水: 'wenyang',
};

export const YONG_AXIS_DELTA = 0.06;
export const JI_AXIS_DELTA = 0.04;

export function yongJiMultByAxis(
  pack: Pick<PatternYongshenPack, 'yongWx' | 'jiWx'>,
): Record<CraftAxisId, number> {
  const mults: Record<CraftAxisId, number> = {
    guangyao: 1,
    tongbian: 1,
    wenyang: 1,
    zhenshou: 1,
    lingyun: 1,
    yeli: 1,
  };
  for (const wx of pack.yongWx) {
    const axis = WX_TO_AXIS[wx];
    if (axis) mults[axis] *= 1 + YONG_AXIS_DELTA;
  }
  for (const wx of pack.jiWx) {
    const axis = WX_TO_AXIS[wx];
    if (axis) mults[axis] *= 1 - JI_AXIS_DELTA;
  }
  // 喜用略抬灵韵（灵感侧）
  if (pack.yongWx.length) mults.lingyun *= 1 + YONG_AXIS_DELTA * 0.5;
  for (const a of CRAFT_AXES) {
    mults[a.id] = clampBuffMult(mults[a.id]);
  }
  return mults;
}

/** 作用在永久分上，再交给流年 Buff 叠乘 */
export function applyYongShenToAxes(
  axes: CraftAxisScore[],
  pack: Pick<PatternYongshenPack, 'yongWx' | 'jiWx'> | null | undefined,
): CraftAxisScore[] {
  if (!pack || (!pack.yongWx.length && !pack.jiWx.length)) return axes;
  const mults = yongJiMultByAxis(pack);
  return axes.map((a) => {
    const m = mults[a.id] ?? 1;
    if (Math.abs(m - 1) < 1e-9) return a;
    const next = Math.round(a.value * m);
    return {
      ...a,
      value: next,
      sources: a.sources.includes('喜用叠乘')
        ? a.sources
        : [...a.sources, '喜用叠乘'],
    };
  });
}
