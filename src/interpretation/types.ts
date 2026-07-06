import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import type {
  CardKnowledge,
  EncounterRecord,
  InterpretationLayers,
  ReadingContext,
} from '../knowledge/types.ts';

export type CardReading = {
  position: string;
  positionKey: string;
  cardName: string;
  cardId: string;
  orientation: 'upright' | 'reversed';
  keywords: string[];
  positionMeaning: string;
  /** @deprecated 使用 interpretationLayers.standardMeaning */
  text: string;
  /** @deprecated 使用 interpretationLayers.standardMeaning */
  baseMeaning: string;
  /** @deprecated 使用 interpretationLayers.contextualReading */
  inContext: string;
  /** @deprecated 使用 interpretationLayers.selfReflection */
  learnTip: string;
  combined: string;
  question: string;
  spreadType: SpreadType;
  cardPosition: string;
  topic: ReadingContext['topic'];
  selectedCardId: string;
  readingContext: ReadingContext;
  selectedCard: CardKnowledge;
  interpretationLayers: InterpretationLayers;
  encounterRecord: EncounterRecord | null;
  hasVisualHotspots: boolean;
};

export type ReadingResult = {
  cards: CardReading[];
  summary: string;
  learningNote?: string;
  reflection?: string;
  provider: 'static' | 'llm' | 'mock';
};

export interface InterpretationProvider {
  interpret(
    cards: DrawnCard[],
    question?: string,
    spreadType?: SpreadType,
  ): Promise<ReadingResult>;
}
