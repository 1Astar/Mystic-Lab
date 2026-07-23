import { buildDefaultWorlds } from './fork-presets.ts';
import {
  EMPTY_PROFILE,
  SELF_PROFILE_ID,
  createSelfPerson,
  toLifeProfileInput,
  type ChoiceSimulation,
  type ForecastCheckResult,
  type LifeForecast,
  type LifeStore,
  type LifeProfileInput,
  type ParallelWorld,
  type PersonProfile,
  type PersonRelation,
} from './types.ts';

const STORAGE_KEY = 'mystic-lab-life-universe';
const MAX_FORECASTS = 40;

function syncFlatProfile(store: LifeStore): LifeStore {
  const active = getPersonFromStore(store, store.activeProfileId) ?? store.profiles[0]!;
  return {
    ...store,
    activeProfileId: active.id,
    profile: toLifeProfileInput(active),
  };
}

export function getPersonFromStore(
  store: LifeStore,
  id: string,
): PersonProfile | undefined {
  return store.profiles.find((p) => p.id === id);
}

export function createEmptyStore(): LifeStore {
  const self = createSelfPerson();
  return syncFlatProfile({
    profiles: [self],
    activeProfileId: SELF_PROFILE_ID,
    profile: toLifeProfileInput(self),
    worlds: buildDefaultWorlds(),
    forecasts: [],
    updatedAt: new Date().toISOString(),
  });
}

function normalizePerson(raw: Partial<PersonProfile> & { id?: string }): PersonProfile {
  const base = createSelfPerson();
  const id = raw.id?.trim() || `p-${Date.now().toString(36)}`;
  const relation = (raw.relation as PersonRelation) || (id === SELF_PROFILE_ID ? 'self' : 'other');
  return {
    ...base,
    ...toLifeProfileInput(raw as LifeProfileInput),
    id,
    nickname:
      (raw.nickname ?? (relation === 'self' ? '自己' : '未命名')).trim().slice(0, 8) ||
      (relation === 'self' ? '自己' : '未命名'),
    relation: id === SELF_PROFILE_ID ? 'self' : relation === 'self' ? 'other' : relation,
    gender: raw.gender === 'female' || raw.gender === 'male' ? raw.gender : '',
    lifeTags: Array.isArray(raw.lifeTags)
      ? raw.lifeTags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
      : [],
  };
}

function migrateProfiles(parsed: Partial<LifeStore>): {
  profiles: PersonProfile[];
  activeProfileId: string;
} {
  if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
    const profiles = parsed.profiles.map((p) => normalizePerson(p));
    if (!profiles.some((p) => p.id === SELF_PROFILE_ID)) {
      profiles.unshift(createSelfPerson(parsed.profile ?? EMPTY_PROFILE));
    }
    const activeProfileId =
      profiles.find((p) => p.id === parsed.activeProfileId)?.id ?? SELF_PROFILE_ID;
    return { profiles, activeProfileId };
  }

  const self = createSelfPerson(parsed.profile ?? EMPTY_PROFILE);
  return { profiles: [self], activeProfileId: SELF_PROFILE_ID };
}

export function loadLifeStore(): LifeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as Partial<LifeStore>;
    const { profiles, activeProfileId } = migrateProfiles(parsed);
    return syncFlatProfile({
      profiles,
      activeProfileId,
      profile: { ...EMPTY_PROFILE, ...(parsed.profile ?? {}) },
      portrait: parsed.portrait,
      worlds: Array.isArray(parsed.worlds) && parsed.worlds.length > 0
        ? parsed.worlds
        : buildDefaultWorlds(),
      simulation: parsed.simulation,
      forecasts: Array.isArray(parsed.forecasts) ? parsed.forecasts : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    });
  } catch {
    return createEmptyStore();
  }
}

export function saveLifeStore(store: LifeStore): void {
  const next = syncFlatProfile({
    ...store,
    updatedAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function listPersons(): PersonProfile[] {
  return loadLifeStore().profiles;
}

export function getActivePerson(): PersonProfile {
  const store = loadLifeStore();
  return getPersonFromStore(store, store.activeProfileId) ?? store.profiles[0]!;
}

export function setActivePersonId(id: string): LifeStore {
  const store = loadLifeStore();
  if (!getPersonFromStore(store, id)) return store;
  const next = syncFlatProfile({ ...store, activeProfileId: id });
  saveLifeStore(next);
  return next;
}

export function upsertPerson(person: PersonProfile): LifeStore {
  const store = loadLifeStore();
  const normalized = normalizePerson(person);
  const idx = store.profiles.findIndex((p) => p.id === normalized.id);
  const profiles =
    idx >= 0
      ? store.profiles.map((p, i) => (i === idx ? normalized : p))
      : [...store.profiles, normalized];
  const next = syncFlatProfile({ ...store, profiles });
  saveLifeStore(next);
  return next;
}

/** 删除他人档案；自己不可删 */
export function deletePerson(id: string): LifeStore {
  if (id === SELF_PROFILE_ID) return loadLifeStore();
  const store = loadLifeStore();
  const profiles = store.profiles.filter((p) => p.id !== id);
  const activeProfileId =
    store.activeProfileId === id ? SELF_PROFILE_ID : store.activeProfileId;
  const next = syncFlatProfile({ ...store, profiles, activeProfileId });
  saveLifeStore(next);
  return next;
}

/** 更新当前激活人的现状字段（兼容旧 updateProfile） */
export function updateProfile(profile: LifeProfileInput): LifeStore {
  const store = loadLifeStore();
  const active = getPersonFromStore(store, store.activeProfileId) ?? store.profiles[0]!;
  const nextPerson: PersonProfile = {
    ...active,
    ...toLifeProfileInput(profile),
  };
  const profiles = store.profiles.map((p) => (p.id === active.id ? nextPerson : p));
  const next = syncFlatProfile({
    ...store,
    profiles,
    portrait: active.id === SELF_PROFILE_ID ? undefined : store.portrait,
  });
  saveLifeStore(next);
  return next;
}

/** 仅合并出生字段到当前激活人；不清除轻画像。 */
export function updateBirthFields(
  birth: Pick<
    LifeProfileInput,
    'birthYear' | 'birthMonth' | 'birthDay' | 'birthHour' | 'birthPlace'
  >,
): LifeStore {
  const store = loadLifeStore();
  const active = getPersonFromStore(store, store.activeProfileId) ?? store.profiles[0]!;
  const nextPerson: PersonProfile = {
    ...active,
    birthYear: birth.birthYear.trim(),
    birthMonth: birth.birthMonth.trim(),
    birthDay: birth.birthDay.trim(),
    birthHour: birth.birthHour.trim(),
    birthPlace: birth.birthPlace.trim(),
  };
  const profiles = store.profiles.map((p) => (p.id === active.id ? nextPerson : p));
  const next = syncFlatProfile({ ...store, profiles });
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
