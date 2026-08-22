import type { ReadingLens } from './card-psychology.ts';
import { imageSketch, motherTheme, resolveReadingLens } from './card-psychology.ts';
import type { CardReading } from './types.ts';

export type QuestionSubject = 'father' | 'mother' | 'self' | 'partner' | 'other';

/** 问句主语：无明确主语时默认指向问卜者关心的人（常为父亲/母亲） */
export function inferQuestionSubject(question: string): QuestionSubject {
  const q = question.trim();
  if (/我爸|父亲|爸爸|他(?!们)/.test(q)) return 'father';
  if (/我妈|母亲|妈妈|她(?!们)/.test(q)) return 'mother';
  if (/我对象|男友|女友|伴侣|老公|老婆/.test(q)) return 'partner';
  if (/我(?!们)|自己|本人/.test(q)) return 'self';
  return 'other';
}

const SUBJECT_LABEL: Record<QuestionSubject, string> = {
  father: '你父亲',
  mother: '你母亲',
  partner: '对方',
  self: '你',
  other: '当事人',
};

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

type CardArchetype = {
  match: RegExp;
  upright: { theme: string; sketch: string; questionHook: string };
  reversed?: { theme: string; sketch: string; questionHook: string };
};

/** 常见牌：画面 + 母题 + 对应问句的钩子（可逐步扩库） */
const ARCHETYPES: CardArchetype[] = [
  {
    match: /宝剑九|九.*剑/,
    upright: {
      theme: '痛苦、焦虑、内耗',
      sketch: '一人坐在床上捂着脸，背景九把剑——极度的精神压力、噩梦、担忧，像夜里睡不着的那种绷紧。',
      questionHook:
        '往往不是「感情有多深」，而是他正极度焦虑、无助，潜意识里在找一个熟悉、能依赖的「安全港湾」。',
    },
  },
  {
    match: /愚者/,
    upright: {
      theme: '新的开始、冒险',
      sketch: '青年站在崖边望向远方，行囊轻便，能量偏向前行。',
      questionHook: '可能带着冲动或「先走一步再说」的心态。',
    },
    reversed: {
      theme: '逃避、盲目、缺乏规划',
      sketch: '脚步悬空、方向不明——逆位愚者像不顾后果的逃离，或没想清楚就伸手抓一根稻草。',
      questionHook:
        '带有逃避现实的性质：可能面对烂摊子想逃，一时冲动、孤独或想回避责任，而非成熟的长远打算。',
    },
  },
  {
    match: /宝剑王后|王后.*剑|剑.*王后/,
    upright: {
      theme: '理智、冷酷、划清界限',
      sketch: '端坐的王后手持利剑，表情冷静甚至锋利——用头脑切断情绪纠缠。',
      questionHook: '过去或平时：要面子、强势，用冷硬态度处理问题，亲手斩断温情也可能。',
    },
  },
  {
    match: /圣杯六|六.*杯/,
    upright: {
      theme: '回忆、馈赠、过去的温情',
      sketch: '孩童与花、旧日馈赠——美好的过往与熟悉的人。',
      questionHook: '可能打「回忆牌」，唤起同情或旧情。',
    },
    reversed: {
      theme: '回不去的过去、单方面索取',
      sketch: '逆位圣杯六：温情变质，变成利用旧关系解燃眉之急，而非真心回到从前。',
      questionHook:
        '打破高高在上的姿态来索取帮助，但过去的情感已变质——更像利益交换或单方面的「卖惨」。',
    },
  },
  {
    match: /倒吊人/,
    upright: {
      theme: '停滞、拖累、死胡同、被迫等待',
      sketch: '一人倒吊在树上无法动弹——局面卡住，只能被动承受。',
      questionHook:
        '挣扎往往换不来解脱，反而陷入拖延与被动；因果回到身上，要用等待和痛苦来偿还之前的冷漠或逃避。',
    },
    reversed: {
      theme: '挣脱或更深的固执',
      sketch: '逆位倒吊人：要么终于想通，要么更顽固地困在原地。',
      questionHook: '僵局可能持续，别指望别人能替他把账还清。',
    },
  },
];

function matchArchetype(card: CardReading): CardArchetype['upright'] | null {
  const rev = card.orientation === 'reversed';
  for (const a of ARCHETYPES) {
    if (!a.match.test(card.cardName)) continue;
    if (rev && a.reversed) return a.reversed;
    return a.upright;
  }
  return null;
}

function orientLabel(card: CardReading): string {
  return card.orientation === 'reversed' ? '逆位' : '正位';
}

export type NarrativeInsight = {
  meaningMap: string;
  insight: string;
  action?: string;
};

/**
 * 参照「宝剑九 + 愚者逆」式解读：画面 → 母题 → 对应你的问题 → 不判死刑的措辞
 */
export function buildNarrativeCardInsight(
  card: CardReading,
  question: string,
  lens: ReadingLens,
  allCards: CardReading[],
  index: number,
  userIntuition?: string,
): NarrativeInsight {
  const subject = inferQuestionSubject(question);
  const subj = SUBJECT_LABEL[subject];
  const frame = positionalFrame(card, index);
  const arch = matchArchetype(card);
  const mother = motherTheme(card);
  const sketch = arch?.sketch || imageSketch(card);
  const theme = arch?.theme || mother;
  const orient = orientLabel(card);

  const meaningMap = [
    `${card.cardName}（${orient}）：${theme}`,
    `画面：${sketch}`,
  ].join('\n');

  const hook =
    arch?.questionHook ||
    `就「${question.slice(0, 24)}${question.length > 24 ? '…' : ''}」而言，这张牌更像在照见${subj}当下的心理，而不是给一个绝对事实判决。`;

  const temporal =
    frame === '过去' || frame === '现在' || frame === '未来'
      ? `【${frame}】`
      : `【${frame}】`;

  let insight = `${temporal}${hook}`;
  if (lens === 'family' && subject === 'father') {
    insight += ` 在家庭议题里，${subj}的行为往往牵动全家的边界——牌在描述他的状态，不是在替你做决定。`;
  }

  const prev = index > 0 ? allCards[index - 1] : null;
  if (prev) {
    insight += ` 承接上一张【${prev.cardName}】：用「因为上一张的能量，所以这一张会……」来串，别孤立背牌意。`;
  }

  if (userIntuition?.trim() && index === 0) {
    insight += `（你写下/感受到的直觉：「${userIntuition.trim().slice(0, 48)}」——可与牌面相互印证。）`;
  }

  const action = boundaryAdviceLine(lens, subject, card);

  return { meaningMap, insight, action };
}

function boundaryAdviceLine(
  lens: ReadingLens,
  subject: QuestionSubject,
  card: CardReading,
): string {
  if (lens === 'family') {
    if (/愚者/.test(card.cardName) && card.orientation === 'reversed') {
      return '保持距离与观察：对方做事可能不顾后果，勿被卷入情绪漩涡；尊重你母亲的边界，他的痛苦首先是他的课题。';
    }
    if (/倒吊人/.test(card.cardName)) {
      return '拒绝被吸血：别做担保、别借钱、别被道德绑架——僵局需他自己面对。';
    }
    return '分清他的事、你的事、家庭的事；可以关心，不必替他还情绪债。';
  }
  return '把牌当心理镜子：结合生活实情印证，不必过度共情到失去边界。';
}

/** 多牌综合结论（第二张范例：过去→现在→未来的轨迹叙事） */
export function buildSpreadSynthesis(
  cards: CardReading[],
  question: string,
  lens: ReadingLens,
  userIntuition?: string,
): string {
  if (cards.length < 2) return '';

  const subject = inferQuestionSubject(question);
  const subj = SUBJECT_LABEL[subject];
  const names = cards.map((c) => `${c.cardName}${c.orientation === 'reversed' ? '逆位' : '正位'}`).join('、');

  const frames = cards.map((c, i) => positionalFrame(c, i));
  const isTimeline = frames.some((f) => f === '过去' || f === '现在' || f === '未来');

  let body = `这组牌（${names}）`;

  if (/为什么|原因|动机/.test(question)) {
    body += `没有给出「因为想复合」或「因为缺钱」式的绝对答案，而是在描绘${subj}目前真实的心理状态。`;
  } else if (/做什么|后果|未来|会怎样/.test(question)) {
    body += `勾勒出一条清晰的行为与后果轨迹——尤其当牌阵带过去/现在/未来时，像在讲一个故事。`;
  } else {
    body += `合在一起，是在描摹局面如何展开，而不是宣判宿命。`;
  }

  if (isTimeline) {
    const chapters = cards
      .map((c, i) => {
        const arch = matchArchetype(c);
        const f = frames[i];
        return `${f}【${c.cardName}】${arch ? `：${arch.theme}` : ''}`;
      })
      .join(' → ');
    body += `\n轨迹：${chapters}。`;
  }

  if (userIntuition?.trim()) {
    body += `\n结合你的直觉（${userIntuition.trim().slice(0, 60)}），牌在提醒：先看清状态，再决定要不要介入。`;
  }

  if (lens === 'family' && /愚者/.test(names) && /宝剑九|焦虑|痛苦/.test(names)) {
    body +=
      '\n核心指向：他很可能处于焦虑、痛苦且不够理智的状态；找你妈未必是为美好生活，而更像索取或求助——情感慰藉或实际帮助都有可能。';
  }

  if (isTimeline && /倒吊人/.test(names)) {
    body +=
      '\n后果层面：挣扎未必换来解脱，反而可能陷入停滞与被动；别指望单靠旧关系能填平烂摊子。';
  }

  body += '\n塔罗反映的是当下能量与心理投射，不是不可更改的宿命——请结合日常生活印证。';

  return body;
}

/** 多条边界建议（对应范例 💌 分段） */
export function buildAdviceLines(
  cards: CardReading[],
  question: string,
  lens: ReadingLens,
): string[] {
  const lines: string[] = [];
  const names = cards.map((c) => c.cardName).join('');

  if (lens === 'family') {
    lines.push('不需要过度共情：他的焦虑不必由你全盘承担。');
    if (/愚者/.test(names)) {
      lines.push('保持距离与观察：冲动、逃避时，中立比卷入更安全。');
    }
    lines.push('尊重你母亲的决定：是否回应、如何回应，是她的边界。');
    if (/倒吊人/.test(names)) {
      lines.push('拒绝被吸血：担保、借钱、道德绑架都要警惕。');
    }
  } else {
    lines.push('把解读当心理防备提醒，结合实情印证，不必一次定论。');
    lines.push('下一步缩成一件今天能做的小事，比反复问牌更有用。');
  }

  return lines;
}

export function empathyNarrativeLead(
  cards: CardReading[],
  question: string,
  lens: ReadingLens,
): string {
  const names = cards.map((c) => c.cardName).join('、');
  const subject = inferQuestionSubject(question);
  if (lens === 'family' && subject === 'father') {
    return `根据你的牌阵（${names}），我先帮你把父亲当下的心理状态理清——牌是镜子，答案仍在你如何守住边界。`;
  }
  return `牌阵（${names}）照见的是当下的能量与潜意识投射；同一类型的问题若同一天再问，可以把两次牌阵当作同一故事的上集与下集来读。`;
}
