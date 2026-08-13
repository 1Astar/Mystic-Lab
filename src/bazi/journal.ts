/**
 * 八字手札：本地日记，附当时格局/喜用与大运流年快照。
 * 对齐六爻：深度解读 / 追问可挂入 aiSessions，手札内回看。
 */
import type { BaziChart } from './cast.ts';
import { dayunLoreHint } from './codex-jiazi-dayun-lore.ts';
import type { LuckCycles } from './luck-cycles.ts';
import { resolvePatternYongshen } from './pattern-yongshen.ts';
import { ensureSceneTags, normalizeSceneTags } from '../life/scene-tags.ts';
import { currentReadingSubject } from '../life/reading-subject.ts';

export type BaziJournalMood = '' | 'calm' | 'up' | 'heavy' | 'curious';

export const BAZI_JOURNAL_MOODS: ReadonlyArray<{
  id: BaziJournalMood;
  label: string;
}> = [
  { id: '', label: '不标' },
  { id: 'calm', label: '平静' },
  { id: 'up', label: '开朗' },
  { id: 'heavy', label: '沉一点' },
  { id: 'curious', label: '好奇' },
];

export type BaziAiTurn = {
  role: 'user' | 'assistant';
  content: string;
  at: string;
};

/** 一次深度解读 / 追问会话（落入手札，可回看） */
export type BaziAiSession = {
  id: string;
  kind: 'deep' | 'followup';
  createdAt: string;
  updatedAt: string;
  deepReading?: string;
  turns: BaziAiTurn[];
};

export type BaziJournalSnapshot = {
  dayMaster: string;
  dayMasterWx: string;
  patternName: string;
  bodyBand: string;
  yongWx: string[];
  jiWx: string[];
  dayunGanZhi: string;
  dayunHint: string;
  liunianLabel: string;
};

export type BaziJournalEntry = {
  id: string;
  createdAt: string;
  /** 主文 */
  body: string;
  /** 后来补写 */
  reflection: string;
  mood: BaziJournalMood;
  snapshot: BaziJournalSnapshot | null;
  sceneTags?: string[];
  subjectId?: string;
  subjectName?: string;
  /** AI 深度解读与追问（可多段） */
  aiSessions?: BaziAiSession[];
};

export const BAZI_JOURNAL_STORAGE_KEY = 'mystic-lab-bazi-journal';
const MAX_ENTRIES = 80;
const MAX_BODY = 2000;

function persist(list: BaziJournalEntry[]): void {
  localStorage.setItem(BAZI_JOURNAL_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
}

function isMood(v: unknown): v is BaziJournalMood {
  return v === '' || v === 'calm' || v === 'up' || v === 'heavy' || v === 'curious';
}

function normalizeSnapshot(raw: unknown): BaziJournalSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<BaziJournalSnapshot>;
  return {
    dayMaster: typeof s.dayMaster === 'string' ? s.dayMaster : '',
    dayMasterWx: typeof s.dayMasterWx === 'string' ? s.dayMasterWx : '',
    patternName: typeof s.patternName === 'string' ? s.patternName : '',
    bodyBand: typeof s.bodyBand === 'string' ? s.bodyBand : '',
    yongWx: Array.isArray(s.yongWx) ? s.yongWx.filter((x): x is string => typeof x === 'string') : [],
    jiWx: Array.isArray(s.jiWx) ? s.jiWx.filter((x): x is string => typeof x === 'string') : [],
    dayunGanZhi: typeof s.dayunGanZhi === 'string' ? s.dayunGanZhi : '',
    dayunHint: typeof s.dayunHint === 'string' ? s.dayunHint : '',
    liunianLabel: typeof s.liunianLabel === 'string' ? s.liunianLabel : '',
  };
}

function normalizeAiSessions(raw: unknown): BaziAiSession[] {
  if (!Array.isArray(raw)) return [];
  const out: BaziAiSession[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Partial<BaziAiSession>;
    if (typeof s.id !== 'string' || !s.id) continue;
    const kind = s.kind === 'followup' ? 'followup' : 'deep';
    const turns: BaziAiTurn[] = [];
    if (Array.isArray(s.turns)) {
      for (const t of s.turns) {
        if (!t || typeof t !== 'object') continue;
        const role = (t as BaziAiTurn).role;
        const content = (t as BaziAiTurn).content;
        if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
        if (!content.trim()) continue;
        turns.push({
          role,
          content,
          at:
            typeof (t as BaziAiTurn).at === 'string'
              ? (t as BaziAiTurn).at
              : new Date().toISOString(),
        });
      }
    }
    out.push({
      id: s.id,
      kind,
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
      updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
      deepReading: typeof s.deepReading === 'string' ? s.deepReading : undefined,
      turns: turns.slice(-40),
    });
  }
  return out.slice(-8);
}

function normalizeEntry(entry: BaziJournalEntry): BaziJournalEntry {
  return {
    ...entry,
    body: typeof entry.body === 'string' ? entry.body : '',
    reflection: typeof entry.reflection === 'string' ? entry.reflection : '',
    mood: isMood(entry.mood) ? entry.mood : '',
    snapshot: normalizeSnapshot(entry.snapshot),
    sceneTags: normalizeSceneTags(entry.sceneTags),
    aiSessions: normalizeAiSessions(entry.aiSessions),
  };
}

export function moodLabel(mood: BaziJournalMood): string {
  return BAZI_JOURNAL_MOODS.find((m) => m.id === mood)?.label ?? '';
}

/** 从当前盘 + 运程做快照（规则推演，非子平全书） */
export function buildBaziJournalSnapshot(
  chart: BaziChart,
  luck: LuckCycles | null,
): BaziJournalSnapshot {
  const py = resolvePatternYongshen(chart);
  const du = luck?.dayun.find((d) => d.current && !d.empty);
  const ln = luck?.liunian.find((l) => l.current) || luck?.liunian.find((l) => l.selected);
  const dayunGanZhi = du?.ganZhi || '';
  return {
    dayMaster: py.dayMaster,
    dayMasterWx: py.dayMasterWx || '',
    patternName: py.patternName,
    bodyBand: py.bodyBand,
    yongWx: [...py.yongWx],
    jiWx: [...py.jiWx],
    dayunGanZhi,
    dayunHint: dayunGanZhi ? dayunLoreHint(dayunGanZhi) || '' : '',
    liunianLabel: ln ? `${ln.year}${ln.ganZhi || ''}` : '',
  };
}

export function loadBaziJournal(): BaziJournalEntry[] {
  try {
    const raw = localStorage.getItem(BAZI_JOURNAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BaziJournalEntry[];
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

export function getBaziJournalEntry(id: string): BaziJournalEntry | undefined {
  return loadBaziJournal().find((e) => e.id === id);
}

export function saveBaziJournalEntry(input: {
  body: string;
  mood?: BaziJournalMood;
  snapshot?: BaziJournalSnapshot | null;
  sceneTags?: string[];
}): BaziJournalEntry {
  const body = input.body.trim().slice(0, MAX_BODY);
  const subject = currentReadingSubject();
  const entry: BaziJournalEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    body,
    reflection: '',
    mood: input.mood && isMood(input.mood) ? input.mood : '',
    snapshot: input.snapshot ?? null,
    sceneTags: ensureSceneTags(body, input.sceneTags),
    subjectId: subject.subjectId,
    subjectName: subject.subjectName,
    aiSessions: [],
  };
  const list = loadBaziJournal();
  list.unshift(entry);
  persist(list);
  return entry;
}

/**
 * 深度解读生成时落一条手札（对齐六爻：会话挂手札可回看）。
 * 返回 { journalId, sessionId }
 */
export function createBaziAiJournalEntry(input: {
  deepReading: string;
  question?: string;
  snapshot?: BaziJournalSnapshot | null;
  sceneTags?: string[];
}): { journalId: string; sessionId: string } | null {
  const text = input.deepReading.trim();
  if (!text) return null;
  const now = new Date().toISOString();
  const sessionId = crypto.randomUUID();
  const q = (input.question || '').trim();
  const body = q
    ? `AI 深度解读 · ${q.slice(0, 80)}${q.length > 80 ? '…' : ''}`
    : 'AI 深度解读';
  const entry = saveBaziJournalEntry({
    body,
    mood: 'curious',
    snapshot: input.snapshot ?? null,
    sceneTags: input.sceneTags,
  });
  const session: BaziAiSession = {
    id: sessionId,
    kind: 'deep',
    createdAt: now,
    updatedAt: now,
    deepReading: text,
    turns: [{ role: 'assistant', content: text, at: now }],
  };
  const list = loadBaziJournal();
  const i = list.findIndex((e) => e.id === entry.id);
  if (i < 0) return { journalId: entry.id, sessionId };
  list[i] = { ...list[i]!, aiSessions: [session] };
  persist(list);
  return { journalId: entry.id, sessionId };
}

/** 写入一次深度解读到已有手札，返回 sessionId */
export function saveBaziAiDeepReadingToJournal(
  journalId: string,
  deepReading: string,
): string | null {
  const text = deepReading.trim();
  if (!journalId || !text) return null;
  const list = loadBaziJournal();
  const i = list.findIndex((e) => e.id === journalId);
  if (i < 0) return null;
  const now = new Date().toISOString();
  const session: BaziAiSession = {
    id: crypto.randomUUID(),
    kind: 'deep',
    createdAt: now,
    updatedAt: now,
    deepReading: text,
    turns: [{ role: 'assistant', content: text, at: now }],
  };
  const prev = list[i]!;
  const sessions = [...(prev.aiSessions ?? []), session].slice(-8);
  list[i] = { ...prev, aiSessions: sessions };
  persist(list);
  return session.id;
}

/** 追加追问回合到已有 session；无 session 则新建 followup */
export function appendBaziAiTurns(
  journalId: string,
  sessionId: string | null | undefined,
  turns: Array<{ role: 'user' | 'assistant'; content: string }>,
): string | null {
  if (!journalId || !turns.length) return null;
  const list = loadBaziJournal();
  const i = list.findIndex((e) => e.id === journalId);
  if (i < 0) return null;
  const now = new Date().toISOString();
  const prev = list[i]!;
  const sessions = [...(prev.aiSessions ?? [])];
  let sid = sessionId ?? '';
  let idx = sid ? sessions.findIndex((s) => s.id === sid) : -1;
  if (idx < 0) {
    const created: BaziAiSession = {
      id: crypto.randomUUID(),
      kind: 'followup',
      createdAt: now,
      updatedAt: now,
      turns: [],
    };
    sessions.push(created);
    idx = sessions.length - 1;
    sid = created.id;
  }
  const cur = sessions[idx]!;
  sessions[idx] = {
    ...cur,
    updatedAt: now,
    turns: [
      ...cur.turns,
      ...turns.map((t) => ({ role: t.role, content: t.content, at: now })),
    ].slice(-40),
  };
  list[i] = { ...prev, aiSessions: sessions.slice(-8) };
  persist(list);
  return sid;
}

export function updateBaziJournalReflection(id: string, reflection: string): void {
  const list = loadBaziJournal();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.reflection = reflection.trim().slice(0, MAX_BODY);
  persist(list);
}

export function updateBaziJournalBody(id: string, body: string): void {
  const list = loadBaziJournal();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.body = body.trim().slice(0, MAX_BODY);
  persist(list);
}

export function deleteBaziJournalEntry(id: string): boolean {
  const list = loadBaziJournal();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) return false;
  persist(next);
  return true;
}

export function snapshotLine(snap: BaziJournalSnapshot | null): string {
  if (!snap) return '';
  const parts = [
    snap.patternName,
    snap.bodyBand,
    snap.dayMaster ? `日主${snap.dayMaster}${snap.dayMasterWx}` : '',
    snap.yongWx.length ? `喜用${snap.yongWx.join('')}` : '',
    snap.dayunGanZhi ? `大运${snap.dayunGanZhi}` : '',
    snap.liunianLabel ? `流年${snap.liunianLabel}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}
