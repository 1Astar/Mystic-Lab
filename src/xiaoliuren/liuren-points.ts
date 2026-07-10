import type { SixGodId } from './six-gods.ts';

/** 掌诀落点：无名指第三节起，顺时针 大安→留连→速喜→赤口→小吉→空亡 */
export type LiurenPoint = {
  id: number;
  index: number;
  godId: SixGodId;
  name: string;
  x: number;
  y: number;
  anchor: string;
};

export const LIUREN_POINTS: readonly LiurenPoint[] = [
  { id: 1, index: 0, godId: 'da-an', name: '大安', x: 57, y: 27, anchor: '无名指第三节' },
  { id: 2, index: 1, godId: 'liu-lian', name: '留连', x: 73, y: 31, anchor: '小指第三节' },
  { id: 3, index: 2, godId: 'su-xi', name: '速喜', x: 71, y: 48, anchor: '小指根部' },
  { id: 4, index: 3, godId: 'chi-kou', name: '赤口', x: 52, y: 62, anchor: '掌根正中' },
  { id: 5, index: 4, godId: 'xiao-ji', name: '小吉', x: 28, y: 46, anchor: '拇指侧掌缘' },
  { id: 6, index: 5, godId: 'kong-wang', name: '空亡', x: 40, y: 28, anchor: '食指第三节' },
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
