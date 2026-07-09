const BRANCHES = [
  { name: '子', range: [23, 1] },
  { name: '丑', range: [1, 3] },
  { name: '寅', range: [3, 5] },
  { name: '卯', range: [5, 7] },
  { name: '辰', range: [7, 9] },
  { name: '巳', range: [9, 11] },
  { name: '午', range: [11, 13] },
  { name: '未', range: [13, 15] },
  { name: '申', range: [15, 17] },
  { name: '酉', range: [17, 19] },
  { name: '戌', range: [19, 21] },
  { name: '亥', range: [21, 23] },
] as const;

export function getCurrentChineseHour(): { branch: string; label: string; index: number } {
  const h = new Date().getHours();
  for (let i = 0; i < BRANCHES.length; i++) {
    const b = BRANCHES[i];
    const [start, end] = b.range;
    if (start > end) {
      if (h >= start || h < end) {
        return { branch: b.name, label: `${b.name}时`, index: i };
      }
    } else if (h >= start && h < end) {
      return { branch: b.name, label: `${b.name}时`, index: i };
    }
  }
  return { branch: '子', label: '子时', index: 0 };
}

export function formatClockTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const EARTHLY_BRANCHES = BRANCHES.map((b) => b.name);

export const SIX_GODS = [
  { name: '大安', symbol: '☁' },
  { name: '留连', symbol: '⛓' },
  { name: '速喜', symbol: '⚡' },
  { name: '赤口', symbol: '⚔' },
  { name: '小吉', symbol: '🍶' },
  { name: '空亡', symbol: '○' },
] as const;
