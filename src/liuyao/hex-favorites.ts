const FAV_KEY = 'mystic.liuyao.hexGuide.favorites.v1';

function loadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
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

export function isHexFavorite(name: string): boolean {
  return loadSet().has(name);
}

/** @returns 切换后是否已收藏 */
export function toggleHexFavorite(name: string): boolean {
  const set = loadSet();
  if (set.has(name)) {
    set.delete(name);
    saveSet(set);
    return false;
  }
  set.add(name);
  saveSet(set);
  return true;
}

export function listHexFavorites(): string[] {
  return [...loadSet()];
}

export function hexFavButtonLabel(on: boolean): string {
  return on ? '⭐ 已收藏' : '☆ 未收藏';
}
