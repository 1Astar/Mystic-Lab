import type { BaziChart } from './cast.ts';
import type { SeasonLabel, WuXing } from './elements.ts';
import {
  categorizeTenGod,
  collectTenGodLabels,
  countCategories,
  type TenGodCategory,
} from './ten-gods.ts';

export type BaziFacts = {
  dayMaster: string;
  dayMasterWx: WuXing | '';
  dayStrength: SeasonLabel;
  monthStemGod: string;
  monthCategory: TenGodCategory | null;
  categoryCounts: Record<TenGodCategory, number>;
  /** 按出现次数降序，最多 3 类 */
  dominantCategories: TenGodCategory[];
  labels: string[];
  relationCount: number;
  hasHour: boolean;
  trueSolarLabel: string;
};

const CAT_ORDER: TenGodCategory[] = [
  'guan_sha',
  'cai',
  'shi_shang',
  'yin',
  'bi_jie',
];

export function dayStrengthOf(chart: BaziChart): SeasonLabel {
  const wx = chart.dayMasterWx;
  if (!wx) return '休';
  return chart.season.find((s) => s.label === wx)?.strength ?? '休';
}

/** 从排盘结果抽取可回溯事实（内部可含术语，UI 证据层用人话） */
export function buildBaziFacts(chart: BaziChart): BaziFacts {
  const labels = collectTenGodLabels(chart);
  const categoryCounts = countCategories(labels);
  const dominantCategories = CAT_ORDER.filter((c) => categoryCounts[c] > 0).sort(
    (a, b) => categoryCounts[b] - categoryCounts[a] || CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b),
  ).slice(0, 3);

  const month = chart.pillars.find((p) => p.key === 'month');
  const monthStemGod =
    month && !month.empty ? month.stemGod.trim() : '—';

  return {
    dayMaster: chart.dayMaster,
    dayMasterWx: chart.dayMasterWx,
    dayStrength: dayStrengthOf(chart),
    monthStemGod,
    monthCategory: categorizeTenGod(monthStemGod),
    categoryCounts,
    dominantCategories,
    labels,
    relationCount: chart.relations.length,
    hasHour: chart.hasHour,
    trueSolarLabel: chart.trueSolarLabel,
  };
}
