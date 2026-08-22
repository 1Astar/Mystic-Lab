/**
 * 紫微 AI 深度解读本地文档（person 键）
 * - 兼容旧版纯文本
 * - v1：deepReading + turns + 可选手札关联
 */
export type ZiweiAiDeepTurn = {
  role: 'user' | 'assistant';
  content: string;
  at: string;
};

export type ZiweiAiDeepDoc = {
  v: 1;
  deepReading: string;
  turns: ZiweiAiDeepTurn[];
  updatedAt: string;
  journalId?: string;
  sessionId?: string;
};

export const ZIWEI_AI_DEEP_PREFIX = 'mystic-lab.ziwei-ai-deep.';
const MAX_TURNS = 40;

function storageKey(personId: string): string {
  return `${ZIWEI_AI_DEEP_PREFIX}${personId}`;
}

function emptyDoc(deepReading = ''): ZiweiAiDeepDoc {
  return {
    v: 1,
    deepReading,
    turns: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeTurns(raw: unknown): ZiweiAiDeepTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ZiweiAiDeepTurn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;
    const role = (t as ZiweiAiDeepTurn).role;
    const content = (t as ZiweiAiDeepTurn).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    if (!content.trim()) continue;
    out.push({
      role,
      content,
      at:
        typeof (t as ZiweiAiDeepTurn).at === 'string'
          ? (t as ZiweiAiDeepTurn).at
          : new Date().toISOString(),
    });
  }
  return out.slice(-MAX_TURNS);
}

export function parseZiweiAiDeepRaw(raw: string | null): ZiweiAiDeepDoc | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<ZiweiAiDeepDoc>;
      if (parsed && parsed.v === 1 && typeof parsed.deepReading === 'string') {
        return {
          v: 1,
          deepReading: parsed.deepReading.trim(),
          turns: normalizeTurns(parsed.turns),
          updatedAt:
            typeof parsed.updatedAt === 'string'
              ? parsed.updatedAt
              : new Date().toISOString(),
          journalId: typeof parsed.journalId === 'string' ? parsed.journalId : undefined,
          sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : undefined,
        };
      }
    } catch {
      /* fall through as plain text */
    }
  }
  return emptyDoc(trimmed);
}

function persist(personId: string, doc: ZiweiAiDeepDoc): void {
  try {
    if (!doc.deepReading.trim() && doc.turns.length === 0) {
      localStorage.removeItem(storageKey(personId));
      return;
    }
    localStorage.setItem(storageKey(personId), JSON.stringify(doc));
  } catch {
    /* ignore */
  }
}

export function loadZiweiAiDeepDoc(personId: string): ZiweiAiDeepDoc | null {
  try {
    return parseZiweiAiDeepRaw(localStorage.getItem(storageKey(personId)));
  } catch {
    return null;
  }
}

export function loadZiweiAiDeepReading(personId: string): string | null {
  const doc = loadZiweiAiDeepDoc(personId);
  const t = doc?.deepReading.trim();
  return t || null;
}

export function saveZiweiAiDeepReading(
  personId: string,
  text: string,
  link?: { journalId?: string; sessionId?: string },
): void {
  const deep = text.trim();
  if (!deep) {
    try {
      localStorage.removeItem(storageKey(personId));
    } catch {
      /* ignore */
    }
    return;
  }
  const doc = emptyDoc(deep);
  if (link?.journalId) doc.journalId = link.journalId;
  if (link?.sessionId) doc.sessionId = link.sessionId;
  persist(personId, doc);
}

export function appendZiweiAiDeepTurns(
  personId: string,
  turns: ZiweiAiDeepTurn[],
): void {
  if (!turns.length) return;
  const prev = loadZiweiAiDeepDoc(personId) ?? emptyDoc();
  const next: ZiweiAiDeepDoc = {
    v: 1,
    deepReading: prev.deepReading,
    turns: normalizeTurns([...prev.turns, ...turns]),
    updatedAt: new Date().toISOString(),
    journalId: prev.journalId,
    sessionId: prev.sessionId,
  };
  persist(personId, next);
}
