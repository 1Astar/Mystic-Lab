import { loadJournalEntries } from '../journal/records.ts';
import { TAROT_DECK } from '../tarot/deck.ts';

export type SuitKey = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export type SuitTrend = {
  key: SuitKey;
  label: string;
  insight: string;
  recentCount: number;
  priorCount: number;
  rising: boolean;
};

export type TarotJourneyInsights = {
  readingCount: number;
  trends: SuitTrend[];
  empty: boolean;
};

const SUIT_META: Record<SuitKey, { label: string; insight: string }> = {
  major: { label: '大阿卡那', insight: '人生阶段、重大转折与内在成长' },
  wands: { label: '权杖', insight: '行动、热情、创造与启动' },
  cups: { label: '圣杯', insight: '情感、关系、感受与联结' },
  swords: { label: '宝剑', insight: '选择、压力、思考与沟通' },
  pentacles: { label: '星币', insight: '现实、安全、工作、资源与积累' },
};

function suitKeyForCardId(cardId: string): SuitKey | null {
  const card = TAROT_DECK.find((c) => c.id === cardId);
  if (!card) return null;
  if (card.arcana === 'major') return 'major';
  return card.suit ?? null;
}

function countSuitsInEntries(entries: { cardIds: string[] }[]): Record<SuitKey, number> {
  const counts: Record<SuitKey, number> = {
    major: 0,
    wands: 0,
    cups: 0,
    swords: 0,
    pentacles: 0,
  };
  for (const entry of entries) {
    for (const cardId of entry.cardIds) {
      const key = suitKeyForCardId(cardId);
      if (key) counts[key] += 1;
    }
  }
  return counts;
}

export function getTarotJourneyInsights(limit = 30): TarotJourneyInsights {
  const readings = loadJournalEntries()
    .filter((e) => e.status !== 'partial' && e.cardIds.length > 0)
    .slice(0, limit);

  if (readings.length === 0) {
    return { readingCount: 0, trends: [], empty: true };
  }

  const mid = Math.min(15, Math.floor(readings.length / 2));
  const recent = readings.slice(0, mid || readings.length);
  const prior = mid > 0 ? readings.slice(mid) : [];

  const recentCounts = countSuitsInEntries(recent);
  const priorCounts = prior.length > 0 ? countSuitsInEntries(prior) : null;

  const trends: SuitTrend[] = (Object.keys(SUIT_META) as SuitKey[])
    .map((key) => {
      const recentCount = recentCounts[key];
      const priorCount = priorCounts ? priorCounts[key] : 0;
      const rising = priorCounts
        ? recentCount > priorCount && recentCount >= 2
        : recentCount >= 2;
      return {
        key,
        label: SUIT_META[key].label,
        insight: SUIT_META[key].insight,
        recentCount,
        priorCount,
        rising,
      };
    })
    .filter((t) => t.recentCount > 0)
    .sort((a, b) => {
      if (a.rising !== b.rising) return a.rising ? -1 : 1;
      return b.recentCount - a.recentCount;
    })
    .slice(0, 3);

  return {
    readingCount: readings.length,
    trends,
    empty: false,
  };
}

export function formatCodexDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function getFirstEncounter(entry: {
  firstSeenAt: string;
  encounters: { at: string; question: string; summary: string; reversed: boolean }[];
}): { at: string; question: string; summary: string; reversed: boolean } | undefined {
  if (!entry.encounters.length) return undefined;
  return entry.encounters.reduce((oldest, e) =>
    new Date(e.at).getTime() < new Date(oldest.at).getTime() ? e : oldest,
  );
}
