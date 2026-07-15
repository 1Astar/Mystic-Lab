import type { SixGodId } from './six-gods.ts';

/**
 * 掌诀落点（左手掌心图，坐标相对掌图框 0–100）：
 * 仅用食指 / 中指 / 无名指的上节与下节，跳过中节。
 * 顺时针：大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡
 *
 * x/y：指节圆心（节点数字 + 动画亮点）
 * lx/ly：名称标签相对节点的外偏（px）
 */
export type LiurenPoint = {
  id: number;
  index: number;
  godId: SixGodId;
  name: string;
  x: number;
  y: number;
  lx: number;
  ly: number;
  anchor: string;
};

export const LIUREN_POINTS: readonly LiurenPoint[] = [
  { id: 1, index: 0, godId: 'da-an', name: '大安', x: 41, y: 35, lx: -50, ly: 8, anchor: '食指下节' },
  { id: 2, index: 1, godId: 'liu-lian', name: '留连', x: 41, y: 18, lx: -46, ly: -28, anchor: '食指上节' },
  { id: 3, index: 2, godId: 'su-xi', name: '速喜', x: 50.5, y: 16, lx: 0, ly: -40, anchor: '中指上节' },
  { id: 4, index: 3, godId: 'chi-kou', name: '赤口', x: 59.5, y: 18, lx: 46, ly: -28, anchor: '无名指上节' },
  { id: 5, index: 4, godId: 'xiao-ji', name: '小吉', x: 59.5, y: 35, lx: 50, ly: 8, anchor: '无名指下节' },
  { id: 6, index: 5, godId: 'kong-wang', name: '空亡', x: 50.5, y: 34, lx: 0, ly: 36, anchor: '中指下节' },
] as const;

export const LIUREN_ORIGIN = LIUREN_POINTS[0];

export function getLiurenPoint(index: number): LiurenPoint {
  const n = ((index % 6) + 6) % 6;
  return LIUREN_POINTS[n];
}

export function getLiurenPointCoords(index: number): { x: number; y: number } {
  const p = getLiurenPoint(index);
  return { x: p.x, y: p.y };
}

/** @deprecated 使用 getLiurenPointCoords */
export const ORBIT_POSITIONS = LIUREN_POINTS.map((p) => ({ x: p.x, y: p.y }));
