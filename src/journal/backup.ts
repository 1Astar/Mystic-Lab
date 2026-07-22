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

/**
 * 导入：先清空本机「覆盖范围内」的键，再写入备份内容。
 * 不含跨问临时缓存等排除项。
 */
export function importBackupPayload(
  backup: MysticLabBackup,
  storage: Storage = localStorage,
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

export function backupFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `mystic-lab-backup-${y}${m}${d}-${hh}${mm}.json`;
}
