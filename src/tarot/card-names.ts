import type { CardDefinition } from './deck.ts';

/** 中文牌名（如「宝剑王牌」「愚者」） */
export function formatCardNameZh(card: CardDefinition): string {
  return card.nameZh;
}

/** 英文牌名（如「Ace of Swords」） */
export function formatCardNameEn(card: CardDefinition): string {
  return card.nameEn;
}
