import type { CastResult } from './engine.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { buildLearnFaq } from './narrative-learn.ts';
import { isAiConfigured, loadAiSettings } from '../ai/settings.ts';
import {
  findAskEntry,
  normalizeAskQuestion,
  upsertAskEntry,
  type AskVaultEntry,
} from './ask-vault.ts';

export type AskAnswerResult = {
  entry: AskVaultEntry;
  answer: string;
  source: 'rule' | 'ai' | 'cached';
  hint?: string;
};

/** 规则兜底：近邻 FAQ / 用神与卦名短答 */
export function answerAskByRules(
  cast: CastResult,
  question: string,
  userAsk: string,
  castAt = new Date(),
): { answer: string; domain: string } {
  const facts = buildReadingFacts(cast, question, castAt);
  const qKey = normalizeAskQuestion(userAsk);
  const faq = buildLearnFaq(facts);
  const hit = faq.find((f) => {
    const fq = normalizeAskQuestion(f.q);
    return fq === qKey || (qKey.length >= 4 && (fq.includes(qKey) || qKey.includes(fq)));
  });
  if (hit) {
    return { answer: hit.a.join(''), domain: facts.domain };
  }

  const bits = [
    `本卦「${facts.primary.fullName}」主题偏「${facts.themeWord}」。`,
    facts.yong.tip,
    facts.changed
      ? `有动则看变向「${facts.changed.fullName}」：先观察再做可验证的一小步。`
      : '无动则宜先稳住当下边界，再等窗口。',
    '（当前为规则短答；配置 AI 后可结合你的原问题讲得更贴。）',
  ];
  return { answer: bits.filter(Boolean).join(''), domain: facts.domain };
}

async function answerAskViaLlm(
  cast: CastResult,
  question: string,
  userAsk: string,
  castAt: Date,
): Promise<string> {
  const settings = loadAiSettings();
  const facts = buildReadingFacts(cast, question, castAt);
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const prompt = [
    '你是六爻教学助教，帮助用户弄懂卦象结构，不是替用户下绝对吉凶判决。',
    `本卦：${facts.primary.fullName}；变卦：${facts.changed?.fullName ?? '无'}；动爻：${facts.changing.labels.join('、') || '无'}；用神倾向：${facts.yong.name}。`,
    `用户原占问题：${question || '（未填）'}`,
    `用户此刻追问：${userAsk}`,
    '请只输出合法 JSON：{"answer":"80-180字短答","next":"一句可自问的下一步（可空）"}',
    '用「你」称呼；先结论后原因；禁止恐吓、宿命论、医疗法律替代建议。',
  ].join('\n');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: '你是六爻教学助教。只输出 JSON：answer / next。',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI 请求失败 (${res.status})`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  let text = data.choices?.[0]?.message?.content?.trim() ?? '';
  text = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(text) as { answer?: string; next?: string };
  const answer = (parsed.answer ?? '').trim();
  if (!answer) throw new Error('AI 返回为空');
  const next = (parsed.next ?? '').trim();
  return next ? `${answer}\n\n还可自问：${next}` : answer;
}

/** 回答并入库。同键复用答案并累加 askCount。 */
export async function answerAndStoreAsk(input: {
  cast: CastResult;
  question: string;
  userAsk: string;
  castAt?: Date;
}): Promise<AskAnswerResult> {
  const castAt = input.castAt ?? new Date();
  const qKey = normalizeAskQuestion(input.userAsk);
  if (!qKey) throw new Error('问题过短，请写完整一点（至少四个字）');

  const hexName = input.cast.primary.name;
  const found = findAskEntry(hexName, input.userAsk);
  if (found?.a.trim()) {
    const cachedSource =
      found.source === 'ai' || found.source === 'rule' ? found.source : 'rule';
    const entry = upsertAskEntry({
      q: input.userAsk,
      a: found.a,
      hexName,
      domain: found.domain,
      source: cachedSource,
      readingQuestion: input.question,
    });
    return { entry, answer: entry.a, source: 'cached' };
  }

  let answer: string;
  let source: 'rule' | 'ai' = 'rule';
  let hint: string | undefined;
  const rule = answerAskByRules(input.cast, input.question, input.userAsk, castAt);

  if (isAiConfigured()) {
    try {
      answer = await answerAskViaLlm(input.cast, input.question, input.userAsk, castAt);
      source = 'ai';
    } catch {
      answer = rule.answer;
      source = 'rule';
      hint = 'AI 暂不可用，已用规则短答。';
    }
  } else {
    answer = rule.answer;
    hint = '未配置 AI 时使用规则短答；可在 AI 解读设置中启用。';
  }

  const entry = upsertAskEntry({
    q: input.userAsk,
    a: answer,
    hexName,
    domain: rule.domain,
    source,
    readingQuestion: input.question,
  });

  return { entry, answer: entry.a, source, hint };
}
