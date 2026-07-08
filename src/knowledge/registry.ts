import { CARD_KNOWLEDGE_OVERRIDES } from './card-overrides.ts';
import { MAJOR_FIVE_HOTSPOTS, MAJOR_FIVE_KNOWLEDGE } from './cards/major-five.ts';
import type { CardKnowledge, CardVisualHotspots, SceneMeaningKey } from './types.ts';
import { TOPIC_TO_SCENE_KEY, type QuestionTopic } from './types.ts';
import type { CardDefinition } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';

const MINOR_ACE_KEYWORDS: Record<string, string[]> = {
  wands: ['灵感', '行动', '火种', '开始', '动力'],
  cups: ['情感', '直觉', '新感受', '敞开', '联结'],
  swords: ['清晰', '真相', '新想法', '决断', '沟通', '理性突破'],
  pentacles: ['机会', '资源', '新起点', '务实', '积累'],
};

const MINOR_ACE_ONE_SENTENCE: Record<string, string> = {
  wands: '权杖王牌像一枚被点燃的火种，代表一股新生的行动力或灵感正在等你接住。',
  cups: '圣杯王牌像一杯刚刚满溢的情感，代表感受、直觉或联结的新开端。',
  swords: '宝剑王牌像一道突然劈开的光，代表一个清晰的新念头、一次理性判断，或者一个需要你直接面对的真相。',
  pentacles: '星币王牌像一粒落在手心的种子，代表一个务实的新机会或值得培育的资源。',
};

const MINOR_ACE_UPRIGHT: Record<string, string> = {
  wands: '它更强调「先动起来」。适合启动项目、尝试新方向，让热情有出口。',
  cups: '它更强调「先感受清楚」。适合表达真实情绪、建立联结，或承认内心的需要。',
  swords: '它更强调「看清楚、说清楚、想清楚」。适合开始规划、沟通、写方案、做决定。',
  pentacles: '它更强调「把机会落地」。适合务实规划、积累资源、迈出可执行的第一步。',
};

function minorWorkMeaning(nameCn: string, suit?: string, rank?: string): string {
  if (rank === 'Ace' && suit === 'swords') {
    return '宝剑王牌在工作问题里，常常对应面试、方案表达、沟通、简历亮点、一次新的职业机会。它不是温柔安抚型的牌，更像一把刀：帮你切开混乱。';
  }
  if (rank === 'Ace') {
    return `${nameCn}在工作议题里，常指向一个新的起点或突破口——机会真实存在，但需要你主动接住并说清楚。`;
  }
  return `工作上，${nameCn}映照当下议题中的关键张力。把它当作提醒，而不是判决。`;
}

function minorLoveMeaning(nameCn: string): string {
  return `感情上，${nameCn}提醒你分辨真实感受与表面冲动。牌在问：你想靠近，还是想确认？`;
}

function minorStudyMeaning(nameCn: string): string {
  return `学业上，${nameCn}指向方法与节奏的调整。问问自己：是在成长，还是在用忙碌证明自己？`;
}

function minorSelfMeaning(nameCn: string): string {
  return `自我层面，${nameCn}照见此刻最需要被正视的主题。答案往往藏在你已经知道、却还没说出口的部分。`;
}

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
  const nameCn = formatCardNameZh(card);
  const isMinorAce = card.arcana === 'minor' && card.rank === 'Ace' && card.suit;
  const override = CARD_KNOWLEDGE_OVERRIDES[card.id];

  const keywords = override?.keywords
    ?? (isMinorAce ? MINOR_ACE_KEYWORDS[card.suit!] ?? card.keywords : card.keywords);

  const oneSentence = override?.oneSentence
    ?? (isMinorAce
      ? MINOR_ACE_ONE_SENTENCE[card.suit!] ?? `${nameCn}带来与当下议题相关的新开端。`
      : `${nameCn}指向与当下议题相关的关键主题。`);

  const uprightMeaning = override?.uprightMeaning
    ?? (isMinorAce
      ? MINOR_ACE_UPRIGHT[card.suit!] ?? '正位时，牌的能量顺畅流动，适合顺势而为。'
      : card.upright.replace(/^[^：]+：/, '').trim());

  const reversedMeaning = override?.reversedMeaning
    ?? card.reversed.replace(/^[^：]+：/, '').trim();

  return {
    id: card.id,
    deckId: card.id,
    nameCn,
    nameEn: card.nameEn,
    arcana: card.arcana,
    number: 0,
    keywords,
    oneSentence,
    uprightMeaning,
    reversedMeaning,
    workMeaning: minorWorkMeaning(nameCn, card.suit, card.rank),
    loveMeaning: minorLoveMeaning(nameCn),
    studyMeaning: minorStudyMeaning(nameCn),
    selfMeaning: minorSelfMeaning(nameCn),
  };
}

export function resolveCardKnowledge(card: CardDefinition): CardKnowledge {
  return getCardKnowledgeByDeckId(card.id) ?? fallbackKnowledgeFromDeck(card);
}
