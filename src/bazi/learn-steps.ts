/** L2 出生密码五步：文案与 step id */

export const LEARN_STEPS = [
  { id: 1, label: '出生时间', short: '时间' },
  { id: 2, label: '四柱', short: '四柱' },
  { id: 3, label: '五行', short: '五行' },
  { id: 4, label: '十神', short: '十神' },
  { id: 5, label: '人生主题', short: '主题' },
] as const;

export type LearnStepId = (typeof LEARN_STEPS)[number]['id'];

export function parseLearnStep(raw: string | null | undefined): LearnStepId {
  const n = Number(raw);
  if (n >= 1 && n <= 5) return n as LearnStepId;
  return 2;
}

export const TEN_GOD_PLAIN: Record<string, string> = {
  正官: '结构与责任',
  七杀: '压力与突破',
  正财: '稳健资源',
  偏财: '流动机会',
  正印: '支持与学习',
  偏印: '独特思路',
  食神: '表达与享受',
  伤官: '创意与锋芒',
  比肩: '同侪并肩',
  劫财: '争夺与互换',
  日主: '你自己',
};
