import type { SixGodId } from './six-gods.ts';

/**
 * 掌诀坐标库（算法/动画单源）：
 * 相对掌图框 0–100；左手掌诀，仅食/中/无名的上节与下节。
 * 顺时针：大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡
 *
 * 换 UI（3D / AR / 主题手）只改这份坐标，不改起课算法。
 */
export type PalmFinger = '食指' | '中指' | '无名指';
export type PalmSegment = '上节' | '下节';

export type LiurenPoint = {
  id: number;
  index: number;
  godId: SixGodId;
  name: string;
  hand: 'left';
  finger: PalmFinger;
  segment: PalmSegment;
  x: number;
  y: number;
  /** 名称标签相对节点外偏（px） */
  lx: number;
  ly: number;
};

export const LIUREN_POINTS: readonly LiurenPoint[] = [
  { id: 1, index: 0, godId: 'da-an', name: '大安', hand: 'left', finger: '食指', segment: '下节', x: 41, y: 35, lx: -50, ly: 8 },
  { id: 2, index: 1, godId: 'liu-lian', name: '留连', hand: 'left', finger: '食指', segment: '上节', x: 41, y: 18, lx: -46, ly: -28 },
  { id: 3, index: 2, godId: 'su-xi', name: '速喜', hand: 'left', finger: '中指', segment: '上节', x: 50.5, y: 16, lx: 0, ly: -40 },
  { id: 4, index: 3, godId: 'chi-kou', name: '赤口', hand: 'left', finger: '无名指', segment: '上节', x: 59.5, y: 18, lx: 46, ly: -28 },
  { id: 5, index: 4, godId: 'xiao-ji', name: '小吉', hand: 'left', finger: '无名指', segment: '下节', x: 59.5, y: 35, lx: 50, ly: 8 },
  { id: 6, index: 5, godId: 'kong-wang', name: '空亡', hand: 'left', finger: '中指', segment: '下节', x: 50.5, y: 34, lx: 0, ly: 36 },
] as const;

export const LIUREN_ORIGIN = LIUREN_POINTS[0];

export function formatPalmAnchor(point: Pick<LiurenPoint, 'finger' | 'segment'>): string {
  return `${point.finger}${point.segment}`;
}

export function getLiurenPoint(index: number): LiurenPoint {
  const n = ((index % 6) + 6) % 6;
  return LIUREN_POINTS[n];
}

export function getLiurenPointCoords(index: number): { x: number; y: number } {
  const p = getLiurenPoint(index);
  return { x: p.x, y: p.y };
}

export const ORBIT_POSITIONS = LIUREN_POINTS.map((p) => ({ x: p.x, y: p.y }));
