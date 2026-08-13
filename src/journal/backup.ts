/** Lab 旅程备份：探索 + 各体系占问/手札 + 八字紫微图鉴/验证 + 造命 + 档案 + AI 设置 */

export const BACKUP_FORMAT = 'mystic-lab-backup' as const;
export const BACKUP_VERSION = 1 as const;

/** 明确纳入备份的键 */
export const BACKUP_KEYS = [
  // 塔罗
  'mystic-lab-journal',
  'mystic-lab-codex',
  'mystic-lab-journey-progress',
  'mystic-lab-tarot-review-notified',
  // 小六壬
  'mystic-lab-xiaoliuren-journal',
  'mystic-lab-xiaoliuren-palm-journey',
  'mystic-lab-xiaoliuren-skill-gates',
  'mystic-lab-xlr-review-notified',
  // 六爻
  'mystic-lab-liuyao-journal',
  'mystic-lab-liuyao-classic-fav',
  'mystic-lab-liuyao-classic-seen',
  'mystic.liuyao.hexGuide.sediment.v1',
  'mystic.liuyao.hexGuide.favorites.v1',
  'mystic.ziwei.codex.favorites.v1',
  'mystic-lab-liuyao-mode',
  'mystic-ly-ask-vault',
  // 八字 / 紫微玩过进度
  'mystic-lab-bazi-codex',
  'mystic-lab-ziwei-codex',
  'mystic-lab-bazi-partner',
  'mystic-lab-bazi-rectify-draft',
  'mystic-lab-bazi-rectify-adoption',
  'mystic-lab-bazi-rectify-ai-narrate',
  'mystic-lab-bazi-learn-v1',
  'mystic-lab-bazi-guess-v1',
  'mystic-lab-bazi-week-weather-v1',
  'mystic-lab-bazi-journal',
  'mystic-lab-bazi-codex-marks',
  'mystic-lab-ziwei-journal',
  'mystic.ziwei.yearVerify.v1',
  'mystic.ziwei.dayVerify.v1',
  // 造命功课
  'mystic-lab-craft-xp-v1',
  'mystic-lab-craft-activate-v1',
  'mystic-lab-craft-combo-ach-v1',
  'mystic-lab-year-stance-v1',
  'mystic-lab-daily-quest-v1',
  'mystic-lab-daily-quest-week-v1',
  'mystic-lab-user-xp-v1',
  // 人生宇宙 + 档案
  'mystic-lab-life-universe',
  'mystic-lab-use-profile-in-readings',
  // AI 设置 / 额度（含 API Key）
  'mystic-lab-ai-settings',
  'mystic-lab-ai-service-mode',
  'mystic-lab-ai-quota-v1',
  // 提问教练反馈
  'mystic-lab-question-rewrite-feedback',
  'mystic-lab-question-rewrite-cache',
  'mystic-lab-question-rewrite-refs',
  // 主题 / 分享身份
  'mystic-lab-theme',
  'mystic-lab-share-owner-v1',
  'mystic-lab-share-device-v1',
] as const;

/** 动态笔记键前缀（六爻课程笔记、解读笔记、紫微深度解读等） */
export const BACKUP_KEY_PREFIXES = [
  'mystic-ly-course-note:',
  'mystic-lab.reading-notes.',
  'mystic-lab.ziwei-ai-deep.',
  'mystic-lab.bazi-ai-deep.',
] as const;

/** 永不导入/导出（临时态） */
export const BACKUP_EXCLUDE_KEYS = [
  'mystic-lab-cross-ask-question',
  'mystic.bazi.reading.q',
  'mystic.ziwei.intent',
  'mystic.ziwei.question',
  'mystic-lab-tarot-resume-journal',
] as const;

export type MysticLabBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  appHint?: string;
  keys: Record<string, string>;
};

export type ImportBackupMode = 'merge' | 'replace';

export type ImportBackupOptions = {
  /** 默认 merge：按 id 合并；replace：先清空再写入 */
  mode?: ImportBackupMode;
};

export function collectBackupKeyNames(
  storage: Storage = localStorage,
): string[] {
  const set = new Set<string>(BACKUP_KEYS);
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) continue;
    if ((BACKUP_EXCLUDE_KEYS as readonly string[]).includes(key)) continue;
    for (const prefix of BACKUP_KEY_PREFIXES) {
      if (key.startsWith(prefix)) set.add(key);
    }
  }
  return [...set].sort();
}

export function buildBackupPayload(
  storage: Storage = localStorage,
  appHint = 'Mystic Lab',
): MysticLabBackup {
  const keys: Record<string, string> = {};
  for (const key of collectBackupKeyNames(storage)) {
    const value = storage.getItem(key);
    if (value !== null) keys[key] = value;
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appHint,
    keys,
  };
}

export function serializeBackup(backup: MysticLabBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function parseBackupJson(raw: string): MysticLabBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('不是合法 JSON');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('备份格式无效');
  const obj = parsed as Record<string, unknown>;
  if (obj.format !== BACKUP_FORMAT) {
    throw new Error('不是 Mystic Lab 备份文件');
  }
  if (typeof obj.version !== 'number') throw new Error('缺少 version');
  if (!obj.keys || typeof obj.keys !== 'object' || Array.isArray(obj.keys)) {
    throw new Error('缺少 keys');
  }
  const keys: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj.keys as Record<string, unknown>)) {
    if (typeof v === 'string') keys[k] = v;
    else keys[k] = JSON.stringify(v);
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: String(obj.exportedAt ?? ''),
    appHint: typeof obj.appHint === 'string' ? obj.appHint : undefined,
    keys,
  };
}

function isAllowedImportKey(key: string): boolean {
  if ((BACKUP_EXCLUDE_KEYS as readonly string[]).includes(key)) return false;
  if ((BACKUP_KEYS as readonly string[]).includes(key)) return true;
  return BACKUP_KEY_PREFIXES.some((p) => key.startsWith(p));
}

export type ImportBackupResult = {
  written: number;
  cleared: number;
  skipped: number;
};

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function tsMs(value: unknown): number {
  if (typeof value !== 'string' || !value) return 0;
  const n = Date.parse(value);
  return Number.isFinite(n) ? n : 0;
}

function entryFreshness(entry: Record<string, unknown>): number {
  const feedback = entry.feedback;
  if (feedback && typeof feedback === 'object' && !Array.isArray(feedback)) {
    const at = (feedback as Record<string, unknown>).at;
    const fb = tsMs(at);
    if (fb > 0) return fb;
  }
  return Math.max(tsMs(entry.at), tsMs(entry.createdAt), tsMs(entry.updatedAt));
}

/** 按 id 合并数组；同 id 保留较新的一条 */
function mergeIdArray(
  localRaw: string | null,
  importedRaw: string,
  opts: { idKey?: string; max?: number; sortKey?: string } = {},
): string {
  const idKey = opts.idKey ?? 'id';
  const max = opts.max ?? 80;
  const sortKey = opts.sortKey ?? 'createdAt';

  const local = tryParseJson(localRaw ?? '[]');
  const imported = tryParseJson(importedRaw);
  if (!Array.isArray(imported)) return importedRaw;
  if (!Array.isArray(local)) return importedRaw;

  const map = new Map<string, Record<string, unknown>>();
  const push = (item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const id = row[idKey];
    if (typeof id !== 'string' || !id) return;
    const prev = map.get(id);
    if (!prev || entryFreshness(row) >= entryFreshness(prev)) {
      map.set(id, row);
    }
  };
  for (const item of local) push(item);
  for (const item of imported) push(item);

  const merged = [...map.values()];
  merged.sort((a, b) => tsMs(b[sortKey]) - tsMs(a[sortKey]));
  return JSON.stringify(merged.slice(0, max));
}

/** 提问缓存：按规范化问题合并，同问保留较新 */
function mergeRewriteCache(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '[]');
  const imported = tryParseJson(importedRaw);
  if (!Array.isArray(imported)) return importedRaw;
  if (!Array.isArray(local)) return importedRaw;

  const norm = (q: unknown) =>
    typeof q === 'string' ? q.trim().replace(/\s+/g, ' ') : '';
  const map = new Map<string, Record<string, unknown>>();
  const push = (item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const key = norm(row.originalQuestion);
    if (!key) return;
    const prev = map.get(key);
    if (!prev || tsMs(row.at) >= tsMs(prev.at)) map.set(key, row);
  };
  for (const item of local) push(item);
  for (const item of imported) push(item);
  const merged = [...map.values()];
  merged.sort((a, b) => tsMs(b.at) - tsMs(a.at));
  return JSON.stringify(merged.slice(0, 40));
}

function isDupEncounter(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (String(a.question ?? '').trim() !== String(b.question ?? '').trim()) return false;
  if (a.spreadLabel !== b.spreadLabel) return false;
  if (Boolean(a.reversed) !== Boolean(b.reversed)) return false;
  return Math.abs(tsMs(a.at) - tsMs(b.at)) < 8000;
}

function dedupeEncounters(
  list: Record<string, unknown>[],
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const enc of list) {
    if (out.some((prev) => isDupEncounter(prev, enc))) continue;
    out.push(enc);
  }
  return out;
}

function mergeCodexEntry(
  local: Record<string, unknown> | undefined,
  imported: Record<string, unknown>,
): Record<string, unknown> {
  if (!local) return imported;
  const localEnc = Array.isArray(local.encounters)
    ? (local.encounters as Record<string, unknown>[])
    : [];
  const importedEnc = Array.isArray(imported.encounters)
    ? (imported.encounters as Record<string, unknown>[])
    : [];
  const encounters = dedupeEncounters([...localEnc, ...importedEnc]).sort(
    (a, b) => tsMs(b.at) - tsMs(a.at),
  );
  const localNote = String(local.personalNote ?? '');
  const importedNote = String(imported.personalNote ?? '');
  const firstSeenCandidates = [local.firstSeenAt, imported.firstSeenAt]
    .map((v) => ({ v, t: tsMs(v) }))
    .filter((x) => x.t > 0)
    .sort((a, b) => a.t - b.t);
  return {
    ...local,
    ...imported,
    cardId: imported.cardId ?? local.cardId,
    firstSeenAt: firstSeenCandidates[0]?.v ?? imported.firstSeenAt ?? local.firstSeenAt,
    favorite: Boolean(local.favorite) || Boolean(imported.favorite),
    personalNote:
      importedNote.length >= localNote.length ? importedNote : localNote,
    encounters,
    count: Math.max(encounters.length, 1),
  };
}

function mergeCodex(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{"entries":{}}') as
    | { entries?: Record<string, Record<string, unknown>> }
    | undefined;
  const imported = tryParseJson(importedRaw) as
    | { entries?: Record<string, Record<string, unknown>> }
    | undefined;
  if (!imported || typeof imported !== 'object') return importedRaw;
  const localEntries =
    local && typeof local === 'object' && local.entries && typeof local.entries === 'object'
      ? local.entries
      : {};
  const importedEntries =
    imported.entries && typeof imported.entries === 'object' ? imported.entries : {};
  const cardIds = new Set([
    ...Object.keys(localEntries),
    ...Object.keys(importedEntries),
  ]);
  const entries: Record<string, Record<string, unknown>> = {};
  for (const id of cardIds) {
    const l = localEntries[id];
    const i = importedEntries[id];
    if (i) entries[id] = mergeCodexEntry(l, i);
    else if (l) entries[id] = l;
  }
  return JSON.stringify({ entries });
}

function mergeStringIdList(
  localRaw: string | null,
  importedRaw: string,
  max = 120,
): string {
  const local = tryParseJson(localRaw ?? '[]');
  const imported = tryParseJson(importedRaw);
  if (!Array.isArray(imported)) return importedRaw;
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v !== 'string' || !v || out.includes(v)) return;
    out.push(v);
  };
  if (Array.isArray(local)) for (const v of local) push(v);
  for (const v of imported) push(v);
  return JSON.stringify(out.slice(0, max));
}

function mergeStringMapPreferLonger(
  localRaw: string | null,
  importedRaw: string,
): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const base =
    local && typeof local === 'object' && !Array.isArray(local)
      ? { ...(local as Record<string, unknown>) }
      : {};
  for (const [k, v] of Object.entries(imported as Record<string, unknown>)) {
    if (typeof v !== 'string') {
      base[k] = v;
      continue;
    }
    const prev = base[k];
    if (typeof prev !== 'string' || v.length >= prev.length) base[k] = v;
  }
  return JSON.stringify(base);
}

function mergeNotifiedMap(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const out: Record<string, string> = {};
  const put = (src: unknown) => {
    if (!src || typeof src !== 'object' || Array.isArray(src)) return;
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      if (typeof v !== 'string') continue;
      const prev = out[k];
      if (!prev || tsMs(v) >= tsMs(prev)) out[k] = v;
    }
  };
  put(local);
  put(imported);
  return JSON.stringify(out);
}

function mergePalmJourney(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{"completed":[],"celebrated":false}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const completed: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v && !completed.includes(v)) completed.push(v);
  };
  if (Array.isArray(l.completed)) for (const v of l.completed) push(v);
  if (Array.isArray(i.completed)) for (const v of i.completed) push(v);
  return JSON.stringify({
    completed,
    celebrated: Boolean(l.celebrated) || Boolean(i.celebrated),
  });
}

function mergeSkillGates(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const num = (v: unknown) => Math.max(0, Number(v) || 0);
  return JSON.stringify({
    learnClears: Math.max(num(l.learnClears), num(i.learnClears)),
    practiceClears: Math.max(num(l.practiceClears), num(i.practiceClears)),
  });
}

function mergeMaxNumberString(localRaw: string | null, importedRaw: string): string {
  const localN = Number.parseInt(localRaw ?? '', 10);
  const importedN = Number.parseInt(importedRaw, 10);
  const a = Number.isFinite(localN) ? localN : Number.NEGATIVE_INFINITY;
  const b = Number.isFinite(importedN) ? importedN : Number.NEGATIVE_INFINITY;
  return String(Math.max(a, b));
}

function mergeProfileFields(
  local: Record<string, unknown>,
  imported: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...local };
  for (const [k, v] of Object.entries(imported)) {
    if (typeof v === 'string') {
      const prev = out[k];
      if (typeof prev !== 'string' || v.trim().length >= String(prev).trim().length) {
        out[k] = v;
      }
    } else if (v != null) {
      out[k] = v;
    }
  }
  return out;
}

function mergePersonProfiles(local: unknown, imported: unknown): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>();
  const push = (item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const id = row.id;
    if (typeof id !== 'string' || !id) return;
    const prev = map.get(id);
    map.set(id, prev ? mergeProfileFields(prev, row) : row);
  };
  if (Array.isArray(local)) for (const p of local) push(p);
  if (Array.isArray(imported)) for (const p of imported) push(p);
  return [...map.values()];
}

function mergeLifeUniverse(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;

  const localWorlds = Array.isArray(l.worlds) ? l.worlds : [];
  const importedWorlds = Array.isArray(i.worlds) ? i.worlds : [];
  const worldMap = new Map<string, Record<string, unknown>>();
  const pushWorld = (item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const id = row.id;
    if (typeof id !== 'string' || !id) return;
    const prev = worldMap.get(id);
    if (!prev) {
      worldMap.set(id, row);
      return;
    }
    worldMap.set(id, {
      ...prev,
      ...row,
      archive: row.archive ?? prev.archive,
      selected: Boolean(prev.selected) || Boolean(row.selected),
    });
  };
  for (const w of localWorlds) pushWorld(w);
  for (const w of importedWorlds) pushWorld(w);

  const forecastMap = new Map<string, Record<string, unknown>>();
  const pushForecast = (item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const id = row.id;
    if (typeof id !== 'string' || !id) return;
    const prev = forecastMap.get(id);
    if (!prev || entryFreshness(row) >= entryFreshness(prev)) {
      forecastMap.set(id, row);
    }
  };
  if (Array.isArray(l.forecasts)) for (const f of l.forecasts) pushForecast(f);
  if (Array.isArray(i.forecasts)) for (const f of i.forecasts) pushForecast(f);
  const forecasts = [...forecastMap.values()].sort(
    (a, b) => tsMs(b.createdAt) - tsMs(a.createdAt),
  );

  const localProfile =
    l.profile && typeof l.profile === 'object' && !Array.isArray(l.profile)
      ? (l.profile as Record<string, unknown>)
      : {};
  const importedProfile =
    i.profile && typeof i.profile === 'object' && !Array.isArray(i.profile)
      ? (i.profile as Record<string, unknown>)
      : {};

  const pickNewerObj = (
    a: unknown,
    b: unknown,
    atKey: string,
  ): unknown => {
    const ao = a && typeof a === 'object' && !Array.isArray(a) ? (a as Record<string, unknown>) : null;
    const bo = b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
    if (!ao) return bo ?? a;
    if (!bo) return ao;
    return tsMs(bo[atKey]) >= tsMs(ao[atKey]) ? bo : ao;
  };

  const profiles = mergePersonProfiles(l.profiles, i.profiles);
  const activeProfileId =
    (typeof i.activeProfileId === 'string' &&
    profiles.some((p) => p.id === i.activeProfileId)
      ? i.activeProfileId
      : undefined) ??
    (typeof l.activeProfileId === 'string' &&
    profiles.some((p) => p.id === l.activeProfileId)
      ? l.activeProfileId
      : undefined) ??
    (typeof profiles[0]?.id === 'string' ? profiles[0].id : 'self');

  const updatedAt =
    tsMs(i.updatedAt) >= tsMs(l.updatedAt)
      ? (i.updatedAt ?? l.updatedAt)
      : (l.updatedAt ?? i.updatedAt);

  return JSON.stringify({
    ...l,
    ...i,
    profiles: profiles.length > 0 ? profiles : i.profiles ?? l.profiles,
    activeProfileId,
    profile: mergeProfileFields(localProfile, importedProfile),
    worlds: [...worldMap.values()],
    forecasts: forecasts.slice(0, 40),
    portrait: pickNewerObj(l.portrait, i.portrait, 'generatedAt'),
    simulation: pickNewerObj(l.simulation, i.simulation, 'generatedAt'),
    updatedAt,
  });
}

function mergeBaziCodex(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{"entries":[],"metTags":[]}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const map = new Map<string, Record<string, unknown>>();
  const push = (item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const id = row.id;
    if (typeof id !== 'string' || !id) return;
    const prev = map.get(id);
    if (!prev) {
      map.set(id, row);
      return;
    }
    const earlier =
      tsMs(row.unlockedAt) > 0 &&
      (tsMs(prev.unlockedAt) <= 0 || tsMs(row.unlockedAt) < tsMs(prev.unlockedAt))
        ? row.unlockedAt
        : prev.unlockedAt;
    map.set(id, {
      ...prev,
      ...row,
      unlockedAt: earlier ?? prev.unlockedAt ?? row.unlockedAt,
      meetCount: Math.max(Number(prev.meetCount) || 0, Number(row.meetCount) || 0),
      reason: row.reason ?? prev.reason,
    });
  };
  if (Array.isArray(l.entries)) for (const e of l.entries) push(e);
  if (Array.isArray(i.entries)) for (const e of i.entries) push(e);
  const metTags = new Set<string>();
  for (const src of [l.metTags, i.metTags]) {
    if (!Array.isArray(src)) continue;
    for (const t of src) if (typeof t === 'string' && t) metTags.add(t);
  }
  const updatedAt =
    tsMs(i.updatedAt) >= tsMs(l.updatedAt)
      ? (i.updatedAt ?? l.updatedAt)
      : (l.updatedAt ?? i.updatedAt);
  return JSON.stringify({
    entries: [...map.values()],
    metTags: [...metTags],
    updatedAt,
  });
}

/** 八字图鉴标记：按 id 并集 fire/useful */
function mergeBaziCodexMarks(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const out: Record<string, string[]> = {};
  for (const src of [l, i]) {
    for (const [id, marks] of Object.entries(src)) {
      if (!id || !Array.isArray(marks)) continue;
      const set = new Set(out[id] ?? []);
      for (const m of marks) {
        if (m === 'fire' || m === 'useful') set.add(m);
      }
      if (set.size) out[id] = [...set];
    }
  }
  return JSON.stringify(out);
}

function mergeZiweiCodex(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{"entries":[]}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const map = new Map<string, Record<string, unknown>>();
  const push = (item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const id = row.starId;
    if (typeof id !== 'string' || !id) return;
    const prev = map.get(id);
    if (!prev) {
      map.set(id, row);
      return;
    }
    const earlier =
      tsMs(row.unlockedAt) > 0 &&
      (tsMs(prev.unlockedAt) <= 0 || tsMs(row.unlockedAt) < tsMs(prev.unlockedAt))
        ? row.unlockedAt
        : prev.unlockedAt;
    const useImportedPalace = tsMs(row.unlockedAt) >= tsMs(prev.unlockedAt);
    map.set(id, {
      ...prev,
      ...row,
      unlockedAt: earlier ?? prev.unlockedAt ?? row.unlockedAt,
      meetCount: Math.max(Number(prev.meetCount) || 0, Number(row.meetCount) || 0),
      lastPalace: useImportedPalace
        ? row.lastPalace ?? prev.lastPalace
        : prev.lastPalace ?? row.lastPalace,
    });
  };
  if (Array.isArray(l.entries)) for (const e of l.entries) push(e);
  if (Array.isArray(i.entries)) for (const e of i.entries) push(e);
  const updatedAt =
    tsMs(i.updatedAt) >= tsMs(l.updatedAt)
      ? (i.updatedAt ?? l.updatedAt)
      : (l.updatedAt ?? i.updatedAt);
  return JSON.stringify({ entries: [...map.values()], updatedAt });
}

function mergeCraftXp(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const checked: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v && !checked.includes(v)) checked.push(v);
  };
  if (Array.isArray(l.checked)) for (const v of l.checked) push(v);
  if (Array.isArray(i.checked)) for (const v of i.checked) push(v);
  const xp = Math.max(Number(l.xp) || 0, Number(i.xp) || 0);
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const updatedAt =
    tsMs(i.updatedAt) >= tsMs(l.updatedAt)
      ? (i.updatedAt ?? l.updatedAt)
      : (l.updatedAt ?? i.updatedAt);
  return JSON.stringify({
    xp,
    level,
    checked: checked.slice(-200),
    updatedAt,
  });
}

function mergeCraftActivate(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const union = (a: unknown, b: unknown) => {
    const out: string[] = [];
    const push = (v: unknown) => {
      if (typeof v === 'string' && v && !out.includes(v)) out.push(v);
    };
    if (Array.isArray(a)) for (const v of a) push(v);
    if (Array.isArray(b)) for (const v of b) push(v);
    return out.slice(-500);
  };
  const updatedAt =
    tsMs(i.updatedAt) >= tsMs(l.updatedAt)
      ? (i.updatedAt ?? l.updatedAt)
      : (l.updatedAt ?? i.updatedAt);
  return JSON.stringify({
    activated: union(l.activated, i.activated),
    explored: union(l.explored, i.explored),
    updatedAt,
  });
}

function mergeCraftComboAchToast(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v && !out.includes(v)) out.push(v);
  };
  if (Array.isArray(l.toasted)) for (const v of l.toasted) push(v);
  if (Array.isArray(i.toasted)) for (const v of i.toasted) push(v);
  const updatedAt =
    tsMs(i.updatedAt) >= tsMs(l.updatedAt)
      ? (i.updatedAt ?? l.updatedAt)
      : (l.updatedAt ?? i.updatedAt);
  return JSON.stringify({ toasted: out.slice(-50), updatedAt });
}

const QUEST_STATUS_RANK: Record<string, number> = {
  todo: 0,
  doing: 1,
  dismissed: 2,
  done: 3,
};

function mergeDailyQuestBag(
  localRaw: string | null,
  importedRaw: string,
): string {
  const parseList = (raw: string | null): Record<string, unknown>[] => {
    const p = tryParseJson(raw ?? '');
    if (!p) return [];
    if (Array.isArray(p)) return p.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
    if (typeof p === 'object' && Array.isArray((p as { quests?: unknown }).quests)) {
      return ((p as { quests: unknown[] }).quests).filter(
        (x) => x && typeof x === 'object',
      ) as Record<string, unknown>[];
    }
    return [];
  };
  const map = new Map<string, Record<string, unknown>>();
  const prefer = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const ra = QUEST_STATUS_RANK[String(a.status)] ?? 0;
    const rb = QUEST_STATUS_RANK[String(b.status)] ?? 0;
    if (rb !== ra) return rb > ra ? b : a;
    const ta = String(a.settledAt ?? a.createdAt ?? '');
    const tb = String(b.settledAt ?? b.createdAt ?? '');
    return tb >= ta ? b : a;
  };
  for (const q of [...parseList(localRaw), ...parseList(importedRaw)]) {
    const id = typeof q.id === 'string' ? q.id : '';
    if (!id) continue;
    const prev = map.get(id);
    map.set(id, prev ? prefer(prev, q) : q);
  }
  return JSON.stringify({ quests: [...map.values()].slice(-400) });
}

function mergeDailyQuestWeek(
  localRaw: string | null,
  importedRaw: string,
): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, Record<string, unknown>>)
      : {};
  const i =
    imported && typeof imported === 'object' && !Array.isArray(imported)
      ? (imported as Record<string, Record<string, unknown>>)
      : {};
  const keys = new Set([...Object.keys(l), ...Object.keys(i)]);
  const out: Record<string, Record<string, unknown>> = {};
  for (const k of keys) {
    const a = l[k];
    const b = i[k];
    if (!a) {
      out[k] = b!;
      continue;
    }
    if (!b) {
      out[k] = a;
      continue;
    }
    const attrByAxis: Record<string, number> = {};
    const mergeAxis = (src: unknown) => {
      if (!src || typeof src !== 'object') return;
      for (const [axis, v] of Object.entries(src as Record<string, unknown>)) {
        attrByAxis[axis] = Math.max(attrByAxis[axis] ?? 0, Number(v) || 0);
      }
    };
    mergeAxis(a.attrByAxis);
    mergeAxis(b.attrByAxis);
    out[k] = {
      ...a,
      ...b,
      userId: a.userId ?? b.userId,
      weekStart: a.weekStart ?? b.weekStart,
      weekAttrGained: Math.max(Number(a.weekAttrGained) || 0, Number(b.weekAttrGained) || 0),
      weekXpGained: Math.max(Number(a.weekXpGained) || 0, Number(b.weekXpGained) || 0),
      weekDailyStreak: Math.max(Number(a.weekDailyStreak) || 0, Number(b.weekDailyStreak) || 0),
      swapCountDaily: Math.max(Number(a.swapCountDaily) || 0, Number(b.swapCountDaily) || 0),
      swapCountWeekly: Math.max(Number(a.swapCountWeekly) || 0, Number(b.swapCountWeekly) || 0),
      lastDailyDoneDate:
        String(a.lastDailyDoneDate ?? '') >= String(b.lastDailyDoneDate ?? '')
          ? a.lastDailyDoneDate ?? b.lastDailyDoneDate
          : b.lastDailyDoneDate ?? a.lastDailyDoneDate,
      attrByAxis,
    };
  }
  return JSON.stringify(out);
}

function mergeUserXpAgg(localRaw: string | null, importedRaw: string): string {
  const normalize = (raw: string | null): Record<string, Record<string, unknown>> => {
    const p = tryParseJson(raw ?? '');
    if (!p || typeof p !== 'object') return {};
    if ('userId' in (p as object) && 'totalXp' in (p as object)) {
      const one = p as Record<string, unknown>;
      const id = String(one.userId ?? '');
      return id ? { [id]: one } : {};
    }
    return p as Record<string, Record<string, unknown>>;
  };
  const l = normalize(localRaw);
  const i = normalize(importedRaw);
  const keys = new Set([...Object.keys(l), ...Object.keys(i)]);
  const out: Record<string, Record<string, unknown>> = {};
  for (const k of keys) {
    const a = l[k];
    const b = i[k];
    if (!a) {
      out[k] = b!;
      continue;
    }
    if (!b) {
      out[k] = a;
      continue;
    }
    const totalXp = Math.max(Number(a.totalXp) || 0, Number(b.totalXp) || 0);
    const lastUpdated =
      String(a.lastUpdated ?? '') >= String(b.lastUpdated ?? '')
        ? a.lastUpdated ?? b.lastUpdated
        : b.lastUpdated ?? a.lastUpdated;
    out[k] = {
      userId: a.userId ?? b.userId ?? k,
      totalXp,
      lastUpdated,
    };
  }
  return JSON.stringify(out);
}

/** 合并 `{ personKey: string[] }` 类校验记录 */
function mergeStringListMap(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const out: Record<string, string[]> = {};
  const put = (src: unknown) => {
    if (!src || typeof src !== 'object' || Array.isArray(src)) return;
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      if (!Array.isArray(v)) continue;
      const prev = out[k] ?? [];
      const next = [...prev];
      for (const item of v) {
        if (typeof item === 'string' && item && !next.includes(item)) next.push(item);
      }
      out[k] = next.slice(-40);
    }
  };
  put(local);
  put(imported);
  return JSON.stringify(out);
}

function mergeAiQuota(localRaw: string | null, importedRaw: string): string {
  const local = tryParseJson(localRaw ?? '{}');
  const imported = tryParseJson(importedRaw);
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    return importedRaw;
  }
  const l =
    local && typeof local === 'object' && !Array.isArray(local)
      ? (local as Record<string, unknown>)
      : {};
  const i = imported as Record<string, unknown>;
  const num = (v: unknown) => Math.max(0, Number(v) || 0);
  const out: Record<string, unknown> = { ...l, ...i };
  for (const key of Object.keys({ ...l, ...i })) {
    if (
      /left|remain|count|used|deep|follow|bonus|reward/i.test(key) &&
      (typeof l[key] === 'number' || typeof i[key] === 'number')
    ) {
      // 额度类：保留较大的剩余，避免合并后「用完」
      if (typeof l[key] === 'number' || typeof i[key] === 'number') {
        out[key] = Math.max(num(l[key]), num(i[key]));
      }
    }
  }
  return JSON.stringify(out);
}

function mergeKeyValue(
  key: string,
  localRaw: string | null,
  importedRaw: string,
): string {
  if (localRaw == null) return importedRaw;

  switch (key) {
    case 'mystic-lab-journal':
    case 'mystic-lab-xiaoliuren-journal':
    case 'mystic-lab-liuyao-journal':
    case 'mystic-lab-bazi-journal':
    case 'mystic-lab-ziwei-journal':
      return mergeIdArray(localRaw, importedRaw, { max: 80, sortKey: 'createdAt' });
    case 'mystic-lab-question-rewrite-feedback':
      return mergeIdArray(localRaw, importedRaw, {
        max: 30,
        sortKey: 'at',
      });
    case 'mystic-lab-question-rewrite-cache':
      return mergeRewriteCache(localRaw, importedRaw);
    case 'mystic-lab-codex':
      return mergeCodex(localRaw, importedRaw);
    case 'mystic-lab-liuyao-classic-fav':
    case 'mystic-lab-liuyao-classic-seen':
    case 'mystic.liuyao.hexGuide.favorites.v1':
      return mergeStringIdList(localRaw, importedRaw, 120);
    case 'mystic-ly-ask-vault':
      return mergeIdArray(localRaw, importedRaw, { max: 80, sortKey: 'createdAt' });
    case 'mystic.liuyao.hexGuide.sediment.v1':
      return mergeStringMapPreferLonger(localRaw, importedRaw);
    case 'mystic-lab-tarot-review-notified':
    case 'mystic-lab-xlr-review-notified':
      return mergeNotifiedMap(localRaw, importedRaw);
    case 'mystic-lab-xiaoliuren-palm-journey':
      return mergePalmJourney(localRaw, importedRaw);
    case 'mystic-lab-xiaoliuren-skill-gates':
      return mergeSkillGates(localRaw, importedRaw);
    case 'mystic-lab-journey-progress':
      return mergeMaxNumberString(localRaw, importedRaw);
    case 'mystic-lab-life-universe':
      return mergeLifeUniverse(localRaw, importedRaw);
    case 'mystic-lab-bazi-codex':
      return mergeBaziCodex(localRaw, importedRaw);
    case 'mystic-lab-bazi-codex-marks':
      return mergeBaziCodexMarks(localRaw, importedRaw);
    case 'mystic-lab-ziwei-codex':
      return mergeZiweiCodex(localRaw, importedRaw);
    case 'mystic-lab-craft-xp-v1':
      return mergeCraftXp(localRaw, importedRaw);
    case 'mystic-lab-craft-activate-v1':
      return mergeCraftActivate(localRaw, importedRaw);
    case 'mystic-lab-craft-combo-ach-v1':
      return mergeCraftComboAchToast(localRaw, importedRaw);
    case 'mystic-lab-daily-quest-v1':
      return mergeDailyQuestBag(localRaw, importedRaw);
    case 'mystic-lab-daily-quest-week-v1':
      return mergeDailyQuestWeek(localRaw, importedRaw);
    case 'mystic-lab-user-xp-v1':
      return mergeUserXpAgg(localRaw, importedRaw);
    case 'mystic.ziwei.yearVerify.v1':
    case 'mystic.ziwei.dayVerify.v1':
      return mergeStringListMap(localRaw, importedRaw);
    case 'mystic-lab-ai-quota-v1':
      return mergeAiQuota(localRaw, importedRaw);
    case 'mystic-lab-question-rewrite-refs':
      return mergeStringIdList(localRaw, importedRaw, 80);
    default:
      // 前缀笔记 / AI 设置 / 校正草稿等：备份侧覆盖；纯文本取更长
      if (
        key.startsWith('mystic-lab.reading-notes.') ||
        key.startsWith('mystic-lab.ziwei-ai-deep.') ||
        key.startsWith('mystic-lab.bazi-ai-deep.') ||
        key.startsWith('mystic-ly-course-note:')
      ) {
        const localText = localRaw ?? '';
        return importedRaw.length >= localText.length ? importedRaw : localText;
      }
      return importedRaw;
  }
}

function importReplace(
  backup: MysticLabBackup,
  storage: Storage,
): ImportBackupResult {
  let cleared = 0;
  for (const key of collectBackupKeyNames(storage)) {
    if (storage.getItem(key) !== null) {
      storage.removeItem(key);
      cleared += 1;
    }
  }

  let written = 0;
  let skipped = 0;
  for (const [key, value] of Object.entries(backup.keys)) {
    if (!isAllowedImportKey(key)) {
      skipped += 1;
      continue;
    }
    storage.setItem(key, value);
    written += 1;
  }
  return { written, cleared, skipped };
}

function importMerge(
  backup: MysticLabBackup,
  storage: Storage,
): ImportBackupResult {
  let written = 0;
  let skipped = 0;
  for (const [key, value] of Object.entries(backup.keys)) {
    if (!isAllowedImportKey(key)) {
      skipped += 1;
      continue;
    }
    const local = storage.getItem(key);
    storage.setItem(key, mergeKeyValue(key, local, value));
    written += 1;
  }
  return { written, cleared: 0, skipped };
}

/**
 * 导入备份。
 * - merge（默认）：手札/探索等按 id 合并，同 id 保留较新；本机独有键保留
 * - replace：先清空本机覆盖范围内的键，再写入备份内容
 */
export function importBackupPayload(
  backup: MysticLabBackup,
  storage: Storage = localStorage,
  options: ImportBackupOptions = {},
): ImportBackupResult {
  const mode = options.mode ?? 'merge';
  return mode === 'replace'
    ? importReplace(backup, storage)
    : importMerge(backup, storage);
}

export function backupFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `mystic-lab-backup-${y}${m}${d}-${hh}${mm}.json`;
}
