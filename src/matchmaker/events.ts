/**
 * 相处事件题库：九段人生轴（对照 matchmaker-mvp）
 * 大运/流年/红鸾给机会加权；猜不影响结局
 */
import type { MatchmakerCharacter } from './characters.ts';
import type { RelationTag, HepanTags } from './tags.ts';
import type { Rng } from './generate.ts';
import type { CoupleYearLuck } from './year-luck.ts';
import { pickHongLuanFocus, pickTraveler } from './year-luck.ts';
import { LATE_LIFE_EVENTS } from './life-events.ts';
import { LIFE_STAGES, nextStageId } from './life-stages.ts';

export type VenueId = 'tea-house' | 'harvest' | 'cafe';

export const VENUES: { id: VenueId; title: string; blurb: string }[] = [
  {
    id: 'tea-house',
    title: '茶馆相亲',
    blurb: '你先帮她们约过一次正座。后来两次都没约上。',
  },
  {
    id: 'harvest',
    title: '暴雨前一起帮忙',
    blurb: '你牵过线，雨前帮衬的场合没成行。',
  },
  {
    id: 'cafe',
    title: '咖啡馆闲坐',
    blurb: '你介绍过，咖啡馆的约两次都黄了。',
  },
];

export type MatchReasonId = 'appreciate' | 'rhythm' | 'friction-worth';

export const MATCH_REASONS: { id: MatchReasonId; label: string }[] = [
  { id: 'appreciate', label: '容易互相欣赏' },
  { id: 'rhythm', label: '生活节奏合拍' },
  { id: 'friction-worth', label: '虽然有摩擦，但值得试试' },
];

export type ChoiceId = string;

export type EventChoice = {
  id: ChoiceId;
  label: string;
  preferTags: RelationTag[];
  preferWish?: RegExp;
};

export type ChoiceAnalysis = {
  id: ChoiceId;
  label: string;
  body: string;
};

/** 回看三行：运程机会 / 为什么这么选 / 后来影响 */
export type ReviewClues = {
  fortune: string;
  choiceWhy: string;
  aftermath: string;
};

export type StoryBeatKind = 'meet' | 'closer' | 'turn';

export type StoryEventDef = {
  id: string;
  kind: StoryBeatKind;
  /** 相对 couple.startYear 的年份偏移 */
  yearOffset: number;
  title: string;
  prompt: string;
  requiresGuess: boolean;
  scene?: (ctx: Pick<EventWriteCtx, 'a' | 'b' | 'year' | 'yearLuck' | 'venueId' | 'history'>) => string;
  choices: EventChoice[];
  analyses?: (ctx: EventWriteCtx) => ChoiceAnalysis[];
  write: (ctx: EventWriteCtx) => EventWriteResult;
};

export type HistorySnap = {
  eventId: string;
  actualChoiceId: string;
  kind: string;
  summary: string;
  year?: number;
};

export type EventWriteCtx = {
  a: MatchmakerCharacter;
  b: MatchmakerCharacter;
  venueId: VenueId;
  reasonId: MatchReasonId;
  tags: HepanTags;
  actualId: ChoiceId;
  playerGuessId: ChoiceId | null;
  year: number;
  yearLuck: CoupleYearLuck | null;
  history: HistorySnap[];
  helperName?: string;
};

export type EventWriteResult = {
  letterTitle: string;
  letterBody: string;
  voiceA: string;
  voiceB: string;
  delta: { trust: number; tension: number };
  kind: 'continue' | 'decline' | 'twist';
  learnBullets: string[];
  twistHint?: string;
  choiceAnalyses?: ChoiceAnalysis[];
  reviewClues: ReviewClues;
};

export type LockedEvent = {
  eventId: string;
  actualChoiceId: ChoiceId;
  playerGuessId: ChoiceId | null;
  revealed: boolean;
  storyYear: number;
};

function scoreChoice(
  choice: EventChoice,
  tags: RelationTag[],
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  eventId?: string,
  yearLuck?: CoupleYearLuck | null,
  history?: HistorySnap[],
): number {
  let s = 1;
  for (const t of choice.preferTags) {
    if (tags.includes(t)) s += 3;
  }
  if (choice.preferWish) {
    if (choice.preferWish.test(a.wish) || choice.preferWish.test(b.wish)) s += 2;
  }

  if (eventId === 'year-meet' && yearLuck) {
    if (choice.id === 'autumn-dinner' && yearLuck.meetBoost) s += 6;
    if (choice.id === 'autumn-dinner' && yearLuck.travelBoost) s += 4;
  }

  if (eventId === 'year-closer') {
    const metAsk = history?.some((h) => h.eventId === 'year-meet');
    if (choice.id === 'ask-next' && (tags.includes('bond') || tags.includes('warm'))) s += 2;
    if (choice.id === 'ask-next' && metAsk) s += 1;
    if (choice.id === 'cool-off' && tags.includes('friction')) s += 3;
    if (yearLuck?.meetBoost && choice.id === 'ask-next') s += 2;
  }

  if (eventId === 'year-turn') {
    const asked = history?.some(
      (h) => h.eventId === 'year-closer' && h.actualChoiceId === 'ask-next',
    );
    const cooled = history?.some(
      (h) => h.eventId === 'year-closer' && h.actualChoiceId === 'cool-off',
    );
    if (choice.id === 'discuss-first' && asked) s += 4;
    if (choice.id === 'accept-then-tell' && cooled) s += 2;
    if (choice.id === 'wait-other' && tags.includes('peer')) s += 2;
  }

  return Math.max(1, s);
}

/** 按标签+运程+前史加权抽实际选择（与玩家猜测无关） */
export function lockActualChoice(
  def: StoryEventDef,
  tags: RelationTag[],
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  rng: Rng,
  _venueId?: VenueId,
  opts?: { yearLuck?: CoupleYearLuck | null; history?: HistorySnap[] },
): ChoiceId {
  const weights = def.choices.map((c) =>
    scoreChoice(c, tags, a, b, def.id, opts?.yearLuck, opts?.history),
  );
  const total = weights.reduce((x, y) => x + y, 0);
  let r = rng() * total;
  for (let i = 0; i < def.choices.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return def.choices[i]!.id;
  }
  return def.choices[def.choices.length - 1]!.id;
}

function learnFromTags(tags: HepanTags): string[] {
  const bullets = [
    `日柱并排：${tags.dayGz[0]} × ${tags.dayGz[1]}（日支 ${tags.dayBranches[0]}、${tags.dayBranches[1]}）。`,
    tags.hepan.note,
  ];
  if (tags.hepan.dayRelation.length) {
    bullets.push(`地支关系：${tags.hepan.dayRelation.join('、')}。合冲刑害是线索，不是判决。`);
  } else {
    bullets.push('这两日支没有直接合冲刑害；故事更多来自十神与各自处境。');
  }
  return bullets;
}

function luckBullets(luck: CoupleYearLuck | null): string[] {
  if (!luck) return [];
  return [
    luck.opportunityLine,
    ...luck.a.clues.slice(0, 2).map((c) => `${luck.a.nickname}：${c}`),
    ...luck.b.clues.slice(0, 2).map((c) => `${luck.b.nickname}：${c}`),
  ];
}

function otherOf(
  self: MatchmakerCharacter,
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
): MatchmakerCharacter {
  return self.id === a.id ? b : a;
}

function venueFailLine(venueId: VenueId): string {
  const v = VENUES.find((x) => x.id === venueId);
  return v?.blurb ?? '你牵过线，前面两次都没约上。';
}

const YEAR_MEET: StoryEventDef = {
  id: 'year-meet',
  kind: 'meet',
  yearOffset: 0,
  title: '初识 · 终于见了一面',
  requiresGuess: false,
  prompt: '这一年的见面机会已经落下——成不成，看回信。',
  choices: [
    {
      id: 'autumn-dinner',
      label: '入秋多留一晚，约上吃饭',
      preferTags: ['bond', 'warm', 'care'],
    },
    {
      id: 'autumn-awkward',
      label: '见了面，气氛一般',
      preferTags: ['friction', 'duty'],
    },
  ],
  write(ctx) {
    const { a, b, venueId, actualId, tags, year, yearLuck } = ctx;
    const traveler = yearLuck ? pickTraveler(a, b, yearLuck) : a;
    const host = otherOf(traveler, a, b);
    const hong = yearLuck ? pickHongLuanFocus(a, b, yearLuck) : host;
    const fortune =
      yearLuck?.opportunityLine ??
      `${year}年：场合与你牵的线把她们送到同一张桌上。`;
    const learn = [
      ...learnFromTags(tags),
      ...luckBullets(yearLuck),
      `结合经历：${a.nickname}「${a.wish}」· ${b.nickname}「${b.wish}」。`,
    ];

    if (actualId === 'autumn-awkward') {
      return {
        kind: 'continue',
        letterTitle: '见了，还欠一点热度',
        letterBody: `${year}年。${venueFailLine(venueId)}

入秋，${traveler.nickname}到${host.nickname}的城市出差，本来第二天就走，临时多留一晚，想起你介绍过这么个人，就问要不要吃饭。

饭局有了。桌上不算冷，也不够热。${host.nickname}临走只说「路上小心」。红鸾给的是见面——至于下一顿，还没人提。`,
        voiceA:
          a.id === traveler.id
            ? `多留一晚是工作，约饭是礼貌。聊得还行，我没急着订下次。`
            : `她专程多留一晚，我心里有数。可这一顿，还没到「下次我带你」那句。`,
        voiceB:
          b.id === traveler.id
            ? `多留一晚是工作，约饭是礼貌。聊得还行，我没急着订下次。`
            : `她专程多留一晚，我心里有数。可这一顿，还没到「下次我带你」那句。`,
        delta: { trust: 1, tension: 0 },
        learnBullets: learn,
        reviewClues: {
          fortune,
          choiceWhy: `运程把人送到同一城，性格与摩擦标签让这一顿停在「认识了」而不是「再约」。`,
          aftermath: `她们已经见过面。下一题会问：谁会不会主动约下一次。`,
        },
      };
    }

    return {
      kind: 'continue',
      letterTitle: '多留一晚，才吃上这顿',
      letterBody: `${year}年。${venueFailLine(venueId)}

入秋，${traveler.nickname}到${host.nickname}的城市出差，本来第二天就走，临时多留一晚，想起你介绍过这么个人，就问${host.nickname}要不要吃饭。

${hong.nickname}这一年的流年里，红鸾给的是「认识新人的机会」；具体场合，是${traveler.nickname}改了行程。饭桌上${host.nickname}聊得挺开心，临走时说：「下次你来，我带你去另一家。」`,
      voiceA:
        a.id === host.id
          ? `我没想到她会多留一晚。话说出口才发现，自己是真想再见到她。`
          : `改行程的时候我还在犹豫。饭吃完，倒希望她那句「下次」是认真的。`,
      voiceB:
        b.id === host.id
          ? `我没想到她会多留一晚。话说出口才发现，自己是真想再见到她。`
          : `改行程的时候我还在犹豫。饭吃完，倒希望她那句「下次」是认真的。`,
      delta: { trust: 2, tension: 0 },
      learnBullets: learn,
      reviewClues: {
        fortune,
        choiceWhy: `${traveler.nickname}因走动/驿马线索改了行程；${hong.nickname}侧红鸾加权了「出现新人」——见面成了，主动权还在下一题。`,
        aftermath: `${host.nickname}留下了「下次带你去另一家」。下一题：${traveler.nickname}会不会主动约下一次。`,
      },
    };
  },
};

function closerAnalyses(ctx: EventWriteCtx): ChoiceAnalysis[] {
  const { a, b, actualId, yearLuck } = ctx;
  const traveler = yearLuck ? pickTraveler(a, b, yearLuck) : a;
  const host = otherOf(traveler, a, b);
  const happened = (id: string) => (actualId === id ? '这局发生了。' : '');
  return [
    {
      id: 'ask-next',
      label: 'A · 主动约下一次',
      body: `${happened('ask-next')}${traveler.nickname}把「下次」接住了。盘上合/照应或红鸾年里，走动的人更容易先发邀约；你也可以回看她以前怎么回应别人的邀约——本局里她选了靠近。`,
    },
    {
      id: 'wait-signal',
      label: 'B · 等对方再提',
      body: `${happened('wait-signal')}饭局有温度，可${traveler.nickname}怕太快。她等${host.nickname}把「另一家」再说一遍。不是冷淡，是把球轻轻推回去。`,
    },
    {
      id: 'cool-off',
      label: 'C · 客气收场',
      body: `${happened('cool-off')}见了面也承认「人挺好」，可节奏或摩擦让${traveler.nickname}停在礼貌。红鸾给的是机会，不是结局。`,
    },
  ];
}

const YEAR_CLOSER: StoryEventDef = {
  id: 'year-closer',
  kind: 'closer',
  yearOffset: 0,
  title: '靠近 · 谁会先约下一次',
  requiresGuess: true,
  scene: ({ a, b, year, yearLuck, history }) => {
    const traveler = yearLuck ? pickTraveler(a, b, yearLuck) : a;
    const host = otherOf(traveler, a, b);
    const meet = history.find((h) => h.eventId === 'year-meet');
    const tip =
      meet?.actualChoiceId === 'autumn-dinner'
        ? `${host.nickname}临走说过「下次你来，我带你去另一家」。`
        : `那顿饭不算差，也还没人把「下次」说死。`;
    return `${year}年秋。${traveler.nickname}多留一晚，两人才吃上这顿。

${tip}

空气里有事要发生——你猜，${traveler.nickname}会主动约下一次吗？`;
  },
  prompt: '你觉得她接下来会怎么做？（猜不改结局；可看当年大运/流年，也可回看前面怎么见面的）',
  choices: [
    {
      id: 'ask-next',
      label: 'A. 主动约下一次',
      preferTags: ['bond', 'warm', 'care'],
      preferWish: /认真|见面|陪/,
    },
    {
      id: 'wait-signal',
      label: 'B. 等对方再提「另一家」',
      preferTags: ['peer', 'duty'],
    },
    {
      id: 'cool-off',
      label: 'C. 客气收场，先不续约',
      preferTags: ['friction', 'duty'],
    },
  ],
  analyses: closerAnalyses,
  write(ctx) {
    const { a, b, actualId, tags, playerGuessId, year, yearLuck } = ctx;
    const traveler = yearLuck ? pickTraveler(a, b, yearLuck) : a;
    const host = otherOf(traveler, a, b);
    const guessNote =
      playerGuessId && playerGuessId !== actualId
        ? `\n\n（你猜的是另一条路。猜偏了也会把两人心思讲明白。）`
        : playerGuessId === actualId
          ? `\n\n（你的判断和本局实际一致。）`
          : '';
    const fortune =
      yearLuck?.opportunityLine ?? `${year}年：见面已落下，走近看性格与前史。`;
    const learn = [
      ...learnFromTags(tags),
      ...luckBullets(yearLuck),
      '红鸾给机会；会不会走近，要看谁先伸手、对方接不接。',
    ];
    const analyses = closerAnalyses(ctx);

    if (actualId === 'cool-off') {
      return {
        kind: 'decline',
        letterTitle: '见过了，先停在这里',
        letterBody: `${traveler.nickname}回城后只回了一句：「路上顺利，谢谢姐姐介绍。」没有下一顿。

${host.nickname}把那家「另一家」的店名划掉了。${guessNote}`,
        voiceA:
          a.id === traveler.id
            ? `机会有了。我现在腾不出心再靠近一步。`
            : `我等过几天。短信没来，我懂了。`,
        voiceB:
          b.id === traveler.id
            ? `机会有了。我现在腾不出心再靠近一步。`
            : `我等过几天。短信没来，我懂了。`,
        delta: { trust: 0, tension: 1 },
        learnBullets: learn,
        choiceAnalyses: analyses,
        reviewClues: {
          fortune,
          choiceWhy: `${traveler.nickname}选了礼貌收场——摩擦或处境忙压过了红鸾的「机会」。`,
          aftermath: `这对线可能淡掉。若故事还能往下走，外地工作那一题会更冷。`,
        },
      };
    }

    if (actualId === 'wait-signal') {
      return {
        kind: 'continue',
        letterTitle: '球在桌上，谁来拾',
        letterBody: `${traveler.nickname}没有立刻约。过了两周，${host.nickname}自己发来：「你下次来的日子定了吗？那家店周末常排队。」

一顿饭变成两顿，中间空了十四天。${guessNote}`,
        voiceA:
          a.id === traveler.id
            ? `我想确认她那句「下次」不是客套。`
            : `等不及了。与其假装不在意，不如我先问一句。`,
        voiceB:
          b.id === traveler.id
            ? `我想确认她那句「下次」不是客套。`
            : `等不及了。与其假装不在意，不如我先问一句。`,
        delta: { trust: 1, tension: 1 },
        learnBullets: learn,
        choiceAnalyses: analyses,
        reviewClues: {
          fortune,
          choiceWhy: `${traveler.nickname}把主动权推回；${host.nickname}后来捡起了球。`,
          aftermath: `她们有了第二次。记住：这一年谁先改过行程、谁先开口——两年后外地工作时还会对照。`,
        },
      };
    }

    return {
      kind: 'continue',
      letterTitle: '回城当晚就约了下次',
      letterBody: `${traveler.nickname}火车还没开，就问${host.nickname}：「下个月我再来三天，那家店，你带路？」

${host.nickname}回了一个地址，和一句「我提前排队」。${guessNote}`,
      voiceA:
        a.id === traveler.id
          ? `多留一晚是我改的计划。下次，我想自己约清楚。`
          : `她约得好干脆。我愿意把「另一家」变成真的。`,
      voiceB:
        b.id === traveler.id
          ? `多留一晚是我改的计划。下次，我想自己约清楚。`
          : `她约得好干脆。我愿意把「另一家」变成真的。`,
      delta: { trust: 3, tension: 0 },
      learnBullets: learn,
      choiceAnalyses: analyses,
      reviewClues: {
        fortune,
        choiceWhy: `${traveler.nickname}主动约下次——合盘偏暖或红鸾年里，「机会」被她接成了邀约。`,
        aftermath: `第二次落定。两年后若再有外地工作，你会想起：这一年是谁为谁改过计划。`,
      },
    };
  },
};

function turnAnalyses(ctx: EventWriteCtx): ChoiceAnalysis[] {
  const { a, b, actualId, history } = ctx;
  const asked = history.some(
    (h) => h.eventId === 'year-closer' && h.actualChoiceId === 'ask-next',
  );
  const happened = (id: string) => (actualId === id ? '这局发生了。' : '');
  return [
    {
      id: 'discuss-first',
      label: 'A · 先商量',
      body: `${happened('discuss-first')}一个有主见的人也可能把共同去留留给两人一起定。${asked ? `你还记得第一年她主动约过下次——这一次她同样选择先开口。` : '盘上的比肩，在这里可以用「并肩」去读。'}`,
    },
    {
      id: 'accept-then-tell',
      label: 'B · 先答应再告诉',
      body: `${happened('accept-then-tell')}${a.nickname}把接工作当成自己能做的决定，又碰上当天截止。${b.nickname}听到的却是：去留已经定了一半。`,
    },
    {
      id: 'wait-other',
      label: 'C · 都等对方开口',
      body: `${happened('wait-other')}前面若有人改过行程、有人把话咽回去，回想起来才会觉得说得通——这一次两人都没先说。`,
    },
  ];
}

const YEAR_TURN: StoryEventDef = {
  id: 'year-turn',
  kind: 'turn',
  yearOffset: 2,
  title: '转折 · 寄往外地的一封信',
  requiresGuess: true,
  scene: ({ a, b, year, history }) => {
    const meet = history.find((h) => h.eventId === 'year-meet');
    const closer = history.find((h) => h.eventId === 'year-closer');
    const y0 = meet?.year ?? year - 2;
    const whoMoved =
      closer?.actualChoiceId === 'ask-next'
        ? `还记得 ${y0} 年：有人为见面多留一晚，后来又主动约了下次。`
        : closer?.actualChoiceId === 'wait-signal'
          ? `还记得 ${y0} 年：见面靠多留一晚；下次是后来才续上的。`
          : `还记得 ${y0} 年：她们因为出差多留一晚才遇见。`;
    return `${year}年。又是一份外地工作——这一次，轮到${a.nickname}决定要不要先告诉${b.nickname}。

${whoMoved}

${b.nickname}还在盘算住处。空气里有事要发生——你猜，${a.nickname}今晚会不会、以及会怎么开口？`;
  },
  prompt: '你觉得她们接下来会怎么做？（猜不改结局；可看盘、看当年运程，也可回看初遇是谁改的计划）',
  choices: [
    {
      id: 'discuss-first',
      label: 'A. 先共同商量，再决定去留',
      preferTags: ['bond', 'care', 'warm'],
      preferWish: /家乡|小家|认真/,
    },
    {
      id: 'accept-then-tell',
      label: 'B. 一人先答应工作，之后才告诉对方',
      preferTags: ['duty', 'friction', 'peer'],
      preferWish: /外地|事业/,
    },
    {
      id: 'wait-other',
      label: 'C. 两个人都等对方先表态',
      preferTags: ['peer', 'friction'],
    },
  ],
  analyses: turnAnalyses,
  write(ctx) {
    const { a, b, actualId, tags, playerGuessId, year, yearLuck, history } = ctx;
    const meetYear = history.find((h) => h.eventId === 'year-meet')?.year ?? year - 2;
    const guessNote =
      playerGuessId && playerGuessId !== actualId
        ? `\n\n（你猜的是另一条路。猜偏了也会把两人心思讲明白。）`
        : playerGuessId === actualId
          ? `\n\n（你的判断和本局实际一致。）`
          : '';
    const fortune =
      yearLuck?.opportunityLine ??
      `${year}年：外地工作再次出现——对照 ${meetYear} 年谁为谁改过计划。`;
    const learn = [
      ...learnFromTags(tags),
      ...luckBullets(yearLuck),
      `${a.nickname}处境：${a.situation}；愿望：${a.wish}。`,
      `${b.nickname}处境：${b.situation}；愿望：${b.wish}。`,
      `前后呼应：${meetYear} 年因走动才遇见；${year} 年又是外地机会。`,
    ];
    const analyses = turnAnalyses(ctx);

    if (actualId === 'accept-then-tell') {
      return {
        kind: 'continue',
        letterTitle: '截止前应了，回家才说',
        letterBody: `${a.nickname}在截止前接受了邀约，回家才告诉${b.nickname}。

${b.nickname}听完只问了一句：「${meetYear}年你多留一晚的时候，还会先问我要不要吃饭。这次截止前，你怎么没问？」${guessNote}`,
        voiceA: `我把机会当成自己能先定的事——今天截止。我以为晚上告诉你，仍算商量。`,
        voiceB: `你当年能为见面改行程。这次去留，我却是被告知的那一个。`,
        delta: { trust: -2, tension: 3 },
        learnBullets: learn,
        choiceAnalyses: analyses,
        reviewClues: {
          fortune,
          choiceWhy: `${a.nickname}先拍板——官杀/事业压力或「有主见」读成了先斩后奏。`,
          aftermath: `${b.nickname}拿初遇对照：谁为谁改过计划，成了心结的尺子。`,
        },
      };
    }

    if (actualId === 'wait-other') {
      return {
        kind: 'continue',
        letterTitle: '都在等，机会自己走了',
        letterBody: `邀请的截止日期到了。

${a.nickname}等${b.nickname}先说「去」或「留」；${b.nickname}也在等一句「你想我怎样」。谁都没先开口，工作黄了，晚饭却更安静。

你想起 ${meetYear} 年：那一次，总有人先改了行程。${guessNote}`,
        voiceA: `我怕一开口就像逼人选择。`,
        voiceB: `我怕一开口就像不支持你。`,
        delta: { trust: -1, tension: 2 },
        learnBullets: learn,
        choiceAnalyses: analyses,
        reviewClues: {
          fortune,
          choiceWhy: '两人都把开口权推给对方——比肩可并肩，也可互相等。',
          aftermath: '机会没了。对照初遇：当年总有人先动一步，这一年谁都没动。',
        },
      };
    }

    return {
      kind: 'continue',
      letterTitle: '地图摊在桌上',
      letterBody: `她们把工作邀请打印出来，压在茶杯边。

${a.nickname}说：「${meetYear}年你为我多留过一晚。这次我想先问你怕什么，再问我们还剩什么选项。」

不一定留下，也不一定走——但没有人替对方做决定。${guessNote}`,
      voiceA: `我想被问到，而不是被通知。`,
      voiceB: `我想一起想，哪怕最后答案不好听。`,
      delta: { trust: 2, tension: 1 },
      learnBullets: learn,
      choiceAnalyses: analyses,
      reviewClues: {
        fortune,
        choiceWhy: `${a.nickname}选择先商量——把初遇里「改计划」的主动，换成这一次的并肩开口。`,
        aftermath: '去留未定，但关系过了一道坎：重要决定不再单方面落地。',
      },
    };
  },
};

export const STORY_EVENTS: StoryEventDef[] = [
  YEAR_MEET,
  YEAR_CLOSER,
  YEAR_TURN,
  ...LATE_LIFE_EVENTS,
];

export function getEvent(id: string): StoryEventDef | undefined {
  return STORY_EVENTS.find((e) => e.id === id);
}

export function nextEventId(historyIds: string[]): string | null {
  return nextStageId(historyIds);
}

/** 回退用：固定偏移；正式取年见 story.ts → pickStageYear */
export function storyYearForEvent(startYear: number, eventId: string): number {
  const stage = LIFE_STAGES.find((s) => s.id === eventId);
  if (stage) return startYear + stage.yearFrom;
  const def = getEvent(eventId);
  return startYear + (def?.yearOffset ?? 0);
}
