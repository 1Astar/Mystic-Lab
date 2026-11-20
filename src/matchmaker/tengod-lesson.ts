/**
 * 八字第一节：十神从哪来
 * 「为什么这个辛被标成正官？」——先认日干，再认见干，标签相对日主。
 * 图鉴讲「正官是什么」；本课讲「标签从哪算出来、换日主会不会变」。
 */
import { stemTenGod } from '../bazi/cast.ts';
import { TEN_GOD_PLAIN } from '../bazi/learn-steps.ts';
import { createEmptyPerson } from '../life/types.ts';
import type { MatchmakerCharacter } from './characters.ts';

export type TengodLessonPhase =
  | 'intro'
  | 'tap_day'
  | 'tap_xin'
  | 'reveal'
  | 'practice_intro'
  | 'practice_guess'
  | 'done';

export type TengodLessonState = {
  kind: 'tengod';
  phase: TengodLessonPhase;
  wrongCount: number;
  hinted: boolean;
  /** practice 猜选了哪个十神名 */
  practicePick: string | null;
};

function lessonChar(
  partial: Partial<MatchmakerCharacter> & {
    id: string;
    nickname: string;
    gender: 'female' | 'male';
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthHour: string;
    birthPlace: string;
    quote: string;
    job: string;
    wish: string;
    situation: string;
  },
): MatchmakerCharacter {
  const base = createEmptyPerson({
    ...partial,
    relation: 'other',
    occupation: partial.job,
    city: partial.birthPlace,
    age: '',
    confusion: '',
    lifeTags: ['lesson', 'tengod'],
  });
  return {
    ...base,
    quote: partial.quote,
    job: partial.job,
    wish: partial.wish,
    situation: partial.situation,
  };
}

/** 带练：甲日主，时干辛 → 正官 */
export const TENGOD_GUIDE = lessonChar({
  id: 'lesson-jia-xin',
  nickname: '甲辛样',
  gender: 'female',
  birthYear: '1988',
  birthMonth: '1',
  birthDay: '10',
  birthHour: '14:00',
  birthPlace: '杭州',
  job: '书铺伙计',
  quote: '先认日干，再认盘上的字。',
  wish: '想看懂标签从哪来',
  situation: '教学盘 · 日主甲 · 时干见辛',
});

/** 自练：乙日主，时干仍有辛 → 七杀（标签变了） */
export const TENGOD_PRACTICE = lessonChar({
  id: 'lesson-yi-xin',
  nickname: '乙辛样',
  gender: 'male',
  birthYear: '1988',
  birthMonth: '1',
  birthDay: '1',
  birthHour: '10:00',
  birthPlace: '杭州',
  job: '茶馆伙计',
  quote: '同一颗辛，日干一换，标签就换。',
  wish: '想自己判断会不会变',
  situation: '教学盘 · 日主乙 · 时干见辛',
});

export const TENGOD_TARGET_STEM = '辛';
export const TENGOD_GUIDE_DAY = '甲';
export const TENGOD_PRACTICE_DAY = '乙';

export function createTengodLesson(): TengodLessonState {
  return {
    kind: 'tengod',
    phase: 'intro',
    wrongCount: 0,
    hinted: false,
    practicePick: null,
  };
}

export function tengodLessonPerson(
  state: TengodLessonState,
): MatchmakerCharacter {
  return state.phase === 'practice_intro' ||
    state.phase === 'practice_guess' ||
    state.phase === 'done'
    ? TENGOD_PRACTICE
    : TENGOD_GUIDE;
}

export function explainXinVsDay(dayStem: string): {
  god: string;
  plain: string;
  lines: string[];
} {
  const god = stemTenGod(dayStem, TENGOD_TARGET_STEM);
  const plain = TEN_GOD_PLAIN[god] || god;
  return {
    god,
    plain,
    lines: [
      `日干是「${dayStem}」——盘上的自己。`,
      `盘上出现「${TENGOD_TARGET_STEM}」，不先叫它正官/七杀，先问：相对日干是什么关系？`,
      `用日干「${dayStem}」去认「${TENGOD_TARGET_STEM}」→ 十神标成「${god}」（${plain}）。`,
      '所以标签不是辛自己身上写死的，是「相对日主」算出来的。',
    ],
  };
}

export function advanceTengodLesson(
  state: TengodLessonState,
): TengodLessonState | null {
  const order: TengodLessonPhase[] = [
    'intro',
    'tap_day',
    'tap_xin',
    'reveal',
    'practice_intro',
    'practice_guess',
    'done',
  ];
  const i = order.indexOf(state.phase);
  if (i < 0 || i >= order.length - 1) return null;
  return {
    ...state,
    phase: order[i + 1]!,
    wrongCount: 0,
    hinted: false,
    practicePick: null,
  };
}

export function gradeTapDay(
  state: TengodLessonState,
  stem: string,
): { ok: true; next: TengodLessonState } | { ok: false; next: TengodLessonState; tip: string } {
  if (stem === TENGOD_GUIDE_DAY) {
    return {
      ok: true,
      next: { ...state, phase: 'tap_xin', wrongCount: 0, hinted: false },
    };
  }
  const wrongCount = state.wrongCount + 1;
  return {
    ok: false,
    next: { ...state, wrongCount, hinted: wrongCount >= 2 },
    tip:
      wrongCount >= 2
        ? '提示：日柱天干那一格——表头「日」下面的天干，这盘是「甲」。'
        : '先点日干（自己）。不是这一颗。',
  };
}

export function gradeTapXin(
  state: TengodLessonState,
  stem: string,
): { ok: true; next: TengodLessonState } | { ok: false; next: TengodLessonState; tip: string } {
  if (stem === TENGOD_TARGET_STEM) {
    return {
      ok: true,
      next: { ...state, phase: 'reveal', wrongCount: 0, hinted: false },
    };
  }
  const wrongCount = state.wrongCount + 1;
  return {
    ok: false,
    next: { ...state, wrongCount, hinted: wrongCount >= 2 },
    tip:
      wrongCount >= 2
        ? '提示：找天干「辛」——这盘在时柱天干。'
        : '再找盘上的「辛」。点到辛，才好展开它为什么被标成正官。',
  };
}

/** 自练：这张盘上辛相对乙日主是七杀，不是正官 */
export function gradePracticeGuess(
  state: TengodLessonState,
  pick: string,
): { ok: true; next: TengodLessonState } | { ok: false; next: TengodLessonState; tip: string } {
  const correct = stemTenGod(TENGOD_PRACTICE_DAY, TENGOD_TARGET_STEM);
  if (pick === correct) {
    return {
      ok: true,
      next: {
        ...state,
        phase: 'done',
        practicePick: pick,
        wrongCount: 0,
        hinted: false,
      },
    };
  }
  const wrongCount = state.wrongCount + 1;
  const stillZhengguan = pick === '正官';
  return {
    ok: false,
    next: { ...state, wrongCount, hinted: wrongCount >= 2, practicePick: pick },
    tip: stillZhengguan
      ? wrongCount >= 2
        ? '提示：日干已换成「乙」。乙见辛 → 七杀，不是正官。标签会变。'
        : '还当正官？日干已经不是甲了——重新用日干去认辛。'
      : wrongCount >= 2
        ? `提示：乙日主见辛 →「${correct}」。`
        : '不对。用这张盘的日干再认一次辛。',
  };
}

export function practiceOptions(): string[] {
  return ['正官', '七杀', '正财', '比肩'];
}
