/** 衣橱 AI 润色本地缓存：按人 + 日 */
const STORAGE_KEY = 'mystic-lab-wardrobe-polish-v1';

export type WardrobePolishCached = {
  styleSummary: string;
  todayTip: string;
  source: 'ai';
  updatedAt: string;
};

type Store = {
  v: 1;
  byKey: Record<string, WardrobePolishCached>;
};

function empty(): Store {
  return { v: 1, byKey: {} };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<Store>;
    return { v: 1, byKey: p.byKey && typeof p.byKey === 'object' ? p.byKey : {} };
  } catch {
    return empty();
  }
}

function save(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function wardrobePolishKey(personId: string, dateKey: string): string {
  return `${personId}::${dateKey}`;
}

export function loadWardrobePolish(
  personId: string,
  dateKey: string,
): WardrobePolishCached | null {
  return load().byKey[wardrobePolishKey(personId, dateKey)] ?? null;
}

export function saveWardrobePolish(
  personId: string,
  dateKey: string,
  data: Omit<WardrobePolishCached, 'source' | 'updatedAt'>,
): void {
  const store = load();
  store.byKey[wardrobePolishKey(personId, dateKey)] = {
    ...data,
    source: 'ai',
    updatedAt: new Date().toISOString(),
  };
  save(store);
}
