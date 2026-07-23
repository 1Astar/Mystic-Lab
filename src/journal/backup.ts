/** Lab 旅程备份：图鉴 + 各体系占问/手札/进度 + AI 设置（含 API Key） */

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
  'mystic-lab-liuyao-mode',
  // 人生宇宙 + 档案
  'mystic-lab-life-universe',
  'mystic-lab-use-profile-in-readings',
  // AI 设置（含 API Key）
  'mystic-lab-ai-settings',
  // 提问教练反馈
  'mystic-lab-question-rewrite-feedback',
  'mystic-lab-question-rewrite-cache',
] as const;

/** 动态笔记键前缀（六爻课程笔记等） */
export const BACKUP_KEY_PREFIXES = ['mystic-ly-course-note:'] as const;

/** 永不导入/导出（临时态） */
export const BACKUP_EXCLUDE_KEYS = ['mystic-lab-cross-ask-question'] as const;

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

  const updatedAt =
    tsMs(i.updatedAt) >= tsMs(l.updatedAt)
      ? (i.updatedAt ?? l.updatedAt)
      : (l.updatedAt ?? i.updatedAt);

  return JSON.stringify({
    ...l,
    ...i,
    profile: mergeProfileFields(localProfile, importedProfile),
    worlds: [...worldMap.values()],
    forecasts: forecasts.slice(0, 40),
    portrait: pickNewerObj(l.portrait, i.portrait, 'generatedAt'),
    simulation: pickNewerObj(l.simulation, i.simulation, 'generatedAt'),
    updatedAt,
  });
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
      return mergeStringIdList(localRaw, importedRaw, 120);
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
    default:
      // AI 设置、模式开关、课程笔记等：备份侧覆盖
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
 * - merge（默认）：手札/图鉴等按 id 合并，同 id 保留较新；本机独有键保留
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
