/**
 * 随机生成合法出生资料 + 经历模板，再经 cast 校验
 * 职业按日主五行弱相关；口头禅按性格（日主）另生成
 */
import { createEmptyPerson } from '../life/types.ts';
import type { WuXing } from '../bazi/elements.ts';
import { castMatchmakerPerson } from './cast.ts';
import type { MatchmakerCharacter } from './characters.ts';
import { personalityQuote } from './personality-quote.ts';

export type Rng = () => number;

const PLACES = ['杭州', '苏州', '上海', '南京', '成都', '广州', '北京', '厦门', '武汉', '西安'];
const HOURS = ['08:00', '09:30', '10:00', '11:00', '13:00', '14:00', '15:30', '16:00', '18:00', '20:00'];

const NICK_F = ['阿橙', '染染', '小满', '青青', '阿禾', '书宁', '晚晚', '柚子', '阿棠', '念念', '初初'];
const NICK_M = ['木言', '阿墨', '阿川', '老松', '北野', '阿白', '小山', '阿衡', '清砚', '阿岑'];

/** 日主五行 → 宜出现的行当（线索，可与性别微调） */
const JOBS_BY_WX: Record<WuXing, string[]> = {
  木: ['花店店员', '小学老师', '话少木匠', '茶馆伙计'],
  火: ['厨师', '咖啡师', '摄影师', '染坊伙计'],
  土: ['木作师傅', '图书馆员', '护士', '书铺伙计'],
  金: ['程序员', '会计助理', '钟表店员', '裁缝'],
  水: ['茶馆姑娘', '书店店员', '渔具店伙计', '旅社前台'],
};

const JOBS_FALLBACK: string[] = Object.values(JOBS_BY_WX).flat();

const WISHES = [
  '想留在家乡慢慢过',
  '想去外地闯一闯',
  '想有个安静的小家',
  '想先把事业站稳',
  '想找个能一起吃饭的人',
  '想被认真对待，而不是被安排',
];

const SITUATIONS = [
  '刚换了工作，节奏还没稳住',
  '家里有人需要偶尔照顾',
  '合租，隐私不算多',
  '攒钱中，约会预算很实在',
  '朋友圈很小，更信当面的人',
  '上一段无疾而终，有点谨慎',
  '以前遇过限时机会，习惯先自己拿主意',
];

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]!;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function randomBirth(rng: Rng): {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthPlace: string;
} {
  const year = 1988 + Math.floor(rng() * 13);
  const month = 1 + Math.floor(rng() * 12);
  const maxD = Math.min(28, daysInMonth(year, month));
  const day = 1 + Math.floor(rng() * maxD);
  return {
    birthYear: String(year),
    birthMonth: String(month),
    birthDay: String(day),
    birthHour: pick(rng, HOURS),
    birthPlace: pick(rng, PLACES),
  };
}

export function createRng(seed?: number): Rng {
  if (seed === undefined) return Math.random;
  // 打散相邻 seed，避免 1..N 首掷几乎落在同一桶
  let s = (seed >>> 0) ^ 0x9e3779b9;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function jobForWx(wx: WuXing | '', gender: 'female' | 'male', rng: Rng): string {
  const bucket = (wx && JOBS_BY_WX[wx]) || JOBS_FALLBACK;
  let job = pick(rng, bucket);
  // 轻量性别措辞：姑娘/伙计互换，不改行当
  if (gender === 'female' && job.includes('伙计')) {
    job = job.replace('伙计', '姑娘');
  } else if (gender === 'male' && job.includes('姑娘')) {
    job = job.replace('姑娘', '伙计');
  }
  return job;
}

/** 生成一名可排盘角色；失败则重试 */
export function generateCharacter(rng: Rng = Math.random, usedNames = new Set<string>()): MatchmakerCharacter {
  for (let i = 0; i < 40; i++) {
    const gender = rng() < 0.5 ? 'female' : 'male';
    const nickPool = gender === 'female' ? NICK_F : NICK_M;
    let nickname = pick(rng, nickPool);
    if (usedNames.has(nickname)) nickname = `${nickname}${Math.floor(rng() * 90 + 10)}`;
    const birth = randomBirth(rng);
    const id = `mm-${Date.now().toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`;
    const person = createEmptyPerson({
      id,
      nickname: nickname.slice(0, 8),
      gender,
      relation: 'other',
      occupation: '',
      city: birth.birthPlace,
      ...birth,
      age: '',
      confusion: '',
      lifeTags: [],
    });
    const cast = castMatchmakerPerson(person);
    if ('error' in cast) continue;

    const job = jobForWx(cast.bazi.dayMasterWx, gender, rng);
    const ch: MatchmakerCharacter = {
      ...person,
      occupation: job,
      quote: personalityQuote(cast, rng),
      job,
      wish: pick(rng, WISHES),
      situation: pick(rng, SITUATIONS),
    };
    usedNames.add(ch.nickname);
    return ch;
  }
  throw new Error('无法生成可排盘角色，请重试刷新。');
}

export function generatePool(count = 6, rng: Rng = Math.random): MatchmakerCharacter[] {
  const used = new Set<string>();
  const out: MatchmakerCharacter[] = [];
  for (let i = 0; i < count; i++) {
    out.push(generateCharacter(rng, used));
  }
  return out;
}

/** 自创草稿：有则用，缺则系统补齐 */
export type CustomCharacterDraft = {
  nickname?: string;
  gender?: 'female' | 'male';
  /** 开局大约几岁 → 推算出生年（与 birthYear 二选一优先 birthYear） */
  age?: number;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  birthHour?: string;
  birthPlace?: string;
};

function resolveBirthYear(draft: CustomCharacterDraft, nowYear: number): number | null {
  const rawY = Number(String(draft.birthYear ?? '').trim());
  if (Number.isFinite(rawY) && rawY >= 1940 && rawY <= nowYear - 16) return Math.floor(rawY);
  const age = Number(draft.age);
  if (Number.isFinite(age) && age >= 16 && age <= 80) {
    return nowYear - Math.floor(age);
  }
  return null;
}

/**
 * 按念头自创：可只填年龄/年/地，其余补齐；也可细填到月日时。
 * 失败返回 error（生辰排不出盘时提示改一时辰）。
 */
export function generateCharacterFromDraft(
  draft: CustomCharacterDraft,
  rng: Rng = Math.random,
  usedNames = new Set<string>(),
): MatchmakerCharacter | { error: string } {
  const nowYear = new Date().getFullYear();
  const year = resolveBirthYear(draft, nowYear);
  if (year == null) {
    return { error: '先填年龄（16–80）或出生年，才好给你补齐生辰。' };
  }

  const placeHint = String(draft.birthPlace ?? '').trim().slice(0, 12);
  const nickHint = String(draft.nickname ?? '').trim().slice(0, 8);
  const genderFixed =
    draft.gender === 'female' || draft.gender === 'male' ? draft.gender : null;
  const monthFixed = Number(draft.birthMonth);
  const dayFixed = Number(draft.birthDay);
  const hourFixed = String(draft.birthHour ?? '').trim();

  for (let i = 0; i < 48; i++) {
    const gender = genderFixed ?? (rng() < 0.5 ? 'female' : 'male');
    const nickPool = gender === 'female' ? NICK_F : NICK_M;
    let nickname = nickHint || pick(rng, nickPool);
    if (usedNames.has(nickname)) {
      nickname = nickHint
        ? `${nickHint.slice(0, 6)}${Math.floor(rng() * 90 + 10)}`
        : `${nickname}${Math.floor(rng() * 90 + 10)}`;
    }

    const month =
      Number.isFinite(monthFixed) && monthFixed >= 1 && monthFixed <= 12
        ? Math.floor(monthFixed)
        : 1 + Math.floor(rng() * 12);
    const maxD = Math.min(28, daysInMonth(year, month));
    const day =
      Number.isFinite(dayFixed) && dayFixed >= 1 && dayFixed <= maxD
        ? Math.floor(dayFixed)
        : 1 + Math.floor(rng() * maxD);
    const birthHour =
      /^\d{1,2}:\d{2}$/.test(hourFixed) ? hourFixed : pick(rng, HOURS);
    const birthPlace = placeHint || pick(rng, PLACES);

    const id = `mm-custom-${Date.now().toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`;
    const person = createEmptyPerson({
      id,
      nickname: nickname.slice(0, 8),
      gender,
      relation: 'other',
      occupation: '',
      city: birthPlace,
      birthYear: String(year),
      birthMonth: String(month),
      birthDay: String(day),
      birthHour,
      birthPlace,
      age: '',
      confusion: '',
      lifeTags: ['custom'],
    });
    const cast = castMatchmakerPerson(person);
    if ('error' in cast) continue;

    const job = jobForWx(cast.bazi.dayMasterWx, gender, rng);
    const ch: MatchmakerCharacter = {
      ...person,
      occupation: job,
      quote: personalityQuote(cast, rng),
      job,
      wish: pick(rng, WISHES),
      situation: pick(rng, SITUATIONS),
    };
    usedNames.add(ch.nickname);
    return ch;
  }
  return { error: '这组生辰排不出盘，改一下时辰或月日再试。' };
}
