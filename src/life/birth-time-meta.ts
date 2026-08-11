/** 生辰时间精度 / 来源（档案共用） */

export type BirthTimeAccuracy = 'minute' | 'pm15' | 'hour' | 'uncertain' | '';

export type BirthTimeSource =
  | 'certificate'
  | 'family_clear'
  | 'family_rough'
  | 'unasked'
  | '';

export const BIRTH_TIME_ACCURACY_OPTIONS: Array<{
  id: BirthTimeAccuracy;
  label: string;
}> = [
  { id: 'minute', label: '精确到分钟' },
  { id: 'pm15', label: '±15分钟' },
  { id: 'hour', label: '±1小时' },
  { id: 'uncertain', label: '不确定' },
];

export const BIRTH_TIME_SOURCE_OPTIONS: Array<{
  id: BirthTimeSource;
  label: string;
}> = [
  { id: 'certificate', label: '出生证 · 医院记录' },
  { id: 'family_clear', label: '家人明确记忆' },
  { id: 'family_rough', label: '家人大概回忆' },
  { id: 'unasked', label: '未追问' },
];

/** 精度偏粗 → 建议走生时校准 */
export function needsBirthTimeRectify(accuracy: BirthTimeAccuracy | undefined): boolean {
  return accuracy === 'hour' || accuracy === 'uncertain';
}

export function normalizeBirthTimeAccuracy(raw: unknown): BirthTimeAccuracy {
  if (raw === 'minute' || raw === 'pm15' || raw === 'hour' || raw === 'uncertain') return raw;
  return '';
}

export function normalizeBirthTimeSource(raw: unknown): BirthTimeSource {
  if (
    raw === 'certificate' ||
    raw === 'family_clear' ||
    raw === 'family_rough' ||
    raw === 'unasked'
  ) {
    return raw;
  }
  return '';
}
