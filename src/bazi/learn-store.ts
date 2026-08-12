/**
 * 八字学习轨：知识点收集 + XP + 称号（与造命 craft/xp 分离）
 */
export type BaziLearnTitleId = 'chugui' | 'zhiming' | 'tuiyan';

export type BaziLearnState = {
  v: 1;
  xp: number;
  /** 已收集知识点 id */
  knowledgeIds: string[];
  /** 已展开过的 why（首次展开给 XP） */
  expandedWhyIds: string[];
  /** 互动事件 id，如 lever:once、if:once */
  interactionIds: string[];
  /** 猜命盘答对次数（推演大师门槛） */
  guessWins: number;
  updatedAt: string;
};

export type BaziLearnTitle = {
  id: BaziLearnTitleId;
  label: string;
  /** 称号说明 */
  blurb: string;
};

const STORAGE_KEY = 'mystic-lab-bazi-learn-v1';

export const BAZI_LEARN_TITLES: BaziLearnTitle[] = [
  {
    id: 'chugui',
    label: '初窥门径',
    blurb: '开始看见解读背后的逻辑',
  },
  {
    id: 'zhiming',
    label: '知命不惑',
    blurb: '收集够知识点，并做过一次互动推演',
  },
  {
    id: 'tuiyan',
    label: '推演大师',
    blurb: '能复习、能复盘，把逻辑用起来',
  },
];

const XP_EXPAND = 5;
const XP_COLLECT = 10;
const XP_INTERACT = 8;
const XP_GUESS_OK = 15;
const XP_GUESS_MISS = 5;

function empty(): BaziLearnState {
  return {
    v: 1,
    xp: 0,
    knowledgeIds: [],
    expandedWhyIds: [],
    interactionIds: [],
    guessWins: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function loadBaziLearn(): BaziLearnState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Partial<BaziLearnState>;
    return {
      v: 1,
      xp: Math.max(0, Number(p.xp) || 0),
      knowledgeIds: Array.isArray(p.knowledgeIds)
        ? [...new Set(p.knowledgeIds.map(String))].slice(-200)
        : [],
      expandedWhyIds: Array.isArray(p.expandedWhyIds)
        ? [...new Set(p.expandedWhyIds.map(String))].slice(-200)
        : [],
      interactionIds: Array.isArray(p.interactionIds)
        ? [...new Set(p.interactionIds.map(String))].slice(-200)
        : [],
      guessWins: Math.max(0, Number(p.guessWins) || 0),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    };
  } catch {
    return empty();
  }
}

function save(state: BaziLearnState): BaziLearnState {
  const next: BaziLearnState = {
    ...state,
    v: 1,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** 按蓝图门槛结算当前称号 */
export function resolveBaziLearnTitle(state = loadBaziLearn()): BaziLearnTitle {
  const k = state.knowledgeIds.length;
  const n = state.interactionIds.length;
  const wins = state.guessWins;
  const weekReview = state.interactionIds.some((id) => id.startsWith('review:week:'));
  if (
    (k >= 5 && n >= 1 && wins >= 3) ||
    (k >= 8 && n >= 2) ||
    (k >= 5 && n >= 1 && weekReview)
  ) {
    return BAZI_LEARN_TITLES[2]!;
  }
  if (k >= 5 && n >= 1) return BAZI_LEARN_TITLES[1]!;
  return BAZI_LEARN_TITLES[0]!;
}

export function hasKnowledge(id: string, state = loadBaziLearn()): boolean {
  return state.knowledgeIds.includes(id);
}

/** 首次展开 why → +XP */
export function markWhyExpanded(
  id: string,
): { state: BaziLearnState; gained: number; already: boolean } {
  const state = loadBaziLearn();
  if (state.expandedWhyIds.includes(id)) {
    return { state, gained: 0, already: true };
  }
  const next = save({
    ...state,
    xp: state.xp + XP_EXPAND,
    expandedWhyIds: [...state.expandedWhyIds, id].slice(-200),
  });
  return { state: next, gained: XP_EXPAND, already: false };
}

/** 收入知识库 → +XP（同 id 一次） */
export function collectKnowledge(
  id: string,
): { state: BaziLearnState; gained: number; already: boolean; title: BaziLearnTitle } {
  const state = loadBaziLearn();
  if (state.knowledgeIds.includes(id)) {
    return {
      state,
      gained: 0,
      already: true,
      title: resolveBaziLearnTitle(state),
    };
  }
  const next = save({
    ...state,
    xp: state.xp + XP_COLLECT,
    knowledgeIds: [...state.knowledgeIds, id].slice(-200),
  });
  return {
    state: next,
    gained: XP_COLLECT,
    already: false,
    title: resolveBaziLearnTitle(next),
  };
}

/** 互动推演（能量杠杆等）→ +XP，同 eventId 一次 */
export function markLearnInteraction(
  eventId: string,
): { state: BaziLearnState; gained: number; already: boolean; title: BaziLearnTitle } {
  const state = loadBaziLearn();
  if (state.interactionIds.includes(eventId)) {
    return {
      state,
      gained: 0,
      already: true,
      title: resolveBaziLearnTitle(state),
    };
  }
  const next = save({
    ...state,
    xp: state.xp + XP_INTERACT,
    interactionIds: [...state.interactionIds, eventId].slice(-200),
  });
  return {
    state: next,
    gained: XP_INTERACT,
    already: false,
    title: resolveBaziLearnTitle(next),
  };
}

export function learnStatusLine(state = loadBaziLearn()): string {
  const title = resolveBaziLearnTitle(state);
  return `知识点 ${state.knowledgeIds.length} · ${title.label}`;
}

/**
 * 猜命盘答题（每日一题仅计一次 XP）。
 * eventId 建议：`guess:2026-08-11`
 */
export function markGuessAnswer(
  eventId: string,
  correct: boolean,
): {
  state: BaziLearnState;
  gained: number;
  already: boolean;
  title: BaziLearnTitle;
} {
  const state = loadBaziLearn();
  if (state.interactionIds.includes(eventId)) {
    return {
      state,
      gained: 0,
      already: true,
      title: resolveBaziLearnTitle(state),
    };
  }
  const gained = correct ? XP_GUESS_OK : XP_GUESS_MISS;
  const next = save({
    ...state,
    xp: state.xp + gained,
    interactionIds: [...state.interactionIds, eventId].slice(-200),
    guessWins: state.guessWins + (correct ? 1 : 0),
  });
  return {
    state: next,
    gained,
    already: false,
    title: resolveBaziLearnTitle(next),
  };
}

/** 测试用 */
export function __resetBaziLearnForTest(): void {
  localStorage.removeItem(STORAGE_KEY);
}
