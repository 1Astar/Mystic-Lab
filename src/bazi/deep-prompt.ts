/**
 * 八字深度解读 Prompt：盘面要点 → system/user（可单测）
 */
import type { PersonProfile } from '../life/types.ts';
import type { PersonalContext } from '../liuyao/personal-context.ts';
import {
  formatPersonalContextLines,
  hasPersonalContext,
} from '../liuyao/personal-context.ts';
import type { BaziChart } from './cast.ts';
import { buildBaziFacts } from './bazi-facts.ts';
import type { LuckCycles } from './luck-cycles.ts';
import { resolvePatternYongshen } from './pattern-yongshen.ts';
import { buildBaziPortrait } from './portrait-template.ts';

export type BaziDeepPromptInput = {
  chart: BaziChart;
  person: PersonProfile;
  question: string;
  ctx: PersonalContext;
  luck?: LuckCycles | null;
  /** 测试可注入定调 */
  headline?: string;
};

function pillarsLine(chart: BaziChart): string {
  return chart.pillars
    .filter((p) => !p.empty && p.key !== 'liunian')
    .map((p) => `${p.title}${p.stem}${p.branch}${p.stemGod ? `（${p.stemGod}）` : ''}`)
    .join(' · ');
}

function luckBrief(luck: LuckCycles | null | undefined): string {
  if (!luck) return '大运流年：暂无（缺性别或排盘未完成）';
  const dy = luck.dayun.find((d) => d.current);
  const ln =
    luck.liunian.find((l) => l.selected) || luck.liunian.find((l) => l.current);
  const dyPart = dy
    ? dy.empty
      ? `当前大运：童限（${dy.startYear}–${dy.endYear}，无干支）`
      : `当前大运：${dy.ganZhi}${dy.stemGod ? `（${dy.stemGod}）` : ''} · ${dy.startYear}–${dy.endYear}`
    : '当前大运：未命中';
  const lnPart = ln
    ? `流年：${ln.year} ${ln.ganZhi}${ln.stemGod ? `（${ln.stemGod}）` : ''}`
    : '流年：未选';
  return `${dyPart}；${lnPart}`;
}

function chartFactsBlock(
  chart: BaziChart,
  person: PersonProfile,
  luck?: LuckCycles | null,
  headline?: string,
): string[] {
  const facts = buildBaziFacts(chart);
  const py = resolvePatternYongshen(chart);
  const tone =
    headline?.trim() ||
    buildBaziPortrait(chart, { gender: person.gender }).keyword;
  return [
    `【日主】${facts.dayMaster}${facts.dayMasterWx || ''} · 月令强弱「${facts.dayStrength}」· ${py.bodyBand}`,
    `【格局】${py.patternName}（${py.method}）`,
    `【喜用】${py.yongWx.join('、') || '—'} · 【忌神】${py.jiWx.join('、') || '—'}`,
    `【四柱】${pillarsLine(chart)}`,
    `【十神侧重】${facts.dominantCategories.join('、') || '均衡偏淡'}`,
    `【定调参考】${tone}`,
    `【${luckBrief(luck)}】`,
    person.nickname ? `【档案称呼】${person.nickname}` : '',
  ].filter(Boolean);
}

/** 纯函数：生成八字深度解读 system/user */
export function buildBaziDeepPrompt(input: BaziDeepPromptInput): {
  system: string;
  user: string;
} {
  const personal = hasPersonalContext(input.ctx);

  const system = [
    '你是八字陪读教练，语气温暖、具体、可执行，禁止绝对吉凶判决与「缺什么就倒霉」话术。',
    '依据用户四柱要点与问题作答；先回应真正在问的事，再点出变量，最后给一个明天可做的一小步。',
    '约 280–420 字，口语化分段，不要套死板四段标题；可轻点十神/五行，但用人话解释。',
    personal
      ? '用户补充了个人情况，请贴合经历/目标/已发生/顾虑，勿复述百科。'
      : '用户未补充细节，基于问题与盘面做清晰可执行分析。',
    '',
    ...chartFactsBlock(input.chart, input.person, input.luck, input.headline),
  ]
    .filter(Boolean)
    .join('\n');

  const user = personal
    ? [
        '请结合我的情况，对八字命盘做一次更贴合的深度解读。',
        `原问题：${input.question.trim() || '（未填写，请按命盘与大运流年主题解读）'}`,
        ...formatPersonalContextLines(input.ctx),
      ].join('\n')
    : [
        '请基于问题与命盘，直接做一次清晰可执行的深度解读（我暂未补充更多个人细节）。',
        `原问题：${input.question.trim() || '（未填写，请按命盘与大运流年主题解读）'}`,
      ].join('\n');

  return { system, user };
}

/** 追问陪读 system：短答，带着深度解读与盘面要点 */
export function buildBaziFollowupSystemPrompt(input: {
  chart: BaziChart;
  person: PersonProfile;
  question: string;
  luck?: LuckCycles | null;
  headline?: string;
  deepReading?: string;
}): string {
  const deep = input.deepReading?.trim() || '';
  return [
    '你是八字陪读教练，语气温暖、具体、可执行，禁止绝对吉凶判决与「缺什么就倒霉」话术。',
    '用户在读完深度解读后继续追问：直接回答这一问，150–280 字，口语化，用「你」；结尾给一个很小的下一步。',
    '不要重复套固定四段标题；可轻点十神/五行，但用人话。勿整段复述深度解读。',
    '',
    ...chartFactsBlock(input.chart, input.person, input.luck, input.headline),
    `原问题：${input.question.trim() || '（未填写）'}`,
    deep
      ? `已生成的深度解读（可参考，勿照抄）：\n${deep.slice(0, 1200)}${deep.length > 1200 ? '…' : ''}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** 追问预设（口语快问） */
export function buildBaziFollowupPresets(input: {
  chart: BaziChart;
  question: string;
}): string[] {
  const py = resolvePatternYongshen(input.chart);
  const q = input.question.trim();
  const yong = py.yongWx.join('、') || '喜用五行';
  if (/工作|职业|换工作|离职|升职|offer/i.test(q)) {
    return [
      '对照今年大运流年，换工作是该冲还是先稳住？',
      `我的喜用偏「${yong}」，日常怎么用在工作节奏上？`,
      '如果只能改一件事，我这周最该先做哪件小事？',
    ];
  }
  if (/感情|恋爱|婚姻|分手|复合/i.test(q)) {
    return [
      '这段关系里，我怎样设边界又不把自己弄更累？',
      `格局是「${py.patternName}」，对相处方式有什么提示？`,
      '我这周能做的最小一步是什么？',
    ];
  }
  return [
    `「${py.patternName}」对我眼下最实用的提醒是什么？`,
    `喜用「${yong}」，我明天能怎么用一小下？`,
    '如果局势继续拖着，我怎样判断该加码还是该缓？',
  ];
}
