import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import {
  applyDetectiveAnswer,
  createDetectiveEngine,
  detectiveHonestGap,
  getDetectiveBoard,
  isObjectiveComplete,
  rankDetectiveBranches,
} from './rectify-detective-engine.ts';
import {
  appendDetectiveAnswer,
  emptyDetectiveDraft,
  rebuildDetectiveEngine,
  undoDetectiveStep,
} from './rectify-detective-draft.ts';

const base = {
  ...EMPTY_PROFILE,
  birthYear: '1970',
  birthMonth: '3',
  birthDay: '29',
  birthPlace: '北京',
};

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v);
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
});

describe('createDetectiveEngine', () => {
  it('initializes 12 branches at base score', () => {
    const state = createDetectiveEngine(base);
    expect(state).toBeTruthy();
    expect(state!.hardAllowed.size).toBe(12);
    expect(state!.scores['午']).toBe(50);
    expect(state!.profiles.length).toBe(12);
  });

  it('returns null for invalid birth date', () => {
    expect(
      createDetectiveEngine({
        ...EMPTY_PROFILE,
        birthYear: 'xxxx',
      }),
    ).toBeNull();
  });
});

describe('applyDetectiveAnswer', () => {
  it('narrows branches on objective slot pick', () => {
    let state = createDetectiveEngine(base)!;
    const res = applyDetectiveAnswer(state, 'obj-slot', 'noon');
    state = res.state;
    expect(res.clue).toBeTruthy();
    expect(res.clue!.body).toContain('正午烈日');
    const board = getDetectiveBoard(state);
    expect(board.active.every((b) => ['午', '未', '申'].includes(b))).toBe(true);
    expect(board.eliminated.length).toBeGreaterThan(0);
  });

  it('excludes night branches on day pick', () => {
    let state = createDetectiveEngine(base)!;
    ({ state } = applyDetectiveAnswer(state, 'obj-daynight', 'day'));
    const board = getDetectiveBoard(state);
    expect(board.eliminated).toEqual(expect.arrayContaining(['子', '丑', '亥']));
    expect(board.active).not.toContain('子');
  });

  it('boosts meal-time branches', () => {
    let state = createDetectiveEngine(base)!;
    ({ state } = applyDetectiveAnswer(state, 'obj-meal', 'yes'));
    const ranked = rankDetectiveBranches(state);
    const top3 = ranked.slice(0, 3).map((r) => r.branch);
    expect(top3.some((b) => ['辰', '午', '酉'].includes(b))).toBe(true);
  });

  it('ranks after personality answers', () => {
    let state = createDetectiveEngine(base)!;
    const picks: Array<[string, string]> = [
      ['obj-slot', 'unknown'],
      ['obj-daynight', 'unsure'],
      ['obj-meal', 'no'],
      ['per-weather', 'fire'],
      ['per-work', 'create'],
    ];
    for (const [q, o] of picks) {
      ({ state } = applyDetectiveAnswer(state, q, o));
    }
    const ranked = rankDetectiveBranches(state);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]!.confidencePct).toBeGreaterThan(0);
    expect(detectiveHonestGap(state).length).toBeGreaterThan(2);
  });

  it('skip option does not change scores', () => {
    let state = createDetectiveEngine(base)!;
    const before = { ...state.scores };
    ({ state } = applyDetectiveAnswer(state, 'per-work', 'skip'));
    expect(state.answers.at(-1)?.optionId).toBe('skip');
    expect(state.scores).toEqual(before);
    expect(state.clues.at(-1)?.body).toContain('跳过');
  });
});

describe('objective completion', () => {
  it('tracks objective phase progress', () => {
    let state = createDetectiveEngine(base)!;
    expect(isObjectiveComplete(state)).toBe(false);
    for (const [q, o] of [
      ['obj-slot', 'unknown'],
      ['obj-daynight', 'unsure'],
      ['obj-meal', 'no'],
    ] as const) {
      ({ state } = applyDetectiveAnswer(state, q, o));
    }
    expect(isObjectiveComplete(state)).toBe(true);
  });
});

describe('rectify-detective-draft', () => {
  it('rebuilds engine from draft answers', () => {
    const draft = emptyDetectiveDraft();
    const { state } = appendDetectiveAnswer(base, draft, 'obj-slot', 'noon');
    expect(state).toBeTruthy();
    const rebuilt = rebuildDetectiveEngine(base, {
      ...draft,
      answers: [{ questionId: 'obj-slot', optionId: 'noon' }],
    });
    const board = getDetectiveBoard(rebuilt!);
    expect(board.active.every((b) => ['午', '未', '申'].includes(b))).toBe(true);
  });

  it('undoes last objective answer', () => {
    let draft = emptyDetectiveDraft();
    draft = {
      ...draft,
      step: 'objective',
      answers: [{ questionId: 'obj-slot', optionId: 'noon' }],
    };
    draft = undoDetectiveStep(draft);
    expect(draft.answers).toHaveLength(0);
    expect(draft.step).toBe('objective');
  });

  it('undoes from script back to personality', () => {
    let draft = emptyDetectiveDraft();
    draft = {
      ...draft,
      step: 'script',
      answers: [
        { questionId: 'obj-slot', optionId: 'unknown' },
        { questionId: 'per-weather', optionId: 'fire' },
      ],
    };
    draft = undoDetectiveStep(draft);
    expect(draft.step).toBe('personality');
    expect(draft.answers.map((a) => a.questionId)).toEqual(['obj-slot']);
  });
});
