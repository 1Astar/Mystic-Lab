/**
 * compareHepan → 关系标签（规则，无 AI）
 */
import { compareHepan, type BaziChart, type HepanCompare } from '../bazi/cast.ts';
import type { MatchmakerCast } from './cast.ts';

export type RelationTag =
  | 'bond' // 日支合/半合
  | 'friction' // 冲刑害
  | 'warm' // 财/食伤互看
  | 'duty' // 官杀
  | 'peer' // 比劫
  | 'care'; // 印星

export type HepanTags = {
  hepan: HepanCompare;
  tags: RelationTag[];
  dayBranches: [string, string];
  dayGz: [string, string];
};

function lineHas(lines: string[], ...keys: string[]): boolean {
  return lines.some((l) => keys.some((k) => l.includes(k)));
}

function godBucket(god: string): RelationTag | null {
  if (/财/.test(god)) return 'warm';
  if (/食|伤/.test(god)) return 'warm';
  if (/官|杀/.test(god)) return 'duty';
  if (/比|劫/.test(god)) return 'peer';
  if (/印/.test(god)) return 'care';
  return null;
}

export function tagsFromHepan(a: BaziChart, b: BaziChart): HepanTags {
  const hepan = compareHepan(a, b);
  const tags = new Set<RelationTag>();
  const rel = hepan.dayRelation;

  if (lineHas(rel, '合', '半合')) tags.add('bond');
  if (lineHas(rel, '冲', '刑', '害')) tags.add('friction');

  for (const g of [hepan.selfToPartner, hepan.partnerToSelf]) {
    const bucket = godBucket(g);
    if (bucket) tags.add(bucket);
  }

  if (tags.size === 0) tags.add('peer');

  return {
    hepan,
    tags: [...tags],
    dayBranches: [a.dayBranch, b.dayBranch],
    dayGz: [`${a.dayMaster}${a.dayBranch}`, `${b.dayMaster}${b.dayBranch}`],
  };
}

export function tagsFromCasts(a: MatchmakerCast, b: MatchmakerCast): HepanTags {
  return tagsFromHepan(a.bazi, b.bazi);
}

export function tagLabel(t: RelationTag): string {
  switch (t) {
    case 'bond':
      return '日支有合';
    case 'friction':
      return '日支有冲刑害';
    case 'warm':
      return '十神偏财食（易互相欣赏）';
    case 'duty':
      return '十神见官杀（规矩与压力）';
    case 'peer':
      return '十神比劫（同辈拉扯）';
    case 'care':
      return '十神见印（照应与依赖）';
    default:
      return t;
  }
}
