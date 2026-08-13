import { CODEX_STARS, getStarLore, isCodexStar, mutagenToCardId, type StarCategory } from './stars.ts';

const STORAGE_KEY = 'mystic-lab-ziwei-codex';
const ENCOUNTER_CAP = 10;
const DEDUPE_MS = 8000;

export type ZiweiCodexEncounter = {
  at: string;
  question: string;
  summary: string;
  palace?: string;
};

export type ZiweiCodexEntry = {
  starId: string;
  unlockedAt: string;
  meetCount: number;
  lastPalace?: string;
  encounters?: ZiweiCodexEncounter[];
};

type CodexStore = {
  entries: ZiweiCodexEntry[];
  updatedAt: string;
};

function isDuplicateEncounter(a: ZiweiCodexEncounter, b: ZiweiCodexEncounter): boolean {
  if (a.question.trim() !== b.question.trim()) return false;
  const dt = Math.abs(new Date(a.at).getTime() - new Date(b.at).getTime());
  return dt < DEDUPE_MS;
}

function normalizeEncounters(raw: unknown): ZiweiCodexEncounter[] {
  if (!Array.isArray(raw)) return [];
  const out: ZiweiCodexEncounter[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Partial<ZiweiCodexEncounter>;
    if (typeof e.at !== 'string' || typeof e.question !== 'string') continue;
    out.push({
      at: e.at,
      question: e.question,
      summary: typeof e.summary === 'string' ? e.summary : '',
      palace: typeof e.palace === 'string' ? e.palace : undefined,
    });
  }
  return out;
}

function sanitizeEntry(entry: ZiweiCodexEntry): ZiweiCodexEntry {
  const encounters = normalizeEncounters(entry.encounters);
  return {
    ...entry,
    encounters,
    meetCount: Math.max(encounters.length, entry.meetCount || 0, 1),
  };
}

function appendEncounter(
  entry: ZiweiCodexEntry,
  encounter: ZiweiCodexEncounter,
): ZiweiCodexEntry {
  const encounters = [...(entry.encounters ?? [])];
  const newest = encounters[0];
  if (newest && isDuplicateEncounter(encounter, newest)) {
    return {
      ...entry,
      encounters,
      meetCount: Math.max(encounters.length, entry.meetCount, 1),
    };
  }
  encounters.unshift(encounter);
  const capped = encounters.slice(0, ENCOUNTER_CAP);
  return {
    ...entry,
    encounters: capped,
    meetCount: Math.max(capped.length, entry.meetCount, 1),
  };
}

function loadStore(): CodexStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as Partial<CodexStore>;
    const entries = (Array.isArray(parsed.entries) ? parsed.entries : []).map(sanitizeEntry);
    return {
      entries,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return { entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveStore(store: CodexStore): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...store, updatedAt: new Date().toISOString() }),
  );
}

export function listCodexEntries(): ZiweiCodexEntry[] {
  return loadStore().entries;
}

export function getCodexEntry(starId: string): ZiweiCodexEntry | undefined {
  return loadStore().entries.find((e) => e.starId === starId);
}

export function isStarUnlocked(starId: string): boolean {
  return loadStore().entries.some((e) => e.starId === starId);
}

export function unlockStarsFromChart(
  starIds: string[],
  palaceByStar?: Partial<Record<string, string>>,
  opts?: { question?: string; summary?: string },
): { newly: string[]; total: number } {
  const store = loadStore();
  const map = new Map(store.entries.map((e) => [e.starId, sanitizeEntry(e)]));
  const newly: string[] = [];
  const now = new Date().toISOString();
  const question = (opts?.question ?? '').trim() || '（排盘遇见）';
  const summary = opts?.summary ?? '';
  const hasQuestionOpt = Boolean((opts?.question ?? '').trim());

  for (const raw of starIds) {
    if (!isCodexStar(raw)) continue;
    const id = getStarLore(raw)?.id;
    if (!id) continue;
    const palace = palaceByStar?.[raw] ?? palaceByStar?.[id];
    const prev = map.get(id);
    const encounter: ZiweiCodexEncounter = {
      at: now,
      question: hasQuestionOpt ? (opts!.question as string).trim() : question,
      summary,
      palace: palace ?? prev?.lastPalace,
    };

    if (!prev) {
      newly.push(id);
      map.set(
        id,
        appendEncounter(
          {
            starId: id,
            unlockedAt: now,
            meetCount: 0,
            lastPalace: palace,
            encounters: [],
          },
          encounter,
        ),
      );
    } else {
      let next: ZiweiCodexEntry = {
        ...prev,
        lastPalace: palace ?? prev.lastPalace,
        encounters: prev.encounters ?? [],
      };
      if (hasQuestionOpt) {
        next = appendEncounter(next, encounter);
      }
      next.meetCount = Math.max(next.encounters?.length ?? 0, next.meetCount, 1);
      map.set(id, next);
    }
  }

  saveStore({ entries: [...map.values()], updatedAt: now });
  return { newly, total: map.size };
}

/** 从盘面收集可点亮 id（主星/辅星/四化） */
export function collectUnlockIdsFromPalaces(
  palaces: Array<{
    name: string;
    majors: Array<{ name: string; mutagen?: string }>;
    minors: Array<{ name: string; mutagen?: string }>;
    adjectives?: Array<{ name: string; mutagen?: string }>;
  }>,
): { ids: string[]; palaceByStar: Record<string, string> } {
  const ids: string[] = [];
  const palaceByStar: Record<string, string> = {};
  for (const p of palaces) {
    for (const s of [...p.majors, ...p.minors, ...(p.adjectives ?? [])]) {
      const lore = getStarLore(s.name);
      if (lore) {
        ids.push(lore.id);
        palaceByStar[lore.id] = p.name;
      }
      if (s.mutagen) {
        const mid = mutagenToCardId(s.mutagen);
        if (mid) {
          ids.push(mid);
          palaceByStar[mid] = p.name;
        }
      }
    }
  }
  return { ids, palaceByStar };
}

export function codexProgress(category?: StarCategory): {
  collected: number;
  total: number;
} {
  const pool = category
    ? CODEX_STARS.filter((s) => s.category === category)
    : CODEX_STARS;
  const unlocked = new Set(loadStore().entries.map((e) => e.starId));
  return {
    collected: pool.filter((s) => unlocked.has(s.id)).length,
    total: pool.length,
  };
}

export function connectionLine(_starId: string, palace?: string): string {
  if (!palace) return '这颗星尚未在你的盘中现身——或尚未点亮。';
  return `在你的命盘里，它落在「${palace}」：这就是它与你隐藏人格的连接。`;
}

/** 「我的相遇」摘要：点亮主星、强宫、已看过 */
export function meetSummary(): {
  unlockedCount: number;
  majorIds: string[];
  strongPalaces: string[];
  viewedIds: string[];
} {
  const entries = listCodexEntries();
  const unlockedCount = entries.length;
  const majorIds = entries
    .map((e) => e.starId)
    .filter((id) => getStarLore(id)?.category === 'major');
  const palaceCount = new Map<string, number>();
  for (const e of entries) {
    if (!e.lastPalace) continue;
    palaceCount.set(e.lastPalace, (palaceCount.get(e.lastPalace) ?? 0) + 1);
  }
  const strongPalaces = [...palaceCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);
  const viewedIds = [...entries]
    .sort((a, b) => b.meetCount - a.meetCount)
    .slice(0, 8)
    .map((e) => e.starId);
  return { unlockedCount, majorIds, strongPalaces, viewedIds };
}
