/**
 * 塔罗深度解读 / 追问提示词
 */
import type { ReadingResult } from '../interpretation/types.ts';
import {
  inferQuestionSubject,
  positionalFrame,
} from '../interpretation/tarot-narrative.ts';
import {
  formatPersonalContextLines,
  hasPersonalContext,
  type PersonalContext,
} from '../liuyao/personal-context.ts';
import { SPREADS, type SpreadType } from './spreads.ts';

export type TarotCardSnap = {
  name: string;
  position: string;
  reversed: boolean;
};

export type TarotReadingContext = {
  question: string;
  spreadType: SpreadType;
  cards: TarotCardSnap[];
  summary: string;
  learningNote?: string;
  readingSnapshot?: ReadingResult | null;
};

export function cardLines(cards: TarotCardSnap[]): string {
  return cards
    .map(
      (c, i) =>
        `${i + 1}. [${c.position || '位置'}] ${c.name}${c.reversed ? '（逆位）' : '（正位）'}`,
    )
    .join('\n');
}

export function spreadLabel(spreadType: SpreadType): string {
  return SPREADS[spreadType]?.name ?? spreadType;
}

type QuestionMode = 'action_outcome' | 'why' | 'relationship' | 'work' | 'general';

export function inferQuestionMode(question: string): QuestionMode {
  const q = question.trim();
  if (/工作|离职|offer|面试|薪|转正|项目|老板|同事/.test(q)) return 'work';
  if (/做什么|会怎样|什么后果|接下来|将来|会怎么/.test(q)) return 'action_outcome';
  if (/为什么|原因|动机|真心|到底想/.test(q)) return 'why';
  if (/爱|感情|关系|他|她|分手|复合|婚姻/.test(q)) return 'relationship';
  return 'general';
}

function formatOfflineThread(snapshot?: ReadingResult | null): string {
  const thread = snapshot?.questionThread;
  if (!thread?.answers.length) return '';
  const blocks = thread.answers.map((a) => {
    const parts = [
      a.heading,
      a.meaningMap ? `意象：${a.meaningMap}` : '',
      a.insight ? `解读：${a.insight}` : '',
      a.action ? `行动：${a.action}` : '',
    ].filter(Boolean);
    return parts.join('\n');
  });
  const tail = [
    thread.synthesis ? `综合：${thread.synthesis}` : '',
    thread.adviceLines?.length ? `建议：${thread.adviceLines.join('；')}` : '',
  ].filter(Boolean);
  return [...blocks, ...tail].join('\n\n');
}

function modeDirectives(mode: QuestionMode, question: string): string[] {
  const subject = inferQuestionSubject(question);
  const lines: string[] = [];

  if (mode === 'action_outcome') {
    lines.push(
      '【必答】开头两句分别点清：①他/对方「更可能做什么」（行为倾向，不是绝对预言）②「可能带来什么后果/连锁反应」。',
      '用过去→现在→未来把三张牌串成一条故事线，禁止机械罗列「过去是X、现在是Y」而无因果。',
    );
    if (subject === 'father' || subject === 'mother') {
      lines.push(
        '家庭议题：区分「他的动机/姿态」与「你的边界」；若牌面有回忆、索取、停滞，要敢点破（如利用旧情、要钱、逃避责任），但不下死刑判决。',
      );
    }
  } else if (mode === 'why') {
    lines.push('【必答】先给心理动机假设，再讲牌阵如何映照；区分「表面理由」与「潜意识驱力」。');
  } else if (mode === 'relationship') {
    lines.push('【必答】关系动态 + 双方各自在守什么/要什么；给可沟通的下一步，而非只描述牌意。');
  } else if (mode === 'work') {
    lines.push('【必答】局面判断 → 风险点 → 短中长期行动；禁止恋爱套话。');
  }

  return lines;
}

const BANNED_PHRASES = [
  '好，我们就按你这个问题直接看',
  '都不算剧烈',
  '先抓住方向，再下钻细节',
  '答案最终仍在你心里',
  '牌在帮你看清局面，而不是替你做绝对宣判',
  '明天就能做的一小步',
].join('、');

export function buildTarotDeepPrompt(
  ctx: TarotReadingContext,
  personal: PersonalContext,
): { system: string; user: string } {
  const personalOn = hasPersonalContext(personal);
  const mode = inferQuestionMode(ctx.question);
  const offline = formatOfflineThread(ctx.readingSnapshot);
  const intuition = ctx.readingSnapshot?.userIntuition?.trim();

  const narrativeExample =
    mode === 'action_outcome'
      ? [
          '叙事范例（学结构，勿照抄）：',
          '「过去宝剑王后的冷硬，让他习惯用理智切断情绪——现在圣杯六逆位更像打『回忆牌』来索取或试探，而非真心回到从前；未来倒吊人则把局面挂起：他未必立刻有激烈动作，但拖延、被动、等别人收拾烂摊子的倾向很重。后果上，你若过早心软，可能一起陷进停滞；若守住边界，他会被迫面对自己欠下的账。」',
        ].join('\n')
      : '';

  const system = [
    '你是擅长叙事与共时性解读的塔罗陪读人：把牌面画面、心理学母题与用户真实处境织成一篇可读的故事。',
    '语气：坚定、温柔、具体；用「你」；禁止绝对吉凶与日期定数。',
    '【写作结构】',
    '1) 开篇 2–3 句：直接回答用户真正在问的事（不要寒暄、不要「好我们就按…」）。',
    '2) 中段：按牌位时间线讲故事——每张牌写「画面意象 → 对应到问句的哪一层 → 与上一张如何承接」。',
    '3) 末段：综合判断（行为倾向 + 后果/边界）+ 一条针对用户处境的可执行建议（要具体，禁止空话）。',
    '【禁止】套话与模板：' + BANNED_PHRASES + '。',
    '【禁止】用「剧不剧透」「都不算剧烈牌」等敷衍句回避对用户问题的正面回应。',
    '【禁止】每张牌各写一小段标题式罗列而无因果串联；必须出现「因为…所以…」「若继续…则可能…」。',
    ...modeDirectives(mode, ctx.question),
    personalOn
      ? '用户已补充个人情况：必须引用其经历/顾虑中的至少一处细节，不要复述通用牌义百科。'
      : '用户未补充细节：仍须基于原问题与牌阵做具体推断，可标注「若实际情况是…则更像…」。',
    narrativeExample,
    `牌阵：${spreadLabel(ctx.spreadType)}`,
    `原问题：${ctx.question.trim() || '（未填写）'}`,
    '牌面：',
    cardLines(ctx.cards) || '（无牌）',
    intuition ? `用户抽牌时的直觉：${intuition}` : '',
    ctx.summary ? `离线一句话（可深化，勿照抄）：${ctx.summary}` : '',
    offline ? `离线串讲（在此基础上深化、纠错、补后果，勿整段复述）：\n${offline}` : '',
    '篇幅：380–520 字；可分段，但不要固定四段小标题。',
  ]
    .filter(Boolean)
    .join('\n');

  const user = personalOn
    ? [
        '请结合我的情况，对这次抽牌做一次更贴合的深度解读。',
        `原问题：${ctx.question.trim() || '（未填写）'}`,
        ...formatPersonalContextLines(personal),
      ].join('\n')
    : [
        '请基于原问题与牌阵，直接做一次清晰、有故事线、敢点破后果的深度解读。',
        `原问题：${ctx.question.trim() || '（未填写）'}`,
      ].join('\n');

  return { system, user };
}

export function buildTarotFollowupSystemPrompt(
  ctx: TarotReadingContext & { deepReading?: string },
): string {
  return [
    '你是塔罗陪读人：追问时只答这一问，150–280 字；语气具体，禁止套话与绝对判决。',
    `牌阵：${spreadLabel(ctx.spreadType)}`,
    `用户原问题：${ctx.question.trim() || '（未填写）'}`,
    '牌面：',
    cardLines(ctx.cards) || '（无牌）',
    ctx.summary ? `系统一句话（可参考，勿照抄）：${ctx.summary}` : '',
    ctx.deepReading
      ? `已有深度解读（对照、深化，勿整段复述）：\n${ctx.deepReading.slice(0, 1200)}`
      : '',
    '结尾给一个很小的、与当前处境相关的下一步。',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildTarotFollowupPresets(ctx: TarotReadingContext): string[] {
  const mode = inferQuestionMode(ctx.question);
  if (mode === 'action_outcome') {
    return [
      '若他真来试探/索取，我最稳妥的回应方式是什么？',
      '牌阵里哪张在提醒我「后果」会落在谁身上？',
      '我怎样设边界，又不把自己弄得更累？',
    ];
  }
  if (mode === 'why') {
    return [
      '除了牌面说的，还有哪些现实因素可能在驱动他？',
      '这张牌最想让我看见什么，而不是害怕什么？',
      '若我继续追问，最该先核实哪一件事实？',
    ];
  }
  const focus = ctx.cards[0]?.name;
  const q = ctx.question;
  if (/爱|感情|关系|他|她|分手|复合/.test(q)) {
    return [
      '如果我还想继续这段关系，最稳妥的沟通方式是什么？',
      '牌阵里「逆位」或张力，是不是在提醒我边界？',
      '我怎样设边界，又不把自己弄得更累？',
    ];
  }
  if (/工作|离职|offer|面试|薪|转正|项目/.test(q)) {
    return [
      '如果我现在就行动，最该先做哪一件小事？',
      '牌象里最该警惕的风险是什么？',
      '怎样判断该加码还是该撤？',
    ];
  }
  return [
    focus ? `对照「${focus}」，我现在最该先做哪一件小事？` : '我现在最该先做哪一件小事？',
    '如果局势继续拖着，我怎样判断该坚持还是该松手？',
    '这阵牌最想提醒我看见什么，而不是害怕什么？',
  ];
}

/** 供单测：牌位时间框 */
export function positionalFrameForCard(
  name: string,
  position: string,
  index: number,
): string {
  return positionalFrame(
    {
      cardName: name,
      position,
    } as never,
    index,
  );
}
