/**
 * 紫微图鉴收藏（本机）：主星 / 配角 / 神煞 id
 */
const FAV_KEY = 'mystic.ziwei.codex.favorites.v1';

function loadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0));
  } catch {
    return new Set();
  }
}

function saveSet(set: Set<string>): void {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota */
  }
}

export function isZiweiCodexFavorite(id: string): boolean {
  return loadSet().has(id);
}

/** @returns 切换后是否已收藏 */
export function toggleZiweiCodexFavorite(id: string): boolean {
  const set = loadSet();
  if (set.has(id)) {
    set.delete(id);
    saveSet(set);
    return false;
  }
  set.add(id);
  saveSet(set);
  return true;
}

export function listZiweiCodexFavorites(): string[] {
  return [...loadSet()];
}

export function ziweiFavButtonLabel(on: boolean): string {
  return on ? '⭐ 已收藏' : '☆ 收藏';
}
