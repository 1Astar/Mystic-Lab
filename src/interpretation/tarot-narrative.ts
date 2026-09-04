import { matchCardArchetype } from './card-archetypes.ts';
import type { ReadingLens } from './card-psychology.ts';
import { imageSketch, motherTheme } from './card-psychology.ts';
import type { ReadingSeriesContext } from '../journal/reading-series.ts';
import {
  framePromptForAsk,
  resolveAskShape,
  slotPreferredFrame,
  type AskShape,
  type AskSlot,
} from './ask-shape.ts';
import {
  resolveReadingScene,
  type QuestionSubject,
} from './reading-scene.ts';
import type { CardReading } from './types.ts';

export type { QuestionSubject };

/** 问句主语：无明确主语时默认指向问卜者关心的人（常为父亲/母亲） */
export function inferQuestionSubject(
  question: string,
  series?: ReadingSeriesContext | null,
): QuestionSubject {
  if (series?.priorEpisodes?.length) {
    return resolveReadingScene({ question, series }).subject;
  }
  const q = question.trim();
  if (/我爸|父亲|爸爸/.test(q)) return 'father';
  if (/我妈|母亲|妈妈/.test(q)) return 'mother';
  if (/我对象|男友|女友|伴侣|老公|老婆/.test(q)) return 'partner';
  if (/他(?!们)/.test(q)) return 'other';
  if (/她(?!们)/.test(q)) return 'other';
  if (/我(?!们)|自己|本人/.test(q)) return 'self';
  return 'other';
}

const SUBJECT_LABEL: Record<QuestionSubject, string> = {
  father: '你父亲',
  mother: '你母亲',
  partner: '对方',
  self: '你',
  other: '对方',
};

/** 问句里的行动方（他/她/称谓） */
function actorLabel(question: string, subject: QuestionSubject): string {
  const q = question.trim();
  if (/他(?!们)/.test(q)) return '他';
  if (/她(?!们)/.test(q)) return '她';
  if (subject === 'father') return '你父亲';
  if (subject === 'mother') return '你母亲';
  return SUBJECT_LABEL[subject];
}

/** 牌阵位次 → 时间/叙事框（过去现在未来等） */
export function positionalFrame(card: CardReading, index: number): string {
  const pos = (card.position || '').trim();
  if (/过去|起因|原因/.test(pos)) return '过去';
  if (/现在|目前|当下|情况/.test(pos)) return '现在';
  if (/未来|走势|结果|后果|将会/.test(pos)) return '未来';
  if (/阻碍|障碍/.test(pos)) return '阻碍';
  if (/建议|行动/.test(pos)) return '建议';
  if (pos) return pos;
  return `第 ${index + 1} 张`;
}

function orientLabel(card: CardReading): string {
  return card.orientation === 'reversed' ? '逆位' : '正位';
}

function cardHook(card: CardReading): string {
  const arch = matchCardArchetype(card);
  return arch?.questionHook || arch?.theme || motherTheme(card);
}

function cardLabel(card: CardReading): string {
  return `${card.cardName}${card.orientation === 'reversed' ? '逆' : ''}`;
}

function pickByFrame(
  cards: CardReading[],
  frames: string[],
  want: string,
): CardReading {
  const i = frames.findIndex((f) => f === want);
  if (i >= 0 && cards[i]) return cards[i]!;
  if (want === '过去') return cards[0]!;
  if (want === '现在') return cards[1] ?? cards[0]!;
  return cards[cards.length - 1]!;
}

export type NarrativeInsight = {
  meaningMap: string;
  insight: string;
  action?: string;
};

/**
 * 画面 → 母题 → 扣进本问槽位；禁止每张牌复制同一句套话
 */
export function buildNarrativeCardInsight(
  card: CardReading,
  question: string,
  lens: ReadingLens,
  allCards: CardReading[],
  index: number,
  userIntuition?: string,
  _series?: ReadingSeriesContext | null,
): NarrativeInsight {
  const ask = resolveAskShape(question);
  const frame = positionalFrame(card, index);
  const arch = matchCardArchetype(card);
  const mother = motherTheme(card);
  const sketch = arch?.sketch || imageSketch(card);
  const theme = arch?.theme || mother;
  const orient = orientLabel(card);
  const prompt = framePromptForAsk(frame, ask);
  const hook = arch?.questionHook || `这张牌照见「${theme}」这一层。`;

  const meaningMap = [
    `${card.cardName}（${orient}）：${theme}`,
    `画面：${sketch}`,
  ].join('\n');

  let insight = `【${frame}】${prompt}：${hook}`;

  const prev = index > 0 ? allCards[index - 1] : null;
  if (prev && ask.needsTimeline) {
    insight += ` 承接【${prev.cardName}】（${cardHook(prev).replace(/。$/, '')}），这一张把压力推到「${theme}」。`;
  }

  if (userIntuition?.trim() && index === 0) {
    insight += `（你的直觉：「${userIntuition.trim().slice(0, 48)}」——可与牌面对照。）`;
  }

  const action = boundaryAdviceLine(lens, card, frame, ask);

  return { meaningMap, insight, action };
}

function boundaryAdviceLine(
  lens: ReadingLens,
  card: CardReading,
  frame: string,
  ask: AskShape,
): string {
  const hasYesNo = ask.slots.some((s) => s.kind === 'yes_no');
  if (lens === 'family') {
    if (frame === '未来') {
      return hasYesNo
        ? '用切断通道兑现判断：不担保、不借钱、不回情绪战；和关键家人对齐同一套底线。'
        : '边界短清单：不担保、不借钱、不被道德绑架。';
    }
    if (frame === '现在') {
      return '本周只核对一件可观察的事：对方有没有实际动作；有则记录，无则保持低回应。';
    }
    if (frame === '过去') {
      return '把旧模式记成「模式」，别再为赢一场争论搭进去。';
    }
    if (/愚者/.test(card.cardName) && card.orientation === 'reversed') {
      return '保持距离：对方可能不顾后果；他的课题先还给他。';
    }
    return '分清对方的事与你的边界；关心可以，介入清单要短。';
  }
  if (lens === 'work') {
    if (frame === '未来' || ask.slots.some((s) => s.kind === 'choice')) {
      return '写清「留下可接受 / 必须走的信号 / 最晚决定日」，用书面节点核对。';
    }
    return '本周只推一个可打勾的职场动作，用对方回应决定加码还是停。';
  }
  if (lens === 'love') {
    return '给短观察期：看对方有没有修复/配合的动作，再决定加码还是收手。';
  }
  return '用生活里一件可核对的小事印证这张牌，别只在想象里打转。';
}

function cardClause(card: CardReading): string {
  return `【${card.cardName}（${orientLabel(card)}）】${cardHook(card)}`;
}

/** 按槽位填牌：任意问法共用，不写死案例文案 */
function answerSlotWithCard(
  slot: AskSlot,
  card: CardReading,
  actor: string,
): string {
  const hook = cardHook(card).replace(/。$/, '');
  const tag = card.position?.trim()
    ? `（${card.position}·${cardLabel(card)}）`
    : `（${cardLabel(card)}）`;

  switch (slot.kind) {
    case 'why':
      return `${slot.label}——更像「${hook}」${tag}，不是单一罪名式结论。`;
    case 'will_do':
      return `${slot.label}——${actor}侧更可能：${hook}${tag}。`;
    case 'consequence':
      return `${slot.label}——${hook}${tag}。`;
    case 'yes_no': {
      const lean = card.orientation === 'reversed' ? '偏谨慎/受阻' : '偏可推进但仍要兑现';
      return `${slot.label}——判断偏「${lean}」：${hook}${tag}；结论靠你是否落实边界/动作，不靠空想。`;
    }
    case 'choice':
      return `${slot.label}——若维持现状，走势更像：${hook}${tag}；用可核对节点二选一。`;
    case 'timing':
      return `${slot.label}——窗口感来自「${hook}」${tag}，不是钉死某一天。`;
    case 'how':
      return `${slot.label}——先做能对冲「${hook}」的一小步${tag}。`;
    default:
      return `${slot.label}——${hook}${tag}。`;
  }
}

function nextActionForLens(lens: ReadingLens, ask: AskShape, actor: string): string {
  if (lens === 'family') {
    return ask.slots.some((s) => s.kind === 'yes_no')
      ? '对你：和关键家人对齐规则——不担保、不借钱、不透露行程；有越界就留证，不靠「再沟通一次」赌运气。'
      : `对你：可以关心，但别做担保、别借钱、别被道德绑架——${actor}的账先由对方面对。`;
  }
  if (lens === 'work') {
    return '对你：本周只定一个可打勾节点（回执/谈薪/投递），用结果决定加码还是停。';
  }
  if (lens === 'love') {
    return '对你：设短观察期，看对方动作质量，再决定加码还是收手。';
  }
  return '对你：先核一件可观察的事实，再决定要不要加码介入。';
}

/** 通用整盘合成：槽位 → 牌位 → 牌意钩子 */
function buildSlotDrivenSynthesis(
  cards: CardReading[],
  question: string,
  subject: QuestionSubject,
  lens: ReadingLens,
  frames: string[],
  ask: AskShape,
): string {
  const actor = actorLabel(question, subject);
  const byFrame = (label: string) => pickByFrame(cards, frames, label);

  const lines: string[] = [
    `就你问的：${ask.slots.map((s) => s.label).join(' / ')}`,
  ];

  const circles = ['①', '②', '③', '④'];
  ask.slots.forEach((slot, i) => {
    const pref = slotPreferredFrame(slot.kind);
    const card = pref === '整盘' ? cards[cards.length - 1]! : byFrame(pref);
    lines.push(`${circles[i] ?? `${i + 1}.`} ${answerSlotWithCard(slot, card, actor)}`);
  });

  if (frames.some((f) => f === '过去' || f === '现在' || f === '未来')) {
    const past = byFrame('过去');
    const present = byFrame('现在');
    const future = byFrame('未来');
    lines.push(
      `线：过去${cardClause(past)} → 现在${cardClause(present)} → 未来${cardClause(future)}。`,
    );
  }

  lines.push(nextActionForLens(lens, ask, actor));
  return lines.join('\n');
}

/** 多牌综合结论：有槽位就按槽填；否则短轨迹 */
export function buildSpreadSynthesis(
  cards: CardReading[],
  question: string,
  lens: ReadingLens,
  userIntuition?: string,
  series?: ReadingSeriesContext | null,
): string {
  if (cards.length < 2) return '';

  const subject = inferQuestionSubject(question, series);
  const ask = resolveAskShape(question);
  const frames = cards.map((c, i) => positionalFrame(c, i));

  let body = series?.synthesisPrefix ? `${series.synthesisPrefix}\n` : '';

  if (ask.needsWholeSpread || ask.needsTimeline) {
    body += buildSlotDrivenSynthesis(cards, question, subject, lens, frames, ask);
    if (userIntuition?.trim()) {
      body += `\n你的直觉（${userIntuition.trim().slice(0, 60)}）：用实际动作核对，不靠想象加戏。`;
    }
    return body;
  }

  const names = cards
    .map((c) => `${c.cardName}${c.orientation === 'reversed' ? '逆位' : '正位'}`)
    .join('、');
  const subj = SUBJECT_LABEL[subject];
  body += `这组牌（${names}）合在一起，描摹${subj}相关局面如何展开。`;

  if (frames.some((f) => f === '过去' || f === '现在' || f === '未来')) {
    const chapters = cards
      .map((c, i) => {
        const arch = matchCardArchetype(c);
        return `${frames[i]}【${c.cardName}】${arch ? `：${arch.theme}` : ''}`;
      })
      .join(' → ');
    body += `\n轨迹：${chapters}。`;
  }

  if (userIntuition?.trim()) {
    body += `\n结合你的直觉（${userIntuition.trim().slice(0, 60)}）：先印证状态，再决定下一步。`;
  }

  return body;
}

/** 建议：按透镜 + 问法，不写死某一家人故事 */
export function buildAdviceLines(
  cards: CardReading[],
  question: string,
  lens: ReadingLens,
): string[] {
  const ask = resolveAskShape(question);
  const names = cards.map((c) => c.cardName).join('');
  const lines: string[] = [];

  if (lens === 'family') {
    if (ask.slots.some((s) => s.kind === 'yes_no')) {
      lines.push('安全与边界优先：通讯、金钱、行程通道能收就收。');
      lines.push('和关键家人对齐同一套回应规则，避免被各个击破。');
    } else {
      lines.push('不需要过度共情：对方的焦虑不必由你全盘承担。');
      lines.push('尊重当事人边界：是否回应、如何回应，是对方的选择。');
    }
    if (/愚者/.test(names)) lines.push('冲动、逃避时，中立比卷入更安全。');
    if (/倒吊人/.test(names)) lines.push('拒绝担保、借钱、道德绑架。');
  } else if (lens === 'work') {
    lines.push('职场题用书面节点核对，口头好感不算数。');
    if (ask.slots.some((s) => s.kind === 'choice')) {
      lines.push('去留先写「可接受底线 / 必须走的信号 / 决定日」。');
    }
  } else if (lens === 'love') {
    lines.push('感情题看对方动作质量，不先写长篇剧本。');
  } else {
    lines.push('用一件今天能核对的小事印证牌面，再决定加码还是收手。');
  }

  return lines;
}

export function empathyNarrativeLead(
  cards: CardReading[],
  question: string,
  lens: ReadingLens,
  series?: ReadingSeriesContext | null,
): string {
  if (series?.lead) return series.lead;
  const names = cards.map((c) => c.cardName).join('、');
  const ask = resolveAskShape(question);
  const slotHint = ask.slots.map((s) => s.label).join('、');
  if (ask.slots.length) {
    return `牌阵（${names}）对着「${slotHint}」——下面按牌位直接答，不绕开你的问题。`;
  }
  const subject = inferQuestionSubject(question, series);
  if (lens === 'family' && (subject === 'father' || subject === 'mother')) {
    return `牌阵（${names}）先照${SUBJECT_LABEL[subject]}这一侧，再谈到你的边界。`;
  }
  return `牌阵（${names}）按时间线串读；同一天再问，可当同一故事的下一集。`;
}
