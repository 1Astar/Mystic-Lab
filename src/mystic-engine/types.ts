/** Mystic Engine · OfflineAnswerPack 共享类型 */

export type SceneDomain = 'career' | 'love' | 'wealth' | 'growth' | 'life' | 'general';

export type IntentId =
  // 事业
  | 'salary_negotiate'
  | 'probation_convert'
  | 'quit_now'
  | 'quit_vs_stay'
  | 'job_search_window'
  | 'offer_decide'
  | 'team_conflict'
  | 'career_promote'
  | 'career_transfer'
  | 'career_startup'
  // 关系
  | 'love_likes'
  | 'love_stay_leave'
  | 'love_contact'
  | 'love_ambiguous'
  | 'love_conflict'
  | 'love_reunion'
  | 'love_marriage'
  // 财富
  | 'wealth_invest'
  | 'wealth_income'
  | 'wealth_spend'
  // 成长
  | 'growth_study'
  | 'growth_choice'
  | 'growth_plan'
  // 通用
  | 'timing'
  | 'anxiety_decide'
  | 'open_explore';

export type IntentHit = {
  id: IntentId;
  slice: string;
  confidence: 'high' | 'mid';
  domain: SceneDomain;
};

export type EvidenceLine = {
  factKey: string;
  plain: string;
  /** 术语白话注，可折叠 */
  gloss?: { term: string; gloss: string };
};

export type SceneAction = {
  id: string;
  title: string;
  body: string;
};

export type AnswerBlock = {
  intentId: IntentId;
  questionSlice: string;
  lean: string;
  evidence: EvidenceLine[];
};

export type Tone = 'soft' | 'cut' | 'hard' | 'open' | 'flow' | 'neutral';

export type RiskPreference = 'cautious' | 'balanced' | 'bold';

export type UserContext = {
  age?: string;
  occupation?: string;
  currentStage?: string;
  riskPreference: RiskPreference;
  previousReadings?: Array<{
    intentHint?: string;
    leanHint?: string;
    at: string;
  }>;
  preferences?: {
    favorActions?: boolean;
    favorEvidence?: boolean;
  };
};

/** 首屏核心结论 */
export type VerdictBlock = {
  headline: string;
  parse: string;
  decision: string;
};

/** 为什么这么判断（一条）——结构化便于扫读 */
export type WhyItem = {
  /** 短标题，如「你的现状」 */
  title: string;
  /** 角标术语（点二字看释义），如「变卦」 */
  badgeTerm?: { term: string; gloss: string };
  /** 角标卦名（点开卦象精读） */
  badgeHex?: { kind: 'primary' | 'changed'; name: string; label: string };
  /** 角标补充，如「五爻」「无」 */
  badgeNote?: string;
  /** 一行钩子（最醒目） */
  hook: string;
  /** 要点列表 */
  points?: string[];
  /** 建议 */
  tip?: string;
  /** 兼容旧全文拼接 */
  body: string;
  /** @deprecated 改用 badgeTerm；保留兼容 */
  gloss?: { term: string; gloss: string };
  /** @deprecated 改用 badgeTerm / badgeHex / badgeNote */
  badge?: string;
};

export type OfflineAnswerPack = {
  intents: IntentHit[];
  answers: AnswerBlock[];
  /** @deprecated 兼容旧字段；与 verdict.decision 同步 */
  decision: string;
  breakthrough: SceneAction;
  checklist: SceneAction[];
  boardExpand?: string;
  contextUsed: boolean;
  /** 首屏大字结论 */
  verdict: VerdictBlock;
  /** 推导：世/应/动 */
  why: WhyItem[];
  /** 第二层：能量与状态拆解（现代语） */
  energy?: string;
  /** 第四层：心理定心丸 */
  reassurance?: string;
  /** 一句话核心隐喻 */
  coreMetaphor?: string;
};
