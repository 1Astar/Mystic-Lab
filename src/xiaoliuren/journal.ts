import type { LessonResult } from './engine.ts';
import type { LunarDate } from './lunar.ts';
import type { ChineseHour } from './chinese-hour.ts';
import { sixGodOneLiner, type SixGodId } from './six-gods.ts';
import { ensureSceneTags, normalizeSceneTags } from '../life/scene-tags.ts';
import { currentReadingSubject } from '../life/reading-subject.ts';

/** 与起课三关对齐；旧手札可能缺失 */
export type XiaoliurenLessonMode = 'learn' | 'practice' | 'beginner';

export type XiaoliurenAiTurn = {
  role: 'user' | 'assistant';
  content: string;
  at: string;
};

/** 一次深度解读 / 追问会话（落入手札，复原可回看） */
export type XiaoliurenAiSession = {
  id: string;
  kind: 'deep' | 'followup';
  createdAt: string;
  updatedAt: string;
  /** 深度解读正文（贴合你） */
  deepReading?: string;
  turns: XiaoliurenAiTurn[];
};

export type XiaoliurenJournalEntry = {
  id: string;
  createdAt: string;
  question: string;
  solarLabel: string;
  lunar: Pick<LunarDate, 'label' | 'monthLabel' | 'dayLabel' | 'month' | 'day'>;
  hour: Pick<ChineseHour, 'name' | 'label' | 'rangeLabel'>;
  resultId: SixGodId;
  resultName: string;
  summary: string;
  reflection: string;
  /** true 应验 / false 未应验 / null 未标 */
  fulfilled?: boolean | null;
  /** 起课模式；旧记录可能没有 */
  lessonMode?: XiaoliurenLessonMode | null;
  sceneTags?: string[];
  subjectId?: string;
  subjectName?: string;
  /** AI 深度解读与追问（可多段）；旧手写记录无此字段 */
  aiSessions?: XiaoliurenAiSession[];
};

/** 起课后满此时长且未标对照 → 待对照 */
export const REVIEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

const STORAGE_KEY = 'mystic-lab-xiaoliuren-journal';

function persist(list: XiaoliurenJournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
}

function normalizeAiSessions(
  sessions: XiaoliurenAiSession[] | undefined,
): XiaoliurenAiSession[] {
  if (!Array.isArray(sessions)) return [];
  return sessions
    .filter((s) => s && typeof s.id === 'string')
    .map((s) => ({
      ...s,
      kind: s.kind === 'followup' ? 'followup' : 'deep',
      turns: Array.isArray(s.turns) ? s.turns : [],
      deepReading: s.deepReading?.trim() || undefined,
    }));
}

function normalizeEntry(entry: XiaoliurenJournalEntry): XiaoliurenJournalEntry {
  return {
    ...entry,
    fulfilled: entry.fulfilled ?? null,
    lessonMode: entry.lessonMode ?? null,
    sceneTags: normalizeSceneTags(entry.sceneTags),
    aiSessions: normalizeAiSessions(entry.aiSessions),
  };
}

export function loadXiaoliurenJournal(): XiaoliurenJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as XiaoliurenJournalEntry[];
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

export function isXiaoliurenDueForReview(
  entry: XiaoliurenJournalEntry,
  nowMs = Date.now(),
): boolean {
  if (entry.fulfilled === true || entry.fulfilled === false) return false;
  const created = new Date(entry.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return nowMs - created >= REVIEW_AFTER_MS;
}

export function listXiaoliurenDueForReview(nowMs = Date.now()): XiaoliurenJournalEntry[] {
  return loadXiaoliurenJournal().filter((e) => isXiaoliurenDueForReview(e, nowMs));
}

export function fulfilledLabel(fulfilled: boolean | null | undefined): string {
  if (fulfilled === true) return '后来对照：应验';
  if (fulfilled === false) return '后来对照：未应验';
  return '';
}

export function saveXiaoliurenJournalEntry(input: {
  question: string;
  solarLabel: string;
  lunar: LunarDate;
  hour: ChineseHour;
  lesson: LessonResult;
  lessonMode?: XiaoliurenLessonMode | null;
}): XiaoliurenJournalEntry {
  const subject = currentReadingSubject();
  const entry: XiaoliurenJournalEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    question: input.question.trim(),
    solarLabel: input.solarLabel,
    lunar: {
      label: input.lunar.label,
      monthLabel: input.lunar.monthLabel,
      dayLabel: input.lunar.dayLabel,
      month: input.lunar.month,
      day: input.lunar.day,
    },
    hour: {
      name: input.hour.name,
      label: input.hour.label,
      rangeLabel: input.hour.rangeLabel,
    },
    resultId: input.lesson.result.id,
    resultName: input.lesson.result.name,
    summary: sixGodOneLiner(input.lesson.result),
    reflection: '',
    fulfilled: null,
    lessonMode: input.lessonMode ?? null,
    sceneTags: ensureSceneTags(input.question),
    subjectId: subject.subjectId,
    subjectName: subject.subjectName,
    aiSessions: [],
  };

  const list = loadXiaoliurenJournal();
  list.unshift(entry);
  persist(list);
  return entry;
}

/** 写入一次深度解读，返回 sessionId */
export function saveXiaoliurenAiDeepReading(
  journalId: string,
  deepReading: string,
): string | null {
  const text = deepReading.trim();
  if (!journalId || !text) return null;
  const list = loadXiaoliurenJournal();
  const i = list.findIndex((e) => e.id === journalId);
  if (i < 0) return null;
  const now = new Date().toISOString();
  const session: XiaoliurenAiSession = {
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
export function appendXiaoliurenAiTurns(
  journalId: string,
  sessionId: string | null | undefined,
  turns: Array<{ role: 'user' | 'assistant'; content: string }>,
): string | null {
  if (!journalId || !turns.length) return null;
  const list = loadXiaoliurenJournal();
  const i = list.findIndex((e) => e.id === journalId);
  if (i < 0) return null;
  const now = new Date().toISOString();
  const prev = list[i]!;
  const sessions = [...(prev.aiSessions ?? [])];
  let sid = sessionId ?? '';
  let idx = sid ? sessions.findIndex((s) => s.id === sid) : -1;
  if (idx < 0) {
    const created: XiaoliurenAiSession = {
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

export function updateXiaoliurenReflection(id: string, reflection: string): void {
  const list = loadXiaoliurenJournal();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.reflection = reflection.trim();
  persist(list);
}

export function updateXiaoliurenFulfilled(id: string, fulfilled: boolean): void {
  const list = loadXiaoliurenJournal();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.fulfilled = fulfilled;
  persist(list);
}

export function getXiaoliurenJournalEntry(id: string): XiaoliurenJournalEntry | undefined {
  return loadXiaoliurenJournal().find((e) => e.id === id);
}
