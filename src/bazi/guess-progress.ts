/**
 * 猜命盘每日作答本地存档
 */
import { guessDayKey, type GuessCard } from './guess-pack.ts';

const STORAGE_KEY = 'mystic-lab-bazi-guess-v1';

export type GuessDayRecord = {
  dayKey: string;
  cardId: string;
  choiceId: string;
  correct: boolean;
  answeredAt: string;
};

export type GuessProgress = {
  v: 1;
  byDay: Record<string, GuessDayRecord>;
};

function empty(): GuessProgress {
  return { v: 1, byDay: {} };
}

export function loadGuessProgress(): GuessProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<GuessProgress>;
    return {
      v: 1,
      byDay:
        p.byDay && typeof p.byDay === 'object'
          ? (p.byDay as Record<string, GuessDayRecord>)
          : {},
    };
  } catch {
    return empty();
  }
}

export function getTodayGuessRecord(dayKey = guessDayKey()): GuessDayRecord | null {
  return loadGuessProgress().byDay[dayKey] ?? null;
}

export function saveGuessAnswer(
  card: GuessCard,
  choiceId: string,
  dayKey = guessDayKey(),
): GuessDayRecord {
  const correct = choiceId === card.answerId;
  const rec: GuessDayRecord = {
    dayKey,
    cardId: card.id,
    choiceId,
    correct,
    answeredAt: new Date().toISOString(),
  };
  const prog = loadGuessProgress();
  prog.byDay[dayKey] = rec;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
  return rec;
}

export function __resetGuessProgressForTest(): void {
  localStorage.removeItem(STORAGE_KEY);
}
