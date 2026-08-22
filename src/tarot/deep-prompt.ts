/**
 * 塔罗深度解读 / 追问提示词
 */
import type { ReadingResult } from '../interpretation/types.ts';
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

export function buildTarotDeepPrompt(
  ctx: TarotReadingContext,
  personal: PersonalContext,
): { system: string; user: string } {
  const personalOn = hasPersonalContext(personal);
  const thread = ctx.readingSnapshot?.questionThread?.answers
    ?.map((a) => `- ${a.question}: ${(a.insight || a.meaningMap || '').slice(0, 120)}`)
    .join('\n');

  const system = [
    '你是温柔而清醒的塔罗陪读人，帮助用户把牌象译回现实行动。',
    '禁止绝对吉凶判决；用「可能 / 倾向 / 值得留意」；口语化，用「你」。',
    personalOn
      ? '【深度贴合】用户补充了个人情况。请结合经历、目标与顾虑回应，不要复述通用牌义百科。'
      : '【快速分析】用户跳过了补充。基于原问题与牌阵做一次清晰、可执行的重述。',
    '先直接回应她真正在问的事，再点出牌阵里值得注意的张力，最后给一个明天就能做的一小步。',
    '不要每次都套固定四段标题；约 280–420 字。',
    `牌阵：${spreadLabel(ctx.spreadType)}`,
    `原问题：${ctx.question.trim() || '（未填写）'}`,
    '牌面：',
    cardLines(ctx.cards) || '（无牌）',
    ctx.summary ? `系统已给一句话（可参考，勿照抄）：${ctx.summary}` : '',
    thread ? `串讲要点（可参考）：\n${thread}` : '',
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
        '请基于原问题与牌阵，直接做一次清晰可执行的分析（我暂未补充更多个人细节）。',
        `原问题：${ctx.question.trim() || '（未填写）'}`,
      ].join('\n');

  return { system, user };
}

export function buildTarotFollowupSystemPrompt(
  ctx: TarotReadingContext & { deepReading?: string },
): string {
  return [
    '你是塔罗陪读人：把牌象译回用户的现实提问。语气坚定温柔，用「你」。',
    `牌阵：${spreadLabel(ctx.spreadType)}`,
    `用户原问题：${ctx.question.trim() || '（未填写）'}`,
    '牌面：',
    cardLines(ctx.cards) || '（无牌）',
    ctx.summary ? `系统一句话（可参考，勿照抄）：${ctx.summary}` : '',
    ctx.deepReading
      ? `已有深度解读（追问时对照，勿整段复述）：\n${ctx.deepReading.slice(0, 800)}`
      : '',
    '追问时直接回答这一问：150–280 字；结尾给一个很小的下一步。禁止绝对吉凶判决。',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildTarotFollowupPresets(ctx: TarotReadingContext): string[] {
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
