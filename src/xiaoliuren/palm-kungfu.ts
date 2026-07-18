import {
  isXiaoliurenDueForReview,
  loadXiaoliurenJournal,
  type XiaoliurenJournalEntry,
  type XiaoliurenLessonMode,
} from './journal.ts';
import {
  getSkillGateStatus,
  loadSkillGates,
  PRACTICE_CLEARS_TO_UNLOCK_QUICK,
  type SkillGateStatus,
} from './skill-gates.ts';
import { SIX_GODS, type SixGodId } from './six-gods.ts';

export type ModeShare = {
  id: XiaoliurenLessonMode | 'unknown';
  label: string;
  count: number;
  /** 0–100，相对已记录模式的占比；unknown 单独算 */
  pct: number;
};

export type GodFreq = {
  id: SixGodId;
  name: string;
  count: number;
  pct: number;
};

export type PalmKungfuStats = {
  totalCasts: number;
  withQuestion: number;
  withReflection: number;
  reviewed: number;
  pendingReview: number;
  modeShares: ModeShare[];
  godFreq: GodFreq[];
  gates: SkillGateStatus;
  /** 通关侧：新手 / 操练次数（来自 skill-gates，更准） */
  learnClears: number;
  practiceClears: number;
  quickUnlocked: boolean;
  title: string;
  subtitle: string;
  nextHint: string;
};

const MODE_LABEL: Record<XiaoliurenLessonMode | 'unknown', string> = {
  learn: '新手',
  practice: '操练',
  beginner: '快速',
  unknown: '未记录',
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function buildPalmKungfuStats(
  entries: XiaoliurenJournalEntry[] = loadXiaoliurenJournal(),
  nowMs = Date.now(),
): PalmKungfuStats {
  const gates = getSkillGateStatus();
  const progress = loadSkillGates();
  const totalCasts = entries.length;

  const modeRaw: Record<XiaoliurenLessonMode | 'unknown', number> = {
    learn: 0,
    practice: 0,
    beginner: 0,
    unknown: 0,
  };
  const godRaw = new Map<SixGodId, number>();
  for (const g of SIX_GODS) godRaw.set(g.id, 0);

  let withQuestion = 0;
  let withReflection = 0;
  let reviewed = 0;
  let pendingReview = 0;

  for (const e of entries) {
    if (e.question.trim()) withQuestion += 1;
    if (e.reflection.trim()) withReflection += 1;
    if (e.fulfilled === true || e.fulfilled === false) reviewed += 1;
    else if (isXiaoliurenDueForReview(e, nowMs)) pendingReview += 1;

    const mode = e.lessonMode ?? 'unknown';
    modeRaw[mode] += 1;
    godRaw.set(e.resultId, (godRaw.get(e.resultId) ?? 0) + 1);
  }

  const knownModeTotal = modeRaw.learn + modeRaw.practice + modeRaw.beginner;
  const modeShares: ModeShare[] = (['learn', 'practice', 'beginner', 'unknown'] as const).map(
    (id) => ({
      id,
      label: MODE_LABEL[id],
      count: modeRaw[id],
      pct:
        id === 'unknown'
          ? pct(modeRaw.unknown, totalCasts)
          : pct(modeRaw[id], knownModeTotal || totalCasts),
    }),
  );

  const godFreq: GodFreq[] = SIX_GODS.map((g) => {
    const count = godRaw.get(g.id) ?? 0;
    return { id: g.id, name: g.name, count, pct: pct(count, totalCasts) };
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));

  const { title, subtitle, nextHint } = masteryCopy({
    totalCasts,
    practiceClears: progress.practiceClears,
    learnClears: progress.learnClears,
    gates,
  });

  return {
    totalCasts,
    withQuestion,
    withReflection,
    reviewed,
    pendingReview,
    modeShares,
    godFreq,
    gates,
    learnClears: progress.learnClears,
    practiceClears: progress.practiceClears,
    quickUnlocked: gates.beginner.unlocked,
    title,
    subtitle,
    nextHint,
  };
}

function masteryCopy(input: {
  totalCasts: number;
  practiceClears: number;
  learnClears: number;
  gates: SkillGateStatus;
}): { title: string; subtitle: string; nextHint: string } {
  const { totalCasts, practiceClears, learnClears, gates } = input;

  if (totalCasts === 0 && learnClears === 0) {
    return {
      title: '掌上功夫 · 尚未起手',
      subtitle: '目标不是依赖 App，而是自己会掐指、能对照生活。',
      nextHint: '先走一遍新手模式，把月→日→时顺数摸熟。',
    };
  }

  if (!gates.practice.unlocked) {
    return {
      title: '掌上功夫 · 入门',
      subtitle: `已起课 ${Math.max(totalCasts, learnClears)} 次 · 还在认掌诀。`,
      nextHint: '完成一次新手模式到结果，解锁空白掌操练。',
    };
  }

  if (!gates.beginner.unlocked) {
    const left = gates.beginner.remaining;
    return {
      title: '掌上功夫 · 操练中',
      subtitle: `空白掌已过关 ${practiceClears}/${PRACTICE_CLEARS_TO_UNLOCK_QUICK} · 正在脱离提示。`,
      nextHint: `再成功操练 ${left} 次，解锁快速模式；也可试着合上屏自己掐。`,
    };
  }

  if (practiceClears < 5) {
    return {
      title: '掌上功夫 · 三关已通',
      subtitle: '快速模式可用。真正的功夫，是离开屏幕也能数。',
      nextHint: '下次先自己掐一遍，再打开 App 核对落位。',
    };
  }

  return {
    title: '掌上功夫 · 渐成',
    subtitle: `操练 ${practiceClears} 次 · 起课 ${totalCasts} 次。可以少看提示、多对照生活。`,
    nextHint: '偶尔合上 App 掐指：对得上，这门手艺就真的是你的了。',
  };
}
