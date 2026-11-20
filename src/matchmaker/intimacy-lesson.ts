/**
 * 「怎么看亲密关系」第一节
 * 看盘顺序参考开源紫微资料（夫妻宫 → 主星），不抄断语库：
 * - Wolke/ziwei-doushu references/shier-gong · hunyin
 * - ziweidoushu-info/ziwei-doushu-wiki 十二宫·夫妻宫主题
 * 八字路线沿用本仓红娘线索：日柱 → 日支（夫妻宫背景）
 */
import { castCharacter } from './cast.ts';
import type { MatchmakerCharacter } from './characters.ts';
import { TUTORIAL_A_CHENG, TUTORIAL_MU_YAN } from './tutorial.ts';

export type IntimacyLessonPhase =
  | 'intro'
  | 'ziwei_ask'
  | 'ziwei_stars'
  | 'scene'
  | 'bazi_day'
  | 'bazi_branch'
  | 'practice_intro'
  | 'practice_ziwei'
  | 'done';

export type IntimacyLessonState = {
  phase: IntimacyLessonPhase;
  /** guide=阿橙带练；practice=木言自练 */
  track: 'guide' | 'practice';
  personId: string;
  wrongCount: number;
  hinted: boolean;
};

export const LESSON_GUIDE_PERSON = TUTORIAL_A_CHENG;
export const LESSON_PRACTICE_PERSON = TUTORIAL_MU_YAN;

export function createIntimacyLesson(): IntimacyLessonState {
  return {
    phase: 'intro',
    track: 'guide',
    personId: LESSON_GUIDE_PERSON.id,
    wrongCount: 0,
    hinted: false,
  };
}

export function lessonPerson(state: IntimacyLessonState): MatchmakerCharacter {
  return state.track === 'practice' ? LESSON_PRACTICE_PERSON : LESSON_GUIDE_PERSON;
}

export function isSpousePalaceName(name: string): boolean {
  const n = name.replace(/宫$/, '');
  return n === '夫妻' || name === '夫妻宫';
}

export function spouseStarsLine(ch: MatchmakerCharacter): string {
  const cast = castCharacter(ch);
  if ('error' in cast) return '这张盘暂时排不出紫微。';
  const majors = cast.spousePalace.majorNames;
  if (majors.length) {
    return `夫妻宫主星：${majors.join('、')}。先记住「宫在哪、星是谁」；脾气怎么显，回到具体吵架场景再对照。`;
  }
  return `${cast.spousePalace.line} 空宫或借对宫时，首版只要求你找对宫位；主星细则以后再练。`;
}

export function lessonSceneBlurb(ch: MatchmakerCharacter): string {
  return `${ch.nickname}和对方为「要不要改周末计划」顶了两句。看盘不是为了宣判谁对，而是留意：亲密场里谁容易先拍板、谁需要把话说开。刚才夫妻宫的主星，只是提醒你「相处气质偏哪边」——图鉴点词可查，查完回到这一步。`;
}

/** 教学题：答对才进下一步；猜剧情不走这里 */
export function gradePalaceTap(
  state: IntimacyLessonState,
  palaceName: string,
): { ok: true; next: IntimacyLessonState } | { ok: false; next: IntimacyLessonState; tip: string } {
  if (isSpousePalaceName(palaceName)) {
    return {
      ok: true,
      next: {
        ...state,
        phase: state.track === 'practice' ? 'done' : 'ziwei_stars',
        wrongCount: 0,
        hinted: false,
      },
    };
  }
  const wrongCount = state.wrongCount + 1;
  const tip =
    wrongCount >= 2
      ? '提示：看「亲密 / 一对一」相关的那一宫——名字里带「夫妻」。'
      : '还不是。想看两人怎么相处，先找管亲密关系的那一宫。';
  return {
    ok: false,
    next: { ...state, wrongCount, hinted: wrongCount >= 2 },
    tip,
  };
}

export function advanceLesson(
  state: IntimacyLessonState,
): IntimacyLessonState | null {
  const order: IntimacyLessonPhase[] = [
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
  const i = order.indexOf(state.phase);
  if (i < 0 || i >= order.length - 1) return null;
  const phase = order[i + 1]!;
  if (phase === 'practice_intro' || phase === 'practice_ziwei') {
    return {
      ...state,
      phase,
      track: 'practice',
      personId: LESSON_PRACTICE_PERSON.id,
      wrongCount: 0,
      hinted: false,
    };
  }
  return { ...state, phase, wrongCount: 0, hinted: false };
}

export function gradeBaziDayColumn(
  state: IntimacyLessonState,
  key: string,
): { ok: true; next: IntimacyLessonState } | { ok: false; next: IntimacyLessonState; tip: string } {
  if (key === 'day') {
    return { ok: true, next: { ...state, phase: 'bazi_branch', wrongCount: 0, hinted: false } };
  }
  const wrongCount = state.wrongCount + 1;
  return {
    ok: false,
    next: { ...state, wrongCount, hinted: wrongCount >= 2 },
    tip:
      wrongCount >= 2
        ? '提示：四柱里代表「我自己」的那一柱叫日柱——表头写「日」。'
        : '不是这一柱。先认出日柱（自己）。',
  };
}

export function gradeBaziBranchPick(
  state: IntimacyLessonState,
  pick: 'stem' | 'branch',
): { ok: true; next: IntimacyLessonState } | { ok: false; next: IntimacyLessonState; tip: string } {
  if (pick === 'branch') {
    return {
      ok: true,
      next: { ...state, phase: 'practice_intro', wrongCount: 0, hinted: false },
    };
  }
  const wrongCount = state.wrongCount + 1;
  return {
    ok: false,
    next: { ...state, wrongCount, hinted: wrongCount >= 2 },
    tip:
      wrongCount >= 2
        ? '提示：日柱里，下面那颗地支才是传统说的夫妻宫背景（日支）。'
        : '日干是「我」。亲密背景看日支——点地支那一侧。',
  };
}
