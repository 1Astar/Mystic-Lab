import { buildDefaultWorlds } from './fork-presets.ts';
import {
  EMPTY_PROFILE,
  type ChoiceSimulation,
  type ForecastCheckResult,
  type LifeForecast,
  type LifeStore,
  type LifeProfileInput,
  type ParallelWorld,
} from './types.ts';

const STORAGE_KEY = 'mystic-lab-life-universe';
const MAX_FORECASTS = 40;

export function createEmptyStore(): LifeStore {
  return {
    profile: { ...EMPTY_PROFILE },
    worlds: buildDefaultWorlds(),
    forecasts: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadLifeStore(): LifeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as Partial<LifeStore>;
    return {
      profile: { ...EMPTY_PROFILE, ...(parsed.profile ?? {}) },
      portrait: parsed.portrait,
      worlds: Array.isArray(parsed.worlds) && parsed.worlds.length > 0
        ? parsed.worlds
        : buildDefaultWorlds(),
      simulation: parsed.simulation,
      forecasts: Array.isArray(parsed.forecasts) ? parsed.forecasts : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveLifeStore(store: LifeStore): void {
  const next: LifeStore = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function updateProfile(profile: LifeProfileInput): LifeStore {
  const store = loadLifeStore();
  const next = { ...store, profile, portrait: undefined };
  saveLifeStore(next);
  return next;
}

/** 仅合并出生字段并同步到「我的档案」；不清除轻画像。 */
export function updateBirthFields(
  birth: Pick<
    LifeProfileInput,
    'birthYear' | 'birthMonth' | 'birthDay' | 'birthHour' | 'birthPlace'
  >,
): LifeStore {
  const store = loadLifeStore();
  const next = {
    ...store,
    profile: {
      ...store.profile,
      birthYear: birth.birthYear.trim(),
      birthMonth: birth.birthMonth.trim(),
      birthDay: birth.birthDay.trim(),
      birthHour: birth.birthHour.trim(),
      birthPlace: birth.birthPlace.trim(),
    },
  };
  saveLifeStore(next);
  return next;
}

export function hasBirthInfo(profile: LifeProfileInput): boolean {
  return Boolean(
    profile.birthYear.trim() ||
      profile.birthMonth.trim() ||
      profile.birthDay.trim() ||
      profile.birthHour.trim() ||
      profile.birthPlace.trim(),
  );
}

export function savePortrait(store: LifeStore): void {
  saveLifeStore(store);
}

export function saveWorlds(worlds: ParallelWorld[]): LifeStore {
  const store = loadLifeStore();
  const next = { ...store, worlds };
  saveLifeStore(next);
  return next;
}

export function saveSimulation(simulation: ChoiceSimulation): LifeStore {
  const store = loadLifeStore();
  const next = { ...store, simulation };
  saveLifeStore(next);
  return next;
}

export function addForecast(
  draft: Omit<LifeForecast, 'id' | 'result' | 'reflection' | 'checkedAt'>,
): LifeStore {
  const store = loadLifeStore();
  const item: LifeForecast = {
    ...draft,
    id: `fc-${Date.now()}`,
    result: 'pending',
    reflection: '',
  };
  const forecasts = [item, ...(store.forecasts ?? [])].slice(0, MAX_FORECASTS);
  const next = { ...store, forecasts };
  saveLifeStore(next);
  return next;
}

export function updateForecastCheck(
  id: string,
  result: Exclude<ForecastCheckResult, 'pending'>,
  reflection = '',
): LifeStore {
  const store = loadLifeStore();
  const forecasts = (store.forecasts ?? []).map((f) =>
    f.id === id
      ? {
          ...f,
          result,
          reflection: reflection.trim(),
          checkedAt: new Date().toISOString(),
        }
      : f,
  );
  const next = { ...store, forecasts };
  saveLifeStore(next);
  return next;
}

export function clearForecastResult(id: string): LifeStore {
  const store = loadLifeStore();
  const forecasts = (store.forecasts ?? []).map((f) =>
    f.id === id
      ? { ...f, result: 'pending' as const, reflection: '', checkedAt: undefined }
      : f,
  );
  const next = { ...store, forecasts };
  saveLifeStore(next);
  return next;
}

export function hasUsableProfile(profile: LifeProfileInput): boolean {
  return Boolean(
    profile.age.trim() ||
      profile.occupation.trim() ||
      profile.city.trim() ||
      profile.confusion.trim() ||
      profile.birthYear.trim(),
  );
}

export function formatBirthBrief(profile: LifeProfileInput): string {
  const y = profile.birthYear.trim();
  const m = profile.birthMonth.trim();
  const d = profile.birthDay.trim();
  const h = profile.birthHour.trim();
  const place = profile.birthPlace.trim();
  if (!y && !m && !d && !h && !place) return '未填写';
  const date = [y, m, d].filter(Boolean).join('-') || '日期未填';
  const hour = h ? ` · ${h}` : '';
  const loc = place ? ` · ${place}` : '';
  return `${date}${hour}${loc}`;
}
