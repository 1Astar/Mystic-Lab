import type { ParallelWorld } from './types.ts';

export type ForkPreset = {
  id: string;
  label: string;
  divergence: string;
};

/** 预设分叉：一点即可，文案可改 */
export const FORK_PRESETS: ForkPreset[] = [
  {
    id: 'stay',
    label: '世界 A',
    divergence: '没有辞职的我',
  },
  {
    id: 'bigtech',
    label: '世界 B',
    divergence: '去了大厂的我',
  },
  {
    id: 'startup',
    label: '世界 C',
    divergence: '创业的我',
  },
  {
    id: 'abroad',
    label: '世界 D',
    divergence: '去了国外的我',
  },
  {
    id: 'hometown',
    label: '世界 E',
    divergence: '回到家乡的我',
  },
  {
    id: 'passion',
    label: '世界 F',
    divergence: '转行做热爱之事的我',
  },
];

const WORLD_LABELS = ['世界 A', '世界 B', '世界 C', '世界 D', '世界 E', '世界 F'];

export function buildDefaultWorlds(): ParallelWorld[] {
  return FORK_PRESETS.map((p, i) => ({
    id: p.id,
    label: WORLD_LABELS[i] ?? `世界 ${i + 1}`,
    divergence: p.divergence,
    selected: i < 4,
  }));
}
