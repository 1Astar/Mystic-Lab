import type { JourneyItem, JourneySystem } from './journey.ts';

const STORAGE_KEY = 'mystic-lab-cross-ask-question';

const ALL_SYSTEMS: JourneySystem[] = ['tarot', 'xiaoliuren', 'liuyao'];

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

export function systemDisplayLabel(system: JourneySystem): string {
  if (system === 'tarot') return '塔罗';
  if (system === 'xiaoliuren') return '小六壬';
  return '六爻';
}

/** 除当前体系外的其它体系（用于同题互跳） */
export function otherSystems(system: JourneySystem): JourneySystem[] {
  return ALL_SYSTEMS.filter((s) => s !== system);
}

/** @deprecated 多体系时优先用 otherSystems；保留兼容：返回第一个其它体系名 */
export function otherSystemLabel(system: JourneySystem): string {
  const others = otherSystems(system);
  if (others.length === 1) return systemDisplayLabel(others[0]!);
  return '其他体系';
}

export function readingPathFor(system: JourneySystem): string {
  if (system === 'tarot') return '/tarot/reading';
  if (system === 'xiaoliuren') return '/xiaoliuren/reading';
  return '/liuyao/reading';
}

/** @deprecated 多体系时优先用 readingPathFor(other) */
export function otherSystemReadingPath(system: JourneySystem): string {
  const first = otherSystems(system)[0];
  return first ? readingPathFor(first) : '/tarot/reading';
}
