/**
 * 紫微手札：本地日记，附当时命宫/流年快照；深度解读与追问可挂 aiSessions 回看。
 */
import type { ZiweiChartView } from './types.ts';
import { ensureSceneTags, normalizeSceneTags } from '../life/scene-tags.ts';
import { currentReadingSubject } from '../life/reading-subject.ts';

export type ZiweiJournalMood = '' | 'calm' | 'up' | 'heavy' | 'curious';

export const ZIWEI_JOURNAL_MOODS: ReadonlyArray<{
  id: ZiweiJournalMood;
  label: string;
}> = [
  { id: '', label: '不标' },
  { id: 'calm', label: '平静' },
  { id: 'up', label: '开朗' },
  { id: 'heavy', label: '沉一点' },
  { id: 'curious', label: '好奇' },
];

export type ZiweiAiTurn = {
  role: 'user' | 'assistant';
  content: string;
  at: string;
};

export type ZiweiAiSession = {
  id: string;
  kind: 'deep' | 'followup';
  createdAt: string;
  updatedAt: string;
  deepReading?: string;
  turns: ZiweiAiTurn[];
};

export type ZiweiJournalSnapshot = {
  fiveElementsClass: string;
  soulMajors: string;
  headline: string;
  annualYear: string;
  annualAdvice: string;
};

export type ZiweiJournalEntry = {
  id: string;
  createdAt: string;
  body: string;
  reflection: string;
  mood: ZiweiJournalMood;
  snapshot: ZiweiJournalSnapshot | null;
  sceneTags?: string[];
  subjectId?: string;
  subjectName?: string;
  aiSessions?: ZiweiAiSession[];
};

export const ZIWEI_JOURNAL_STORAGE_KEY = 'mystic-lab-ziwei-journal';
const MAX_ENTRIES = 80;
const MAX_BODY = 2000;

function persist(list: ZiweiJournalEntry[]): void {
  localStorage.setItem(ZIWEI_JOURNAL_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
}

function isMood(v: unknown): v is ZiweiJournalMood {
  return v === '' || v === 'calm' || v === 'up' || v === 'heavy' || v === 'curious';
}

function normalizeSnapshot(raw: unknown): ZiweiJournalSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<ZiweiJournalSnapshot>;
  return {
    fiveElementsClass: typeof s.fiveElementsClass === 'string' ? s.fiveElementsClass : '',
    soulMajors: typeof s.soulMajors === 'string' ? s.soulMajors : '',
    headline: typeof s.headline === 'string' ? s.headline : '',
    annualYear: typeof s.annualYear === 'string' ? s.annualYear : '',
    annualAdvice: typeof s.annualAdvice === 'string' ? s.annualAdvice : '',
  };
}

function normalizeAiSessions(raw: unknown): ZiweiAiSession[] {
  if (!Array.isArray(raw)) return [];
  const out: ZiweiAiSession[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Partial<ZiweiAiSession>;
    if (typeof s.id !== 'string' || !s.id) continue;
    const kind = s.kind === 'followup' ? 'followup' : 'deep';
    const turns: ZiweiAiTurn[] = [];
    if (Array.isArray(s.turns)) {
      for (const t of s.turns) {
        if (!t || typeof t !== 'object') continue;
        const role = (t as ZiweiAiTurn).role;
        const content = (t as ZiweiAiTurn).content;
        if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
        if (!content.trim()) continue;
        turns.push({
          role,
          content,
          at:
            typeof (t as ZiweiAiTurn).at === 'string'
              ? (t as ZiweiAiTurn).at
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

function normalizeEntry(entry: ZiweiJournalEntry): ZiweiJournalEntry {
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

export function moodLabel(mood: ZiweiJournalMood): string {
  return ZIWEI_JOURNAL_MOODS.find((m) => m.id === mood)?.label ?? '';
}

export function buildZiweiJournalSnapshot(view: ZiweiChartView): ZiweiJournalSnapshot {
  const majors = view.soulPalace.majors.map((s) => s.name).join('、') || '空象';
  const annual = view.theater.annual;
  return {
    fiveElementsClass: view.fiveElementsClass || '',
    soulMajors: majors,
    headline: view.theater.headline || '',
    annualYear: String(annual.year || ''),
    annualAdvice: (annual.advice || '').slice(0, 120),
  };
}

export function loadZiweiJournal(): ZiweiJournalEntry[] {
  try {
    const raw = localStorage.getItem(ZIWEI_JOURNAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ZiweiJournalEntry[];
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

export function getZiweiJournalEntry(id: string): ZiweiJournalEntry | undefined {
  return loadZiweiJournal().find((e) => e.id === id);
}

export function saveZiweiJournalEntry(input: {
  body: string;
  mood?: ZiweiJournalMood;
  snapshot?: ZiweiJournalSnapshot | null;
  sceneTags?: string[];
}): ZiweiJournalEntry {
  const body = input.body.trim().slice(0, MAX_BODY);
  const subject = currentReadingSubject();
  const entry: ZiweiJournalEntry = {
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
  const list = loadZiweiJournal();
  list.unshift(entry);
  persist(list);
  return entry;
}

export function createZiweiAiJournalEntry(input: {
  deepReading: string;
  question?: string;
  snapshot?: ZiweiJournalSnapshot | null;
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
  const entry = saveZiweiJournalEntry({
    body,
    mood: 'curious',
    snapshot: input.snapshot ?? null,
    sceneTags: input.sceneTags,
  });
  const session: ZiweiAiSession = {
    id: sessionId,
    kind: 'deep',
    createdAt: now,
    updatedAt: now,
    deepReading: text,
    turns: [{ role: 'assistant', content: text, at: now }],
  };
  const list = loadZiweiJournal();
  const i = list.findIndex((e) => e.id === entry.id);
  if (i < 0) return { journalId: entry.id, sessionId };
  list[i] = { ...list[i]!, aiSessions: [session] };
  persist(list);
  return { journalId: entry.id, sessionId };
}

export function saveZiweiAiDeepReadingToJournal(
  journalId: string,
  deepReading: string,
): string | null {
  const text = deepReading.trim();
  if (!journalId || !text) return null;
  const list = loadZiweiJournal();
  const i = list.findIndex((e) => e.id === journalId);
  if (i < 0) return null;
  const now = new Date().toISOString();
  const session: ZiweiAiSession = {
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

export function appendZiweiAiTurns(
  journalId: string,
  sessionId: string | null | undefined,
  turns: Array<{ role: 'user' | 'assistant'; content: string }>,
): string | null {
  if (!journalId || !turns.length) return null;
  const list = loadZiweiJournal();
  const i = list.findIndex((e) => e.id === journalId);
  if (i < 0) return null;
  const now = new Date().toISOString();
  const prev = list[i]!;
  const sessions = [...(prev.aiSessions ?? [])];
  let sid = sessionId ?? '';
  let idx = sid ? sessions.findIndex((s) => s.id === sid) : -1;
  if (idx < 0) {
    const created: ZiweiAiSession = {
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

export function updateZiweiJournalReflection(id: string, reflection: string): void {
  const list = loadZiweiJournal();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.reflection = reflection.trim().slice(0, MAX_BODY);
  persist(list);
}

export function deleteZiweiJournalEntry(id: string): boolean {
  const list = loadZiweiJournal();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) return false;
  persist(next);
  return true;
}

export function snapshotLine(snap: ZiweiJournalSnapshot | null): string {
  if (!snap) return '';
  const parts = [
    snap.fiveElementsClass,
    snap.soulMajors ? `命宫${snap.soulMajors}` : '',
    snap.headline,
    snap.annualYear ? `流年${snap.annualYear}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}
