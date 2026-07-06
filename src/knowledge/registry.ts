import { MAJOR_FIVE_HOTSPOTS, MAJOR_FIVE_KNOWLEDGE } from './cards/major-five.ts';
import type { CardKnowledge, CardVisualHotspots, SceneMeaningKey } from './types.ts';
import { TOPIC_TO_SCENE_KEY, type QuestionTopic } from './types.ts';
import type { CardDefinition } from '../tarot/deck.ts';

const knowledgeByDeckId = new Map<string, CardKnowledge>();
const knowledgeById = new Map<string, CardKnowledge>();
const hotspotsByDeckId = new Map<string, CardVisualHotspots>();

for (const card of MAJOR_FIVE_KNOWLEDGE) {
  knowledgeByDeckId.set(card.deckId, card);
  knowledgeById.set(card.id, card);
}

for (const visual of MAJOR_FIVE_HOTSPOTS) {
  hotspotsByDeckId.set(visual.deckId, visual);
}

export function getCardKnowledgeByDeckId(deckId: string): CardKnowledge | undefined {
  return knowledgeByDeckId.get(deckId);
}

export function getCardKnowledgeById(knowledgeId: string): CardKnowledge | undefined {
  return knowledgeById.get(knowledgeId);
}

export function getVisualHotspots(deckId: string): CardVisualHotspots | undefined {
  return hotspotsByDeckId.get(deckId);
}

export function hasKnowledgeEntry(deckId: string): boolean {
  return knowledgeByDeckId.has(deckId);
}

export function getSceneMeaning(
  knowledge: CardKnowledge,
  topic: QuestionTopic,
  reversed: boolean,
): string {
  const key: SceneMeaningKey = TOPIC_TO_SCENE_KEY[topic];
  const base = knowledge[key];
  if (!reversed) return base;
  return `（逆位时）${base} 此时更需留意阻滞、过度或失衡的一面。`;
}

/** 无知识库条目时，从 deck 定义生成最小 fallback */
export function fallbackKnowledgeFromDeck(card: CardDefinition): CardKnowledge {
  return {
    id: card.id,
    deckId: card.id,
    nameCn: card.nameZh,
    nameEn: card.nameEn,
    arcana: card.arcana,
    number: 0,
    keywords: card.keywords,
    oneSentence: card.upright.split('。')[0] + '。',
    uprightMeaning: card.upright,
    reversedMeaning: card.reversed,
    workMeaning: `在工作议题中，${card.nameZh}常与${card.keywords.join('、')}相关。`,
    loveMeaning: `在感情议题中，${card.nameZh}常与${card.keywords.join('、')}相关。`,
    studyMeaning: `在学业议题中，${card.nameZh}常与${card.keywords.join('、')}相关。`,
    selfMeaning: `在自我状态中，${card.nameZh}映照${card.keywords.join('、')}的主题。`,
  };
}

export function resolveCardKnowledge(card: CardDefinition): CardKnowledge {
  return getCardKnowledgeByDeckId(card.id) ?? fallbackKnowledgeFromDeck(card);
}
