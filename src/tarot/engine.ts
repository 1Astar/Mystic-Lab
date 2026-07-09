import { TAROT_DECK, type CardDefinition } from './deck.ts';

export type DrawnCard = {
  card: CardDefinition;
  reversed: boolean;
  position?: string;
  positionKey?: string;
};

export function shuffleDeck<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawCards(count: number, reversedChance = 0.3): DrawnCard[] {
  const shuffled = shuffleDeck(TAROT_DECK);
  return shuffled.slice(0, count).map((card) => ({
    card,
    reversed: Math.random() < reversedChance,
  }));
}

export function drawClarifierCard(excludeIds: string[]): DrawnCard | null {
  const available = TAROT_DECK.filter((c) => !excludeIds.includes(c.id));
  if (available.length === 0) return null;
  const shuffled = shuffleDeck(available);
  const card = shuffled[0]!;
  return {
    card,
    reversed: Math.random() < 0.3,
    position: '补牌',
    positionKey: 'clarifier',
  };
}

export function cardLabel(drawn: DrawnCard): string {
  const suffix = drawn.reversed ? '（逆位）' : '（正位）';
  return `${drawn.card.nameZh}${suffix}`;
}
