import { detectQuestionTheme, type QuestionTheme } from '../codex/collection.ts';
import { listPalaces, palaceOfHexagram, type Hexagram } from './hexagrams.ts';
import { TRIGRAMS, type TrigramId } from './trigrams.ts';
import { loadLiuyaoJournal, type LiuyaoJournalEntry } from './journal.ts';
import { buildVaultSnapshot, meetLineFor, type HexMeetStat, type VaultSnapshot } from './vault.ts';

export type PalaceProgress = {
  id: TrigramId;
  label: string;
  collected: number;
  total: number;
};

export type VaultOverview = VaultSnapshot & {
  palaces: PalaceProgress[];
  topPalaceLabel: string | null;
  topThemeLabel: string | null;
};

const THEME_LABEL: Record<QuestionTheme, string> = {
  work: '工作方向',
  love: '感情关系',
  study: '学业成长',
  self: '自我状态',
};

const PALACE_INSIGHT: Record<TrigramId, string> = {
  乾: '开创、主导、刚健推进',
  兑: '交流、喜悦、边界松动',
  离: '显现、被看见、行动与表达',
  震: '启动、震动、从零开始',
  巽: '渗入、反复、柔顺调整',
  坎: '险陷、不确定、在流动中找岸',
  艮: '止住、边界、先停半步',
  坤: '承载、接纳、厚德托底',
};

function entryAt(e: LiuyaoJournalEntry): string {
  return e.castAt || e.createdAt;
}

/** 已收集概览：八宫进度 + 最近主题 */
export function buildVaultOverview(): VaultOverview {
  const snap = buildVaultSnapshot();
  const met = new Set(snap.meets.map((m) => m.name));
  const palaces: PalaceProgress[] = listPalaces().map(({ palace, names }) => ({
    id: palace,
    label: `${palace}宫 · ${TRIGRAMS[palace].nature}`,
    collected: names.filter((n) => met.has(n)).length,
    total: names.length,
  }));

  // 最近遇见最多的宫：按相遇次数（非唯一卦）
  const palaceCounts = new Map<TrigramId, number>();
  for (const m of snap.meets) {
    const p = palaceOfHexagram(m.name);
    if (!p) continue;
    palaceCounts.set(p, (palaceCounts.get(p) ?? 0) + m.count);
  }
  let topPalace: TrigramId | null = null;
  let topN = 0;
  for (const [p, n] of palaceCounts) {
    if (n > topN) {
      topN = n;
      topPalace = p;
    }
  }

  const themeCounts: Record<QuestionTheme, number> = {
    work: 0,
    love: 0,
    study: 0,
    self: 0,
  };
  for (const e of snap.recent) {
    themeCounts[detectQuestionTheme(e.question)] += 1;
  }
  let topTheme: QuestionTheme | null = null;
  let themeN = 0;
  for (const t of Object.keys(themeCounts) as QuestionTheme[]) {
    if (themeCounts[t] > themeN) {
      themeN = themeCounts[t];
      topTheme = t;
    }
  }

  return {
    ...snap,
    palaces,
    topPalaceLabel: topPalace ? `${topPalace}宫 · ${TRIGRAMS[topPalace].nature}` : null,
    topThemeLabel: topTheme && themeN > 0 ? THEME_LABEL[topTheme] : null,
  };
}

export type PalaceTrend = {
  id: TrigramId;
  label: string;
  insight: string;
  recentCount: number;
  priorCount: number;
  rising: boolean;
};

export type LiuyaoJourneyInsights = {
  readingCount: number;
  trends: PalaceTrend[];
  empty: boolean;
};

/** 六爻旅程：最近占问里各宫出现趋势 */
export function getLiuyaoJourneyInsights(limit = 30): LiuyaoJourneyInsights {
  const readings = loadLiuyaoJournal().slice(0, limit);
  if (!readings.length) {
    return { readingCount: 0, trends: [], empty: true };
  }

  const mid = Math.min(15, Math.floor(readings.length / 2));
  const recent = readings.slice(0, mid || readings.length);
  const prior = mid > 0 ? readings.slice(mid) : [];

  const countPalace = (list: LiuyaoJournalEntry[]) => {
    const map = new Map<TrigramId, number>();
    for (const e of list) {
      const p = palaceOfHexagram(e.primaryName);
      if (!p) continue;
      map.set(p, (map.get(p) ?? 0) + 1);
    }
    return map;
  };

  const recentMap = countPalace(recent);
  const priorMap = prior.length ? countPalace(prior) : null;

  const trends: PalaceTrend[] = listPalaces()
    .map(({ palace }) => {
      const recentCount = recentMap.get(palace) ?? 0;
      const priorCount = priorMap?.get(palace) ?? 0;
      const rising = priorMap
        ? recentCount > priorCount && recentCount >= 2
        : recentCount >= 2;
      return {
        id: palace,
        label: `${palace}宫`,
        insight: PALACE_INSIGHT[palace],
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

  return { readingCount: readings.length, trends, empty: false };
}

/** 某一卦的全部相遇记录（日记） */
export function encountersForHex(name: string): LiuyaoJournalEntry[] {
  return loadLiuyaoJournal()
    .filter((e) => e.primaryName === name)
    .sort((a, b) => entryAt(b).localeCompare(entryAt(a)));
}

export function getHexMeetStat(name: string): HexMeetStat | null {
  return buildVaultSnapshot().meets.find((m) => m.name === name) ?? null;
}

export function meetBannerForHex(hex: Hexagram): string {
  const stat = getHexMeetStat(hex.name);
  if (!stat) return `你还没有遇见「${hex.fullName}」。起卦并保存后，这里会留下轨迹。`;
  return meetLineFor(stat);
}

export function getJournalEntryById(id: string): LiuyaoJournalEntry | undefined {
  return loadLiuyaoJournal().find((e) => e.id === id);
}

export function formatEncounterAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso.slice(0, 16);
  }
}
