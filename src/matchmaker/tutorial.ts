/**
 * 教程关：四人固定样例（阿橙卯 × 木言酉 = 六冲教学）
 * 正式局仍用随机池；教程可反复加载，不含写死 pair|venue 结局表
 */
import { createEmptyPerson } from '../life/types.ts';
import type { MatchmakerCharacter } from './characters.ts';

function tutorialChar(
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
  },
): MatchmakerCharacter {
  const base = createEmptyPerson({
    ...partial,
    relation: 'other',
    occupation: partial.job,
    city: partial.birthPlace,
    age: '',
    confusion: '',
    lifeTags: ['tutorial'],
  });
  return {
    ...base,
    quote: partial.quote,
    job: partial.job,
    wish: partial.wish,
    situation: partial.situation,
  };
}

/** 阿橙 · 日支卯 */
export const TUTORIAL_A_CHENG = tutorialChar({
  id: 'a-cheng',
  nickname: '阿橙',
  gender: 'female',
  job: '茶馆姑娘',
  quote: '窗边那桌光线差，茶却总有人点。',
  wish: '想被认真对待，而不是被安排',
  situation: '茶馆忙季，总有人帮忙摆桌',
  birthYear: '1992',
  birthMonth: '1',
  birthDay: '4',
  birthHour: '10:00',
  birthPlace: '杭州',
});

/** 木言 · 日支酉（与阿橙六冲） */
export const TUTORIAL_MU_YAN = tutorialChar({
  id: 'mu-yan',
  nickname: '木言',
  gender: 'male',
  job: '话少木匠',
  quote: '……这桌子腿，有点歪。',
  wish: '想有个安静的小家',
  situation: '接活不多话，容易被听成挑刺',
  birthYear: '1992',
  birthMonth: '1',
  birthDay: '10',
  birthHour: '10:00',
  birthPlace: '杭州',
});

/** 阿墨 · 看走眼时「帮忙摆桌」的那位 */
export const TUTORIAL_A_MO = tutorialChar({
  id: 'a-mo',
  nickname: '阿墨',
  gender: 'male',
  job: '书铺伙计',
  quote: '忙的时候我可以帮忙摆桌。',
  wish: '想找个能一起吃饭的人',
  situation: '常去茶馆帮衬，人在旁边',
  birthYear: '1992',
  birthMonth: '1',
  birthDay: '1',
  birthHour: '14:00',
  birthPlace: '杭州',
});

/** 染染 */
export const TUTORIAL_RAN_RAN = tutorialChar({
  id: 'ran-ran',
  nickname: '染染',
  gender: 'female',
  job: '染坊姑娘',
  quote: '布浸进染缸，颜色才真正定下来。',
  wish: '想留在家乡慢慢过',
  situation: '染坊忙季与茶馆错峰',
  birthYear: '1992',
  birthMonth: '1',
  birthDay: '3',
  birthHour: '14:00',
  birthPlace: '苏州',
});

export const TUTORIAL_POOL: MatchmakerCharacter[] = [
  TUTORIAL_A_CHENG,
  TUTORIAL_MU_YAN,
  TUTORIAL_A_MO,
  TUTORIAL_RAN_RAN,
];

export const TUTORIAL_HINT =
  '建议：选阿橙 + 木言（日支卯酉相冲）→ 茶馆相亲 → 初见直接看回信；相处一年再猜「今晚会不会开口」，可点「看两人的盘」。回信由合盘标签抽出；旁观的阿墨可能入戏。';
