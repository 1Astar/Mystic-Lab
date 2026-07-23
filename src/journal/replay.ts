import type { CodexEncounter } from '../codex/collection.ts';
import type { DrawnCard } from '../tarot/engine.ts';
import { buildReadingResult } from '../interpretation/contextual-reading.ts';
import { buildQuestionThread } from '../interpretation/question-thread.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import { SPREADS, isKnownSpreadType } from '../tarot/spreads.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import {
  getJournalEntryById,
  loadJournalEntries,
  type JournalEntry,
} from './records.ts';

export function reconstructDrawnCards(entry: JournalEntry): DrawnCard[] {
  return entry.cards.map((c, i) => {
    const cardId = entry.cardIds[i];
    const card =
      (cardId ? TAROT_DECK.find((d) => d.id === cardId) : undefined) ??
      TAROT_DECK.find((d) => d.nameZh === c.name);
    if (!card) {
      throw new Error(`Unknown card: ${cardId ?? c.name}`);
    }
    const spreadPos = isKnownSpreadType(entry.spreadType)
      ? SPREADS[entry.spreadType].positions[i]
      : undefined;
    return {
      card,
      reversed: c.reversed,
      position: c.position || spreadPos?.label,
      positionKey: spreadPos?.key ?? (c.position === '补牌' ? 'clarifier' : undefined),
    };
  });
}

/**
 * 旧快照没有 questionThread：用现有牌 + 问题补一层串讲（不覆盖原有牌文）。
 */
export function hydrateReadingQuestionThread(
  reading: ReadingResult,
  question?: string,
): ReadingResult {
  if (reading.questionThread?.answers?.length) return reading;
  const q = (question ?? reading.cards[0]?.question ?? '').trim();
  if (!q || !reading.cards.length) return reading;
  const thread = buildQuestionThread(
    reading.cards,
    q,
    reading.provider === 'llm' ? 'llm' : 'mock',
  );
  if (!thread) return reading;
  return {
    ...reading,
    questionThread: thread,
    summary: reading.summary?.trim() || thread.oneLiner,
  };
}

export type JournalReadingResolve = {
  reading: ReadingResult;
  /** 无快照时为根据记录重新生成 */
  regenerated: boolean;
  /** 仅为旧快照补了 questionThread */
  hydratedThread?: boolean;
  entry: JournalEntry;
};

export function resolveJournalReading(entry: JournalEntry): JournalReadingResolve {
  if (entry.readingSnapshot?.cards?.length) {
    const hadThread = Boolean(entry.readingSnapshot.questionThread?.answers?.length);
    const reading = hydrateReadingQuestionThread(
      entry.readingSnapshot,
      entry.question,
    );
    return {
      reading,
      regenerated: false,
      hydratedThread: !hadThread && Boolean(reading.questionThread?.answers?.length),
      entry,
    };
  }

  const drawn = reconstructDrawnCards(entry);
  const reading = buildReadingResult(drawn, entry.question, entry.spreadType);
  reading.summary = entry.summary || reading.summary;
  reading.learningNote = entry.learningNote || reading.learningNote;
  return { reading, regenerated: true, entry };
}

/** 从图鉴相遇记录定位手札并复原完整结果 */
export function findJournalForEncounter(
  cardId: string,
  encounter: CodexEncounter,
): JournalEntry | null {
  if (encounter.journalId) {
    const byId = getJournalEntryById(encounter.journalId);
    if (byId) return byId;
  }

  const q = encounter.question.trim();
  const t = new Date(encounter.at).getTime();
  const list = loadJournalEntries();

  let best: JournalEntry | null = null;
  let bestDt = Number.POSITIVE_INFINITY;

  for (const entry of list) {
    if (entry.question.trim() !== q) continue;
    if (!entry.cardIds.includes(cardId)) continue;
    const dt = Math.abs(new Date(entry.createdAt).getTime() - t);
    if (dt > 45 * 60 * 1000) continue;
    if (dt < bestDt) {
      bestDt = dt;
      best = entry;
    }
  }

  return best;
}

export function resolveEncounterReplay(
  cardId: string,
  encounter: CodexEncounter,
): JournalReadingResolve {
  const journal = findJournalForEncounter(cardId, encounter);
  if (journal) {
    return resolveJournalReading(journal);
  }

  // 无手札：仅复原这一张牌
  const card = TAROT_DECK.find((d) => d.id === cardId);
  if (!card) throw new Error(`Unknown card: ${cardId}`);

  const drawn: DrawnCard[] = [
    {
      card,
      reversed: encounter.reversed,
      position: encounter.spreadLabel || undefined,
      positionKey: undefined,
    },
  ];
  const reading = buildReadingResult(drawn, encounter.question, 'single');
  reading.summary = encounter.summary || reading.summary;

  const synthetic: JournalEntry = {
    id: `j-synthetic-${cardId}-${encounter.at}`,
    createdAt: encounter.at,
    question: encounter.question,
    spreadType: 'single',
    cardIds: [cardId],
    cards: [
      {
        name: card.nameZh,
        position: encounter.spreadLabel,
        reversed: encounter.reversed,
      },
    ],
    summary: reading.summary,
    learningNote: '',
    reflection: '',
    status: 'complete',
    readingSnapshot: reading,
  };

  return { reading, regenerated: true, entry: synthetic };
}
