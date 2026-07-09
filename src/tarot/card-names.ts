import type { CardDefinition } from './deck.ts';

/** 中文牌名：小阿尔克那用「星币四」格式，不用「四币」 */
export function formatCardNameZh(card: CardDefinition): string {
  if (card.arcana === 'minor' && card.suit && card.rank) {
    const suitZh: Record<string, string> = {
      wands: '权杖',
      cups: '圣杯',
      swords: '宝剑',
      pentacles: '星币',
    };
    const rankZh: Record<string, string> = {
      Ace: '王牌',
      Two: '二',
      Three: '三',
      Four: '四',
      Five: '五',
      Six: '六',
      Seven: '七',
      Eight: '八',
      Nine: '九',
      Ten: '十',
      Page: '侍从',
      Knight: '骑士',
      Queen: '王后',
      King: '国王',
    };
    const suit = suitZh[card.suit] ?? card.suit;
    const rank = rankZh[card.rank] ?? card.rank;
    return `${suit}${rank}`;
  }
  return card.nameZh;
}

/** 英文牌名（如「Ace of Swords」） */
export function formatCardNameEn(card: CardDefinition): string {
  return card.nameEn;
}
