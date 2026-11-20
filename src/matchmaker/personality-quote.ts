/**
 * 口头禅：按日主气质生成（性格线索）
 * 要人味：像随口嘟囔，别像人生金句 / 鸡汤海报
 */
import type { WuXing } from '../bazi/elements.ts';
import type { MatchmakerCast } from './cast.ts';
import { castCharacter } from './cast.ts';
import type { MatchmakerCharacter } from './characters.ts';

export type QuoteRng = () => number;

/** 日干口头禅池 · 具体、碎、带一点口癖 */
const CATCH_BY_STEM: Record<string, string[]> = {
  甲: [
    '等我想清楚再回你，别催。',
    '先把眼前这件弄完再说。',
    '我不太会半路改主意。',
  ],
  乙: [
    '……算了，绕过去也行。',
    '你别突然大声，我听着累。',
    '慢慢说，我跟得上。',
  ],
  丙: [
    '有话就说完，憋着难受。',
    '今天状态好，多聊两句。',
    '我一高兴就容易说多。',
  ],
  丁: [
    '灯关小一点，我舒服。',
    '真心话可以，场面话就算了。',
    '你认真看我的时候，我反而会害羞。',
  ],
  戊: [
    '别空转，落地才算数。',
    '稳一点，我才敢跟着走。',
    '这事能托给你，我就放心。',
  ],
  己: [
    '小事没弄完，大事我不敢谈。',
    '我想被认真对待，不是被安排。',
    '你记得我说过的小事，我会记很久。',
  ],
  庚: [
    '含糊的事，我不爱拖。',
    '边界说清楚，大家都轻松。',
    '别绕，直接讲。',
  ],
  辛: [
    '我挑剔一点，你别介意。',
    '差一点点，我会一直想。',
    '整齐了，心里才踏实。',
  ],
  壬: [
    '今天想换条路走走。',
    '别把我框死，我会闷。',
    '过两天兴许又不这么想了。',
  ],
  癸: [
    '让我自己待一会儿。',
    '直觉不对，我先停。',
    '雨天我反而更能想事情。',
  ],
};

const CATCH_BY_WX: Record<WuXing, string[]> = {
  木: [
    '地方不对，我使不上劲。',
    '先别谈结果，我还没准备好。',
  ],
  火: [
    '你听懂了吗？我想确认一下。',
    '热得快，冷得也快，你别吓人。',
  ],
  土: [
    '信得过的人，不用天天证明。',
    '分寸在，我才敢靠近。',
  ],
  金: [
    '规矩先讲好，再一起做。',
    '快可以，别丢面子。',
  ],
  水: [
    '变一变没关系，别催我定。',
    '留点空，我才喘得上气。',
  ],
};

const FALLBACK = [
  '我还没想好怎么说。',
  '先吃饭吧，别的回头再讲。',
  '嗯……我再看看。',
  '你别太急，我跟得上。',
];

function pick<T>(rng: QuoteRng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]!;
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seedRng(seed: number): QuoteRng {
  let s = (seed >>> 0) ^ 0x9e3779b9;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** 由排盘结果生成一句口头禅 */
export function personalityQuote(cast: MatchmakerCast, rng: QuoteRng = Math.random): string {
  const stem = cast.dayStem;
  const wx = cast.bazi.dayMasterWx;
  const pool = [
    ...(CATCH_BY_STEM[stem] ?? []),
    ...(wx ? CATCH_BY_WX[wx] : []),
  ];
  if (pool.length) return pick(rng, pool);
  return pick(rng, FALLBACK);
}

/** 给角色写上稳定的性格口头禅（同 id 同句） */
export function withPersonalityQuote(ch: MatchmakerCharacter): MatchmakerCharacter {
  const cast = castCharacter(ch);
  if ('error' in cast) return ch;
  return {
    ...ch,
    quote: personalityQuote(cast, seedRng(hashId(ch.id))),
  };
}

export function withPersonalityQuotes(
  list: MatchmakerCharacter[],
): MatchmakerCharacter[] {
  return list.map(withPersonalityQuote);
}
