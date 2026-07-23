/**
 * 塔罗未完成手札：续抽会话（直达抽牌）
 */
import { shuffleDeck, type DrawnCard } from '../tarot/engine.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import {
  resolveActiveSpread,
  type SpreadType,
} from '../tarot/spreads.ts';
import type { ReadingResult } from '../interpretation/types.ts';
import {
  getJournalEntryById,
  type JournalEntry,
} from './records.ts';
import { reconstructDrawnCards } from './replay.ts';

export const RESUME_JOURNAL_KEY = 'mystic-lab-tarot-resume-journal';

export function stashResumeJournalId(id: string): void {
  try {
    sessionStorage.setItem(RESUME_JOURNAL_KEY, id);
  } catch {
    /* private mode / quota */
  }
}

/** 读取并清除，避免二次误恢复 */
export function consumeResumeJournalId(): string | null {
  try {
    const id = sessionStorage.getItem(RESUME_JOURNAL_KEY);
    if (id) sessionStorage.removeItem(RESUME_JOURNAL_KEY);
    return id;
  } catch {
    return null;
  }
}

export function canResumePartial(entry: JournalEntry): boolean {
  return (
    entry.status === 'partial' &&
    entry.cardIds.length > 0 &&
    entry.cards.length > 0
  );
}

export type TarotResumeSession = {
  journalId: string;
  question: string;
  spreadType: SpreadType;
  drawnCards: DrawnCard[];
  cardPool: DrawnCard[];
  currentIndex: number;
  revealedFlags: boolean[];
  reading: ReadingResult | null;
  /** true：牌阵已抽满，应进入翻开后/结果路径 */
  readyForResult: boolean;
};

export type BuildResumeResult =
  | { ok: true; session: TarotResumeSession }
  | { ok: false; reason: string };

/** 在已抽牌之后，按阵位补足剩余未抽牌（排除已用 id） */
export function fillRemainingCardPool(
  drawn: DrawnCard[],
  spreadType: SpreadType,
): DrawnCard[] {
  const spread = resolveActiveSpread(spreadType);
  const need = Math.max(spread.positions.length, drawn.length);
  const remaining = need - drawn.length;
  if (remaining <= 0) return [...drawn];

  const exclude = new Set(drawn.map((d) => d.card.id));
  const available = shuffleDeck(TAROT_DECK.filter((c) => !exclude.has(c.id)));
  const pool: DrawnCard[] = [...drawn];
  for (let i = 0; i < remaining; i += 1) {
    const def = available[i];
    if (!def) break;
    const pos = spread.positions[drawn.length + i];
    pool.push({
      card: def,
      reversed: Math.random() < 0.3,
      position: pos?.label ?? '补位',
      positionKey: pos?.key,
    });
  }
  return pool;
}

export function buildResumeSession(entry: JournalEntry): BuildResumeResult {
  if (!canResumePartial(entry)) {
    return { ok: false, reason: '此手札不是可续的未完成占问' };
  }

  let drawn: DrawnCard[];
  try {
    drawn = reconstructDrawnCards(entry);
  } catch {
    return { ok: false, reason: '无法恢复此占问（牌面数据缺失）' };
  }

  if (drawn.length === 0) {
    return { ok: false, reason: '无法恢复此占问（尚无已抽牌）' };
  }

  const spreadType = entry.spreadType;
  const cardPool = fillRemainingCardPool(drawn, spreadType);
  const drawnCards = cardPool.slice(0, drawn.length);
  const need = resolveActiveSpread(spreadType).positions.length;
  const readyForResult = drawnCards.length >= need;

  return {
    ok: true,
    session: {
      journalId: entry.id,
      question: entry.question,
      spreadType,
      drawnCards,
      cardPool,
      currentIndex: drawnCards.length,
      revealedFlags: drawnCards.map(() => true),
      reading: entry.readingSnapshot ?? null,
      readyForResult,
    },
  };
}

export function resolveResumeFromStash(): BuildResumeResult | null {
  const id = consumeResumeJournalId();
  if (!id) return null;
  const entry = getJournalEntryById(id);
  if (!entry) {
    return { ok: false, reason: '未找到要继续的手札' };
  }
  return buildResumeSession(entry);
}
