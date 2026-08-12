/** 造命 · 星盘经验值 */

const STORAGE_KEY = 'mystic-lab-craft-xp-v1';

export type CraftXpState = {
  xp: number;
  level: number;
  /** 已打卡：`${weekKey}:${questId}` */
  checked: string[];
  updatedAt: string;
};

const XP_PER_LEVEL = 100;

export function emptyCraftXp(): CraftXpState {
  return { xp: 0, level: 1, checked: [], updatedAt: new Date().toISOString() };
}

export function loadCraftXp(): CraftXpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCraftXp();
    const p = JSON.parse(raw) as Partial<CraftXpState>;
    const xp = Math.max(0, Number(p.xp) || 0);
    return {
      xp,
      level: Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1),
      checked: Array.isArray(p.checked) ? p.checked.map(String).slice(-200) : [],
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyCraftXp();
  }
}

function save(state: CraftXpState): CraftXpState {
  const next = {
    ...state,
    level: Math.max(1, Math.floor(state.xp / XP_PER_LEVEL) + 1),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function checkKey(weekKey: string, questId: string): string {
  return `${weekKey}:${questId}`;
}

export function hasChecked(weekKey: string, questId: string, state = loadCraftXp()): boolean {
  return state.checked.includes(checkKey(weekKey, questId));
}

export function markChecked(
  weekKey: string,
  questId: string,
  gainXp: number,
): { state: CraftXpState; gained: number; already: boolean } {
  const state = loadCraftXp();
  const key = checkKey(weekKey, questId);
  if (state.checked.includes(key)) {
    return { state, gained: 0, already: true };
  }
  const gained = Math.max(0, Math.floor(gainXp));
  const next = save({
    ...state,
    xp: state.xp + gained,
    checked: [...state.checked, key].slice(-200),
  });
  return { state: next, gained, already: false };
}

/** 扣 XP（换任务等）；不足则失败不改写 */
export function deductXp(cost: number): { ok: boolean; state: CraftXpState } {
  const state = loadCraftXp();
  const need = Math.max(0, Math.floor(cost));
  if (state.xp < need) return { ok: false, state };
  return { ok: true, state: save({ ...state, xp: state.xp - need }) };
}

/** 当前等级内进度 0–100 */
export function levelProgressPct(state = loadCraftXp()): number {
  const into = state.xp % XP_PER_LEVEL;
  return Math.round((into / XP_PER_LEVEL) * 100);
}

export function xpToNextLevel(state = loadCraftXp()): number {
  return XP_PER_LEVEL - (state.xp % XP_PER_LEVEL);
}
