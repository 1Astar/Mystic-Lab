import type { BaziChart } from './cast.ts';
import {
  ALL_STEM_BRANCH,
  WUXING_LORE,
  WUXING_ORDER,
  type WuxingLore,
} from './codex-lore.ts';
import {
  metTagIdsFromChart,
  starCardIdsFromChart,
  ALL_STAR_CARDS,
  getStarCard,
  shenshaCardId,
} from './codex-tags.ts';
import { SHENSHA_FEATURED } from './codex-shensha-tiers.ts';
import type { WuXing } from './elements.ts';
import { buildEnergyBalance } from './sense-energy.ts';

const STORAGE_KEY = 'mystic-lab-bazi-codex';

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

export type BaziCodexEntry = {
  id: string;
  kind: BaziCodexKind;
  unlockedAt: string;
  meetCount: number;
  /** 偏旺 | 偏弱 | 缺 — 仅五行 */
  reason?: string;
};

type CodexStore = {
  entries: BaziCodexEntry[];
  /** 神煞名 或 tg:十神名 */
  metTags: string[];
  updatedAt: string;
};

function loadStore(): CodexStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], metTags: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as Partial<CodexStore>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
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

export function unlockBaziCodexFromChart(chart: BaziChart): {
  newly: BaziCodexEntry[];
  total: number;
} {
  const store = loadStore();
  const map = new Map(store.entries.map((e) => [e.id, e]));
  const newly: BaziCodexEntry[] = [];
  const now = new Date().toISOString();
  const metTags = new Set(store.metTags);
  for (const id of metTagIdsFromChart(chart)) metTags.add(id);

  for (const { id, reason } of notableWuxingFromChart(chart)) {
    const prev = map.get(id);
    if (!prev) {
      const entry: BaziCodexEntry = {
        id,
        kind: 'wuxing',
        unlockedAt: now,
        meetCount: 1,
        reason,
      };
      newly.push(entry);
      map.set(id, entry);
    } else {
      map.set(id, {
        ...prev,
        meetCount: prev.meetCount + 1,
        reason: reason ?? prev.reason,
      });
    }
  }

  for (const id of stemBranchIdsFromChart(chart)) {
    const lore = ALL_STEM_BRANCH.find((x) => x.id === id)!;
    const prev = map.get(id);
    if (!prev) {
      const entry: BaziCodexEntry = {
        id,
        kind: lore.kind,
        unlockedAt: now,
        meetCount: 1,
      };
      newly.push(entry);
      map.set(id, entry);
    } else {
      map.set(id, { ...prev, meetCount: prev.meetCount + 1 });
    }
  }

  for (const id of starCardIdsFromChart(chart)) {
    const card = getStarCard(id);
    if (!card) continue;
    const prev = map.get(id);
    if (!prev) {
      const entry: BaziCodexEntry = {
        id,
        kind: card.kind,
        unlockedAt: now,
        meetCount: 1,
      };
      newly.push(entry);
      map.set(id, entry);
    } else {
      map.set(id, { ...prev, meetCount: prev.meetCount + 1 });
    }
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
    const pool = SHENSHA_FEATURED.map((n) => shenshaCardId(n));
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
  return {
    collected: unlocked.size,
    total: WUXING_ORDER.length + ALL_STEM_BRANCH.length + ALL_STAR_CARDS.length,
  };
}

export function wuxingUnlockHint(id: WuXing, reason?: string): string {
  const lore: WuxingLore = WUXING_LORE[id];
  if (!reason) return `「${lore.title}」尚未因偏旺 / 偏弱 / 缺而被点亮。`;
  if (reason === '偏旺') return `因「偏旺」点亮：你的盘里${lore.epithet}这一股偏满。`;
  if (reason === '缺') return `因「缺」点亮：你的盘里${lore.epithet}偏枯，值得主动补给。`;
  return `因「偏弱」点亮：${lore.epithet}这一股偏低，需要关照。`;
}
