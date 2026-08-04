export const ZIWEI_INTENT_KEY = 'mystic.ziwei.intent';
export const ZIWEI_QUESTION_KEY = 'mystic.ziwei.question';

export type StoredIntent = 'horizon' | 'map';

export function saveZiweiIntent(intent: StoredIntent): void {
  try {
    sessionStorage.setItem(ZIWEI_INTENT_KEY, intent);
  } catch {
    /* ignore */
  }
}

export function loadZiweiIntent(): StoredIntent {
  try {
    const v = sessionStorage.getItem(ZIWEI_INTENT_KEY);
    return v === 'horizon' ? 'horizon' : 'map';
  } catch {
    return 'map';
  }
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
