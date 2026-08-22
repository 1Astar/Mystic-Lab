/**
 * Lab 轻练习（对标八字猜盘）：共用题型与按日抽题
 */
export type LightGuessOption = {
  id: string;
  label: string;
};

export type LightGuessCard = {
  id: string;
  name: string;
  kind: string;
  sealedLabel: string;
  clues: string[];
  question: string;
  options: LightGuessOption[];
  answerId: string;
  explainCorrect: string;
  explainWrong: string;
};

export function lightGuessDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 按日稳定抽题 */
export function pickDailyLightGuess(
  cards: LightGuessCard[],
  dayKey = lightGuessDayKey(),
): LightGuessCard {
  if (!cards.length) {
    throw new Error('light guess pack is empty');
  }
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) | 0;
  const i = Math.abs(h) % cards.length;
  return cards[i]!;
}

export type LightGuessDayRecord = {
  dayKey: string;
  cardId: string;
  choiceId: string;
  correct: boolean;
  answeredAt: string;
};

export type LightGuessProgress = {
  v: 1;
  byDay: Record<string, LightGuessDayRecord>;
};

export function createLightGuessStore(storageKey: string) {
  function empty(): LightGuessProgress {
    return { v: 1, byDay: {} };
  }

  function load(): LightGuessProgress {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return empty();
      const p = JSON.parse(raw) as Partial<LightGuessProgress>;
      return {
        v: 1,
        byDay:
          p.byDay && typeof p.byDay === 'object'
            ? (p.byDay as Record<string, LightGuessDayRecord>)
            : {},
      };
    } catch {
      return empty();
    }
  }

  function getTodayRecord(dayKey = lightGuessDayKey()): LightGuessDayRecord | null {
    return load().byDay[dayKey] ?? null;
  }

  function saveAnswer(
    card: LightGuessCard,
    choiceId: string,
    dayKey = lightGuessDayKey(),
  ): LightGuessDayRecord {
    const correct = choiceId === card.answerId;
    const rec: LightGuessDayRecord = {
      dayKey,
      cardId: card.id,
      choiceId,
      correct,
      answeredAt: new Date().toISOString(),
    };
    const prog = load();
    prog.byDay[dayKey] = rec;
    localStorage.setItem(storageKey, JSON.stringify(prog));
    return rec;
  }

  function __resetForTest(): void {
    localStorage.removeItem(storageKey);
  }

  return { getTodayRecord, saveAnswer, __resetForTest, storageKey };
}
