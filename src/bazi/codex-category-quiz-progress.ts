/**
 * 分类小挑战进度：会话内浏览计数 + 每日每类最多一次。
 */
import {
  isCodexQuizCategory,
  pickCategoryQuiz,
  type CodexQuiz,
  type CodexQuizCategory,
} from './codex-category-quiz.ts';

const STORAGE_KEY = 'mystic-lab-bazi-codex-quiz-v1';
const MIN_BROWSE = 2;

type DayStore = {
  v: 1;
  day: string;
  /** category → correct | wrong | skip */
  done: Record<string, 'correct' | 'wrong' | 'skip'>;
};

const browseByCategory = new Map<string, Set<string>>();
/** localStorage 不可用时的内存兜底（测试环境） */
let memoryStore: DayStore | null = null;

function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyStore(): DayStore {
  return { v: 1, day: dayKey(), done: {} };
}

function loadStore(): DayStore {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DayStore;
        if (parsed?.v === 1 && typeof parsed.day === 'string') {
          if (parsed.day !== dayKey()) return emptyStore();
          return { v: 1, day: parsed.day, done: parsed.done || {} };
        }
      }
    }
  } catch {
    /* fall through */
  }
  if (memoryStore && memoryStore.day === dayKey()) return memoryStore;
  return emptyStore();
}

function saveStore(store: DayStore): void {
  memoryStore = store;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    /* ignore */
  }
}

/** 打开某分类词条详情时记账 */
export function recordCodexCategoryBrowse(
  category: string,
  entryId: string,
): void {
  if (!isCodexQuizCategory(category) || !entryId) return;
  let set = browseByCategory.get(category);
  if (!set) {
    set = new Set();
    browseByCategory.set(category, set);
  }
  set.add(entryId);
}

export function browseCountForCategory(category: string): number {
  return browseByCategory.get(category)?.size ?? 0;
}

export function hasCategoryQuizDoneToday(category: string): boolean {
  if (!isCodexQuizCategory(category)) return true;
  return Boolean(loadStore().done[category]);
}

/**
 * 离开某分类时：若本会话已逛够且今日未做过 → 返回题目。
 */
export function maybeOfferCategoryQuiz(
  leavingCategory: string,
  minBrowse = MIN_BROWSE,
): CodexQuiz | null {
  if (!isCodexQuizCategory(leavingCategory)) return null;
  if (hasCategoryQuizDoneToday(leavingCategory)) return null;
  if (browseCountForCategory(leavingCategory) < minBrowse) return null;
  return pickCategoryQuiz(leavingCategory, dayKey());
}

export function markCategoryQuizResult(
  category: CodexQuizCategory,
  result: 'correct' | 'wrong' | 'skip',
): void {
  const store = loadStore();
  store.done[category] = result;
  saveStore(store);
  browseByCategory.delete(category);
}

/** 测试用：清空会话浏览与当日记录 */
export function resetCodexCategoryQuizStateForTests(): void {
  browseByCategory.clear();
  memoryStore = null;
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
