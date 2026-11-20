/**
 * 成家 → 一生：固定骨架，场景与选择由合盘标签 + 运程线索加权
 */
import type {
  ChoiceAnalysis,
  EventWriteCtx,
  EventWriteResult,
  ReviewClues,
  StoryEventDef,
} from './events.ts';
import { pickTraveler } from './year-luck.ts';

function guessNote(ctx: EventWriteCtx): string {
  const { playerGuessId, actualId } = ctx;
  if (!playerGuessId) return '';
  if (playerGuessId === actualId) return `\n\n（你的判断和本局实际一致。）`;
  return `\n\n（你猜的是另一条路。猜偏了也会把两人心思讲明白。）`;
}

function together(ctx: EventWriteCtx): boolean {
  const cooled = ctx.history.some(
    (h) => h.eventId === 'year-closer' && h.actualChoiceId === 'cool-off',
  );
  const split = ctx.history.some(
    (h) => h.eventId === 'year-commitment' && h.actualChoiceId === 'go-apart',
  );
  if (split) return false;
  if (cooled && ctx.history.filter((h) => h.kind === 'continue').length < 2) return false;
  // trust 在 write 时尚未加本局 delta；用历史长度粗判
  return ctx.history.some((h) => h.eventId === 'year-settle' || h.eventId === 'year-closer');
}

function baseReview(
  fortune: string,
  choiceWhy: string,
  aftermath: string,
): ReviewClues {
  return { fortune, choiceWhy, aftermath };
}

function analysesOf(
  items: Array<{ id: string; label: string; body: string }>,
  actualId: string,
): ChoiceAnalysis[] {
  return items.map((x) => ({
    ...x,
    body: (actualId === x.id ? '这局发生了。' : '') + x.body,
  }));
}

function resultShell(
  ctx: EventWriteCtx,
  partial: Omit<EventWriteResult, 'learnBullets' | 'reviewClues'> & {
    reviewClues: ReviewClues;
    extraLearn?: string[];
  },
): EventWriteResult {
  const fortune =
    ctx.yearLuck?.opportunityLine ?? `${ctx.year}年：运程与前史一起把这件事推上台面。`;
  return {
    ...partial,
    learnBullets: [
      fortune,
      `${ctx.a.nickname}：${ctx.a.situation} / ${ctx.a.wish}`,
      `${ctx.b.nickname}：${ctx.b.situation} / ${ctx.b.wish}`,
      ...(partial.extraLearn ?? []),
    ],
  };
}

export const YEAR_SETTLE: StoryEventDef = {
  id: 'year-settle',
  kind: 'turn',
  yearOffset: 4,
  title: '成家 · 要不要把日子定下来',
  requiresGuess: true,
  scene: ({ a, b, year, history }) => {
    const turn = history.find((h) => h.eventId === 'year-turn');
    const tip = turn
      ? `还记得 ${turn.year ?? year - 2} 年那次去留——后面几年，她们各自把想要的生活写过一遍。`
      : '牵线已经过了几年。';
    return `${year}年。${tip}

${a.nickname}和${b.nickname}各自写下了接下来想要的生活。空气里有事要发生。`;
  },
  prompt: '你觉得她们会走向哪一种「成家」？（猜不改结局）',
  choices: [
    {
      id: 'marry',
      label: 'A. 结婚，成了一家人',
      preferTags: ['bond', 'care', 'warm'],
      preferWish: /小家|认真|家乡/,
    },
    {
      id: 'partner',
      label: 'B. 两地之间，仍有一盏灯',
      preferTags: ['peer', 'duty'],
      preferWish: /外地|事业/,
    },
    {
      id: 'separate',
      label: 'C. 到这里，各自往前走',
      preferTags: ['friction', 'duty'],
    },
  ],
  analyses: (ctx) =>
    analysesOf(
      [
        {
          id: 'marry',
          label: 'A · 结婚',
          body: '信任与照应够厚时，更愿意把住哪里、遇事怎么商量一件件说完。',
        },
        {
          id: 'partner',
          label: 'B · 仍在一起',
          body: '去留谈过以后，也可能把未来留着慢慢谈，学会说清什么时候会回来。',
        },
        {
          id: 'separate',
          label: 'C · 各自往前',
          body: '若前面摩擦多、或有人先拍板伤了信任，道别也可能是认真的安排。',
        },
      ],
      ctx.actualId,
    ),
  write(ctx) {
    const { a, b, actualId, year, yearLuck } = ctx;
    const note = guessNote(ctx);
    const fortune = yearLuck?.opportunityLine ?? `${year}年`;
    if (actualId === 'separate') {
      return resultShell(ctx, {
        kind: 'decline',
        letterTitle: '到这里，各自往前走',
        letterBody: `那场关于去留的谈话过后，两人慢慢有了各自的生活。${b.nickname}搬家前问了${a.nickname}要不要来挑几本书。离开时，都说下次碰上了还可以打招呼。${note}`,
        voiceA: `有些话当年没说完。现在说完了，也松了一口气。`,
        voiceB: `我把想要的日子写清楚了。不在同一页，也可以好好收场。`,
        delta: { trust: -1, tension: 1 },
        choiceAnalyses: YEAR_SETTLE.analyses?.(ctx),
        reviewClues: baseReview(
          fortune,
          '信任或节奏对不上——成家这一步停在道别。',
          '后面「成家后 / 边界」会走各自生活的旁支。',
        ),
      });
    }
    if (actualId === 'partner') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '两地之间，仍有一盏灯',
        letterBody: `${a.nickname}还把${b.nickname}的来访日期圈在日历上。两人把未来留着慢慢谈，也已经学会说清楚自己什么时候会回来。${note}`,
        voiceA: `我不急着盖章。我想确定我们还会为对方改行程。`,
        voiceB: `灯还亮着。灯亮着，就还有下一站。`,
        delta: { trust: 1, tension: 1 },
        choiceAnalyses: YEAR_SETTLE.analyses?.(ctx),
        reviewClues: baseReview(
          fortune,
          '愿意见面，但还没把共同生活一次定死。',
          '成家后会继续谈住处与边界。',
        ),
      });
    }
    return resultShell(ctx, {
      kind: 'continue',
      letterTitle: '结婚，成了一家人',
      letterBody: `${a.nickname}翻出了当年第一次见面留下的东西。两个人这次把住哪里、遇事怎么商量，一件一件说完，才选了结婚的日子。${note}`,
      voiceA: `我想把日子定下来——不是因为怕，是因为想认真。`,
      voiceB: `说完那些琐碎的约定，我才觉得安心。`,
      delta: { trust: 3, tension: 0 },
      choiceAnalyses: YEAR_SETTLE.analyses?.(ctx),
      reviewClues: baseReview(fortune, '信任与照应把「成家」落成婚约。', '下一阶段：一起布置生活。'),
    });
  },
};

export const YEAR_HOUSEHOLD: StoryEventDef = {
  id: 'year-household',
  kind: 'turn',
  yearOffset: 6,
  title: '成家后 · 日子怎么过',
  requiresGuess: true,
  scene: ({ a, b, year }) =>
    `${year}年。生活慢慢稳定下来。${a.nickname}和${b.nickname}需要决定，下一段日子要住在哪里、账怎么算。`,
  prompt: '共同生活会怎样安排？',
  choices: [
    {
      id: 'share-home',
      label: 'A. 把住处和开支一起定下来',
      preferTags: ['bond', 'care'],
    },
    {
      id: 'two-keys',
      label: 'B. 各留一处落脚点',
      preferTags: ['peer', 'duty'],
      preferWish: /外地/,
    },
    {
      id: 'one-decides',
      label: 'C. 一人先布置，再请对方来看',
      preferTags: ['duty', 'friction', 'peer'],
    },
  ],
  analyses: (ctx) =>
    analysesOf(
      [
        { id: 'share-home', label: 'A · 一起定', body: '愿意共担的人会先问对方怎样生活才舒服。' },
        { id: 'two-keys', label: 'B · 两处钥匙', body: '对住处有不同需要时，多留一点空间也可以是认真的安排。' },
        { id: 'one-decides', label: 'C · 先做出来', body: '擅长行动的人可能先做出来，另一位会在意有没有自己的位置。' },
      ],
      ctx.actualId,
    ),
  write(ctx) {
    const { a, b, actualId, yearLuck, history } = ctx;
    const note = guessNote(ctx);
    const fortune = yearLuck?.opportunityLine ?? `${ctx.year}年`;
    const settledApart = history.some(
      (h) => h.eventId === 'year-settle' && h.actualChoiceId === 'separate',
    );
    if (settledApart || !together(ctx)) {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '把日子重新布置好',
        letterBody: `从上次道别起，两边的日历慢慢有了不同的安排。${a.nickname}终于把拖了很久的一件事做成了。${b.nickname}也有了能安心吃晚饭的地方。${note}`,
        voiceA: `各自安顿，也是一种收场。`,
        voiceB: `我把屋子收拾好了。偶尔还会想起她喜欢的那盏灯。`,
        delta: { trust: 0, tension: 0 },
        choiceAnalyses: YEAR_HOUSEHOLD.analyses?.(ctx),
        reviewClues: baseReview(fortune, '已经不在一起，这一段是各自生活的旁支。', '边界与危机仍会以「各自」口径出现。'),
      });
    }
    if (actualId === 'one-decides') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '先订了家具',
        letterBody: `${a.nickname}先订了家具。${b.nickname}看着只有一张椅子的桌子，说：「我还以为我们会一起挑。」两人第一次认真谈起家里的决定由谁来做。${note}`,
        voiceA: `我想把家先搭起来。`,
        voiceB: `搭起来的时候，有没有留我的位置？`,
        delta: { trust: -1, tension: 2 },
        choiceAnalyses: YEAR_HOUSEHOLD.analyses?.(ctx),
        reviewClues: baseReview(fortune, '有人先行动——另一位感到缺席。', '边界题会更敏感。'),
      });
    }
    if (actualId === 'two-keys') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '各留一把钥匙',
        letterBody: `两个人各留了一把自己的钥匙，也互相留了一把。头几个月只约固定的两天，后来慢慢找到节奏。${note}`,
        voiceA: `我想要空间，也想要回来的门。`,
        voiceB: `两把钥匙，是信任，也是练习。`,
        delta: { trust: 1, tension: 1 },
        choiceAnalyses: YEAR_HOUSEHOLD.analyses?.(ctx),
        reviewClues: baseReview(fortune, '用空间换长期相处。', '边界来时，钥匙会成为对照。'),
      });
    }
    return resultShell(ctx, {
      kind: 'continue',
      letterTitle: '一起算了账',
      letterBody: `两人各带一件最舍不得的东西进门。搬完一起算了账，给周末留了一小笔共同预算。${note}`,
      voiceA: `共同预算听起来小，其实很大。`,
      voiceB: `我愿意把日子摊开算。`,
      delta: { trust: 2, tension: 0 },
      choiceAnalyses: YEAR_HOUSEHOLD.analyses?.(ctx),
      reviewClues: baseReview(fortune, '共担把「成家后」落到实处。', '后面遇外界好感时，更可能明说边界。'),
    });
  },
};

export const YEAR_BOUNDARY: StoryEventDef = {
  id: 'year-boundary',
  kind: 'turn',
  yearOffset: 9,
  title: '边界 · 一条深夜收到的消息',
  requiresGuess: true,
  scene: ({ a, b, year, yearLuck }) => {
    const focus = yearLuck ? pickTraveler(a, b, yearLuck) : a;
    const setting = yearLuck?.travelBoost
      ? '一次出差'
      : yearLuck?.meetBoost
        ? '一场朋友聚会'
        : '一个共事很久的项目';
    return `${year}年。${setting}让${focus.nickname}认识了一个总能接住话题的人。对方发来消息，想绕开原来的朋友圈单独见见。

你猜，${focus.nickname}会怎么回？`;
  },
  prompt: '边界来了，她会怎么做？',
  choices: [
    {
      id: 'tell-partner',
      label: 'A. 把界限说清楚，与伴侣聊',
      preferTags: ['bond', 'care', 'duty'],
    },
    {
      id: 'keep-private',
      label: 'B. 把往来留在私人聊天里',
      preferTags: ['peer', 'friction'],
    },
    {
      id: 'cross-line',
      label: 'C. 赴约后才承认越过约定',
      preferTags: ['friction', 'peer'],
      preferWish: /外地|闯/,
    },
  ],
  analyses: (ctx) =>
    analysesOf(
      [
        { id: 'tell-partner', label: 'A · 明说', body: '习惯明说边界的人，更容易把事情放到两个人能商量的地方。' },
        { id: 'keep-private', label: 'B · 含糊', body: '想留住被理解的感觉、又怕谈开的人，可能会让模糊持续更久。' },
        { id: 'cross-line', label: 'C · 越界', body: '外部好感、长期未解决的疏远和含糊处理界限，叠在一起会改变这一局里的选择。' },
      ],
      ctx.actualId,
    ),
  write(ctx) {
    const { a, b, actualId, yearLuck, history } = ctx;
    const focus = yearLuck ? pickTraveler(a, b, yearLuck) : a;
    const partner = focus.id === a.id ? b : a;
    const note = guessNote(ctx);
    const fortune = yearLuck?.opportunityLine ?? `${ctx.year}年`;
    const apart = history.some(
      (h) => h.eventId === 'year-settle' && h.actualChoiceId === 'separate',
    );
    if (apart) {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '生活里来了新面孔',
        letterBody: `${focus.nickname}聊到打烊，还有好几个话题没聊完。对下一次见面有了期待。${partner.nickname}也在原来的日子之外，慢慢养成了自己的新习惯。${note}`,
        voiceA: `新的人出现时，旧的故事已经翻过页了。`,
        voiceB: `我也有了新的晚饭搭子。偶尔还会想起她。`,
        delta: { trust: 0, tension: 0 },
        choiceAnalyses: YEAR_BOUNDARY.analyses?.(ctx),
        reviewClues: baseReview(fortune, '不在一起时，边界题变成各自的新相遇。', '危机将以各自扛关出现。'),
      });
    }
    if (actualId === 'cross-line') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '赴了第二次单独的约',
        letterBody: `${focus.nickname}赴了第二次单独的约，把原先说好的界限往后挪了。后来事情讲开，${partner.nickname}把预订好的周末行程取消了。${note}`,
        voiceA: focus.id === a.id ? `我以为自己还能收住。` : `我需要先弄明白，还愿不愿意一起走。`,
        voiceB: focus.id === b.id ? `我以为自己还能收住。` : `我需要先弄明白，还愿不愿意一起走。`,
        delta: { trust: -3, tension: 4 },
        choiceAnalyses: YEAR_BOUNDARY.analyses?.(ctx),
        reviewClues: baseReview(fortune, '越界把信任凿开了一道缝。', '危机来时旧事更容易一起翻出来。'),
      });
    }
    if (actualId === 'keep-private') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '消息仍然会回',
        letterBody: `${focus.nickname}把对话移出了常用列表，消息仍然会回。${partner.nickname}两次提起最近难得好好讲话，这件事始终没有说开。${note}`,
        voiceA: `我说不出口，也不想骗。`,
        voiceB: `有什么事，我感觉到了，但抓不住。`,
        delta: { trust: -1, tension: 2 },
        choiceAnalyses: YEAR_BOUNDARY.analyses?.(ctx),
        reviewClues: baseReview(fortune, '含糊让边界悬着。', '危机时这层雾会加重。'),
      });
    }
    return resultShell(ctx, {
      kind: 'continue',
      letterTitle: '回绝了私下见面',
      letterBody: `${focus.nickname}回绝了私下见面的邀请。回到家才对${partner.nickname}说，这两个月一直很想有时间好好说说话。两人把周末重新留了半天出来。${note}`,
      voiceA: `界限说清楚，我反而轻松。`,
      voiceB: `她愿意说，我就愿意听。`,
      delta: { trust: 2, tension: 0 },
      choiceAnalyses: YEAR_BOUNDARY.analyses?.(ctx),
      reviewClues: baseReview(fortune, '明说边界，把机会还给关系。', '危机时更可能一起摊开困难。'),
    });
  },
};

export const YEAR_CRISIS: StoryEventDef = {
  id: 'year-crisis',
  kind: 'turn',
  yearOffset: 12,
  title: '危机 · 计划之外的一年',
  requiresGuess: true,
  scene: ({ a, b, year }) =>
    `${year}年。一处收入突然中断，原来的分工已经撑不住了。${a.nickname}和${b.nickname}需要重新决定怎么过这一阵。`,
  prompt: '危机来了，她们先做哪件事？',
  choices: [
    {
      id: 'share-load',
      label: 'A. 把实际困难摊开，约好分担',
      preferTags: ['bond', 'care', 'warm'],
    },
    {
      id: 'one-carries',
      label: 'B. 一个人先扛，等过得去再说',
      preferTags: ['duty', 'peer'],
    },
    {
      id: 'old-wounds',
      label: 'C. 旧事一起翻出来，暂时分开住',
      preferTags: ['friction'],
    },
  ],
  analyses: (ctx) =>
    analysesOf(
      [
        { id: 'share-load', label: 'A · 摊开', body: '能谈清楚彼此的需要，之前积起来的信任才有地方落脚。' },
        { id: 'one-carries', label: 'B · 先扛', body: '平时更独立的一方可能把扛住当作照顾，另一方未必知道怎么加入。' },
        { id: 'old-wounds', label: 'C · 分开住', body: '这段关系里难以继续回避的内容，常会和眼前的危机一起来。' },
      ],
      ctx.actualId,
    ),
  write(ctx) {
    const { a, b, actualId, yearLuck, history } = ctx;
    const note = guessNote(ctx);
    const fortune = yearLuck?.opportunityLine ?? `${ctx.year}年`;
    const apart = history.some(
      (h) => h.eventId === 'year-settle' && h.actualChoiceId === 'separate',
    );
    if (apart) {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '各自扛过一段难关',
        letterBody: `${a.nickname}换了工作，接受了朋友的帮助。${b.nickname}终于为原先忙不过来的一件事腾了时间。后来两人从共同朋友那儿听说对方近况，都托人问了一声好。${note}`,
        voiceA: `难关是自己的，问候可以是旧的。`,
        voiceB: `听说她还好，我就放心一点。`,
        delta: { trust: 0, tension: 0 },
        choiceAnalyses: YEAR_CRISIS.analyses?.(ctx),
        reviewClues: baseReview(fortune, '各自扛关。', '关系去向会变成多年后再聊。'),
      });
    }
    if (actualId === 'old-wounds') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '先各住一阵',
        letterBody: `原来的分歧又翻了出来。两人商量着先各住一阵，把最急的安排做完，也给自己留出想清楚的时间。${note}`,
        voiceA: `眼前的难，和旧的伤，缠在一起了。`,
        voiceB: `我需要距离，才能看清还要不要靠近。`,
        delta: { trust: -2, tension: 3 },
        choiceAnalyses: YEAR_CRISIS.analyses?.(ctx),
        reviewClues: baseReview(fortune, '危机掀开旧账。', '关系去向更可能走到修复或分开。'),
      });
    }
    if (actualId === 'one-carries') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '一个人先扛了下来',
        letterBody: `一个人先把事情扛了下来，另一个人是在半夜看到桌上的清单才明白。困难过去了，分工的事仍然留在桌上。${note}`,
        voiceA: `我以为扛住就是照顾。`,
        voiceB: `你怎么不叫我一起扛？`,
        delta: { trust: -1, tension: 2 },
        choiceAnalyses: YEAR_CRISIS.analyses?.(ctx),
        reviewClues: baseReview(fortune, '独立拍板式的照顾留下委屈。', '去向题里会谈到重新约定。'),
      });
    }
    return resultShell(ctx, {
      kind: 'continue',
      letterTitle: '把困难写下来',
      letterBody: `两人坐到桌边，把时间、钱和能求助的人写下来。每天少做一点原定的事，才腾出力气把眼前的难关过完。${note}`,
      voiceA: `摊开以后，反而没那么怕。`,
      voiceB: `我知道自己可以站在哪一格。`,
      delta: { trust: 2, tension: 1 },
      choiceAnalyses: YEAR_CRISIS.analyses?.(ctx),
      reviewClues: baseReview(fortune, '分担让危机变成共同事件。', '关系去向更可能继续过下去。'),
    });
  },
};

export const YEAR_COMMITMENT: StoryEventDef = {
  id: 'year-commitment',
  kind: 'turn',
  yearOffset: 20,
  title: '关系去向 · 还想怎样过',
  requiresGuess: true,
  scene: ({ a, b, year }) =>
    `${year}年。眼前的困难已经过去，留下的问题还在。一个傍晚，${a.nickname}和${b.nickname}开始谈以后想要怎样生活。`,
  prompt: '到这一步，两人会走向哪里？',
  choices: [
    {
      id: 'keep-going',
      label: 'A. 把日子接着过下去',
      preferTags: ['bond', 'warm', 'care'],
    },
    {
      id: 'repair',
      label: 'B. 重新约定边界，给关系一次修复',
      preferTags: ['care', 'duty', 'peer'],
    },
    {
      id: 'go-apart',
      label: 'C. 把分开这件事谈清楚',
      preferTags: ['friction', 'duty'],
    },
  ],
  analyses: (ctx) =>
    analysesOf(
      [
        { id: 'keep-going', label: 'A · 接着过', body: '危机过去以后愿意照顾彼此的需要，共同生活才会有继续往下的理由。' },
        { id: 'repair', label: 'B · 修复', body: '还愿意再试的人，需要彼此能看见具体的改变。' },
        { id: 'go-apart', label: 'C · 分开', body: '反复留下的难处已经大过两个人愿意继续投入的力气。' },
      ],
      ctx.actualId,
    ),
  write(ctx) {
    const { a, b, actualId, yearLuck, history } = ctx;
    const note = guessNote(ctx);
    const fortune = yearLuck?.opportunityLine ?? `${ctx.year}年`;
    const apart = history.some(
      (h) => h.eventId === 'year-settle' && h.actualChoiceId === 'separate',
    );
    if (apart) {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '多年后又聊了一会儿',
        letterBody: `共同的朋友办了一次多年未见的聚会。${a.nickname}和${b.nickname}坐到一起，聊起年轻时曾经犹豫很久的那件事。两人都能笑一笑。散场后照旧各自回家。${note}`,
        voiceA: `能笑着说出来，就已经够了。`,
        voiceB: `年轻时那页，终于可以合上。`,
        delta: { trust: 0, tension: 0 },
        choiceAnalyses: YEAR_COMMITMENT.analyses?.(ctx),
        reviewClues: baseReview(fortune, '各自生活后的回望。', '一生回顾会记住初遇。'),
      });
    }
    if (actualId === 'go-apart') {
      return resultShell(ctx, {
        kind: 'decline',
        letterTitle: '把分开谈清楚',
        letterBody: `话谈了好几次。他们决定分开，各自安排了新的住处，也为几件共同的旧物找到了去处。${note}`,
        voiceA: `结束也是一种认真。`,
        voiceB: `我把钥匙放回桌上的时候，手是稳的。`,
        delta: { trust: -2, tension: 2 },
        choiceAnalyses: YEAR_COMMITMENT.analyses?.(ctx),
        reviewClues: baseReview(fortune, '选择把关系画上句号。', '一生章会写分开以后的日子。'),
      });
    }
    if (actualId === 'repair') {
      return resultShell(ctx, {
        kind: 'continue',
        letterTitle: '各写下三件愿意改变的事',
        letterBody: `两个人各写下了三件愿意改变的事。很慢才做好第一件。到过年时，有些过去根本谈不了的事，已经能够说到最后一句。${note}`,
        voiceA: `修复很慢，但看得见。`,
        voiceB: `我愿意再试一次——因为看见了改变。`,
        delta: { trust: 2, tension: 1 },
        choiceAnalyses: YEAR_COMMITMENT.analyses?.(ctx),
        reviewClues: baseReview(fortune, '用具体改变换一次机会。', '一生章会记住这些约定。'),
      });
    }
    return resultShell(ctx, {
      kind: 'continue',
      letterTitle: '把接下来几年排了一遍',
      letterBody: `他们趁一个清闲的下午，把接下来几年的计划排了一遍。旧事偶尔还会提起，但彼此都知道要怎么把话接下去。${note}`,
      voiceA: `接着过，是因为还想过。`,
      voiceB: `计划写在同一张纸上，我就安心。`,
      delta: { trust: 2, tension: 0 },
      choiceAnalyses: YEAR_COMMITMENT.analyses?.(ctx),
      reviewClues: baseReview(fortune, '选择继续共同生活。', '一生章会写两人并肩到老。'),
    });
  },
};

export const YEAR_LIFETIME: StoryEventDef = {
  id: 'year-lifetime',
  kind: 'turn',
  yearOffset: 48,
  title: '一生 · 把故事读到最后',
  requiresGuess: false,
  prompt: '红娘簿翻到最后一页。',
  choices: [{ id: 'epilogue', label: '终章', preferTags: ['bond'] }],
  write(ctx) {
    const { a, b, year, yearLuck, history } = ctx;
    const fortune = yearLuck?.opportunityLine ?? `${year}年`;
    const apart =
      history.some((h) => h.eventId === 'year-settle' && h.actualChoiceId === 'separate') ||
      history.some((h) => h.eventId === 'year-commitment' && h.actualChoiceId === 'go-apart');
    const repaired = history.some(
      (h) => h.eventId === 'year-commitment' && h.actualChoiceId === 'repair',
    );
    const meet = history.find((h) => h.eventId === 'year-meet');
    const body = apart
      ? `从年轻时那次道别以后，两人慢慢走向了不同的生活。后来还有过几次问候，${meet?.year ?? ''}年那场见面也一直有人记得。`
      : repaired
        ? `重新商量过的几条约定，后来被夹进了日历里。老了以后，他们一人负责烧水，一人习惯在桌边留两只杯子。`
        : `老了以后，他们一人负责烧水，一人习惯在桌边留两只杯子。红娘簿从初见翻到这里，每一次选择都留在了关系里。`;
    return resultShell(ctx, {
      kind: 'continue',
      letterTitle: '把一生读到最后',
      letterBody: `红娘簿翻到最后一页。\n\n${body}\n\n${a.nickname}（${a.birthYear}–…）、${b.nickname}（${b.birthYear}–…）。可以翻回年表，看看哪一步把两个人带到了这里。`,
      voiceA: `若重来，我仍想在那一晚多留一晚。`,
      voiceB: `若重来，我仍想说「下次你来，我带你去另一家」。`,
      delta: { trust: 0, tension: 0 },
      reviewClues: baseReview(
        fortune,
        '终章收束整段关系——由前面每一步选择写成。',
        '故事告一段落。可以再牵一对。',
      ),
      extraLearn: ['固定骨架：初识→靠近→转折→成家→成家后→边界→危机→关系去向→一生；段内年份与场合由运程加权。'],
    });
  },
};

export const LATE_LIFE_EVENTS: StoryEventDef[] = [
  YEAR_SETTLE,
  YEAR_HOUSEHOLD,
  YEAR_BOUNDARY,
  YEAR_CRISIS,
  YEAR_COMMITMENT,
  YEAR_LIFETIME,
];
