/**
 * 八字手札：本地日记，附当时格局/喜用与大运流年快照。
 * 对齐小六壬/六爻手札的 localStorage 模式；首版不做多轮 AI、不做应验对照。
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

function normalizeEntry(entry: BaziJournalEntry): BaziJournalEntry {
  return {
    ...entry,
    body: typeof entry.body === 'string' ? entry.body : '',
    reflection: typeof entry.reflection === 'string' ? entry.reflection : '',
    mood: isMood(entry.mood) ? entry.mood : '',
    snapshot: normalizeSnapshot(entry.snapshot),
    sceneTags: normalizeSceneTags(entry.sceneTags),
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
  };
  const list = loadBaziJournal();
  list.unshift(entry);
  persist(list);
  return entry;
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
