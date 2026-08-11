/**
 * 流年占问：规则事实（四化/宫位/神煞）+ LLM 个性化
 * 无 AI 时降级为规则解读，不用关键词桶模板当主答。
 */
import type { PersonProfile } from '../life/types.ts';
import {
  canUseMysticDeep,
  canUseMysticFollow,
  recordFollowUse,
  loadAiServiceMode,
} from '../ai/ai-mode.ts';
import { resolveAiRunReady, runChatCompletion } from '../ai/chat-runner.ts';
import { isAiConfigured } from '../ai/settings.ts';
import type { AnnualAdvice, ZiweiChartView } from './types.ts';

const CACHE_PREFIX = 'mystic-lab.ziwei-annual-ask.';
/** 测试 / 无 localStorage 时的内存兜底 */
const memoryCache = new Map<string, string>();

function hashQuestion(q: string): string {
  const s = q.trim().slice(0, 120);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `${s.length}_${(h >>> 0).toString(36)}`;
}

function cacheKey(personId: string, year: number, question: string): string {
  return `${CACHE_PREFIX}${personId}.${year}.${hashQuestion(question)}`;
}

export function loadAnnualAskCache(
  personId: string,
  year: number,
  question: string,
): string | null {
  const k = cacheKey(personId, year, question);
  try {
    const t = localStorage.getItem(k)?.trim();
    if (t) return t;
  } catch {
    /* ignore */
  }
  return memoryCache.get(k) ?? null;
}

export function saveAnnualAskCache(
  personId: string,
  year: number,
  question: string,
  text: string,
): void {
  const k = cacheKey(personId, year, question);
  if (!text.trim()) {
    memoryCache.delete(k);
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    return;
  }
  memoryCache.set(k, text.trim());
  try {
    localStorage.setItem(k, text.trim());
  } catch {
    /* ignore */
  }
}

/** 给 LLM / 降级展示用的规则事实块 */
export function formatAnnualRuleBrief(
  view: ZiweiChartView,
  annual: AnnualAdvice,
): string {
  const soul = view.soulPalace.majors.map((s) => s.name).join('、') || '空象';
  return [
    `流年 ${annual.year}`,
    `四化：${annual.mutagenLine}`,
    `关注宫位：${annual.focusPalaces.join('、') || '—'}`,
    annual.shenshaLine ? `神煞叠读：${annual.shenshaLine}` : '',
    `命盘定调：${view.theater.headline}`,
    `命宫主星：${soul} · ${view.fiveElementsClass}`,
    `规则底稿：${annual.advice}`,
    `传统口径：${annual.traditional}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 问题域提示（只约束 LLM 对照宫位，不写死答复） */
function questionDomainHint(question: string): string {
  const q = question.trim();
  if (/工作|换|跳槽|职业|事业|官|升|创业|面试/.test(q)) {
    return '本题偏事业：请优先对照官禄、迁移、仆役与流年四化落点。';
  }
  if (/感情|恋爱|结婚|分手|关系|桃花|伴侣/.test(q)) {
    return '本题偏感情：请优先对照夫妻、福德、仆役与流年四化落点。';
  }
  if (/钱|财|收入|投资|买房|花销/.test(q)) {
    return '本题偏财运：请优先对照财帛、田宅与流年化禄/化忌。';
  }
  if (/健康|身体|病|睡眠|压力/.test(q)) {
    return '本题偏身心：请优先对照疾厄、福德与化忌落点。';
  }
  return '请对照流年命宫、四化落宫与关注宫位作答，勿空泛。';
}

export type AnnualAskResult = {
  text: string;
  source: 'llm' | 'rule' | 'cache';
  message?: string;
};

/**
 * 先规则，再 LLM 个性化。AI 未就绪或失败 → 返回规则底稿。
 */
export async function personalizeAnnualAsk(opts: {
  view: ZiweiChartView;
  person: PersonProfile;
  question: string;
}): Promise<AnnualAskResult> {
  const annual = opts.view.theater.annual;
  const q = opts.question.trim() || annual.question;
  const cached = loadAnnualAskCache(opts.person.id, annual.year, q);
  if (cached) return { text: cached, source: 'cache' };

  const ruleText = annual.advice;
  const ready = resolveAiRunReady({
    kind: 'follow',
    mysticFollowOk: canUseMysticFollow(),
    mysticDeepOk: canUseMysticDeep(),
  });

  if (!ready.ok) {
    let message = '当前用规则解读；接上 AI 后可个性化。';
    if (ready.reason === 'need_byok') {
      message = isAiConfigured()
        ? 'AI 未就绪，先展示规则解读。'
        : '尚未配置 AI，先展示规则解读。可在设置里接上 Key。';
    } else if (ready.reason === 'mystic_quota') {
      message = '体验次数用完，先展示规则解读。';
    } else if (ready.reason === 'mystic_soon') {
      message = isAiConfigured()
        ? 'Mystic AI 未开；可改用自己的 Key。先展示规则解读。'
        : 'Mystic AI 即将开放；先展示规则解读。';
    }
    return { text: ruleText, source: 'rule', message };
  }

  const brief = formatAnnualRuleBrief(opts.view, annual);
  const system = [
    '你是紫微斗数陪读教练。必须严格依据【规则事实】作答，禁止编造盘面没有的宫星与四化。',
    '语气温暖、具体、可执行；禁止绝对吉凶判决与恐吓。',
    '结构：①直接回答所问 ②点出今年变量（对照四化/宫位）③给一个本周可做的小行动。',
    '约 180–280 字，口语分段，不要用死板小标题。',
    questionDomainHint(q),
  ].join('\n');

  const user = [
    `我的问题：${q}`,
    opts.person.nickname ? `称呼：${opts.person.nickname}` : '',
    '',
    '【规则事实】',
    brief,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const text = await runChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.5 },
    );
    if (loadAiServiceMode() === 'mystic') recordFollowUse();
    saveAnnualAskCache(opts.person.id, annual.year, q, text);
    return { text, source: 'llm' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '分析失败';
    return {
      text: ruleText,
      source: 'rule',
      message:
        msg === 'NO_AI'
          ? 'AI 未接通，先展示规则解读。'
          : `个性化未完成（${msg}），先展示规则解读。`,
    };
  }
}
