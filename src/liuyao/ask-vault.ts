/** 六爻边看边问 · 本机问答库 */

export const ASK_VAULT_KEY = 'mystic-ly-ask-vault';
export const ASK_PROMOTE_MIN_ASKS = 5;
export const ASK_PROMOTE_MIN_USEFUL = 3;
const MAX_STORE = 200;
const MIN_Q_LEN = 4;

export type AskSource = 'seed' | 'rule' | 'ai' | 'promoted';

export type AskVaultEntry = {
  id: string;
  qKey: string;
  q: string;
  a: string;
  hexName: string;
  domain: string;
  source: AskSource;
  askCount: number;
  usefulVotes: number;
  unclearVotes: number;
  createdAt: string;
  updatedAt: string;
  readingQuestion?: string;
};

export type UpsertAskInput = {
  q: string;
  a: string;
  hexName: string;
  domain: string;
  source: Exclude<AskSource, 'promoted'>;
  readingQuestion?: string;
};

/** 规范化问句；过短返回空串（表示拒收） */
export function normalizeAskQuestion(raw: string): string {
  let s = raw.trim().replace(/\s+/g, ' ');
  s = s
    .replace(/[？?]+$/g, '')
    .replace(/[！!]+$/g, '')
    .replace(/[：:]/g, ':')
    .replace(/[，,]/g, ',')
    .replace(/[（]/g, '(')
    .replace(/[）)]/g, ')');
  if (s.length < MIN_Q_LEN) return '';
  return s;
}

function loadAll(): AskVaultEntry[] {
  try {
    const raw = localStorage.getItem(ASK_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AskVaultEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items: AskVaultEntry[]): void {
  localStorage.setItem(ASK_VAULT_KEY, JSON.stringify(items.slice(0, MAX_STORE)));
}

function newId(): string {
  return `ask-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function maybePromote(entry: AskVaultEntry): AskVaultEntry {
  if (
    entry.askCount >= ASK_PROMOTE_MIN_ASKS &&
    entry.usefulVotes >= ASK_PROMOTE_MIN_USEFUL &&
    entry.source !== 'seed'
  ) {
    return { ...entry, source: 'promoted' };
  }
  return entry;
}

export function listAskVault(): AskVaultEntry[] {
  return loadAll();
}

export function findAskEntry(hexName: string, q: string): AskVaultEntry | null {
  const qKey = normalizeAskQuestion(q);
  if (!qKey) return null;
  return loadAll().find((e) => e.hexName === hexName && e.qKey === qKey) ?? null;
}

/** 新问入库或同键累加 askCount；更新答案时以新答案为准 */
export function upsertAskEntry(input: UpsertAskInput): AskVaultEntry {
  const qKey = normalizeAskQuestion(input.q);
  if (!qKey) {
    throw new Error('问题过短，请写完整一点');
  }
  const now = new Date().toISOString();
  const all = loadAll();
  const idx = all.findIndex((e) => e.hexName === input.hexName && e.qKey === qKey);
  if (idx >= 0) {
    const prev = all[idx]!;
    let next: AskVaultEntry = {
      ...prev,
      q: input.q.trim(),
      a: input.a.trim() || prev.a,
      domain: input.domain || prev.domain,
      askCount: prev.askCount + 1,
      updatedAt: now,
      readingQuestion: input.readingQuestion ?? prev.readingQuestion,
    };
    if (prev.source !== 'promoted' && prev.source !== 'seed') {
      next.source = input.source;
    }
    next = maybePromote(next);
    all[idx] = next;
    saveAll(all);
    return next;
  }

  const created: AskVaultEntry = maybePromote({
    id: newId(),
    qKey,
    q: input.q.trim(),
    a: input.a.trim(),
    hexName: input.hexName,
    domain: input.domain,
    source: input.source,
    askCount: 1,
    usefulVotes: 0,
    unclearVotes: 0,
    createdAt: now,
    updatedAt: now,
    readingQuestion: input.readingQuestion,
  });
  saveAll([created, ...all]);
  return created;
}

export function voteAskUseful(id: string): AskVaultEntry | null {
  const all = loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  let next = {
    ...all[idx]!,
    usefulVotes: all[idx]!.usefulVotes + 1,
    updatedAt: new Date().toISOString(),
  };
  next = maybePromote(next);
  all[idx] = next;
  saveAll(all);
  return next;
}

export function voteAskUnclear(id: string): AskVaultEntry | null {
  const all = loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next = {
    ...all[idx]!,
    unclearVotes: all[idx]!.unclearVotes + 1,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = next;
  saveAll(all);
  return next;
}

/** 已达回灌门槛的常问（按 usefulVotes、askCount 排序） */
export function listPromotedAsks(hexName: string): AskVaultEntry[] {
  return loadAll()
    .filter(
      (e) =>
        e.hexName === hexName &&
        e.source === 'promoted' &&
        e.askCount >= ASK_PROMOTE_MIN_ASKS &&
        e.usefulVotes >= ASK_PROMOTE_MIN_USEFUL,
    )
    .sort((a, b) => b.usefulVotes - a.usefulVotes || b.askCount - a.askCount);
}
