/** 人生宇宙 · 轻画像档案与平行世界 */

export type LifeGenerationSource = 'ai' | 'template';

/** 档案关系（自己 / 他人） */
export type PersonRelation =
  | 'self'
  | 'family'
  | 'partner'
  | 'friend'
  | 'client'
  | 'other';

export const PERSON_RELATION_LABELS: Record<PersonRelation, string> = {
  self: '自己',
  family: '家人',
  partner: '伴侣',
  friend: '朋友',
  client: '客户',
  other: '其他',
};

export const SELF_PROFILE_ID = 'self';

/** 现状字段（出生 + 人生状态） */
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

/** 一个人的档案（自己或他人） */
export type PersonProfile = LifeProfileInput & {
  id: string;
  /** 顶栏显示名，如「自己」「豆豆」 */
  nickname: string;
  relation: PersonRelation;
  gender: '' | 'female' | 'male';
  /** 可选长期标签（求职期等） */
  lifeTags: string[];
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
  /** 多人档案；缺省迁移自旧单 profile */
  profiles: PersonProfile[];
  /** 当前「这次问谁」 */
  activeProfileId: string;
  /**
   * 与当前激活人同步的扁平字段（兼容旧读取处）。
   * 写入请优先用 updateActivePerson / upsertPerson。
   */
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

export function toLifeProfileInput(
  p: Partial<LifeProfileInput> | LifeProfileInput | PersonProfile,
): LifeProfileInput {
  return {
    age: p.age ?? '',
    occupation: p.occupation ?? '',
    city: p.city ?? '',
    birthYear: p.birthYear ?? '',
    birthMonth: p.birthMonth ?? '',
    birthDay: p.birthDay ?? '',
    birthHour: p.birthHour ?? '',
    birthPlace: p.birthPlace ?? '',
    confusion: p.confusion ?? '',
  };
}

export function createSelfPerson(from: LifeProfileInput = EMPTY_PROFILE): PersonProfile {
  return {
    id: SELF_PROFILE_ID,
    nickname: '自己',
    relation: 'self',
    gender: '',
    lifeTags: [],
    ...toLifeProfileInput(from),
  };
}

export function createEmptyPerson(
  partial?: Partial<PersonProfile> & { nickname: string },
): PersonProfile {
  const nickname = (partial?.nickname ?? '未命名').trim().slice(0, 8) || '未命名';
  const fields = toLifeProfileInput(partial ?? EMPTY_PROFILE);
  return {
    id: partial?.id?.trim() || `p-${Date.now().toString(36)}`,
    nickname,
    relation: partial?.relation ?? 'friend',
    gender: partial?.gender ?? '',
    lifeTags: Array.isArray(partial?.lifeTags) ? [...partial!.lifeTags!] : [],
    ...fields,
  };
}
