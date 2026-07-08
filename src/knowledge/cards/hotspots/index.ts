import { MAJOR_ARCANA_HOTSPOTS } from './major-arcana.ts';
import { SWORDS_MINOR_HOTSPOTS } from './swords-minor.ts';
import type { CardVisualHotspots } from '../../types.ts';

export { MAJOR_ARCANA_HOTSPOTS, SWORDS_MINOR_HOTSPOTS };

/** 全部已配置牌面热点（22 大阿尔克那 + 14 宝剑） */
export const CARD_HOTSPOTS: CardVisualHotspots[] = [
  ...MAJOR_ARCANA_HOTSPOTS,
  ...SWORDS_MINOR_HOTSPOTS,
];

export function getHotspotCount(): number {
  return CARD_HOTSPOTS.length;
}
