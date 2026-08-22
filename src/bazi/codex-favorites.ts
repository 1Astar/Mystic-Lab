/**
 * 八字图鉴收藏标记（本机）：火 = 重点关注；对我有用 = 运势对照常用
 */
export type BaziCodexMark = 'fire' | 'useful';

const STORAGE_KEY = 'mystic-lab-bazi-codex-marks';

type MarkMap = Record<string, BaziCodexMark[]>;

function loadMap(): MarkMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: MarkMap = {};
    for (const [id, marks] of Object.entries(parsed as Record<string, unknown>)) {
      if (!id.trim() || !Array.isArray(marks)) continue;
      const clean = marks.filter((m): m is BaziCodexMark => m === 'fire' || m === 'useful');
      if (clean.length) out[id] = [...new Set(clean)];
    }
    return out;
  } catch {
    return {};
  }
}

function saveMap(map: MarkMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function getBaziCodexMarks(id: string): BaziCodexMark[] {
  return loadMap()[id] ?? [];
}

export function hasBaziCodexMark(id: string, mark: BaziCodexMark): boolean {
  return getBaziCodexMarks(id).includes(mark);
}

export function toggleBaziCodexMark(id: string, mark: BaziCodexMark): boolean {
  const map = loadMap();
  const cur = new Set(map[id] ?? []);
  if (cur.has(mark)) cur.delete(mark);
  else cur.add(mark);
  if (cur.size === 0) delete map[id];
  else map[id] = [...cur];
  saveMap(map);
  return cur.has(mark);
}

export function listBaziCodexMarkedIds(mark?: BaziCodexMark): string[] {
  const map = loadMap();
  return Object.keys(map).filter((id) => (mark ? map[id]?.includes(mark) : true));
}

export function baziCodexMarkLabel(mark: BaziCodexMark): string {
  return mark === 'fire' ? '火' : '对我有用';
}

export function baziCodexMarkButtonLabel(mark: BaziCodexMark, on: boolean): string {
  if (mark === 'fire') return on ? '🔥 火' : '火';
  return on ? '✓ 对我有用' : '对我有用';
}

export const BAZI_CODEX_MARKS_STORAGE_KEY = STORAGE_KEY;
