/** 三关通关：新手 → 空白掌操练 → 解锁快速模式 */

const STORAGE_KEY = 'mystic-lab-xiaoliuren-skill-gates';

/** 自主操练完整通过几次后解锁快速模式 */
export const PRACTICE_CLEARS_TO_UNLOCK_QUICK = 2;

export type SkillGatesProgress = {
  /** 新手模式完整走完次数（到结果） */
  learnClears: number;
  /** 自主操练完整点对次数（到结果） */
  practiceClears: number;
};

export type SkillGateId = 'learn' | 'practice' | 'beginner';

export type SkillGateStatus = {
  learn: { unlocked: true; clears: number };
  practice: { unlocked: boolean; clears: number; needLearn: number };
  beginner: {
    unlocked: boolean;
    clears: number;
    needPractice: number;
    remaining: number;
  };
};

function empty(): SkillGatesProgress {
  return { learnClears: 0, practiceClears: 0 };
}

export function loadSkillGates(): SkillGatesProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<SkillGatesProgress>;
    return {
      learnClears: Math.max(0, Number(parsed.learnClears) || 0),
      practiceClears: Math.max(0, Number(parsed.practiceClears) || 0),
    };
  } catch {
    return empty();
  }
}

function persist(p: SkillGatesProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function isPracticeUnlocked(progress = loadSkillGates()): boolean {
  return progress.learnClears >= 1;
}

export function isQuickUnlocked(progress = loadSkillGates()): boolean {
  return progress.practiceClears >= PRACTICE_CLEARS_TO_UNLOCK_QUICK;
}

export function getSkillGateStatus(progress = loadSkillGates()): SkillGateStatus {
  const need = PRACTICE_CLEARS_TO_UNLOCK_QUICK;
  const remaining = Math.max(0, need - progress.practiceClears);
  return {
    learn: { unlocked: true, clears: progress.learnClears },
    practice: {
      unlocked: isPracticeUnlocked(progress),
      clears: progress.practiceClears,
      needLearn: 1,
    },
    beginner: {
      unlocked: isQuickUnlocked(progress),
      clears: progress.practiceClears,
      needPractice: need,
      remaining,
    },
  };
}

export function isModeUnlocked(
  mode: SkillGateId,
  progress = loadSkillGates(),
): boolean {
  if (mode === 'learn') return true;
  if (mode === 'practice') return isPracticeUnlocked(progress);
  return isQuickUnlocked(progress);
}

/** 新手模式走到结果时调用 */
export function markLearnClear(): SkillGatesProgress {
  const p = loadSkillGates();
  p.learnClears += 1;
  persist(p);
  return p;
}

/** 自主操练三步全对并走到结果时调用 */
export function markPracticeClear(): SkillGatesProgress {
  const p = loadSkillGates();
  p.practiceClears += 1;
  persist(p);
  return p;
}

/** 判定空白掌点击是否为本步下一格 */
export function isCorrectPracticeTap(
  hops: number[],
  hopCursor: number,
  tappedIndex: number,
): boolean {
  if (hopCursor < 0 || hopCursor >= hops.length) return false;
  return hops[hopCursor] === tappedIndex;
}

export function practiceTapHint(
  phase: 'month' | 'day' | 'hour',
  count: number,
  hopCursor: number,
): string {
  const left = Math.max(0, count - hopCursor);
  if (phase === 'month') {
    return hopCursor === 0
      ? `从大安起，请在掌上顺时针点出共 ${count} 下（还差 ${left}）。点错会提示。`
      : `继续顺时针下一点。本步共 ${count} 下，还差 ${left}。`;
  }
  if (phase === 'day') {
    return hopCursor === 0
      ? `从上一步落点起继续顺数 ${count} 下（不重回大安）。还差 ${left}。`
      : `继续顺时针。本步共 ${count} 下，还差 ${left}。`;
  }
  return hopCursor === 0
    ? `从日落点继续，按时辰顺数 ${count} 下。还差 ${left}。`
    : `继续顺时针。本步共 ${count} 下，还差 ${left}。`;
}

export function practiceWrongHint(expectedLabel: string): string {
  return `这一点不对。请想一想顺时针下一格——应落在「${expectedLabel}」附近再点。`;
}
