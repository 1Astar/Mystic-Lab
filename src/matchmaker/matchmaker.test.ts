import { beforeEach, describe, expect, it } from 'vitest';
import { createRng, generateCharacter, generatePool } from './generate.ts';
import { lockActualChoice, getEvent, nextEventId, STORY_EVENTS } from './events.ts';
import { LIFE_STAGES } from './life-stages.ts';
import { tagsFromHepan } from './tags.ts';
import { castCharacter } from './cast.ts';
import {
  applyGuess,
  buildCouple,
  openNextEvent,
  revealEvent,
} from './story.ts';
import {
  clearRematch,
  createEmptyMatchmakerStore,
  leaveRematch,
  loadMatchmakerStore,
  loadTutorialPool,
  refreshPoolKeepPinned,
  resetMatchmakerStore,
  saveMatchmakerStore,
  startRematch,
} from './store.ts';
import { buildGuessChartHint } from './hints.ts';
import { TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, TUTORIAL_POOL } from './tutorial.ts';
import {
  coupleYearLuck,
  personYearLuck,
  pickStoryStartYear,
} from './year-luck.ts';
import { liunianHasHongLuan, hongLuanBranch } from '../bazi/shensha.ts';

function mockLocalStorage(): void {
  const mem = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, String(v));
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    },
  });
}

describe('matchmaker tengod lesson', () => {
  it('点甲再点辛才展开；换盘乙见辛标七杀', async () => {
    const {
      createTengodLesson,
      advanceTengodLesson,
      gradeTapDay,
      gradeTapXin,
      gradePracticeGuess,
      explainXinVsDay,
    } = await import('./tengod-lesson.ts');
    let s = createTengodLesson();
    expect(s.kind).toBe('tengod');
    s = advanceTengodLesson(s)!;
    expect(s.phase).toBe('tap_day');
    const miss = gradeTapDay(s, '丁');
    expect(miss.ok).toBe(false);
    if (miss.ok) return;
    const day = gradeTapDay(miss.next, '甲');
    expect(day.ok).toBe(true);
    if (!day.ok) return;
    expect(day.next.phase).toBe('tap_xin');
    const xin = gradeTapXin(day.next, '辛');
    expect(xin.ok).toBe(true);
    if (!xin.ok) return;
    expect(xin.next.phase).toBe('reveal');
    expect(explainXinVsDay('甲').god).toBe('正官');
    s = advanceTengodLesson(xin.next)!;
    expect(s.phase).toBe('practice_intro');
    s = advanceTengodLesson(s)!;
    expect(s.phase).toBe('practice_guess');
    const wrong = gradePracticeGuess(s, '正官');
    expect(wrong.ok).toBe(false);
    if (wrong.ok) return;
    const hit = gradePracticeGuess(wrong.next, '七杀');
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    expect(hit.next.phase).toBe('done');
  });
});

describe('matchmaker intimacy lesson', () => {
  it('找对夫妻宫才进主星；错两次出提示', async () => {
    const {
      createIntimacyLesson,
      gradePalaceTap,
      advanceLesson,
      gradeBaziDayColumn,
      gradeBaziBranchPick,
    } = await import('./intimacy-lesson.ts');
    let s = createIntimacyLesson();
    s = advanceLesson(s)!;
    expect(s.phase).toBe('ziwei_ask');
    const miss = gradePalaceTap(s, '命宫');
    expect(miss.ok).toBe(false);
    if (miss.ok) return;
    expect(miss.next.wrongCount).toBe(1);
    const miss2 = gradePalaceTap(miss.next, '财帛宫');
    expect(miss2.ok).toBe(false);
    if (miss2.ok) return;
    expect(miss2.next.hinted).toBe(true);
    const hit = gradePalaceTap(miss2.next, '夫妻宫');
    expect(hit.ok).toBe(true);
    if (!hit.ok) return;
    expect(hit.next.phase).toBe('ziwei_stars');
    s = hit.next;
    for (const _ of ['scene', 'bazi_day'] as const) {
      s = advanceLesson(s)!;
    }
    expect(s.phase).toBe('bazi_day');
    const day = gradeBaziDayColumn(s, 'day');
    expect(day.ok).toBe(true);
    if (!day.ok) return;
    const br = gradeBaziBranchPick(day.next, 'branch');
    expect(br.ok).toBe(true);
    if (!br.ok) return;
    expect(br.next.phase).toBe('practice_intro');
  });
});

describe('matchmaker custom draft', () => {
  it('只填年龄与出生地也能补齐可排盘主线', async () => {
    const { generateCharacterFromDraft, createRng } = await import('./generate.ts');
    const ch = generateCharacterFromDraft(
      { age: 25, birthPlace: '厦门', gender: 'female', nickname: '阿禾' },
      createRng(42),
    );
    expect('error' in ch).toBe(false);
    if ('error' in ch) return;
    expect(ch.nickname).toBe('阿禾');
    expect(ch.birthPlace).toBe('厦门');
    expect(ch.gender).toBe('female');
    expect(Number(ch.birthYear)).toBe(new Date().getFullYear() - 25);
    expect(ch.birthMonth).toBeTruthy();
    expect(ch.birthDay).toBeTruthy();
    expect(ch.birthHour).toMatch(/^\d{1,2}:\d{2}$/);
    expect(ch.lifeTags).toContain('custom');
  });

  it('细填生辰后 adopt 为主线', async () => {
    const { generateCharacterFromDraft, createRng } = await import('./generate.ts');
    const { adoptCustomMainline, createEmptyMatchmakerStore, getMainlinePerson } =
      await import('./store.ts');
    mockLocalStorage();
    resetMatchmakerStore();
    const ch = generateCharacterFromDraft(
      {
        age: 28,
        birthYear: '1998',
        birthMonth: '3',
        birthDay: '12',
        birthHour: '10:00',
        birthPlace: '杭州',
        gender: 'male',
        nickname: '木言试',
      },
      createRng(7),
    );
    expect('error' in ch).toBe(false);
    if ('error' in ch) return;
    expect(ch.birthYear).toBe('1998');
    expect(ch.birthMonth).toBe('3');
    expect(ch.birthDay).toBe('12');
    expect(ch.birthHour).toBe('10:00');
    let store = createEmptyMatchmakerStore();
    store = adoptCustomMainline(store, ch);
    expect(store.mainlineId).toBe(ch.id);
    expect(getMainlinePerson(store)?.birthHour).toBe('10:00');
    expect(store.selectedIds).toEqual([ch.id]);
  });
});

describe('matchmaker generate', () => {
  it('generates castable characters with day pillars', () => {
    const rng = createRng(42);
    const pool = generatePool(4, rng);
    expect(pool).toHaveLength(4);
    for (const ch of pool) {
      const cast = castCharacter(ch);
      expect('error' in cast).toBe(false);
      if ('error' in cast) return;
      expect(cast.dayBranch.length).toBe(1);
      expect(ch.wish.length).toBeGreaterThan(2);
      expect(ch.situation.length).toBeGreaterThan(2);
    }
  });
});

describe('year luck · 红鸾 / 大运流年', () => {
  it('liunianHasHongLuan matches natal year branch table', () => {
    expect(hongLuanBranch('未')).toBe('申');
    expect(liunianHasHongLuan('未', '申')).toBe(true);
    expect(liunianHasHongLuan('未', '酉')).toBe(false);
  });

  it('personYearLuck marks 红鸾 on known year for tutorial 阿橙', () => {
    // 阿橙年支未 → 红鸾申；2016 丙申、2028 戊申
    const luck2016 = personYearLuck(TUTORIAL_A_CHENG, 2016);
    expect(luck2016).not.toBeNull();
    expect(luck2016!.hongLuan).toBe(true);
    expect(luck2016!.liunianBranch).toBe('申');
    expect(luck2016!.clues.some((c) => c.includes('红鸾'))).toBe(true);

    const luck2024 = personYearLuck(TUTORIAL_A_CHENG, 2024);
    expect(luck2024).not.toBeNull();
    expect(luck2024!.hongLuan).toBe(false);
    expect(luck2024!.dayunGanZhi.length).toBeGreaterThan(0);
  });

  it('pickStoryStartYear prefers a year with meetBoost when available', () => {
    const y = pickStoryStartYear(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN);
    const luck = coupleYearLuck(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, y);
    expect(luck).not.toBeNull();
    expect(luck!.a.age).toBeGreaterThanOrEqual(20);
    expect(luck!.b.age).toBeGreaterThanOrEqual(20);
  });

  it('红鸾年抬高 autumn-dinner 权重', () => {
    const ca = castCharacter(TUTORIAL_A_CHENG);
    const cb = castCharacter(TUTORIAL_MU_YAN);
    expect('error' in ca || 'error' in cb).toBe(false);
    if ('error' in ca || 'error' in cb) return;
    const tags = tagsFromHepan(ca.bazi, cb.bazi);
    const def = getEvent('year-meet')!;
    const luckHong = coupleYearLuck(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, 2016)!;
    expect(luckHong.meetBoost || luckHong.a.hongLuan || luckHong.b.hongLuan).toBe(true);

    let hongDinner = 0;
    let plainDinner = 0;
    const plainLuck = coupleYearLuck(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, 2024)!;
    for (let i = 1; i <= 40; i++) {
      const seed = i * 10007 + 13;
      if (
        lockActualChoice(
          def,
          tags.tags,
          TUTORIAL_A_CHENG,
          TUTORIAL_MU_YAN,
          createRng(seed),
          'cafe',
          { yearLuck: luckHong },
        ) === 'autumn-dinner'
      ) {
        hongDinner++;
      }
      if (
        lockActualChoice(
          def,
          tags.tags,
          TUTORIAL_A_CHENG,
          TUTORIAL_MU_YAN,
          createRng(seed),
          'cafe',
          { yearLuck: plainLuck },
        ) === 'autumn-dinner'
      ) {
        plainDinner++;
      }
    }
    expect(hongDinner).toBeGreaterThanOrEqual(plainDinner);
    expect(hongDinner).toBeGreaterThan(20);
  });
});

describe('matchmaker tags + event lock', () => {
  it('locking choice is independent of player guess', () => {
    const rng = createRng(7);
    const a = generateCharacter(rng);
    const b = generateCharacter(rng);
    const ca = castCharacter(a);
    const cb = castCharacter(b);
    expect('error' in ca || 'error' in cb).toBe(false);
    if ('error' in ca || 'error' in cb) return;

    const tags = tagsFromHepan(ca.bazi, cb.bazi);
    expect(tags.tags.length).toBeGreaterThan(0);

    const def = getEvent('year-meet')!;
    const actual = lockActualChoice(def, tags.tags, a, b, createRng(99), 'cafe');
    expect(def.choices.some((c) => c.id === actual)).toBe(true);
    expect(lockActualChoice(def, tags.tags, a, b, createRng(99), 'cafe')).toBe(actual);
  });

  it('tutorial pool has four fixed ids', () => {
    mockLocalStorage();
    resetMatchmakerStore();
    const store = loadTutorialPool(createEmptyMatchmakerStore());
    expect(store.mode).toBe('tutorial');
    expect(store.pool.map((p) => p.id).sort()).toEqual(
      TUTORIAL_POOL.map((p) => p.id).sort(),
    );
  });

  it('初遇回信写出多留一晚与回看三行', () => {
    mockLocalStorage();
    resetMatchmakerStore();
    let store = loadTutorialPool(createEmptyMatchmakerStore());
    const couple = buildCouple(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, 'friction-worth', 'tea-house');
    expect('error' in couple).toBe(false);
    if ('error' in couple) return;
    store = saveMatchmakerStore({
      ...store,
      selectedIds: ['a-cheng', 'mu-yan'],
      reasonId: 'friction-worth',
      venueId: 'tea-house',
      couple,
      activeEvent: {
        eventId: 'year-meet',
        actualChoiceId: 'autumn-dinner',
        playerGuessId: null,
        revealed: false,
        storyYear: couple.startYear,
      },
    });
    const revealed = revealEvent(store);
    expect('error' in revealed).toBe(false);
    if ('error' in revealed) return;
    expect(revealed.lastReveal?.letterBody).toMatch(/多留一晚|吃饭/);
    expect(revealed.lastReveal?.reviewClues?.fortune.length).toBeGreaterThan(4);
    expect(revealed.lastReveal?.reviewClues?.choiceWhy.length).toBeGreaterThan(4);
    expect(revealed.lastReveal?.reviewClues?.aftermath.length).toBeGreaterThan(4);
    expect(revealed.couple!.history[0]!.year).toBe(couple.startYear);
  });
});

describe('matchmaker story year rhythm', () => {
  beforeEach(() => {
    mockLocalStorage();
    resetMatchmakerStore();
  });

  it('九段人生轴顺序固定；初识不猜 → 靠近猜；猜不改结局', () => {
    expect(LIFE_STAGES).toHaveLength(9);
    expect(STORY_EVENTS.map((e) => e.id)).toEqual(LIFE_STAGES.map((s) => s.id));
    expect(nextEventId([])).toBe('year-meet');
    expect(nextEventId(['year-meet'])).toBe('year-closer');
    expect(nextEventId(['year-meet', 'year-closer'])).toBe('year-turn');
    expect(nextEventId(['year-meet', 'year-closer', 'year-turn'])).toBe('year-settle');
    expect(
      nextEventId(LIFE_STAGES.map((s) => s.id)),
    ).toBeNull();

    const rng = createRng(3);
    const a = generateCharacter(rng);
    const b = generateCharacter(rng);
    let store = createEmptyMatchmakerStore();
    store = saveMatchmakerStore({
      ...store,
      pool: [a, b, ...store.pool.slice(0, 4)],
      selectedIds: [a.id, b.id],
      reasonId: 'appreciate',
      venueId: 'tea-house',
    });
    const couple = buildCouple(a, b, 'appreciate', 'tea-house');
    expect('error' in couple).toBe(false);
    if ('error' in couple) return;
    expect(couple.startYear).toBeGreaterThan(1990);

    store = saveMatchmakerStore({ ...store, couple });
    const meet = openNextEvent(store, 12345);
    expect('error' in meet).toBe(false);
    if ('error' in meet) return;
    expect(meet.step).toBe('reveal');
    expect(meet.couple!.history[0]!.eventId).toBe('year-meet');
    expect(meet.lastReveal?.reviewClues).toBeTruthy();

    store = saveMatchmakerStore({ ...meet, step: 'follow' });
    const closer = openNextEvent(store, 42);
    expect('error' in closer).toBe(false);
    if ('error' in closer) return;
    expect(closer.step).toBe('guess');
    expect(closer.activeEvent?.eventId).toBe('year-closer');
    expect(closer.activeEvent!.storyYear).toBeGreaterThanOrEqual(couple.startYear);

    const locked = closer.activeEvent!.actualChoiceId;
    const guessed = applyGuess(closer, 'ask-next');
    expect('error' in guessed).toBe(false);
    if ('error' in guessed) return;
    expect(guessed.activeEvent!.actualChoiceId).toBe(locked);

    const revealedCloser = revealEvent(guessed);
    expect('error' in revealedCloser).toBe(false);
    if ('error' in revealedCloser) return;
    expect(revealedCloser.lastReveal?.choiceAnalyses?.length).toBe(3);
    expect(revealedCloser.lastReveal?.actualChoiceId).toBe(locked);

    store = saveMatchmakerStore({ ...revealedCloser, step: 'follow' });
    const turn = openNextEvent(store, 7);
    expect('error' in turn).toBe(false);
    if ('error' in turn) return;
    expect(turn.step).toBe('guess');
    expect(turn.activeEvent?.eventId).toBe('year-turn');
    expect(turn.activeEvent!.storyYear).toBeGreaterThanOrEqual(couple.startYear + 1);

    const loaded = loadMatchmakerStore();
    expect(loaded.version).toBe(3);
  });

  it('转折文案呼应初遇年份', () => {
    const ca = castCharacter(TUTORIAL_A_CHENG);
    const cb = castCharacter(TUTORIAL_MU_YAN);
    expect('error' in ca || 'error' in cb).toBe(false);
    if ('error' in ca || 'error' in cb) return;

    let store = loadTutorialPool(createEmptyMatchmakerStore());
    const couple = buildCouple(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, 'appreciate', 'cafe');
    expect('error' in couple).toBe(false);
    if ('error' in couple) return;
    const y0 = couple.startYear;
    store = saveMatchmakerStore({
      ...store,
      selectedIds: ['a-cheng', 'mu-yan'],
      reasonId: 'appreciate',
      venueId: 'cafe',
      couple: {
        ...couple,
        history: [
          {
            eventId: 'year-meet',
            actualChoiceId: 'autumn-dinner',
            playerGuessId: null,
            kind: 'continue',
            summary: '多留一晚',
            year: y0,
          },
          {
            eventId: 'year-closer',
            actualChoiceId: 'ask-next',
            playerGuessId: 'ask-next',
            kind: 'continue',
            summary: '约了下次',
            year: y0,
          },
        ],
        trust: 5,
        tension: 0,
      },
      activeEvent: {
        eventId: 'year-turn',
        actualChoiceId: 'discuss-first',
        playerGuessId: 'discuss-first',
        revealed: false,
        storyYear: y0 + 2,
      },
    });
    const revealed = revealEvent(store);
    expect('error' in revealed).toBe(false);
    if ('error' in revealed) return;
    expect(revealed.lastReveal?.letterBody).toMatch(new RegExp(String(y0)));
    expect(revealed.lastReveal?.reviewClues?.fortune).toMatch(/外地|对照|年/);
  });
});

describe('matchmaker chart hints', () => {
  it('builds two-layer hint with 比肩 term；preferId 锁定邀约方', () => {
    const ca = castCharacter(TUTORIAL_A_CHENG);
    const cb = castCharacter(TUTORIAL_MU_YAN);
    expect('error' in ca || 'error' in cb).toBe(false);
    if ('error' in ca || 'error' in cb) return;
    const hint = buildGuessChartHint(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, ca, cb, TUTORIAL_A_CHENG.id);
    expect(hint.focusPersonId).toBe(TUTORIAL_A_CHENG.id);
    expect(hint.layer1).toMatch(/高亮/);
    expect(hint.term.length).toBeGreaterThan(0);
    expect(hint.habitLine.length).toBeGreaterThan(4);
    expect(hint.layer2Body).toMatch(/比肩|日主/);
  });
});

describe('matchmaker twogen sample', () => {
  beforeEach(() => {
    mockLocalStorage();
    resetMatchmakerStore();
  });

  it('载入后簿册三条、池含晚芽清禾、家谱可链近失', async () => {
    const { loadTwoGenSample, TG_WAN_YA, TG_QING_HE, NEAR_MISS_ID, MARRIAGE_A_ID } =
      await import('./twogen-sample.ts');
    const store = loadTwoGenSample(createEmptyMatchmakerStore());
    expect(store.mode).toBe('twogen');
    expect(store.matchLens).toBe('open');
    expect(store.ledger).toHaveLength(3);
    expect(store.ledger.some((e) => e.id === NEAR_MISS_ID && e.kind === 'near_miss')).toBe(true);
    expect(store.pool.map((c) => c.id)).toEqual(
      expect.arrayContaining([TG_WAN_YA.id, TG_QING_HE.id]),
    );
    const marriageA = store.ledger.find((e) => e.id === MARRIAGE_A_ID);
    expect(marriageA?.childIds).toContain(TG_WAN_YA.id);
    expect(marriageA?.relatedNearMissId).toBe(NEAR_MISS_ID);
    expect(store.roster.length).toBeGreaterThanOrEqual(6);
  });
});

describe('matchmaker gen2 lens', () => {
  beforeEach(() => {
    mockLocalStorage();
    resetMatchmakerStore();
  });

  it('打开小样默认 open；enter 后才是 gen2 镜头', async () => {
    const { loadTwoGenSample } = await import('./twogen-sample.ts');
    const { enterGen2Matchmaking, leaveGen2Matchmaking } = await import('./store.ts');
    let store = loadTwoGenSample(createEmptyMatchmakerStore());
    expect(store.matchLens).toBe('open');
    store = enterGen2Matchmaking(store);
    expect(store.matchLens).toBe('gen2');
    expect(store.step).toBe('pool');
    store = leaveGen2Matchmaking(store);
    expect(store.matchLens).toBe('open');
  });
});

describe('matchmaker refresh keeps selected', () => {
  beforeEach(() => {
    mockLocalStorage();
    resetMatchmakerStore();
  });

  it('刷新后已选中的人仍在池里', () => {
    let store = saveMatchmakerStore({
      ...createEmptyMatchmakerStore(),
      mode: 'free',
      pool: generatePool(6, createRng(7)),
    });
    const keep = store.pool[0]!;
    store = saveMatchmakerStore({
      ...store,
      selectedIds: [keep.id],
    });
    store = refreshPoolKeepPinned(store);
    expect(store.pool.some((c) => c.id === keep.id)).toBe(true);
    expect(store.selectedIds).toEqual([keep.id]);
    expect(store.pool).toHaveLength(6);
  });
});

describe('matchmaker rematch overwrite', () => {
  beforeEach(() => {
    mockLocalStorage();
    resetMatchmakerStore();
  });

  it('换伴侣清空 couple 并锁锚点', () => {
    let store = loadTutorialPool(createEmptyMatchmakerStore());
    const couple = buildCouple(TUTORIAL_A_CHENG, TUTORIAL_MU_YAN, 'appreciate', 'tea-house');
    expect('error' in couple).toBe(false);
    if ('error' in couple) return;
    store = saveMatchmakerStore({
      ...store,
      couple,
      selectedIds: [couple.idA, couple.idB],
      step: 'follow',
    });
    store = startRematch(store, TUTORIAL_A_CHENG.id);
    expect(store.rematch?.anchorId).toBe(TUTORIAL_A_CHENG.id);
    expect(store.mainlineId).toBe(TUTORIAL_A_CHENG.id);
    expect(store.couple).toBeNull();
    expect(store.step).toBe('pool');
    expect(store.selectedIds).toEqual([TUTORIAL_A_CHENG.id]);
    expect(store.pinnedIds).toContain(TUTORIAL_A_CHENG.id);
    store = leaveRematch(store);
    expect(store.rematch).toBeNull();
    expect(clearRematch({ ...store, rematch: { anchorId: 'x' } }).rematch).toBeNull();
  });
});

describe('matchmaker mainline household', () => {
  beforeEach(() => {
    mockLocalStorage();
    resetMatchmakerStore();
  });

  it('新开局默认有完整主线人物', () => {
    const store = createEmptyMatchmakerStore();
    expect(store.mainlineId).toBeTruthy();
    const main = store.pool.find((c) => c.id === store.mainlineId);
    expect(main).toBeTruthy();
    expect(main!.birthYear).toMatch(/^\d{4}$/);
    expect(main!.birthPlace.length).toBeGreaterThan(0);
    expect(main!.job.length).toBeGreaterThan(0);
  });

  it('追这户人家升格主线并保留生辰', async () => {
    const { followHousehold, getMainlinePerson } = await import('./store.ts');
    let store = loadTutorialPool(createEmptyMatchmakerStore());
    const birth = {
      birthYear: TUTORIAL_MU_YAN.birthYear,
      birthMonth: TUTORIAL_MU_YAN.birthMonth,
      birthDay: TUTORIAL_MU_YAN.birthDay,
      birthHour: TUTORIAL_MU_YAN.birthHour,
      birthPlace: TUTORIAL_MU_YAN.birthPlace,
    };
    store = followHousehold(store, TUTORIAL_MU_YAN.id);
    expect(store.mainlineId).toBe(TUTORIAL_MU_YAN.id);
    const main = getMainlinePerson(store);
    expect(main?.nickname).toBe(TUTORIAL_MU_YAN.nickname);
    expect(main?.birthYear).toBe(birth.birthYear);
    expect(main?.birthMonth).toBe(birth.birthMonth);
    expect(main?.birthDay).toBe(birth.birthDay);
    expect(main?.birthHour).toBe(birth.birthHour);
    expect(main?.birthPlace).toBe(birth.birthPlace);
    store = refreshPoolKeepPinned(store);
    expect(store.pool.some((c) => c.id === TUTORIAL_MU_YAN.id)).toBe(true);
  });
});

describe('matchmaker person sheet', () => {
  it('八字复用命盘四柱表；紫微挂载原生盘宿主', async () => {
    const { renderPersonSheet } = await import('./person-sheet.ts');
    const bazi = renderPersonSheet(TUTORIAL_A_CHENG, 'bazi');
    expect(bazi).toMatch(/日主/);
    expect(bazi).toMatch(/bazi-grid/);
    expect(bazi).toMatch(/data-bazi-term/);
    expect(bazi).toMatch(/data-mm-chart-tab="ziwei"/);
    const ziwei = renderPersonSheet(TUTORIAL_A_CHENG, 'ziwei');
    expect(ziwei).toMatch(/data-mm-ziwei-plate/);
    expect(ziwei).toMatch(/夫妻/);
  });
});

describe('matchmaker personality quote', () => {
  it('口头禅随日主稳定，不跟职业金句', async () => {
    const { personalityQuote, withPersonalityQuote } = await import(
      './personality-quote.ts'
    );
    const { castCharacter } = await import('./cast.ts');
    const cast = castCharacter(TUTORIAL_A_CHENG);
    expect('error' in cast).toBe(false);
    if ('error' in cast) return;
    const a = personalityQuote(cast, () => 0.1);
    const b = personalityQuote(cast, () => 0.1);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(4);
    const stamped = withPersonalityQuote(TUTORIAL_A_CHENG);
    expect(stamped.quote).toBeTruthy();
    expect(stamped.quote).not.toBe(TUTORIAL_A_CHENG.quote);
  });
});
