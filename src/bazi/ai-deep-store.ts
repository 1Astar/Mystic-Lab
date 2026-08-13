/**
 * 八字 AI 深度解读本地文档（person 键）
 * - 兼容旧版纯文本
 * - v1：deepReading + turns（多轮追问）+ 可选手札关联
 */
export type BaziAiDeepTurn = {
  role: 'user' | 'assistant';
  content: string;
  at: string;
};

export type BaziAiDeepDoc = {
  v: 1;
  deepReading: string;
  turns: BaziAiDeepTurn[];
  updatedAt: string;
  /** 挂入八字手札后的条目 id（回放用） */
  journalId?: string;
  /** 当前深度会话 id */
  sessionId?: string;
};

export const BAZI_AI_DEEP_PREFIX = 'mystic-lab.bazi-ai-deep.';
const MAX_TURNS = 40;

function storageKey(personId: string): string {
  return `${BAZI_AI_DEEP_PREFIX}${personId}`;
}

function emptyDoc(deepReading = ''): BaziAiDeepDoc {
  return {
    v: 1,
    deepReading,
    turns: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeTurns(raw: unknown): BaziAiDeepTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: BaziAiDeepTurn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;
    const role = (t as BaziAiDeepTurn).role;
    const content = (t as BaziAiDeepTurn).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    if (!content.trim()) continue;
    out.push({
      role,
      content,
      at:
        typeof (t as BaziAiDeepTurn).at === 'string'
          ? (t as BaziAiDeepTurn).at
          : new Date().toISOString(),
    });
  }
  return out.slice(-MAX_TURNS);
}

/** 解析 localStorage：纯文本 → 仅 deepReading；JSON v1 → 全文 */
export function parseBaziAiDeepRaw(raw: string | null): BaziAiDeepDoc | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<BaziAiDeepDoc>;
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

function persist(personId: string, doc: BaziAiDeepDoc): void {
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

export function loadBaziAiDeepDoc(personId: string): BaziAiDeepDoc | null {
  try {
    return parseBaziAiDeepRaw(localStorage.getItem(storageKey(personId)));
  } catch {
    return null;
  }
}

export function loadBaziAiDeepReading(personId: string): string | null {
  const doc = loadBaziAiDeepDoc(personId);
  const t = doc?.deepReading.trim();
  return t || null;
}

/** 写入/覆盖深度解读；重新生成时清空追问回合 */
export function saveBaziAiDeepReading(
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

export function appendBaziAiDeepTurns(
  personId: string,
  turns: BaziAiDeepTurn[],
): void {
  if (!turns.length) return;
  const prev = loadBaziAiDeepDoc(personId) ?? emptyDoc();
  const next: BaziAiDeepDoc = {
    v: 1,
    deepReading: prev.deepReading,
    turns: normalizeTurns([...prev.turns, ...turns]),
    updatedAt: new Date().toISOString(),
    journalId: prev.journalId,
    sessionId: prev.sessionId,
  };
  persist(personId, next);
}
