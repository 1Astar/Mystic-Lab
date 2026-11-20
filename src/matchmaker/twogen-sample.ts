/**
 * 两代红娘簿小样：第一代差点约成 → 各自成家 → 第二代进候选池
 */
import { createEmptyPerson } from '../life/types.ts';
import type { MatchmakerCharacter } from './characters.ts';
import { withPersonalityQuotes } from './personality-quote.ts';
import type { LedgerEntry, MatchmakerStore } from './store.ts';
import { saveMatchmakerStore } from './store.ts';

function sampleChar(
  partial: Partial<MatchmakerCharacter> & {
    id: string;
    nickname: string;
    gender: 'female' | 'male';
    quote: string;
    job: string;
    wish: string;
    situation: string;
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthHour: string;
    birthPlace: string;
    lifeTags?: string[];
  },
): MatchmakerCharacter {
  const base = createEmptyPerson({
    ...partial,
    relation: 'other',
    occupation: partial.job,
    city: partial.birthPlace,
    age: '',
    confusion: '',
    lifeTags: partial.lifeTags ?? ['twogen'],
  });
  return {
    ...base,
    quote: partial.quote,
    job: partial.job,
    wish: partial.wish,
    situation: partial.situation,
  };
}

/** 第一代 · 近失女 */
export const TG_A_WAN = sampleChar({
  id: 'tg-a-wan',
  nickname: '阿晚',
  gender: 'female',
  job: '茶馆姑娘',
  quote: '那年秋天，我差一点就开口。',
  wish: '想被认真对待，而不是被安排',
  situation: '已成家，孩子大了',
  birthYear: '1984',
  birthMonth: '3',
  birthDay: '12',
  birthHour: '10:00',
  birthPlace: '杭州',
  lifeTags: ['twogen', 'gen:1'],
});

/** 第一代 · 近失男 */
export const TG_QING_YAN = sampleChar({
  id: 'tg-qing-yan',
  nickname: '清砚',
  gender: 'male',
  job: '书铺伙计',
  quote: '忙的时候我可以帮忙摆桌。',
  wish: '想先把事业站稳',
  situation: '已成家，孩子大了',
  birthYear: '1983',
  birthMonth: '7',
  birthDay: '8',
  birthHour: '14:00',
  birthPlace: '西安',
  lifeTags: ['twogen', 'gen:1'],
});

/** 阿晚的配偶 */
export const TG_LAO_SONG = sampleChar({
  id: 'tg-lao-song',
  nickname: '老松',
  gender: 'male',
  job: '木作师傅',
  quote: '桌子稳了，人也就安了。',
  wish: '想有个安静的小家',
  situation: '和阿晚过了二十年',
  birthYear: '1982',
  birthMonth: '11',
  birthDay: '2',
  birthHour: '9:00',
  birthPlace: '杭州',
  lifeTags: ['twogen', 'gen:1'],
});

/** 清砚的配偶 */
export const TG_XIAO_MAN = sampleChar({
  id: 'tg-xiao-man',
  nickname: '小满',
  gender: 'female',
  job: '厨师',
  quote: '火候对了，别的都可以商量。',
  wish: '想被认真对待，而不是被安排',
  situation: '和清砚过了二十年',
  birthYear: '1985',
  birthMonth: '5',
  birthDay: '20',
  birthHour: '11:00',
  birthPlace: '武汉',
  lifeTags: ['twogen', 'gen:1'],
});

/** 第二代 · 阿晚×老松之子 */
export const TG_WAN_YA = sampleChar({
  id: 'tg-wan-ya',
  nickname: '晚芽',
  gender: 'male',
  job: '茶馆学徒',
  quote: '听过爸妈提起一个没成的秋天。',
  wish: '想自己选一条路',
  situation: '刚成年，第一次被人介绍',
  birthYear: '2004',
  birthMonth: '9',
  birthDay: '15',
  birthHour: '16:00',
  birthPlace: '杭州',
  lifeTags: ['twogen', 'gen:2', 'parents:tg-marriage-a'],
});

/** 第二代 · 清砚×小满之女 */
export const TG_QING_HE = sampleChar({
  id: 'tg-qing-he',
  nickname: '清禾',
  gender: 'female',
  job: '书店店员',
  quote: '家里旧信匣里，夹着一张没寄出的帖。',
  wish: '想找个能一起吃饭的人',
  situation: '刚成年，第一次进红娘簿候选',
  birthYear: '2005',
  birthMonth: '2',
  birthDay: '6',
  birthHour: '10:00',
  birthPlace: '西安',
  lifeTags: ['twogen', 'gen:2', 'parents:tg-marriage-b'],
});

/** 路人垫场 */
export const TG_FILLER_A = sampleChar({
  id: 'tg-filler-a',
  nickname: '竹青',
  gender: 'female',
  job: '染坊姑娘',
  quote: '布浸进染缸，颜色才真正定下来。',
  wish: '想留在家乡慢慢过',
  situation: '同龄人里随缘见一面',
  birthYear: '2003',
  birthMonth: '4',
  birthDay: '18',
  birthHour: '13:00',
  birthPlace: '苏州',
  lifeTags: ['twogen', 'gen:2', 'filler'],
});

export const TG_FILLER_B = sampleChar({
  id: 'tg-filler-b',
  nickname: '阿墨',
  gender: 'male',
  job: '书铺伙计',
  quote: '忙的时候我可以帮忙摆桌。',
  wish: '想去外地闯一闯',
  situation: '同龄人里随缘见一面',
  birthYear: '2004',
  birthMonth: '8',
  birthDay: '22',
  birthHour: '15:00',
  birthPlace: '南京',
  lifeTags: ['twogen', 'gen:2', 'filler'],
});

export const TWOGEN_ROSTER: MatchmakerCharacter[] = [
  TG_A_WAN,
  TG_QING_YAN,
  TG_LAO_SONG,
  TG_XIAO_MAN,
  TG_WAN_YA,
  TG_QING_HE,
  TG_FILLER_A,
  TG_FILLER_B,
];

export const TWOGEN_POOL_IDS = [
  TG_WAN_YA.id,
  TG_QING_HE.id,
  TG_FILLER_A.id,
  TG_FILLER_B.id,
] as const;

export const NEAR_MISS_ID = 'tg-near-miss';
export const MARRIAGE_A_ID = 'tg-marriage-a';
export const MARRIAGE_B_ID = 'tg-marriage-b';

export const TWOGEN_LEDGER: LedgerEntry[] = [
  {
    id: NEAR_MISS_ID,
    kind: 'near_miss',
    title: '差点约成 · 阿晚 × 清砚',
    year: 2004,
    summary: '靠近之后没有开口，秋天就过去了。',
    body: `2004年秋天。阿晚和清砚在茶馆外站了很久，谁也没有把「下次再见」说成一个具体日子。\n\n后来各自成家。红娘簿把这一页夹在近失栏：不是没缘，是差一步。\n\n二十年过去，他们的孩子晚芽、清禾都成年了——要不要再牵一根线，由你决定。`,
    idA: TG_A_WAN.id,
    idB: TG_QING_YAN.id,
  },
  {
    id: MARRIAGE_A_ID,
    kind: 'marriage',
    title: '成家 · 阿晚 × 老松',
    year: 2005,
    summary: '阿晚与老松成家，育有晚芽。',
    body: '阿晚后来遇见老松。日子稳了，家谱里添了一个名字：晚芽。',
    idA: TG_A_WAN.id,
    idB: TG_LAO_SONG.id,
    childIds: [TG_WAN_YA.id],
    relatedNearMissId: NEAR_MISS_ID,
  },
  {
    id: MARRIAGE_B_ID,
    kind: 'marriage',
    title: '成家 · 清砚 × 小满',
    year: 2005,
    summary: '清砚与小满成家，育有清禾。',
    body: '清砚后来遇见小满。书铺与灶台渐渐合成一个家，孩子叫清禾。',
    idA: TG_QING_YAN.id,
    idB: TG_XIAO_MAN.id,
    childIds: [TG_QING_HE.id],
    relatedNearMissId: NEAR_MISS_ID,
  },
];

export const TWOGEN_HINT =
  '两代小样：父辈二十年前差点约成。池里有晚芽、清禾——可牵可不牵；红娘簿可翻近失与家谱。';

export function isTwoGenLegacyPair(ids: string[]): boolean {
  const set = new Set(ids);
  return set.has(TG_WAN_YA.id) && set.has(TG_QING_HE.id);
}

export function findInRoster(
  roster: MatchmakerCharacter[],
  id: string,
): MatchmakerCharacter | undefined {
  return roster.find((c) => c.id === id);
}

/** 载入两代小样：簿册预置，人池以第二代为主 */
export function loadTwoGenSample(store: MatchmakerStore): MatchmakerStore {
  const roster = withPersonalityQuotes(
    TWOGEN_ROSTER.map((c) => ({ ...c, lifeTags: [...c.lifeTags] })),
  );
  const pool = TWOGEN_POOL_IDS.map((id) => roster.find((c) => c.id === id)!).filter(Boolean);
  return saveMatchmakerStore({
    ...store,
    version: 3,
    mode: 'twogen',
    view: 'play',
    /** 打开小样≠进入二代局；要主动点「为二代做媒」 */
    matchLens: 'open',
    step: 'pool',
    focusLedgerId: null,
    roster,
    ledger: TWOGEN_LEDGER.map((e) => ({ ...e, childIds: e.childIds ? [...e.childIds] : undefined })),
    pool,
    pinnedIds: [TG_WAN_YA.id, TG_QING_HE.id],
    selectedIds: [],
    rematch: null,
    reasonId: null,
    venueId: null,
    couple: null,
    activeEvent: null,
    lastReveal: null,
  });
}
