/**
 * 今日当红娘 v2 · 独立本地存档
 */
import type { MatchmakerCharacter } from './characters.ts';
import type {
  ChoiceAnalysis,
  MatchReasonId,
  VenueId,
  LockedEvent,
  ReviewClues,
} from './events.ts';
import type { RelationTag } from './tags.ts';
import { generateCharacter, generatePool } from './generate.ts';
import {
  createIntimacyLesson,
  type IntimacyLessonState,
} from './intimacy-lesson.ts';
import {
  createTengodLesson,
  type TengodLessonState,
} from './tengod-lesson.ts';
import { withPersonalityQuotes } from './personality-quote.ts';
import { TUTORIAL_POOL } from './tutorial.ts';

export type ChartLessonState = IntimacyLessonState | TengodLessonState;

export function isTengodLesson(
  lesson: ChartLessonState | null | undefined,
): lesson is TengodLessonState {
  return Boolean(lesson && 'kind' in lesson && lesson.kind === 'tengod');
}

export type MatchmakerMode = 'free' | 'tutorial' | 'twogen';

export type MatchmakerView = 'play' | 'ledger' | 'family' | 'lesson';

export type MatchmakerStep =
  | 'pool'
  | 'reason'
  | 'venue'
  | 'guess'
  | 'reveal'
  | 'follow';

export type LedgerKind = 'near_miss' | 'marriage' | 'active';

export type LedgerEntry = {
  id: string;
  kind: LedgerKind;
  title: string;
  year: number;
  summary: string;
  /** 近失/成家可读正文 */
  body?: string;
  idA: string;
  idB: string;
  childIds?: string[];
  relatedNearMissId?: string;
};

export type StoryBeat = {
  eventId: string;
  actualChoiceId: string;
  playerGuessId: string | null;
  kind: string;
  summary: string;
  year: number;
  reviewClues?: ReviewClues;
};

export type CoupleState = {
  idA: string;
  idB: string;
  reasonId: MatchReasonId;
  venueId: VenueId;
  tags: RelationTag[];
  trust: number;
  tension: number;
  /** 故事起点年（初遇那年） */
  startYear: number;
  history: StoryBeat[];
};

/** 换伴侣：锁锚点，覆盖当前故事重开 */
export type RematchState = {
  anchorId: string;
};

/**
 * 选人镜头：open=普通这一批（可夹二代孩子）；
 * gen2=主动为二代做媒（二代节奏入口，不是一打开就锁死）
 */
export type MatchLens = 'open' | 'gen2';

export type MatchmakerStore = {
  version: 3;
  step: MatchmakerStep;
  mode: MatchmakerMode;
  /** play=流程；ledger=红娘簿；family=家谱；lesson=看盘教学 */
  view: MatchmakerView;
  /** 看盘教学（亲密关系 / 十神认法）；view=lesson 时用 */
  lesson: ChartLessonState | null;
  matchLens: MatchLens;
  /** 家谱/近失聚焦的簿册条目 */
  focusLedgerId: string | null;
  /** 簿册已知人物（含第一代父母，可不在候选池） */
  roster: MatchmakerCharacter[];
  ledger: LedgerEntry[];
  pool: MatchmakerCharacter[];
  pinnedIds: string[];
  selectedIds: string[];
  /**
   * 主线人物：家谱/换伴侣对照都围着 TA。
   * 来源：开局默认完整人，或点「追这户人家」升格。
   */
  mainlineId: string | null;
  /** 覆盖重开中：保留此人，另选一位 */
  rematch: RematchState | null;
  reasonId: MatchReasonId | null;
  venueId: VenueId | null;
  couple: CoupleState | null;
  activeEvent: LockedEvent | null;
  /** 已揭晓的最近一封信缓存 */
  lastReveal: {
    letterTitle: string;
    letterBody: string;
    voiceA: string;
    voiceB: string;
    learnBullets: string[];
    kind: string;
    twistHint?: string;
    guessCorrect: boolean | null;
    choiceAnalyses?: ChoiceAnalysis[];
    actualChoiceId?: string;
    storyYear?: number;
    reviewClues?: ReviewClues;
  } | null;
  updatedAt: string;
};

const STORAGE_KEY = 'mystic-lab-matchmaker';

function buildStoreWithMainline(
  partial?: Partial<MatchmakerStore>,
): MatchmakerStore {
  const mainline = generateCharacter();
  const used = new Set([mainline.nickname]);
  const rest: MatchmakerCharacter[] = [];
  for (let i = 0; i < 5; i++) {
    rest.push(generateCharacter(Math.random, used));
  }
  return {
    version: 3,
    step: 'pool',
    mode: 'free',
    view: 'play',
    lesson: null,
    matchLens: 'open',
    focusLedgerId: null,
    roster: [mainline],
    ledger: [],
    pool: [mainline, ...rest],
    pinnedIds: [mainline.id],
    selectedIds: [],
    mainlineId: mainline.id,
    rematch: null,
    reasonId: null,
    venueId: null,
    couple: null,
    activeEvent: null,
    lastReveal: null,
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

export function createEmptyMatchmakerStore(): MatchmakerStore {
  return buildStoreWithMainline();
}

/** 载入四人样例教程关（结局仍走标签抽信，不写死 pair|venue） */
export function loadTutorialPool(store: MatchmakerStore): MatchmakerStore {
  return saveMatchmakerStore({
    ...store,
    mode: 'tutorial',
    view: 'play',
    matchLens: 'open',
    focusLedgerId: null,
    roster: [],
    ledger: [],
    step: 'pool',
    pool: withPersonalityQuotes(TUTORIAL_POOL.map((c) => ({ ...c }))),
    pinnedIds: TUTORIAL_POOL.map((c) => c.id),
    selectedIds: [],
    // 教程不覆盖已追主线；无主线则默认阿橙，方便对照生辰
    mainlineId: store.mainlineId ?? TUTORIAL_POOL[0]!.id,
    rematch: null,
    reasonId: null,
    venueId: null,
    couple: null,
    activeEvent: null,
    lastReveal: null,
  });
}

export function loadFreePool(store: MatchmakerStore): MatchmakerStore {
  const keptMain =
    store.mainlineId != null
      ? findPersonAnywhere(store, store.mainlineId) ?? null
      : null;
  if (keptMain) {
    const used = new Set([keptMain.nickname]);
    const rest: MatchmakerCharacter[] = [];
    for (let i = 0; i < 5; i++) {
      rest.push(generateCharacter(Math.random, used));
    }
    return saveMatchmakerStore({
      ...store,
      mode: 'free',
      view: 'play',
      matchLens: 'open',
      focusLedgerId: null,
      step: 'pool',
      pool: [keptMain, ...rest],
      pinnedIds: [keptMain.id],
      selectedIds: [],
      mainlineId: keptMain.id,
      roster: upsertRoster(store.roster, keptMain),
      rematch: null,
      reasonId: null,
      venueId: null,
      couple: null,
      activeEvent: null,
      lastReveal: null,
    });
  }
  return saveMatchmakerStore(buildStoreWithMainline({ ledger: store.ledger }));
}

/** 主动进入「为二代做媒」镜头（覆盖重开选人，不清簿册） */
export function enterGen2Matchmaking(store: MatchmakerStore): MatchmakerStore {
  const kids = store.roster.filter((c) => c.lifeTags.includes('gen:2'));
  const fillers = store.roster.filter((c) => c.lifeTags.includes('filler'));
  const pool = [...kids, ...fillers];
  return saveMatchmakerStore({
    ...store,
    matchLens: 'gen2',
    view: 'play',
    step: 'pool',
    pool: pool.length >= 2 ? pool : store.pool,
    pinnedIds: kids.map((c) => c.id),
    selectedIds: [],
    rematch: null,
    reasonId: null,
    venueId: null,
    couple: null,
    activeEvent: null,
    lastReveal: null,
  });
}

function normalizeTengodLesson(raw: unknown): TengodLessonState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<TengodLessonState>;
  const phases: TengodLessonState['phase'][] = [
    'intro',
    'tap_day',
    'tap_xin',
    'reveal',
    'practice_intro',
    'practice_guess',
    'done',
  ];
  if (!phases.includes(r.phase as TengodLessonState['phase'])) return null;
  return {
    kind: 'tengod',
    phase: r.phase as TengodLessonState['phase'],
    wrongCount: Number(r.wrongCount) || 0,
    hinted: Boolean(r.hinted),
    practicePick: r.practicePick ? String(r.practicePick) : null,
  };
}

function normalizeLesson(raw: unknown): ChartLessonState | null {
  if (!raw || typeof raw !== 'object') return null;
  if ((raw as { kind?: string }).kind === 'tengod') {
    return normalizeTengodLesson(raw);
  }
  const r = raw as Partial<IntimacyLessonState>;
  const phases: IntimacyLessonState['phase'][] = [
    'intro',
    'ziwei_ask',
    'ziwei_stars',
    'scene',
    'bazi_day',
    'bazi_branch',
    'practice_intro',
    'practice_ziwei',
    'done',
  ];
  if (!phases.includes(r.phase as IntimacyLessonState['phase'])) return null;
  const track = r.track === 'practice' ? 'practice' : 'guide';
  return {
    phase: r.phase as IntimacyLessonState['phase'],
    track,
    personId: String(r.personId || ''),
    wrongCount: Number(r.wrongCount) || 0,
    hinted: Boolean(r.hinted),
  };
}

/** 进入「怎么看亲密关系」教学（与猜剧情分开） */
export function enterIntimacyLesson(store: MatchmakerStore): MatchmakerStore {
  return saveMatchmakerStore({
    ...store,
    view: 'lesson',
    lesson: createIntimacyLesson(),
  });
}

/** 进入「十神从哪来」八字第一节 */
export function enterTengodLesson(store: MatchmakerStore): MatchmakerStore {
  return saveMatchmakerStore({
    ...store,
    view: 'lesson',
    lesson: createTengodLesson(),
  });
}

export function leaveIntimacyLesson(store: MatchmakerStore): MatchmakerStore {
  return saveMatchmakerStore({
    ...store,
    view: 'play',
    lesson: null,
    step: 'pool',
  });
}

export function setIntimacyLesson(
  store: MatchmakerStore,
  lesson: ChartLessonState,
): MatchmakerStore {
  return saveMatchmakerStore({
    ...store,
    view: 'lesson',
    lesson,
  });
}

function upsertRoster(
  roster: MatchmakerCharacter[],
  person: MatchmakerCharacter,
): MatchmakerCharacter[] {
  const i = roster.findIndex((c) => c.id === person.id);
  if (i < 0) return [...roster, person];
  const next = roster.slice();
  next[i] = person;
  return next;
}

/** 把某人升格为主线：沿用生辰与经历；池子与钉住里保住 TA */
export function followHousehold(
  store: MatchmakerStore,
  personId: string,
): MatchmakerStore {
  const person = findPersonAnywhere(store, personId);
  if (!person) return store;
  const poolHas = store.pool.some((c) => c.id === personId);
  const pool = poolHas ? store.pool : [person, ...store.pool].slice(0, 8);
  const pinned = store.pinnedIds.includes(personId)
    ? store.pinnedIds
    : [...store.pinnedIds, personId];
  return saveMatchmakerStore({
    ...store,
    mainlineId: personId,
    roster: upsertRoster(store.roster, person),
    pool,
    pinnedIds: pinned,
  });
}

/** 自创角色入池并定为主线（生辰从此固定，换伴侣不换盘） */
export function adoptCustomMainline(
  store: MatchmakerStore,
  person: MatchmakerCharacter,
): MatchmakerStore {
  const withoutDup = store.pool.filter((c) => c.id !== person.id);
  const pool = [person, ...withoutDup].slice(0, 8);
  const pinned = store.pinnedIds.includes(person.id)
    ? store.pinnedIds
    : [...store.pinnedIds, person.id];
  return saveMatchmakerStore({
    ...store,
    mode: store.mode === 'tutorial' ? 'free' : store.mode,
    view: 'play',
    step: 'pool',
    mainlineId: person.id,
    roster: upsertRoster(store.roster, person),
    pool,
    pinnedIds: pinned,
    selectedIds: [person.id],
    rematch: null,
    reasonId: null,
    venueId: null,
    couple: null,
    activeEvent: null,
    lastReveal: null,
  });
}

export function getMainlinePerson(
  store: MatchmakerStore,
): MatchmakerCharacter | undefined {
  if (!store.mainlineId) return undefined;
  return findPersonAnywhere(store, store.mainlineId);
}

export function leaveGen2Matchmaking(store: MatchmakerStore): MatchmakerStore {
  if (store.matchLens !== 'gen2') return store;
  const kids = store.roster.filter((c) => c.lifeTags.includes('gen:2'));
  const fillers = store.roster.filter((c) => c.lifeTags.includes('filler'));
  const pool = [...kids, ...fillers];
  return saveMatchmakerStore({
    ...store,
    matchLens: 'open',
    step: 'pool',
    view: 'play',
    pool: pool.length >= 2 ? pool : store.pool,
    pinnedIds: kids.map((c) => c.id),
    selectedIds: [],
    couple: null,
    activeEvent: null,
    lastReveal: null,
  });
}

function normalizePerson(raw: Partial<MatchmakerCharacter>): MatchmakerCharacter | null {
  if (!raw?.id || !raw.nickname) return null;
  return {
    id: String(raw.id),
    nickname: String(raw.nickname).slice(0, 8),
    relation: 'other',
    gender: raw.gender === 'female' || raw.gender === 'male' ? raw.gender : 'female',
    lifeTags: Array.isArray(raw.lifeTags) ? raw.lifeTags.map(String) : [],
    age: '',
    occupation: String(raw.job ?? raw.occupation ?? ''),
    city: String(raw.city ?? raw.birthPlace ?? ''),
    birthYear: String(raw.birthYear ?? ''),
    birthMonth: String(raw.birthMonth ?? ''),
    birthDay: String(raw.birthDay ?? ''),
    birthHour: String(raw.birthHour ?? ''),
    birthPlace: String(raw.birthPlace ?? ''),
    confusion: '',
    quote: String(raw.quote ?? ''),
    job: String(raw.job ?? raw.occupation ?? ''),
    wish: String(raw.wish ?? '想被认真对待'),
    situation: String(raw.situation ?? '日子过得普通'),
  };
}

function normalizeLedger(raw: unknown): LedgerEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const e = item as Partial<LedgerEntry>;
      if (!e?.id || !e.title) return null;
      const kind: LedgerKind =
        e.kind === 'near_miss' || e.kind === 'marriage' || e.kind === 'active'
          ? e.kind
          : 'active';
      return {
        id: String(e.id),
        kind,
        title: String(e.title),
        year: Number(e.year) || 0,
        summary: String(e.summary ?? ''),
        body: e.body ? String(e.body) : undefined,
        idA: String(e.idA ?? ''),
        idB: String(e.idB ?? ''),
        childIds: Array.isArray(e.childIds) ? e.childIds.map(String) : undefined,
        relatedNearMissId: e.relatedNearMissId ? String(e.relatedNearMissId) : undefined,
      } satisfies LedgerEntry;
    })
    .filter((x): x is LedgerEntry => Boolean(x));
}

function normalize(raw: Partial<MatchmakerStore> & { version?: number }): MatchmakerStore {
  const ver = Number(raw.version);
  if (ver !== 2 && ver !== 3) {
    return createEmptyMatchmakerStore();
  }
  const steps: MatchmakerStep[] = ['pool', 'reason', 'venue', 'guess', 'reveal', 'follow'];
  const step = steps.includes(raw.step as MatchmakerStep) ? (raw.step as MatchmakerStep) : 'pool';
  const pool = Array.isArray(raw.pool)
    ? raw.pool.map(normalizePerson).filter((x): x is MatchmakerCharacter => Boolean(x))
    : [];
  const roster = Array.isArray(raw.roster)
    ? raw.roster.map(normalizePerson).filter((x): x is MatchmakerCharacter => Boolean(x))
    : [];
  const mode: MatchmakerMode =
    raw.mode === 'tutorial' || raw.mode === 'twogen' ? raw.mode : 'free';
  const view: MatchmakerView =
    raw.view === 'ledger' ||
    raw.view === 'family' ||
    raw.view === 'lesson'
      ? raw.view
      : 'play';
  const matchLens: MatchLens = raw.matchLens === 'gen2' ? 'gen2' : 'open';
  const lesson =
    view === 'lesson'
      ? normalizeLesson(raw.lesson) ?? createIntimacyLesson()
      : null;
  return {
    version: 3,
    step,
    mode,
    view,
    lesson,
    matchLens,
    focusLedgerId: raw.focusLedgerId ? String(raw.focusLedgerId) : null,
    roster,
    ledger: normalizeLedger(raw.ledger),
    pool: pool.length >= 2 ? pool : generatePool(6),
    pinnedIds: Array.isArray(raw.pinnedIds) ? raw.pinnedIds.map(String) : [],
    selectedIds: Array.isArray(raw.selectedIds) ? raw.selectedIds.map(String).slice(0, 2) : [],
    mainlineId: raw.mainlineId ? String(raw.mainlineId) : null,
    rematch:
      raw.rematch?.anchorId && String(raw.rematch.anchorId)
        ? { anchorId: String(raw.rematch.anchorId) }
        : null,
    reasonId:
      raw.reasonId === 'appreciate' ||
      raw.reasonId === 'rhythm' ||
      raw.reasonId === 'friction-worth'
        ? raw.reasonId
        : null,
    venueId:
      raw.venueId === 'tea-house' || raw.venueId === 'harvest' || raw.venueId === 'cafe'
        ? raw.venueId
        : null,
    couple: raw.couple
      ? {
          idA: String(raw.couple.idA),
          idB: String(raw.couple.idB),
          reasonId: raw.couple.reasonId,
          venueId: raw.couple.venueId,
          tags: Array.isArray(raw.couple.tags) ? (raw.couple.tags as RelationTag[]) : [],
          trust: Number(raw.couple.trust) || 0,
          tension: Number(raw.couple.tension) || 0,
          startYear: Number(raw.couple.startYear) || new Date().getFullYear() - 2,
          history: Array.isArray(raw.couple.history)
            ? raw.couple.history.map((h) => ({
                eventId: String(h.eventId),
                actualChoiceId: String(h.actualChoiceId),
                playerGuessId: h.playerGuessId ? String(h.playerGuessId) : null,
                kind: String(h.kind ?? ''),
                summary: String(h.summary ?? ''),
                year: Number(h.year) || Number(raw.couple?.startYear) || 0,
                reviewClues: h.reviewClues,
              }))
            : [],
        }
      : null,
    activeEvent: raw.activeEvent
      ? {
          eventId: String(raw.activeEvent.eventId),
          actualChoiceId: String(raw.activeEvent.actualChoiceId),
          playerGuessId: raw.activeEvent.playerGuessId
            ? String(raw.activeEvent.playerGuessId)
            : null,
          revealed: Boolean(raw.activeEvent.revealed),
          storyYear:
            Number(raw.activeEvent.storyYear) ||
            Number(raw.couple?.startYear) ||
            new Date().getFullYear(),
        }
      : null,
    lastReveal: raw.lastReveal ?? null,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

/** 旧档无主线时补一位完整人，不冲掉已有池子人选 */
function withEnsuredMainline(store: MatchmakerStore): MatchmakerStore {
  if (store.mainlineId && findPersonAnywhere(store, store.mainlineId)) {
    return store;
  }
  if (store.pool[0]) {
    return {
      ...store,
      mainlineId: store.pool[0].id,
      roster: upsertRoster(store.roster, store.pool[0]),
      pinnedIds: store.pinnedIds.includes(store.pool[0].id)
        ? store.pinnedIds
        : [...store.pinnedIds, store.pool[0].id],
    };
  }
  const mainline = generateCharacter();
  return {
    ...store,
    mainlineId: mainline.id,
    roster: upsertRoster(store.roster, mainline),
    pool: [mainline, ...store.pool].slice(0, 8),
    pinnedIds: store.pinnedIds.includes(mainline.id)
      ? store.pinnedIds
      : [...store.pinnedIds, mainline.id],
  };
}

export function loadMatchmakerStore(): MatchmakerStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyMatchmakerStore();
    return withEnsuredMainline(
      normalize(JSON.parse(raw) as Partial<MatchmakerStore>),
    );
  } catch {
    return createEmptyMatchmakerStore();
  }
}

export function saveMatchmakerStore(store: MatchmakerStore): MatchmakerStore {
  const next = withEnsuredMainline(
    normalize({ ...store, version: 3, updatedAt: new Date().toISOString() }),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetMatchmakerStore(): MatchmakerStore {
  const empty = createEmptyMatchmakerStore();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  return empty;
}

/** 刷新人池：已选中 / 钉住 / 换伴侣锚点都保留，只换其余名额 */
export function refreshPoolKeepPinned(store: MatchmakerStore): MatchmakerStore {
  if (store.mode === 'tutorial') {
    return loadTutorialPool(store);
  }
  if (store.mode === 'twogen') {
    const keepIds = new Set([
      ...store.pinnedIds,
      ...store.selectedIds,
      ...(store.rematch?.anchorId ? [store.rematch.anchorId] : []),
      ...(store.mainlineId ? [store.mainlineId] : []),
    ]);
    const kept = store.roster.filter((c) => keepIds.has(c.id));
    const fillers = store.roster.filter(
      (c) => c.lifeTags.includes('gen:2') && !keepIds.has(c.id),
    );
    const pool = [...kept, ...fillers];
    return saveMatchmakerStore({
      ...store,
      pool: pool.length >= 2 ? pool : store.pool,
      selectedIds: store.selectedIds.filter((id) => pool.some((c) => c.id === id)),
      step: 'pool',
      view: 'play',
    });
  }
  const keepIds = new Set([
    ...store.pinnedIds,
    ...store.selectedIds,
    ...(store.rematch?.anchorId ? [store.rematch.anchorId] : []),
    ...(store.mainlineId ? [store.mainlineId] : []),
  ]);
  const seen = new Set<string>();
  const keptFromPool = store.pool.filter((c) => {
    if (!keepIds.has(c.id) || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  // 主线可能只在 roster
  const mainline =
    store.mainlineId && !seen.has(store.mainlineId)
      ? findPersonAnywhere(store, store.mainlineId)
      : undefined;
  const kept = mainline ? [mainline, ...keptFromPool] : keptFromPool;
  if (mainline) seen.add(mainline.id);
  const need = Math.max(0, 6 - kept.length);
  const usedNames = new Set(kept.map((c) => c.nickname));
  const fresh: MatchmakerCharacter[] = [];
  for (let i = 0; i < need; i++) {
    fresh.push(generateCharacter(Math.random, usedNames));
  }
  const nextPool = [...kept, ...fresh];
  let selectedIds = store.selectedIds.filter((id) => nextPool.some((c) => c.id === id));
  const anchorId = store.rematch?.anchorId;
  if (anchorId && nextPool.some((c) => c.id === anchorId) && !selectedIds.includes(anchorId)) {
    selectedIds = [anchorId, ...selectedIds].slice(0, 2);
  }
  return saveMatchmakerStore({
    ...store,
    mode: 'free',
    pool: nextPool,
    selectedIds,
    step: 'pool',
    view: 'play',
  });
}

export function findPersonAnywhere(
  store: MatchmakerStore,
  id: string,
): MatchmakerCharacter | undefined {
  return store.roster.find((c) => c.id === id) ?? store.pool.find((c) => c.id === id);
}

export function getLedgerEntry(
  store: MatchmakerStore,
  id: string | null | undefined,
): LedgerEntry | undefined {
  if (!id) return undefined;
  return store.ledger.find((e) => e.id === id);
}

/**
 * 换伴侣 · 覆盖重开：锁住此人，清空当前故事，回人池另选一位。
 * 旧 couple / history 直接丢弃（不写并行线）。
 */
export function startRematch(store: MatchmakerStore, anchorId: string): MatchmakerStore {
  const anchor =
    findPersonAnywhere(store, anchorId) ?? store.pool.find((c) => c.id === anchorId);
  if (!anchor) return store;
  const poolHas = store.pool.some((c) => c.id === anchorId);
  const pool = poolHas ? store.pool : [anchor, ...store.pool].slice(0, 8);
  const pinned = store.pinnedIds.includes(anchorId)
    ? store.pinnedIds
    : [...store.pinnedIds, anchorId];
  // 换伴侣默认把此人升格/稳住为主线，生辰不变才能对照「遇见另一个人」
  return saveMatchmakerStore({
    ...store,
    view: 'play',
    focusLedgerId: null,
    rematch: { anchorId },
    mainlineId: anchorId,
    roster: upsertRoster(store.roster, anchor),
    step: 'pool',
    pool,
    pinnedIds: pinned,
    selectedIds: [anchorId],
    reasonId: null,
    venueId: null,
    couple: null,
    activeEvent: null,
    lastReveal: null,
  });
}

export function leaveRematch(store: MatchmakerStore): MatchmakerStore {
  if (!store.rematch) return store;
  return saveMatchmakerStore({
    ...store,
    rematch: null,
    selectedIds: store.selectedIds.filter((id) => id !== store.rematch!.anchorId),
  });
}

/** 新故事开线后结束换伴侣态 */
export function clearRematch(store: MatchmakerStore): MatchmakerStore {
  if (!store.rematch) return store;
  return { ...store, rematch: null };
}
