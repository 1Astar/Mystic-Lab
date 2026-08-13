/**
 * 星曜浏览轴：主星 / 吉星 / 煞星 / 辅曜 / 杂曜 / 神煞（与 STAR_BUCKET 对齐）
 */
import type { StarBucket } from './codex-taxonomy.ts';
import { STAR_BUCKET_META } from './codex-taxonomy.ts';

export type StarMeetFilter = 'collected' | 'all' | 'favorite';
/** 与图鉴 StarBucket 同序，便于顶栏六档 */
export type StarKindFilter = StarBucket;

export const STAR_MEET_META: Record<
  StarMeetFilter,
  { title: string; blurb: string; icon: string }
> = {
  collected: { title: '已收集', blurb: '已激活，或盘中相遇待试炼的星曜', icon: '📦' },
  all: { title: '全部', blurb: '按类型浏览完整图鉴', icon: '📚' },
  favorite: { title: '收藏', blurb: '你标星收藏的条目', icon: '⭐' },
};

export const STAR_KIND_META: Record<StarKindFilter, { title: string; blurb: string }> = {
  major: { title: '十四主星', blurb: STAR_BUCKET_META.major.blurb },
  lucky: { title: '六吉', blurb: STAR_BUCKET_META.lucky.blurb },
  sha: { title: '六煞', blurb: STAR_BUCKET_META.sha.blurb },
  aux: { title: '辅曜', blurb: STAR_BUCKET_META.aux.blurb },
  minor: { title: '杂曜', blurb: STAR_BUCKET_META.minor.blurb },
  shensha: { title: '神煞', blurb: STAR_BUCKET_META.shensha.blurb },
};

export const STAR_KIND_ORDER: StarKindFilter[] = [
  'major',
  'lucky',
  'sha',
  'aux',
  'minor',
  'shensha',
];

/** 旧 bucket URL → kind（现已一一对应） */
export function starBucketToKind(bucket: StarBucket): StarKindFilter {
  return bucket;
}

/** kind → 写回 URL 的 bucket */
export function starKindToBucket(kind: StarKindFilter): StarBucket {
  return kind;
}

export function parseStarMeet(raw: string | null | undefined): StarMeetFilter {
  if (raw === 'collected' || raw === 'favorite' || raw === 'all') return raw;
  if (raw === 'in_chart') return 'collected';
  return 'all';
}
