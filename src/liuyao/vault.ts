import { HEXAGRAMS } from './hexagrams.ts';
import { loadLiuyaoJournal, type LiuyaoJournalEntry } from './journal.ts';

/** 单卦相遇统计（由起卦记录推导，类似塔罗图鉴） */
export type HexMeetStat = {
  name: string;
  fullName: string;
  count: number;
  firstAt: string;
  lastAt: string;
  lastQuestion: string;
};

export type VaultSnapshot = {
  collected: number;
  total: number;
  meets: HexMeetStat[];
  mostMet: HexMeetStat | null;
  recent: LiuyaoJournalEntry[];
};

function entryAt(e: LiuyaoJournalEntry): string {
  return e.castAt || e.createdAt;
}

/** 从「我的卦象」日记汇总 64 卦相遇 */
export function buildVaultSnapshot(): VaultSnapshot {
  const journal = loadLiuyaoJournal();
  const byName = new Map<string, HexMeetStat>();

  for (const e of journal) {
    const name = e.primaryName;
    const fullName = e.primaryFullName || name;
    const at = entryAt(e);
    const cur = byName.get(name);
    if (!cur) {
      byName.set(name, {
        name,
        fullName,
        count: 1,
        firstAt: at,
        lastAt: at,
        lastQuestion: e.question,
      });
      continue;
    }
    cur.count += 1;
    if (at < cur.firstAt) cur.firstAt = at;
    if (at > cur.lastAt) {
      cur.lastAt = at;
      cur.lastQuestion = e.question;
    }
  }

  const meets = [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
  return {
    collected: meets.length,
    total: HEXAGRAMS.length,
    meets,
    mostMet: meets[0] ?? null,
    recent: journal.slice(0, 12),
  };
}

export function meetCountFor(name: string): number {
  return buildVaultSnapshot().meets.find((m) => m.name === name)?.count ?? 0;
}

export function meetLineFor(stat: HexMeetStat | null): string {
  if (!stat) return '起卦后，遇见的卦会慢慢点亮图鉴。';
  if (stat.count === 1) return `你第一次遇见「${stat.fullName}」。`;
  return `这是你第 ${stat.count} 次遇见「${stat.fullName}」。`;
}
