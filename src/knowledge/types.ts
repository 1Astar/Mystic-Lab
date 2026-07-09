import type { QuestionTheme } from '../codex/collection.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import type { QuestionPattern } from '../tarot/question-coach.ts';

export type FoolJourneyStep = {
  order: number;
  title: string;
  summary: string;
};

export type CardKnowledge = {
  id: string;
  deckId: string;
  nameCn: string;
  nameEn: string;
  arcana: 'major' | 'minor';
  number: number;
  keywords: string[];
  oneSentence: string;
  uprightMeaning: string;
  reversedMeaning: string;
  workMeaning: string;
  loveMeaning: string;
  studyMeaning: string;
  selfMeaning: string;
  /** 正位关键词（图鉴深度解读） */
  uprightKeywords?: string[];
  /** 逆位关键词 */
  reversedKeywords?: string[];
  /** 财富议题 */
  wealthMeaning?: string;
  /** 容易误读的点 */
  misreadings?: string[];
  /** 整牌总览（牌面画面描述，图鉴 / 看懂牌面） */
  visualOverview?: string;
  foolJourney?: FoolJourneyStep;
};

export type VisualHotspot = {
  id: string;
  label: string;
  /** 0–100，相对牌面宽度 */
  x: number;
  /** 0–100，相对牌面高度 */
  y: number;
  meaning: string;
};

export type CardVisualHotspots = {
  cardId: string;
  deckId: string;
  /** 整牌画面总览（看懂牌面 Tab 顶部） */
  overview?: string;
  hotspots: VisualHotspot[];
};

export type AnswerTendency = {
  /** 整体判断，如 偏稳 / 偏卡 / 有机会但需调整 */
  overall: string;
  /** 结果倾向：正向 / 中性偏正 / 中性 / 中性偏负 / 偏负 */
  tendency: string;
  /** 一句话直接回答用户原问题 */
  oneLiner: string;
  /** 关键行动提醒 */
  actionTip: string;
};

export type QuestionTopic = QuestionTheme;

export type ContextualSection = {
  title: string;
  body: string;
};

export type ReadingContext = {
  question: string;
  spreadType: SpreadType;
  cardPosition: string;
  positionKey: string;
  topic: QuestionTopic;
  selectedCardId: string;
  questionPattern?: QuestionPattern;
  personName?: string;
};

export type EncounterRecord = {
  cardId: string;
  firstMetAt: string;
  encounterCount: number;
  questions: string[];
  notes: string[];
  lastMetAt?: string;
  timeline?: {
    at: string;
    question: string;
    spreadLabel: string;
    reversed: boolean;
  }[];
};

export type StandardMeaningLayer = {
  keywords: string[];
  oneSentence: string;
  reminder: string;
};

export type InterpretationLayers = {
  /** 第一层：标准牌义（结构化，避免重复渲染） */
  standard: StandardMeaningLayer;
  /** 直接结论（有提问时优先展示） */
  answerTendency?: AnswerTendency;
  /** 第二层：结合问题的解读（P3 接 LLM，P1 用 mock） */
  contextualReading: string;
  /** 结构化解读段落（感情喜欢类等） */
  contextualSections?: ContextualSection[];
  /** 看懂牌面：回到你的问题 */
  visualQuestionBridge?: string;
  /** 第三层：引导用户自己判断 */
  selfReflection: string[];
};

export type SceneMeaningKey = 'workMeaning' | 'loveMeaning' | 'studyMeaning' | 'selfMeaning';

export const TOPIC_TO_SCENE_KEY: Record<QuestionTopic, SceneMeaningKey> = {
  work: 'workMeaning',
  love: 'loveMeaning',
  study: 'studyMeaning',
  self: 'selfMeaning',
};
