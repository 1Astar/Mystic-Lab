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

/** 牌面元素 → 用户问题场景的映射 */
export type ElementMapping = {
  /** 热点原名，如「偷走的剑」 */
  label: string;
  /** 小标题，如 现实状况：「偷走的剑」意味着什么？ */
  title: string;
  /** 元素在牌面上的原意（保留） */
  originalMeaning: string;
  /** 映射到用户问题场景的具体说法 */
  body: string;
};

/** 一次追问的完整回答 */
export type FollowUpAnswer = {
  question: string;
  sections: ContextualSection[];
  elementMappings?: ElementMapping[];
  plainText: string;
  provider: 'mock' | 'llm';
  at: string;
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
  /** 用户可选补充的情境背景（喂给规则/AI） */
  background?: string;
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
  /** 结构化解读段落（核心结论/情境/建议/疏导 或感情专段） */
  contextualSections?: ContextualSection[];
  /** 行动指令标签（优先于抽象关键词展示） */
  actionTags?: string[];
  /** 牌面元素 → 问题场景映射（痛点拆解） */
  elementMappings?: ElementMapping[];
  /** 可点击追问建议 */
  followUps?: string[];
  /** 用户已点过的追问回答（叠在主解读下） */
  followUpAnswers?: FollowUpAnswer[];
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
