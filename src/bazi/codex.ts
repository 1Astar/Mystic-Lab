import type { BaziChart } from './cast.ts';
import {
  ALL_STEM_BRANCH,
  WUXING_LORE,
  WUXING_ORDER,
  type WuxingLore,
} from './codex-lore.ts';
import {
  metTagIdsFromChart,
  ALL_STAR_CARDS,
  getStarCard,
  shenshaCardId,
  tengodCardId,
} from './codex-tags.ts';
import {
  BAZI_ENCYCLOPEDIA_IDS,
  getBaziEncyclopedia,
  listBaziEncyclopediaByKind,
} from './codex-encyclopedia.ts';
import { jiaziId, nayinId, RELATION_ATLAS } from './codex-atlas-catalog.ts';
import { nayinOf } from './pillar-meta.ts';
import type { WuXing } from './elements.ts';
import { buildEnergyBalance } from './sense-energy.ts';

const STORAGE_KEY = 'mystic-lab-bazi-codex';
const ENCOUNTER_CAP = 10;
const DEDUPE_MS = 8000;

export type BaziCodexKind =
  | 'wuxing'
  | 'stem'
  | 'branch'
  | 'shensha'
  | 'tengod'
  | 'nayin'
  | 'jiazi'
  | 'relation'
  | 'luck';

export type BaziCodexEncounter = {
  at: string;
  question: string;
  summary: string;
};

export type BaziCodexEntry = {
  id: string;
  kind: BaziCodexKind;
  unlockedAt: string;
  meetCount: number;
  /** 偏旺 | 偏弱 | 缺 — 仅五行 */
  reason?: string;
  encounters?: BaziCodexEncounter[];
};

type CodexStore = {
  entries: BaziCodexEntry[];
  /** 神煞名 或 tg:十神名 */
  metTags: string[];
  updatedAt: string;
};

function isDuplicateEncounter(a: BaziCodexEncounter, b: BaziCodexEncounter): boolean {
  if (a.question.trim() !== b.question.trim()) return false;
  const dt = Math.abs(new Date(a.at).getTime() - new Date(b.at).getTime());
  return dt < DEDUPE_MS;
}

function normalizeEncounters(raw: unknown): BaziCodexEncounter[] {
  if (!Array.isArray(raw)) return [];
  const out: BaziCodexEncounter[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Partial<BaziCodexEncounter>;
    if (typeof e.at !== 'string' || typeof e.question !== 'string') continue;
    out.push({
      at: e.at,
      question: e.question,
      summary: typeof e.summary === 'string' ? e.summary : '',
    });
  }
  return out;
}

function sanitizeEntry(entry: BaziCodexEntry): BaziCodexEntry {
  const encounters = normalizeEncounters(entry.encounters);
  return {
    ...entry,
    encounters,
    meetCount: Math.max(encounters.length, entry.meetCount || 0, 1),
  };
}

function appendEncounter(
  entry: BaziCodexEntry,
  encounter: BaziCodexEncounter,
): BaziCodexEntry {
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

function touchEntry(
  map: Map<string, BaziCodexEntry>,
  newly: BaziCodexEntry[],
  base: Omit<BaziCodexEntry, 'encounters' | 'meetCount' | 'unlockedAt'> & {
    unlockedAt?: string;
    meetCount?: number;
    encounters?: BaziCodexEncounter[];
  },
  now: string,
  encounter: BaziCodexEncounter,
  hasQuestionOpt: boolean,
): void {
  const prev = map.get(base.id);
  if (!prev) {
    const created = appendEncounter(
      {
        id: base.id,
        kind: base.kind,
        unlockedAt: now,
        meetCount: 0,
        reason: base.reason,
        encounters: [],
      },
      encounter,
    );
    newly.push(created);
    map.set(base.id, created);
    return;
  }
  let next: BaziCodexEntry = {
    ...prev,
    reason: base.reason ?? prev.reason,
    encounters: prev.encounters ?? [],
  };
  if (hasQuestionOpt) {
    next = appendEncounter(next, encounter);
  }
  next.meetCount = Math.max(next.encounters?.length ?? 0, next.meetCount, 1);
  map.set(base.id, next);
}

function loadStore(): CodexStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], metTags: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as Partial<CodexStore>;
    return {
      entries: (Array.isArray(parsed.entries) ? parsed.entries : []).map(sanitizeEntry),
      metTags: Array.isArray(parsed.metTags) ? parsed.metTags : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return { entries: [], metTags: [], updatedAt: new Date().toISOString() };
  }
}

function saveStore(store: CodexStore): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...store, updatedAt: new Date().toISOString() }),
  );
}

export function listBaziCodexEntries(): BaziCodexEntry[] {
  return loadStore().entries;
}

export function getBaziCodexEntry(id: string): BaziCodexEntry | undefined {
  return loadStore().entries.find((e) => e.id === id);
}

export function listMetCodexTags(): Set<string> {
  return new Set(loadStore().metTags);
}

export function isBaziCodexUnlocked(id: string): boolean {
  return loadStore().entries.some((e) => e.id === id);
}

/**
 * 从能量柱判定可点亮的五行：偏旺 / 偏弱 / 缺。
 * - 偏旺 = excess
 * - 缺 = shortage
 * - 偏弱 = 分数明显低于均值（含第二弱）
 */
export function notableWuxingFromChart(chart: BaziChart): {
  id: WuXing;
  reason: '偏旺' | '偏弱' | '缺';
}[] {
  const energy = buildEnergyBalance(chart);
  const scores = Object.fromEntries(energy.bars.map((b) => [b.wx, b.score])) as Record<
    WuXing,
    number
  >;
  const vals = WUXING_ORDER.map((wx) => scores[wx]);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const out = new Map<WuXing, '偏旺' | '偏弱' | '缺'>();

  if (energy.excess) out.set(energy.excess, '偏旺');
  if (energy.shortage) out.set(energy.shortage, '缺');

  for (const wx of WUXING_ORDER) {
    if (out.has(wx)) continue;
    if (scores[wx] <= avg - 0.5) out.set(wx, '偏弱');
  }

  return [...out.entries()].map(([id, reason]) => ({ id, reason }));
}

/** 四柱 + 流年（若有）上的天干地支 */
export function stemBranchIdsFromChart(chart: BaziChart): string[] {
  const ids = new Set<string>();
  for (const p of chart.pillars) {
    if (p.empty) continue;
    if (p.stem) ids.add(p.stem);
    if (p.branch) ids.add(p.branch);
  }
  return [...ids].filter((id) => ALL_STEM_BRANCH.some((x) => x.id === id));
}

/** 命盘可计入全库进度的词条 id（干支/十神/神煞/纳音/甲子/关系） */
export function libraryIdsFromChart(chart: BaziChart): Array<{ id: string; kind: BaziCodexKind }> {
  const out = new Map<string, BaziCodexKind>();

  for (const id of stemBranchIdsFromChart(chart)) {
    const lore = ALL_STEM_BRANCH.find((x) => x.id === id);
    if (lore) out.set(id, lore.kind);
  }

  for (const raw of metTagIdsFromChart(chart)) {
    if (raw.startsWith('tg:')) {
      const id = tengodCardId(raw.slice(3));
      if (getBaziEncyclopedia(id) || getStarCard(id)) out.set(id, 'tengod');
      continue;
    }
    const id = shenshaCardId(raw);
    if (getBaziEncyclopedia(id)) out.set(id, 'shensha');
  }

  for (const p of chart.pillars) {
    if (p.empty || p.key === 'liunian') continue;
    if (!p.stem || !p.branch || p.stem === '—' || p.branch === '—') continue;
    const gz = `${p.stem}${p.branch}`;
    const jz = jiaziId(gz);
    if (getBaziEncyclopedia(jz)) out.set(jz, 'jiazi');
    const ny = nayinOf(gz);
    if (ny && ny !== '—') {
      const nid = nayinId(ny);
      if (getBaziEncyclopedia(nid)) out.set(nid, 'nayin');
    }
  }

  for (const line of chart.relations) {
    if (line.includes('三合')) out.set('rel:三合', 'relation');
    else if (line.includes('半合')) out.set('rel:半合', 'relation');
    else if (line.includes('三会')) out.set('rel:三会', 'relation');
    else if (line.includes('相冲')) out.set('rel:六冲', 'relation');
    else if (line.includes('相刑') || line.includes('自刑')) out.set('rel:相刑', 'relation');
    else if (line.includes('相害')) out.set('rel:相害', 'relation');
    else if (line.includes('相破')) out.set('rel:相破', 'relation');
    else if (line.includes('相穿')) out.set('rel:相穿', 'relation');
    else if (/合/.test(line) && !line.includes('三合') && !line.includes('半合')) {
      // 地支六合或天干五合
      if (/[甲乙丙丁戊己庚辛壬癸]/.test(line)) out.set('rel:天干五合', 'relation');
      else out.set('rel:六合', 'relation');
    }
    for (const r of RELATION_ATLAS) {
      if (line.includes(r.title) && getBaziEncyclopedia(r.id)) out.set(r.id, 'relation');
    }
  }

  return [...out.entries()].map(([id, kind]) => ({ id, kind }));
}

export function unlockBaziCodexFromChart(
  chart: BaziChart,
  opts?: { question?: string; summary?: string },
): {
  newly: BaziCodexEntry[];
  total: number;
} {
  const store = loadStore();
  const map = new Map(store.entries.map((e) => [e.id, sanitizeEntry(e)]));
  const newly: BaziCodexEntry[] = [];
  const now = new Date().toISOString();
  const hasQuestionOpt = Boolean((opts?.question ?? '').trim());
  const question = hasQuestionOpt ? (opts!.question as string).trim() : '（排盘遇见）';
  const summary = opts?.summary ?? '';
  const encounter: BaziCodexEncounter = { at: now, question, summary };
  const metTags = new Set(store.metTags);
  for (const id of metTagIdsFromChart(chart)) metTags.add(id);

  for (const { id, reason } of notableWuxingFromChart(chart)) {
    touchEntry(
      map,
      newly,
      { id, kind: 'wuxing', reason },
      now,
      encounter,
      hasQuestionOpt,
    );
  }

  for (const { id, kind } of libraryIdsFromChart(chart)) {
    touchEntry(map, newly, { id, kind }, now, encounter, hasQuestionOpt);
  }

  saveStore({
    entries: [...map.values()],
    metTags: [...metTags],
    updatedAt: now,
  });
  return { newly, total: map.size };
}

export function baziCodexProgress(
  kind?: BaziCodexKind | 'stem-branch' | 'star',
): {
  collected: number;
  total: number;
} {
  const unlocked = new Set(loadStore().entries.map((e) => e.id));
  if (kind === 'wuxing') {
    return {
      collected: WUXING_ORDER.filter((id) => unlocked.has(id)).length,
      total: WUXING_ORDER.length,
    };
  }
  if (kind === 'stem' || kind === 'branch') {
    const pool = ALL_STEM_BRANCH.filter((x) => x.kind === kind);
    return {
      collected: pool.filter((x) => unlocked.has(x.id)).length,
      total: pool.length,
    };
  }
  if (kind === 'stem-branch') {
    return {
      collected: ALL_STEM_BRANCH.filter((x) => unlocked.has(x.id)).length,
      total: ALL_STEM_BRANCH.length,
    };
  }
  if (kind === 'shensha') {
    const pool = listBaziEncyclopediaByKind('shensha').map((e) => e.id);
    return {
      collected: pool.filter((id) => unlocked.has(id)).length,
      total: pool.length,
    };
  }
  if (kind === 'tengod') {
    const pool = ALL_STAR_CARDS.filter((c) => c.kind === kind);
    return {
      collected: pool.filter((c) => unlocked.has(c.id)).length,
      total: pool.length,
    };
  }
  if (kind === 'star') {
    return {
      collected: ALL_STAR_CARDS.filter((c) => unlocked.has(c.id)).length,
      total: ALL_STAR_CARDS.length,
    };
  }
  if (kind === 'nayin' || kind === 'jiazi' || kind === 'relation' || kind === 'luck') {
    const pool = listBaziEncyclopediaByKind(kind).map((e) => e.id);
    return {
      collected: pool.filter((id) => unlocked.has(id)).length,
      total: pool.length,
    };
  }
  // 全库进度
  return {
    collected: BAZI_ENCYCLOPEDIA_IDS.filter((id) => unlocked.has(id)).length,
    total: BAZI_ENCYCLOPEDIA_IDS.length,
  };
}

export function wuxingUnlockHint(id: WuXing, reason?: string): string {
  const lore: WuxingLore = WUXING_LORE[id];
  if (!reason) return `「${lore.title}」尚未因偏旺 / 偏弱 / 缺而被点亮。`;
  if (reason === '偏旺') return `因「偏旺」点亮：你的盘里${lore.epithet}这一股偏满。`;
  if (reason === '缺') return `因「缺」点亮：你的盘里${lore.epithet}偏枯，值得主动补给。`;
  return `因「偏弱」点亮：${lore.epithet}这一股偏低，需要关照。`;
}
