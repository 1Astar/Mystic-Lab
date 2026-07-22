/** 人生宇宙 · 轻画像档案与平行世界 */

export type LifeGenerationSource = 'ai' | 'template';

export type LifeProfileInput = {
  age: string;
  occupation: string;
  city: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthPlace: string;
  confusion: string;
};

export type LifePortrait = {
  tendencies: string[];
  themes: string[];
  stageTitle: string;
  stageSummary: string;
  stageHints: string[];
  source: LifeGenerationSource;
  generatedAt: string;
};

export type FiveYearArchive = {
  title: string;
  summary: string;
  work: string;
  lifestyle: string;
  relationships: string;
  growth: string;
  tone: string;
  source: LifeGenerationSource;
};

export type ParallelWorld = {
  id: string;
  label: string;
  divergence: string;
  selected: boolean;
  archive?: FiveYearArchive;
};

/** 选择模拟 · 一条决策分支 */
export type ChoiceBranch = {
  id: string;
  label: string;
  title: string;
  /** 可能轨迹节点，按时间先后 */
  trajectory: string[];
  note: string;
};

export type ChoiceSimulation = {
  question: string;
  horizonLabel: string;
  branches: ChoiceBranch[];
  selectedBranchId?: string;
  source: LifeGenerationSource;
  generatedAt: string;
};

export type ForecastCheckResult = 'pending' | 'hit' | 'miss';

/** 人生预测 · 一条可打卡对照记录 */
export type LifeForecast = {
  id: string;
  question: string;
  /** 现实补充信息 */
  context: string;
  prediction: string;
  rationale: string;
  /** 建议回来对照的日期 YYYY-MM-DD */
  checkBy: string;
  result: ForecastCheckResult;
  reflection: string;
  source: LifeGenerationSource;
  createdAt: string;
  checkedAt?: string;
};

export type LifeStore = {
  profile: LifeProfileInput;
  portrait?: LifePortrait;
  worlds: ParallelWorld[];
  simulation?: ChoiceSimulation;
  forecasts?: LifeForecast[];
  updatedAt: string;
};

export const EMPTY_PROFILE: LifeProfileInput = {
  age: '',
  occupation: '',
  city: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  birthHour: '',
  birthPlace: '',
  confusion: '',
};
