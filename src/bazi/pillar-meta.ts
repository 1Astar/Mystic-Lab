import { LunarUtil } from 'lunar-javascript';
import type { BaziChart } from './cast.ts';

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const CHANG_SHENG = [
  '长生',
  '沐浴',
  '冠带',
  '临官',
  '帝旺',
  '衰',
  '病',
  '死',
  '墓',
  '绝',
  '胎',
  '养',
] as const;

export type ChangShengStage = (typeof CHANG_SHENG)[number];

/** 十二长生通识（盘面地势/自坐共用） */
export const CHANG_SHENG_GLOSS: Record<ChangShengStage, string> = {
  长生: '能量刚萌芽，像种子破土，宜养不宜硬冲。',
  沐浴: '气场显露、易受感召，也易浮躁，宜收敛锋芒。',
  冠带: '开始成形、被看见，适合学习与装扮门面。',
  临官: '得位得力，行动与责任感较强。',
  帝旺: '气势最旺，表现力与冲劲都足，也要注意过满。',
  衰: '由盛转缓，宜守成、复盘，少开新战场。',
  病: '气机偏弱或受阻，宜养息、就医式地排查问题。',
  死: '旧局收束，适合放下与交接，不宜硬扛。',
  墓: '入库收藏，资源与心思更内敛，宜沉淀。',
  绝: '旧气已尽、新气未生，空档期适合清理。',
  胎: '念头初结，适合酝酿，不宜过早宣扬。',
  养: '在孕育中，宜耐心培养，少催熟。',
};

export function isChangShengStage(term: string): term is ChangShengStage {
  return (CHANG_SHENG as readonly string[]).includes(term);
}

/** 命盘摘要：地势/自坐落点 + 通识 */
export function changShengChartBrief(stage: ChangShengStage, chart: BaziChart | null): string {
  const gloss = `十二长生之一：${CHANG_SHENG_GLOSS[stage]}`;
  if (!chart) {
    return `${stage}：${gloss}\n填写出生信息后，这里会标出地势/自坐落在哪一柱。`;
  }
  const natal = chart.pillars.filter((p) => !p.empty && p.key !== 'liunian');
  const diHits = natal.filter((p) => p.diShi === stage).map((p) => p.title);
  const zzHits = natal.filter((p) => p.ziZuo === stage).map((p) => p.title);
  const lines = [
    `${stage}：${gloss}`,
    '',
    diHits.length
      ? `地势落在：${diHits.join('、')}（日干「${chart.dayMaster}」对该支的十二长生）`
      : '地势：原局四柱未落此态',
    zzHits.length
      ? `自坐落在：${zzHits.join('、')}（本柱干坐本柱支）`
      : '自坐：原局四柱未落此态',
    '地势看日主在该宫的旺衰段；自坐看该柱自身气机。',
  ];
  return lines.join('\n');
}

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
