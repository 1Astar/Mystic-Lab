import { getAllEntries } from '../codex/collection.ts';
import {
  loadBaziJournal,
  moodLabel as baziMoodLabel,
  snapshotLine as baziSnapshotLine,
  type BaziJournalEntry,
} from '../bazi/journal.ts';
import {
  getPalmJourneyDoneCount,
  isPalmJourneyComplete,
  PALM_JOURNEY_CHAPTERS,
} from '../xiaoliuren/palm-journey.ts';
import {
  fulfilledLabel,
  isXiaoliurenDueForReview,
  loadXiaoliurenJournal,
  type XiaoliurenJournalEntry,
} from '../xiaoliuren/journal.ts';
import {
  journalMetaLine,
  loadLiuyaoJournal,
  type LiuyaoJournalEntry,
} from '../liuyao/journal.ts';
import {
  loadZiweiJournal,
  moodLabel as ziweiMoodLabel,
  snapshotLine as ziweiSnapshotLine,
  type ZiweiJournalEntry,
} from '../ziwei/journal.ts';
import {
  backfillJournalFromCodex,
  loadJournalEntries,
  type JournalEntry,
} from './records.ts';

export type JourneySystem = 'tarot' | 'xiaoliuren' | 'liuyao' | 'bazi' | 'ziwei';

export type JourneyItem = {
  id: string;
  system: JourneySystem;
  createdAt: string;
  question: string;
  /** 列表摘要：牌名 / 六神 / 卦名 / 手札快照 */
  summary: string;
  reflection: string;
  statusLabel?: string;
  tarot?: JournalEntry;
  xiaoliuren?: XiaoliurenJournalEntry;
  liuyao?: LiuyaoJournalEntry;
  bazi?: BaziJournalEntry;
  ziwei?: ZiweiJournalEntry;
};

function liuyaoStatusLabel(entry: LiuyaoJournalEntry): string | undefined {
  if (entry.fulfilled === true) return '有呼应';
  if (entry.fulfilled === false) return '不太准';
  return undefined;
}

export function loadJourneyItems(): JourneyItem[] {
  backfillJournalFromCodex();

  const tarotItems: JourneyItem[] = loadJournalEntries().map((entry) => {
    const isPartial = entry.status === 'partial';
    const cardsLine = entry.cards.map((c) => `${c.position}·${c.name}`).join(' / ');
    return {
      id: `tarot:${entry.id}`,
      system: 'tarot',
      createdAt: entry.createdAt,
      question: entry.question,
      summary: cardsLine || (isPartial ? entry.summary : entry.learningNote),
      reflection: entry.reflection,
      statusLabel: isPartial ? '未完成' : undefined,
      tarot: entry,
    };
  });

  const xlrItems: JourneyItem[] = loadXiaoliurenJournal().map((entry) => {
    const due = isXiaoliurenDueForReview(entry);
    const later = fulfilledLabel(entry.fulfilled);
    return {
      id: `xiaoliuren:${entry.id}`,
      system: 'xiaoliuren' as const,
      createdAt: entry.createdAt,
      question: entry.question,
      summary: `${entry.resultName} · ${entry.summary}`,
      reflection: entry.reflection,
      statusLabel: due ? '待对照' : later || undefined,
      xiaoliuren: entry,
    };
  });

  const lyItems: JourneyItem[] = loadLiuyaoJournal().map((entry) => ({
    id: `liuyao:${entry.id}`,
    system: 'liuyao' as const,
    createdAt: entry.castAt ?? entry.createdAt,
    question: entry.question,
    summary: `${journalMetaLine(entry)} · ${entry.summary}`,
    reflection: entry.reflection,
    statusLabel: liuyaoStatusLabel(entry),
    liuyao: entry,
  }));

  const baziItems: JourneyItem[] = loadBaziJournal().map((entry) => {
    const mood = baziMoodLabel(entry.mood);
    const snap = baziSnapshotLine(entry.snapshot);
    return {
      id: `bazi:${entry.id}`,
      system: 'bazi' as const,
      createdAt: entry.createdAt,
      question: entry.body.trim() || '（八字手札）',
      summary: snap || (mood ? `心情 · ${mood}` : '八字手札'),
      reflection: entry.reflection,
      statusLabel: mood || undefined,
      bazi: entry,
    };
  });

  const ziweiItems: JourneyItem[] = loadZiweiJournal().map((entry) => {
    const mood = ziweiMoodLabel(entry.mood);
    const snap = ziweiSnapshotLine(entry.snapshot);
    return {
      id: `ziwei:${entry.id}`,
      system: 'ziwei' as const,
      createdAt: entry.createdAt,
      question: entry.body.trim() || '（紫微手札）',
      summary: snap || (mood ? `心情 · ${mood}` : '紫微手札'),
      reflection: entry.reflection,
      statusLabel: mood || undefined,
      ziwei: entry,
    };
  });

  return [...tarotItems, ...xlrItems, ...lyItems, ...baziItems, ...ziweiItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function filterJourneyItems(
  items: JourneyItem[],
  filter: 'all' | 'tarot' | 'xiaoliuren' | 'liuyao' | 'bazi' | 'ziwei' | 'notes',
): JourneyItem[] {
  if (filter === 'all') return items;
  if (filter === 'tarot') return items.filter((i) => i.system === 'tarot');
  if (filter === 'xiaoliuren') return items.filter((i) => i.system === 'xiaoliuren');
  if (filter === 'liuyao') return items.filter((i) => i.system === 'liuyao');
  if (filter === 'bazi') return items.filter((i) => i.system === 'bazi');
  if (filter === 'ziwei') return items.filter((i) => i.system === 'ziwei');
  return items.filter((i) => i.reflection.trim().length > 0);
}

export function countFavoriteCards(): number {
  return getAllEntries().filter((e) => e.favorite).length;
}

export function palmJourneyProgressLabel(): string {
  if (isPalmJourneyComplete()) return '掌上演算之旅已完成';
  const done = getPalmJourneyDoneCount();
  return `掌上演算之旅 ${done}/${PALM_JOURNEY_CHAPTERS.length}`;
}
