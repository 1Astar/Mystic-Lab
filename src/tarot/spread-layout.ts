import type { SpreadDefinition, SpreadType } from './spreads.ts';

/** 牌阵盘坐标：相对盘面宽高的百分比（中心点） */
export type SlotLayout = {
  x: number;
  y: number;
};

const ROW3: SlotLayout[] = [
  { x: 18, y: 46 },
  { x: 50, y: 46 },
  { x: 82, y: 46 },
];

/** 五镜阵：小十字 */
const FIVE_CROSS: SlotLayout[] = [
  { x: 50, y: 18 }, // 情况
  { x: 18, y: 48 }, // 阻碍
  { x: 50, y: 48 }, // 建议
  { x: 82, y: 48 }, // 外在
  { x: 50, y: 80 }, // 结果
];

export function defaultLayoutsForCount(count: number): SlotLayout[] {
  const n = Math.max(1, count);
  if (n === 1) return [{ x: 50, y: 48 }];
  if (n === 2) return [
    { x: 32, y: 48 },
    { x: 68, y: 48 },
  ];
  if (n === 3) return [...ROW3];
  if (n === 4) {
    return [
      { x: 32, y: 28 },
      { x: 68, y: 28 },
      { x: 32, y: 68 },
      { x: 68, y: 68 },
    ];
  }
  if (n === 5) return [...FIVE_CROSS];
  // 6–7：上排 3 / 下排其余
  const top = Math.ceil(n / 2);
  const bottom = n - top;
  const row = (len: number, y: number): SlotLayout[] => {
    if (len === 1) return [{ x: 50, y }];
    return Array.from({ length: len }, (_, i) => ({
      x: 16 + (i * 68) / Math.max(1, len - 1),
      y,
    }));
  };
  return [...row(top, 30), ...row(bottom, 70)];
}

const PRESET_LAYOUTS: Partial<Record<SpreadType, SlotLayout[]>> = {
  single: [{ x: 50, y: 48 }],
  'past-present-future': ROW3,
  'situation-obstacle-advice': ROW3,
  'five-lens': FIVE_CROSS,
};

export function layoutsForSpread(spread: SpreadDefinition): SlotLayout[] {
  const preset = PRESET_LAYOUTS[spread.type];
  if (preset && preset.length === spread.positions.length) return preset.map((p) => ({ ...p }));
  return defaultLayoutsForCount(spread.positions.length);
}

export function isFreeArrangeSpread(type: SpreadType): boolean {
  return type === 'custom';
}
