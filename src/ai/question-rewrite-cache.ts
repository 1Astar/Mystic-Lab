import type { RewriteCandidate } from './question-feedback.ts';

export type RewriteCacheEntry = {
  originalQuestion: string;
  candidates: RewriteCandidate[];
  at: string;
};

const STORAGE_KEY = 'mystic-lab-question-rewrite-cache';
const MAX_STORE = 40;

/** 规范化后用于同问匹配（去首尾空白、合并空白） */
export function normalizeRewriteQuestion(question: string): string {
  return question.trim().replace(/\s+/g, ' ');
}

function loadAll(): RewriteCacheEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RewriteCacheEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items: RewriteCacheEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORE)));
}

export function findRewriteCache(originalQuestion: string): RewriteCacheEntry | null {
  const key = normalizeRewriteQuestion(originalQuestion);
  if (key.length < 2) return null;
  return loadAll().find((e) => normalizeRewriteQuestion(e.originalQuestion) === key) ?? null;
}

export function saveRewriteCache(
  originalQuestion: string,
  candidates: RewriteCandidate[],
): RewriteCacheEntry {
  const key = normalizeRewriteQuestion(originalQuestion);
  const entry: RewriteCacheEntry = {
    originalQuestion: key,
    candidates: candidates.slice(0, 3),
    at: new Date().toISOString(),
  };
  const rest = loadAll().filter((e) => normalizeRewriteQuestion(e.originalQuestion) !== key);
  saveAll([entry, ...rest]);
  return entry;
}

/** 用户不满意反馈后作废，下次需重新生成 */
export function invalidateRewriteCache(originalQuestion: string): void {
  const key = normalizeRewriteQuestion(originalQuestion);
  if (key.length < 2) return;
  saveAll(loadAll().filter((e) => normalizeRewriteQuestion(e.originalQuestion) !== key));
}
