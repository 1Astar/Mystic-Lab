import type { JourneyItem, JourneySystem } from './journey.ts';

const STORAGE_KEY = 'mystic-lab-cross-ask-question';

/** 规范化问题文本，用于同题匹配 */
export function normalizeQuestionKey(question: string): string {
  return question.trim().replace(/\s+/g, ' ');
}

/** 结果页互跳：写入待预填问题 */
export function stashCrossAskQuestion(question: string): void {
  const q = normalizeQuestionKey(question);
  if (!q) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, q);
  } catch {
    /* 隐私模式等忽略 */
  }
}

/** 读取并清除预填问题（一次性） */
export function takeCrossAskQuestion(): string {
  try {
    const q = sessionStorage.getItem(STORAGE_KEY) ?? '';
    sessionStorage.removeItem(STORAGE_KEY);
    return normalizeQuestionKey(q);
  } catch {
    return '';
  }
}

/** 另一体系同题记录（精确匹配规范化后的问题） */
export function findSiblingJourneyItems(
  item: JourneyItem,
  all: JourneyItem[],
): JourneyItem[] {
  const key = normalizeQuestionKey(item.question);
  if (!key) return [];
  return all.filter(
    (other) =>
      other.id !== item.id &&
      other.system !== item.system &&
      normalizeQuestionKey(other.question) === key,
  );
}

export function otherSystemLabel(system: JourneySystem): string {
  return system === 'tarot' ? '小六壬' : '塔罗';
}

export function otherSystemReadingPath(system: JourneySystem): string {
  return system === 'tarot' ? '/xiaoliuren/reading' : '/tarot/reading';
}
