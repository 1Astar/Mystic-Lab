import { LunarUtil } from 'lunar-javascript';

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const CHANG_SHENG = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

/** 某干对某支的十二长生（自坐用本柱干；地势用日主） */
export function changShengOf(stem: string, branch: string): string {
  const ganIndex = GAN.indexOf(stem);
  const zhiIndex = ZHI.indexOf(branch);
  if (ganIndex < 0 || zhiIndex < 0) return '—';
  const offsetTable = LunarUtil.CHANG_SHENG_OFFSET as Record<string, number>;
  const offset = offsetTable[stem];
  if (offset === undefined) return '—';
  let index = offset + (ganIndex % 2 === 0 ? zhiIndex : -zhiIndex);
  index %= 12;
  if (index < 0) index += 12;
  return CHANG_SHENG[index] ?? '—';
}

export function ziZuoOf(stem: string, branch: string): string {
  return changShengOf(stem, branch);
}

export function diShiOf(dayStem: string, branch: string): string {
  return changShengOf(dayStem, branch);
}

export function nayinOf(ganzhi: string): string {
  const table = LunarUtil.NAYIN as Record<string, string>;
  return table[ganzhi] || '—';
}

export function xunKongOf(ganzhi: string): string {
  if (typeof LunarUtil.getXunKong === 'function') {
    return LunarUtil.getXunKong(ganzhi) || '—';
  }
  return '—';
}
