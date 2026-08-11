export const ZIWEI_INTENT_KEY = 'mystic.ziwei.intent';
export const ZIWEI_QUESTION_KEY = 'mystic.ziwei.question';

/**
 * 入口已合并为「定调 + 运限」同页；不再分 horizon/map。
 * 保留类型与读写，避免旧调用炸；恒为 map。
 */
export type StoredIntent = 'map';

export function saveZiweiIntent(_intent?: StoredIntent | 'horizon'): void {
  try {
    sessionStorage.setItem(ZIWEI_INTENT_KEY, 'map');
  } catch {
    /* ignore */
  }
}

export function loadZiweiIntent(): StoredIntent {
  return 'map';
}

export function saveZiweiQuestion(q: string): void {
  try {
    sessionStorage.setItem(ZIWEI_QUESTION_KEY, q);
  } catch {
    /* ignore */
  }
}

export function loadZiweiQuestion(): string {
  try {
    return sessionStorage.getItem(ZIWEI_QUESTION_KEY) ?? '';
  } catch {
    return '';
  }
}
