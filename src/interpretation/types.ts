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
  /** @deprecated 使用 interpretationLayers.standard */
  text: string;
  /** @deprecated 使用 interpretationLayers.standard */
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
  /** mock=规则模板，llm=已调用大模型 */
  interpretationProvider: 'mock' | 'llm';
  /** 翻牌后、看解读前用户写下的第一直觉；跳过则为空 */
  userIntuition?: string;
  /** 直觉与解读的对照短文（有直觉时生成） */
  intuitionCompare?: string;
};

export type InterpretOptions = {
  /** 用户补充的情境背景 */
  background?: string;
};

export type ReadingResult = {
  cards: CardReading[];
  summary: string;
  learningNote?: string;
  reflection?: string;
  /** 本轮解读使用的补充背景（随快照保存） */
  questionBackground?: string;
  /** 全翻后写下的整阵/焦点直觉 */
  userIntuition?: string;
  /** 直觉焦点牌下标；缺省表示整阵 */
  intuitionFocusIndex?: number;
  provider: 'static' | 'llm' | 'mock';
};

export interface InterpretationProvider {
  interpret(
    cards: DrawnCard[],
    question?: string,
    spreadType?: SpreadType,
    options?: InterpretOptions,
  ): Promise<ReadingResult>;
}
