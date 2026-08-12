/**
 * 周度脑内天气：心态短记本地存档
 */
import { isoWeekKey } from '../craft/quests.ts';
import { dateKeyFromDate } from './sense-liuri.ts';

const STORAGE_KEY = 'mystic-lab-bazi-week-weather-v1';

export type DayMood = {
  /** 短记 */
  text: string;
  /** 用户自评：对上了 / 没感觉 / 跳过 */
  match?: 'hit' | 'miss' | 'skip';
};

export type WeekWeatherDoc = {
  v: 1;
  /** ISO 周 key */
  weekKey: string;
  days: Record<string, DayMood>;
  /** 是否已点「本周对账」 */
  reconciled: boolean;
  updatedAt: string;
};

type Store = {
  v: 1;
  byWeek: Record<string, WeekWeatherDoc>;
};

function emptyStore(): Store {
  return { v: 1, byWeek: {} };
}

export function loadWeekWeatherStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const p = JSON.parse(raw) as Partial<Store>;
    return {
      v: 1,
      byWeek: p.byWeek && typeof p.byWeek === 'object' ? p.byWeek : {},
    };
  } catch {
    return emptyStore();
  }
}

function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadWeekDoc(weekKey = isoWeekKey()): WeekWeatherDoc {
  const store = loadWeekWeatherStore();
  return (
    store.byWeek[weekKey] ?? {
      v: 1,
      weekKey,
      days: {},
      reconciled: false,
      updatedAt: new Date().toISOString(),
    }
  );
}

export function saveDayMood(
  dateKey: string,
  patch: Partial<DayMood>,
  weekKey = isoWeekKey(),
): WeekWeatherDoc {
  const store = loadWeekWeatherStore();
  const doc = loadWeekDoc(weekKey);
  const prev = doc.days[dateKey] ?? { text: '' };
  doc.days[dateKey] = {
    text: patch.text !== undefined ? patch.text.slice(0, 80) : prev.text,
    match: patch.match !== undefined ? patch.match : prev.match,
  };
  doc.updatedAt = new Date().toISOString();
  store.byWeek[weekKey] = doc;
  saveStore(store);
  return doc;
}

export function markWeekReconciled(weekKey = isoWeekKey()): WeekWeatherDoc {
  const store = loadWeekWeatherStore();
  const doc = loadWeekDoc(weekKey);
  doc.reconciled = true;
  doc.updatedAt = new Date().toISOString();
  store.byWeek[weekKey] = doc;
  saveStore(store);
  return doc;
}

export function countFilledDays(doc: WeekWeatherDoc): number {
  return Object.values(doc.days).filter((d) => d.text.trim().length > 0).length;
}

export function countHits(doc: WeekWeatherDoc): number {
  return Object.values(doc.days).filter((d) => d.match === 'hit').length;
}

export function todayDateKey(): string {
  return dateKeyFromDate(new Date());
}

export function __resetWeekWeatherForTest(): void {
  localStorage.removeItem(STORAGE_KEY);
}
