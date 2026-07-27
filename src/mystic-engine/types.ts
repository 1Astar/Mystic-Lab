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

export type OfflineAnswerPack = {
  intents: IntentHit[];
  answers: AnswerBlock[];
  decision: string;
  breakthrough: SceneAction;
  checklist: SceneAction[];
  boardExpand?: string;
  contextUsed: boolean;
};
