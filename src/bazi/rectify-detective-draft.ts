/**
 * 生时校准 v2 · 侦探会话草稿（localStorage）
 */
import type { LifeProfileInput } from '../life/types.ts';
import {
  applyDetectiveAnswer,
  createDetectiveEngine,
  type DetectiveAnswer,
  type DetectiveEngineState,
} from './rectify-detective-engine.ts';
import { applyUserClueText } from './rectify-user-clue.ts';

const STORAGE_KEY = 'mystic-lab-bazi-rectify-detective-draft';

export type DetectiveDraftStep = 'welcome' | 'objective' | 'personality' | 'script' | 'result';

export type DetectiveUserClue = {
  id: string;
  text: string;
  tags: string[];
  at: string;
};

export type DetectiveDraft = {
  step: DetectiveDraftStep;
  answers: DetectiveAnswer[];
  userClues: DetectiveUserClue[];
  /** 剧本对照选中的时辰 */
  preferredBranch: string;
  /** 是否揭开第三套剧本 */
  revealHiddenScript: boolean;
  updatedAt: string;
};

function profileKey(profile: LifeProfileInput): string {
  return [profile.birthYear, profile.birthMonth, profile.birthDay, profile.birthPlace].join(
    '|',
  );
}

export function emptyDetectiveDraft(): DetectiveDraft {
  return {
    step: 'welcome',
    answers: [],
    userClues: [],
    preferredBranch: '',
    revealHiddenScript: false,
    updatedAt: new Date().toISOString(),
  };
}

export function loadDetectiveDraft(): DetectiveDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<DetectiveDraft>;
    return {
      step: p.step ?? 'welcome',
      answers: Array.isArray(p.answers) ? p.answers : [],
      userClues: Array.isArray(p.userClues) ? p.userClues : [],
      preferredBranch: typeof p.preferredBranch === 'string' ? p.preferredBranch : '',
      revealHiddenScript: Boolean(p.revealHiddenScript),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveDetectiveDraft(draft: DetectiveDraft): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...draft,
      updatedAt: draft.updatedAt || new Date().toISOString(),
    }),
  );
}

export function clearDetectiveDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** 从草稿重建引擎状态（档案变化则返回 null） */
export function rebuildDetectiveEngine(
  profile: LifeProfileInput,
  draft?: DetectiveDraft | null,
): DetectiveEngineState | null {
  const base = createDetectiveEngine(profile);
  if (!base) return null;
  const d = draft ?? loadDetectiveDraft();
  if (!d) return base;
  if (base.profileKey !== profileKey(profile)) return base;

  let state = base;
  for (const a of d.answers) {
    const res = applyDetectiveAnswer(state, a.questionId, a.optionId);
    state = res.state;
  }
  for (const uc of d.userClues) {
    const res = applyUserClueText(state, uc.text);
    state = res.state;
  }
  return state;
}

export function appendDetectiveAnswer(
  profile: LifeProfileInput,
  draft: DetectiveDraft,
  questionId: string,
  optionId: string,
): {
  draft: DetectiveDraft;
  state: DetectiveEngineState | null;
  clue: ReturnType<typeof applyDetectiveAnswer>['clue'];
} {
  let state = rebuildDetectiveEngine(profile, draft);
  if (!state) {
    return { draft, state: null, clue: null };
  }
  const res = applyDetectiveAnswer(state, questionId, optionId);
  const nextDraft: DetectiveDraft = {
    ...draft,
    answers: res.state.answers,
    updatedAt: new Date().toISOString(),
  };
  saveDetectiveDraft(nextDraft);
  return { draft: nextDraft, state: res.state, clue: res.clue };
}

export function addUserClue(draft: DetectiveDraft, text: string, tags: string[] = []): DetectiveDraft {
  const next: DetectiveDraft = {
    ...draft,
    userClues: [
      ...draft.userClues,
      {
        id: `uc-${Date.now().toString(36)}`,
        text: text.trim().slice(0, 200),
        tags: tags.slice(0, 6),
        at: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
  saveDetectiveDraft(next);
  return next;
}

function popLastAnswer(
  answers: DetectiveAnswer[],
  prefix: 'obj' | 'per',
): DetectiveAnswer[] {
  const next = [...answers];
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i]!.questionId.startsWith(prefix)) {
      next.splice(i, 1);
      break;
    }
  }
  return next;
}

/**
 * 返回上一步：
 * - 结果 → 剧本
 * - 剧本 → 性格（撤回最后一题性格，便于重选）
 * - 性格/粗筛 → 撤回该阶段最后一题；没有则可退到上一阶段 / 欢迎
 */
export function undoDetectiveStep(draft: DetectiveDraft): DetectiveDraft {
  const now = new Date().toISOString();
  if (draft.step === 'welcome') return draft;

  if (draft.step === 'result') {
    return {
      ...draft,
      step: 'script',
      preferredBranch: '',
      updatedAt: now,
    };
  }

  if (draft.step === 'script') {
    return {
      ...draft,
      step: 'personality',
      answers: popLastAnswer(draft.answers, 'per'),
      preferredBranch: '',
      updatedAt: now,
    };
  }

  if (draft.step === 'personality') {
    const answers = popLastAnswer(draft.answers, 'per');
    if (answers.length === draft.answers.length) {
      return { ...draft, step: 'objective', answers, updatedAt: now };
    }
    return { ...draft, answers, updatedAt: now };
  }

  // objective
  const answers = popLastAnswer(draft.answers, 'obj');
  if (answers.length === draft.answers.length) {
    return {
      ...draft,
      step: 'welcome',
      answers: [],
      userClues: draft.userClues,
      preferredBranch: '',
      revealHiddenScript: false,
      updatedAt: now,
    };
  }
  return { ...draft, answers, updatedAt: now };
}

export function canUndoDetectiveStep(draft: DetectiveDraft): boolean {
  return draft.step !== 'welcome';
}
