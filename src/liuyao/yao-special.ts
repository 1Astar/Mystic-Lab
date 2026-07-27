/**
 * 六爻特殊讲法（教学近似）：暗动、月破、六冲等。
 * 只标「能算清、出现才补」的情况。
 */
import type { YaoDress } from './najia.ts';
import { WX_KE, type WuXing } from './wuxing.ts';

/** 地支六冲 */
export const LIU_CHONG: Record<string, string> = {
  子: '午',
  午: '子',
  丑: '未',
  未: '丑',
  寅: '申',
  申: '寅',
  卯: '酉',
  酉: '卯',
  辰: '戌',
  戌: '辰',
  巳: '亥',
  亥: '巳',
};

export function isBranchLiuChong(a: string, b: string): boolean {
  return Boolean(a && b && LIU_CHONG[a] === b);
}

/** 日冲暗动：表上没标动，但地支被日支六冲 */
export function isAnDong(
  row: Pick<YaoDress, 'changing' | 'branch'>,
  dayBranch: string,
): boolean {
  return !row.changing && isBranchLiuChong(row.branch, dayBranch);
}

/** 月破：爻支与月建六冲（力气易被月令冲散） */
export function isYuePo(row: Pick<YaoDress, 'branch'>, monthBranch: string): boolean {
  return isBranchLiuChong(row.branch, monthBranch);
}

/** 明动或暗动，都算「在起作用」 */
export function isEffectivelyMoving(
  row: Pick<YaoDress, 'changing' | 'branch'>,
  dayBranch: string,
): boolean {
  return row.changing || isAnDong(row, dayBranch);
}

export type YaoMoveMark = '动' | '暗动';

export function yaoMoveMark(
  row: Pick<YaoDress, 'changing' | 'branch'>,
  dayBranch: string,
): YaoMoveMark | null {
  if (row.changing) return '动';
  if (isAnDong(row, dayBranch)) return '暗动';
  return null;
}

/** 化回头克：变爻五行克本爻五行 */
export function isHuiTouKe(
  row: Pick<YaoDress, 'changing' | 'wuxing' | 'changedWuxing'>,
): boolean {
  if (!row.changing || !row.changedWuxing) return false;
  return WX_KE[row.changedWuxing as WuXing] === row.wuxing;
}

export type YaoSpecialFlags = {
  move: YaoMoveMark | null;
  anDong: boolean;
  yuePo: boolean;
  huiTouKe: boolean;
  kong: boolean;
  linRi: boolean;
};

export function buildYaoSpecialFlags(
  row: YaoDress,
  opts: { dayBranch: string; monthBranch: string; dayXunKong: string },
): YaoSpecialFlags {
  const anDong = isAnDong(row, opts.dayBranch);
  return {
    move: yaoMoveMark(row, opts.dayBranch),
    anDong,
    yuePo: isYuePo(row, opts.monthBranch),
    huiTouKe: isHuiTouKe(row),
    kong: Boolean(row.branch) && opts.dayXunKong.includes(row.branch),
    linRi: row.branch === opts.dayBranch,
  };
}

/** 短标签列表，供爻卡 / 花名册 */
export function formatYaoSpecialTags(flags: YaoSpecialFlags): string[] {
  const tags: string[] = [];
  if (flags.move === '动') tags.push('动');
  if (flags.move === '暗动') tags.push('暗动');
  if (flags.huiTouKe) tags.push('回头克');
  if (flags.yuePo) tags.push('月破');
  if (flags.kong) tags.push('旬空');
  if (flags.linRi) tags.push('临日');
  return tags;
}
