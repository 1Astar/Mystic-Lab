/**
 * 牵线后按年推演：锁事件 → 猜 → 揭晓（大运/流年/红鸾入戏）
 */
import { castCharacter } from './cast.ts';
import { findInPool, type MatchmakerCharacter } from './characters.ts';
import {
  getEvent,
  lockActualChoice,
  nextEventId,
  storyYearForEvent,
  type MatchReasonId,
  type VenueId,
} from './events.ts';
import { createRng } from './generate.ts';
import { LIFE_STAGES, pickStageYear } from './life-stages.ts';
import type { CoupleState, MatchmakerStore } from './store.ts';
import { tagsFromCasts } from './tags.ts';
import { coupleYearLuck, pickStoryStartYear } from './year-luck.ts';

export function getPairFromStore(
  store: MatchmakerStore,
): [MatchmakerCharacter, MatchmakerCharacter] | null {
  if (store.selectedIds.length !== 2) return null;
  const a = findInPool(store.pool, store.selectedIds[0]!);
  const b = findInPool(store.pool, store.selectedIds[1]!);
  if (!a || !b) return null;
  return [a, b];
}

export function buildCouple(
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  reasonId: MatchReasonId,
  venueId: VenueId,
): CoupleState | { error: string } {
  const ca = castCharacter(a);
  const cb = castCharacter(b);
  if ('error' in ca) return { error: ca.error };
  if ('error' in cb) return { error: cb.error };
  const tags = tagsFromCasts(ca, cb);
  const startYear = pickStoryStartYear(a, b);
  return {
    idA: a.id,
    idB: b.id,
    reasonId,
    venueId,
    tags: tags.tags,
    trust: 0,
    tension: 0,
    startYear,
    history: [],
  };
}

/** 开启下一事件：先写入 actualChoice，不展示 */
export function openNextEvent(store: MatchmakerStore, seed?: number): MatchmakerStore | { error: string } {
  const pair = getPairFromStore(store);
  if (!pair || !store.couple) return { error: '请先牵线一对人。' };
  const [a, b] = pair;
  const historyIds = store.couple.history.map((h) => h.eventId);
  const eventId = nextEventId(historyIds);
  if (!eventId) return { error: '这对人的故事告一段落，可以再牵一对。' };
  const def = getEvent(eventId);
  if (!def) return { error: '事件缺失。' };

  const stage = LIFE_STAGES.find((s) => s.id === eventId);
  const lastYear =
    store.couple.history.map((h) => h.year).filter((y) => y > 0).pop() ??
    store.couple.startYear;
  const storyYear = stage
    ? pickStageYear(store.couple.startYear, stage, a, b, lastYear)
    : storyYearForEvent(store.couple.startYear, eventId);
  const yearLuck = coupleYearLuck(a, b, storyYear);
  const rng = createRng(seed);
  const actualChoiceId = lockActualChoice(
    def,
    store.couple.tags,
    a,
    b,
    rng,
    store.couple.venueId,
    { yearLuck, history: store.couple.history },
  );
  const locked: MatchmakerStore = {
    ...store,
    step: def.requiresGuess ? 'guess' : 'reveal',
    activeEvent: {
      eventId,
      actualChoiceId,
      playerGuessId: null,
      revealed: false,
      storyYear,
    },
    lastReveal: null,
  };
  if (!def.requiresGuess) {
    return revealEvent(locked);
  }
  return locked;
}

export function applyGuess(store: MatchmakerStore, guessId: string): MatchmakerStore | { error: string } {
  if (!store.activeEvent || store.activeEvent.revealed) {
    return { error: '没有待猜的事件。' };
  }
  return {
    ...store,
    activeEvent: {
      ...store.activeEvent,
      playerGuessId: guessId,
    },
  };
}

export function revealEvent(store: MatchmakerStore): MatchmakerStore | { error: string } {
  const pair = getPairFromStore(store);
  if (!pair || !store.couple || !store.activeEvent) return { error: '无法揭晓。' };
  const [a, b] = pair;
  const def = getEvent(store.activeEvent.eventId);
  if (!def) return { error: '事件缺失。' };

  const ca = castCharacter(a);
  const cb = castCharacter(b);
  if ('error' in ca) return { error: ca.error };
  if ('error' in cb) return { error: cb.error };
  const tags = tagsFromCasts(ca, cb);

  const storyYear =
    store.activeEvent.storyYear ||
    storyYearForEvent(store.couple.startYear, def.id);
  const yearLuck = coupleYearLuck(a, b, storyYear);

  const helper =
    store.pool.find((p) => p.id === 'a-mo' && p.id !== a.id && p.id !== b.id) ??
    store.pool.find(
      (p) =>
        p.id !== a.id &&
        p.id !== b.id &&
        /摆桌|帮衬|帮忙/.test(`${p.quote}${p.situation}${p.job}`),
    );

  const written = def.write({
    a,
    b,
    venueId: store.couple.venueId,
    reasonId: store.couple.reasonId,
    tags,
    actualId: store.activeEvent.actualChoiceId,
    playerGuessId: store.activeEvent.playerGuessId,
    year: storyYear,
    yearLuck,
    history: store.couple.history,
    helperName: helper?.nickname,
  });

  const guessCorrect =
    store.activeEvent.playerGuessId == null
      ? null
      : store.activeEvent.playerGuessId === store.activeEvent.actualChoiceId;

  const beat = {
    eventId: def.id,
    actualChoiceId: store.activeEvent.actualChoiceId,
    playerGuessId: store.activeEvent.playerGuessId,
    kind: written.kind,
    summary: written.letterTitle,
    year: storyYear,
    reviewClues: written.reviewClues,
  };

  return {
    ...store,
    step: 'reveal',
    couple: {
      ...store.couple,
      trust: store.couple.trust + written.delta.trust,
      tension: store.couple.tension + written.delta.tension,
      history: [...store.couple.history, beat],
    },
    activeEvent: {
      ...store.activeEvent,
      revealed: true,
      storyYear,
    },
    lastReveal: {
      letterTitle: written.letterTitle,
      letterBody: written.letterBody,
      voiceA: written.voiceA,
      voiceB: written.voiceB,
      learnBullets: written.learnBullets,
      kind: written.kind,
      twistHint: written.twistHint,
      guessCorrect,
      choiceAnalyses: written.choiceAnalyses,
      actualChoiceId: store.activeEvent.actualChoiceId,
      storyYear,
      reviewClues: written.reviewClues,
    },
  };
}
