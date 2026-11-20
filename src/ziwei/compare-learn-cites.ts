/**
 * 首批挂载词 · 天纪短引文（人手挑选，偏定性/教法一句）
 * 出处：nihai-tianji-corpus docs + data/entries.jsonl
 * 许可：CC BY-NC-SA 4.0；原课著作权仍归权利方。
 */
import type { CompareCite } from './compare-learn.ts';

const BV = 'BV1KJsLekEfA';

export type CompareCiteEntry = CompareCite & {
  /** 图鉴查找键：宫 title / 星名 / 术语名 */
  keys: string[];
};

/**
 * 每词一条短引文。quote 控制在约一句可读长度；stamp 可回放。
 */
export const COMPARE_CITES_V1: readonly CompareCiteEntry[] = [
  {
    keys: ['命宫'],
    quote: '我们在看命宫的时候，命宫讲的是就是你本人你自己，讲的你的先天。',
    bvid: BV,
    part: 3,
    tHms: '00:12:09',
    sectionNote: '02-十二宫 · 命宫',
  },
  {
    keys: ['夫妻宫', '夫妻'],
    quote: '夫妻顾名思义就是看她的婚姻。如果是光论宫的时候，你光看夫妻宫你大错特错，一定要看福德宫。',
    bvid: BV,
    part: 3,
    tHms: '00:38:11',
    sectionNote: '02-十二宫 · 夫妻宫',
  },
  {
    keys: ['官禄宫', '官禄'],
    quote: '官星一定要进入官禄宫最好。财星要进入财帛宫最好。叫做适得其所，叫做正位。',
    bvid: BV,
    part: 5,
    tHms: '00:31:27',
    sectionNote: '02-十二宫 · 官禄宫',
  },
  {
    keys: ['福德宫', '福德'],
    quote: '祸福无门，咎由自取。咎是咎在易经里面就是悔恨后悔懊恼，都是自找的。',
    bvid: BV,
    part: 3,
    tHms: '00:38:41',
    sectionNote: '02-十二宫 · 福德宫',
  },
  {
    keys: ['财帛宫', '财帛'],
    quote: '财帛是什么，你到私人企业你自己去做生意当老板。',
    bvid: BV,
    part: 3,
    tHms: '00:15:03',
    sectionNote: '02-十二宫 · 财帛宫',
  },
  {
    keys: ['迁移宫', '迁移'],
    quote: '有的人必须要到外地经历一圈，回来以后他才会好。',
    bvid: BV,
    part: 3,
    tHms: '00:13:44',
    sectionNote: '02-十二宫 · 迁移宫',
  },
  {
    keys: ['三方四正'],
    quote: '我们斗数看的时候一定是看三方四正。',
    bvid: BV,
    part: 3,
    tHms: '00:21:59',
    sectionNote: '02-十二宫 · 三方四正与对宫借星',
  },
  {
    keys: ['大限'],
    quote: '我们有一句话叫做命好不如限好。',
    bvid: BV,
    part: 5,
    tHms: '00:32:58',
    sectionNote: '07-方法论 · 批命顺序与原则',
  },
  {
    keys: ['流年'],
    quote: '今年你的流年刚好落在财帛宫里面，代表今年你的主力在财帛上面。',
    bvid: BV,
    part: 3,
    tHms: '00:19:58',
    sectionNote: '02-十二宫 · 宫性与流年',
  },
  {
    keys: ['紫微'],
    quote: '那这颗星它是帝星，黄帝的星。它是北斗星君，它是个帝星。',
    bvid: BV,
    part: 5,
    tHms: '00:26:39',
    sectionNote: '01-主星 · 紫微 · 定性',
  },
  {
    keys: ['天府'],
    quote: '南斗星系第一颗星叫做天府星。天府星是南斗星君。它统帅南方的诸星。',
    bvid: BV,
    part: 5,
    tHms: '00:48:02',
    sectionNote: '01-主星 · 天府 · 定性',
  },
  {
    keys: ['贪狼'],
    quote: '那贪狼星呢，在人事上面呢，这个是属于桃花星，这是主桃花星。',
    bvid: BV,
    part: 7,
    tHms: '00:02:08',
    sectionNote: '01-主星 · 贪狼 · 定性',
  },
  {
    keys: ['武曲'],
    quote: '武曲星这颗星第一个它代表的是武官。第二个它也代表财星。而且它是财星的王。',
    bvid: BV,
    part: 5,
    tHms: '00:40:19',
    sectionNote: '01-主星 · 武曲 · 定性',
  },
  {
    keys: ['七杀'],
    quote: '七杀在午也是居将星，也是将星来会。',
    bvid: BV,
    part: 13,
    tHms: '00:29:16',
    sectionNote: '01-主星 · 七杀',
  },
  {
    keys: ['天机'],
    quote: '这个天机星也是属于一个官带星。天机星是属于阴星。紫微星是属于阳星。',
    bvid: BV,
    part: 5,
    tHms: '00:34:22',
    sectionNote: '01-主星 · 天机 · 定性',
  },
];

const INDEX = (() => {
  const map = new Map<string, CompareCiteEntry>();
  for (const e of COMPARE_CITES_V1) {
    for (const k of e.keys) {
      map.set(k, e);
      map.set(k.replace(/宫$/, ''), e);
    }
  }
  return map;
})();

export function findCompareCite(term: string): CompareCiteEntry | null {
  const raw = term.trim();
  if (!raw) return null;
  return (
    INDEX.get(raw) ??
    INDEX.get(raw.replace(/宫$/, '')) ??
    INDEX.get(`${raw}宫`) ??
    null
  );
}
