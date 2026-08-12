/**
 * 星曜浏览轴：已收集 / 全部 / 收藏 + 全部下 主星 / 配角 / 神煞色调
 */
import type { StarBucket } from './codex-taxonomy.ts';

export type StarMeetFilter = 'collected' | 'all' | 'favorite';
export type StarKindFilter = 'major' | 'support' | 'shensha';

export const STAR_MEET_META: Record<StarMeetFilter, { title: string; blurb: string }> = {
  collected: { title: '已收集', blurb: '已觉醒或盘中遇见的星曜' },
  all: { title: '全部', blurb: '按类型浏览完整图鉴' },
  favorite: { title: '收藏', blurb: '你标星收藏的条目' },
};

export const STAR_KIND_META: Record<StarKindFilter, { title: string; blurb: string }> = {
  major: { title: '主星', blurb: '十四主星 · 主角海报' },
  support: { title: '配角', blurb: '吉星 · 煞星 · 辅曜 · 杂曜' },
  shensha: { title: '神煞色调', blurb: '议题色调 · 勿单断' },
};

export const STAR_KIND_ORDER: StarKindFilter[] = ['major', 'support', 'shensha'];

/** 旧 bucket URL → 新 kind */
export function starBucketToKind(bucket: StarBucket): StarKindFilter {
  if (bucket === 'shensha') return 'shensha';
  if (bucket === 'major') return 'major';
  return 'support';
}

/** kind → 写回 URL 的 bucket（兼容深链） */
export function starKindToBucket(kind: StarKindFilter): StarBucket {
  if (kind === 'shensha') return 'shensha';
  if (kind === 'major') return 'major';
  return 'lucky';
}

export function parseStarMeet(raw: string | null | undefined): StarMeetFilter {
  if (raw === 'collected' || raw === 'favorite' || raw === 'all') return raw;
  if (raw === 'in_chart') return 'collected';
  return 'all';
}
