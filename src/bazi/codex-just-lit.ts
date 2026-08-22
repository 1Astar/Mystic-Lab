/** 本会话已播过点亮微动效的词条，避免切 Tab 重播 */
const SESSION_KEY = 'mystic-lab-bazi-just-lit-seen';

function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function saveSeen(set: Set<string>): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set].slice(-200)));
  } catch {
    /* ignore */
  }
}

/** 从 newly 里取出尚未播放动效的 id */
export function takeJustLitIds(newlyIds: string[]): string[] {
  const seen = loadSeen();
  const fresh = newlyIds.filter((id) => id && !seen.has(id));
  for (const id of fresh) seen.add(id);
  if (fresh.length) saveSeen(seen);
  return fresh;
}
