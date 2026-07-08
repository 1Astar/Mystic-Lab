import { CUPS_MINOR_HOTSPOTS } from './cups-minor.ts';
import { MAJOR_ARCANA_HOTSPOTS } from './major-arcana.ts';
import { PENTACLES_MINOR_HOTSPOTS } from './pentacles-minor.ts';
import { SWORDS_MINOR_HOTSPOTS } from './swords-minor.ts';
import { WANDS_MINOR_HOTSPOTS } from './wands-minor.ts';
import type { CardVisualHotspots } from '../../types.ts';

export {
  CUPS_MINOR_HOTSPOTS,
  MAJOR_ARCANA_HOTSPOTS,
  PENTACLES_MINOR_HOTSPOTS,
  SWORDS_MINOR_HOTSPOTS,
  WANDS_MINOR_HOTSPOTS,
};

/** 全部已配置牌面热点（78 张完整覆盖） */
export const CARD_HOTSPOTS: CardVisualHotspots[] = [
  ...MAJOR_ARCANA_HOTSPOTS,
  ...WANDS_MINOR_HOTSPOTS,
  ...CUPS_MINOR_HOTSPOTS,
  ...SWORDS_MINOR_HOTSPOTS,
  ...PENTACLES_MINOR_HOTSPOTS,
];

export function getHotspotCount(): number {
  return CARD_HOTSPOTS.length;
}
