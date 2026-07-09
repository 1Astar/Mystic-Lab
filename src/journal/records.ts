import type { DrawnCard } from '../tarot/engine.ts';
import type { SpreadType } from '../tarot/spreads.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import { getAllEntries } from '../codex/collection.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import { buildLearningNote, SPREADS } from '../tarot/spreads.ts';

export type JournalEntry = {
  id: string;
  createdAt: string;
  question: string;
  spreadType: SpreadType;
  cardIds: string[];
  cards: { name: string; position: string; reversed: boolean }[];
  summary: string;
  learningNote: string;
  reflection: string;
  fulfilled?: boolean | null;
  /** 未完成占问时为 partial */
  status?: 'complete' | 'partial';
  /** 占问完成时的解读快照，用于手札回看 */
  readingSnapshot?: ReadingResult;
};

const STORAGE_KEY = 'mystic-lab-journal';
const SESSION_BUCKET_MS = 15 * 60 * 1000;

function persist(list: JournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 80)));
}

function inferSpreadType(cardCount: number): SpreadType {
  if (cardCount === 1) return 'single';
  if (cardCount === 3) return 'past-present-future';
  return 'past-present-future';
}

function sessionBucketKey(question: string, at: string): string {
  const bucket = Math.floor(new Date(at).getTime() / SESSION_BUCKET_MS);
  return `${question.trim()}|${bucket}`;
}

function sameCardSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort().join(',');
  const sb = [...b].sort().join(',');
  return sa === sb;
}

function hasSimilarEntry(
  list: JournalEntry[],
  question: string,
  at: string,
  cardIds: string[],
): boolean {
  const t = new Date(at).getTime();
  return list.some((e) => {
    if (e.question.trim() !== question.trim()) return false;
    if (!sameCardSet(e.cardIds, cardIds)) return false;
    return Math.abs(new Date(e.createdAt).getTime() - t) < SESSION_BUCKET_MS;
  });
}

/** 从图鉴相遇记录回填缺失的手札 */
export function backfillJournalFromCodex(): number {
  const existing = loadJournalEntries();
  const codexEntries = getAllEntries();
  if (codexEntries.length === 0) return 0;

  type FlatEnc = {
    at: string;
    question: string;
    cardId: string;
    spreadLabel: string;
    reversed: boolean;
    cardName: string;
  };

  const flat: FlatEnc[] = [];
  for (const ce of codexEntries) {
    const card = TAROT_DECK.find((c) => c.id === ce.cardId);
    const cardName = card?.nameZh ?? ce.cardId;
    for (const enc of ce.encounters) {
      flat.push({
        at: enc.at,
        question: enc.question,
        cardId: ce.cardId,
        spreadLabel: enc.spreadLabel,
        reversed: enc.reversed,
        cardName,
      });
    }
  }

  if (flat.length === 0) return 0;

  const groups = new Map<string, FlatEnc[]>();
  for (const enc of flat) {
    const key = sessionBucketKey(enc.question, enc.at);
    const list = groups.get(key) ?? [];
    list.push(enc);
    groups.set(key, list);
  }

  const created: JournalEntry[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const deduped: FlatEnc[] = [];
    for (const enc of group) {
      if (deduped.some((d) => d.cardId === enc.cardId && d.spreadLabel === enc.spreadLabel)) continue;
      deduped.push(enc);
    }

    const question = deduped[0]?.question ?? '';
    const createdAt = deduped[0]?.at ?? new Date().toISOString();
    const cardIds = deduped.map((d) => d.cardId);
    if (hasSimilarEntry([...existing, ...created], question, createdAt, cardIds)) continue;

    const spreadType = inferSpreadType(deduped.length);
    const names = deduped.map((d) => d.cardName).join('、');
    created.push({
      id: `j-backfill-${createdAt}-${cardIds.join('-')}`,
      createdAt,
      question,
      spreadType,
      cardIds,
      cards: deduped.map((d) => ({
        name: d.cardName,
        position: d.spreadLabel,
        reversed: d.reversed,
      })),
      summary: `「${names}」已收入图鉴。答案不在牌里，在你心里。`,
      learningNote: buildLearningNote(spreadType, question),
      reflection: '',
      fulfilled: null,
      status: 'complete',
    });
  }

  if (created.length === 0) return 0;

  created.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  persist([...created, ...existing]);
  return created.length;
}

function buildPartialSummary(drawn: number, total: number): string {
  return `已抽 ${drawn}/${total} 张 · 占问未完成`;
}

/** 创建或更新手札（支持中途离开的 partial 草稿） */
export function upsertJournalProgress(
  existingId: string | null,
  question: string,
  spreadType: SpreadType,
  cards: DrawnCard[],
  reading: ReadingResult | null,
  status: 'partial' | 'complete',
  totalCards: number,
  reflection = '',
): JournalEntry {
  const list = loadJournalEntries();
  const cardIds = cards.map((c) => c.card.id);
  const id = existingId ?? `j-${Date.now()}`;
  const prev = list.find((e) => e.id === id);

  const summary =
    status === 'complete' && reading?.summary
      ? reading.summary
      : buildPartialSummary(cards.length, totalCards);

  const note =
    status === 'complete'
      ? reading?.learningNote ?? buildLearningNote(spreadType, question)
      : prev?.learningNote || buildLearningNote(spreadType, question);

  const entry: JournalEntry = {
    id,
    createdAt: prev?.createdAt ?? new Date().toISOString(),
    question,
    spreadType,
    cardIds,
    cards: cards.map((c) => ({
      name: c.card.nameZh,
      position: c.position ?? '',
      reversed: c.reversed,
    })),
    summary,
    learningNote: note,
    reflection: prev?.reflection ?? reflection,
    fulfilled: status === 'complete' ? (prev?.fulfilled ?? null) : null,
    status,
    readingSnapshot:
      reading && cards.length > 0
        ? reading
        : prev?.readingSnapshot,
  };

  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);
  persist(list);
  return entry;
}

export function saveJournalEntry(
  question: string,
  spreadType: SpreadType,
  cards: DrawnCard[],
  reading: ReadingResult,
  learningNote: string,
  reflection = '',
  existingId: string | null = null,
): JournalEntry {
  reading.learningNote = learningNote;
  return upsertJournalProgress(
    existingId,
    question,
    spreadType,
    cards,
    reading,
    'complete',
    SPREADS[spreadType].positions.length,
    reflection,
  );
}

export function updateJournalReflection(id: string, reflection: string): void {
  const list = loadJournalEntries();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.reflection = reflection;
  persist(list);
}

export function updateJournalFulfilled(id: string, fulfilled: boolean): void {
  const list = loadJournalEntries();
  const item = list.find((e) => e.id === id);
  if (!item) return;
  item.fulfilled = fulfilled;
  persist(list);
}

export function loadJournalEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalEntry[];
    return parsed.map((e) => ({
      ...e,
      cardIds: e.cardIds ?? [],
      reflection: e.reflection ?? '',
      fulfilled: e.fulfilled ?? null,
      status: e.status ?? 'complete',
      readingSnapshot: e.readingSnapshot,
    }));
  } catch {
    return [];
  }
}
