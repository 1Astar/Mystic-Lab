/**
 * 大限地图解锁：按虚岁开十年叙事包（流年不锁）
 */
export type DecadeUnlockState = 'locked' | 'current' | 'unlocked';

/** 虚岁近似：公历年 − 出生年 + 1（与流年轨 age 口径一致） */
export function virtualAgeAt(birthYear: number, at = new Date()): number {
  const y = Math.floor(birthYear);
  if (!Number.isFinite(y) || y < 1900) return 0;
  const age = at.getFullYear() - y + 1;
  if (age < 1 || age > 120) return 0;
  return age;
}

export function decadeUnlockState(
  ageFrom: number,
  ageTo: number,
  virtualAge: number,
): DecadeUnlockState {
  const from = Math.floor(ageFrom) || 0;
  const to = Math.floor(ageTo) || 0;
  const age = Math.floor(virtualAge) || 0;
  if (!from || !age) return 'unlocked';
  if (age < from) return 'locked';
  if (to && age > to) return 'unlocked';
  return 'current';
}

export function isDecadeUnlocked(
  ageFrom: number,
  ageTo: number,
  virtualAge: number,
): boolean {
  return decadeUnlockState(ageFrom, ageTo, virtualAge) !== 'locked';
}

export function decadeUnlockLabel(state: DecadeUnlockState, ageFrom: number, ageTo: number): string {
  if (state === 'locked') {
    return ageFrom && ageTo ? `约 ${ageFrom}–${ageTo} 岁开启` : '尚未开启';
  }
  if (state === 'current') return '进行中';
  return '已走过';
}
