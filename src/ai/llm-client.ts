import type { CardReading } from '../interpretation/types.ts';
import {
  formatHotspotsForPrompt,
  topicSceneKeywords,
} from '../interpretation/structured-reading.ts';
import { loadAiSettings, type AiSettings } from './settings.ts';

export type LlmContextualRequest = {
  question: string;
  card: CardReading;
  background?: string;
  /** 追问时：用户原问题 */
  originalQuestion?: string;
  isFollowUp?: boolean;
};

function buildPrompt(req: LlmContextualRequest): string {
  const { question, card, background, originalQuestion, isFollowUp } = req;
  const orient = card.orientation === 'reversed' ? '逆位' : '正位';
  const sceneKw = topicSceneKeywords(card.selectedCard, card.topic);
  const bg = background?.trim() || card.readingContext.background?.trim();
  const hotspots = formatHotspotsForPrompt(card.selectedCard.deckId);

  return [
    '你是一位有 10 年经验的塔罗占卜师。',
    `用户当前抽到的牌是【${card.cardName}】（${orient}）。请结合下方牌面元素拆解，针对用户问题进行解答。`,
    '要求：将牌面元素（如资源有限、需取舍）翻译成用户问题场景中的具体现实问题，不要照抄牌意。',
    '',
    '必须严格按 JSON 输出（不要 markdown 代码围栏），格式：',
    JSON.stringify({
      overview: '热点整体解读·总结论',
      elementMappings: [
        {
          label: '偷走的剑',
          title: '现实状况：「偷走的剑」意味着什么？',
          originalMeaning: '只拿走得动的那几把——资源有限，需取舍。',
          body: '映射到求职等场景的具体说法',
        },
      ],
      advice: '可操作建议',
      comfort: '心理疏导',
      actionTags: ['广撒网多面试', '挖内推'],
      followUps: ['追问1？', '追问2？', '追问3？'],
    }),
    '',
    '结构说明：',
    '1. overview：第一步·热点整体解读（先给总结论，结合问题）',
    '2. elementMappings：第二步·元素拆解；必须同时给 originalMeaning（牌面原意，保留热点库原话或忠实复述）与 body（映射到用户问题场景的现实说法）；title 用「现实状况：「元素名」意味着什么？」；禁止只写场景、丢掉原意，也禁止只抄原意不映射',
    '3. advice：第三步·结合答案的具体行动建议',
    '4. comfort：一句安抚与鼓励',
    '5. actionTags：3–4 个短行动指令（不要「风」「流动」这类抽象词）',
    '6. followUps：2–3 个用户可能想继续追问的短问题（带问号）',
    '',
    '硬性约束：',
    '- 用「你」称呼；先结论后原因再建议',
    '- 不问准日期定数；问「什么时候」就谈窗口与可做之事',
    '- 用户未提供的公司名、薪资数字、私密情节不要虚构',
    '- elementMappings 每条都必须包含 originalMeaning + body 两段',
    isFollowUp
      ? '- 这是追问：在同一张牌与同一套元素拆解上深化，不要重复第一段空话'
      : '',
    '',
    isFollowUp && originalQuestion
      ? `用户原问题：${originalQuestion}`
      : '',
    `用户${isFollowUp ? '追问' : '问题'}：${question || '（未填写）'}`,
    bg ? `用户补充背景：${bg}` : '用户补充背景：（无）',
    `牌阵位置：${card.position || '未知'}（${card.positionMeaning || '—'}）`,
    `场景关键词提炼：${sceneKw}`,
    `标准一句话：${card.selectedCard.oneSentence}`,
    '',
    hotspots,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function fetchContextualReading(
  req: LlmContextualRequest,
  settings: AiSettings = loadAiSettings(),
): Promise<string> {
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.65,
      messages: [
        {
          role: 'system',
          content:
            '你是资深塔罗师。只输出合法 JSON：overview/elementMappings/advice/comfort/actionTags/followUps。elementMappings 每条必须含 originalMeaning（牌面原意）与 body（场景映射）。禁止丢掉原意、禁止编造未提供细节。',
        },
        {
          role: 'user',
          content: buildPrompt(req),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI 请求失败 (${res.status})${errText ? `: ${errText.slice(0, 120)}` : ''}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('AI 返回为空');
  return text;
}

/** 最小请求，用于配置页验证 Base URL / Key / 模型是否可用 */
export async function testAiConnection(settings: AiSettings): Promise<string> {
  const baseUrl = settings.baseUrl.trim().replace(/\/$/, '');
  const apiKey = settings.apiKey.trim();
  const model = settings.model.trim();

  if (!baseUrl) throw new Error('请先填写 API Base URL');
  if (!apiKey) throw new Error('请先填写 API Key');
  if (!model) throw new Error('请先选择或填写模型');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 20,
      temperature: 0,
      messages: [{ role: 'user', content: '请只回复两个字：成功' }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(formatApiError(res.status, errText));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('接口已连通，但返回内容为空');
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

function formatApiError(status: number, raw: string): string {
  if (!raw) return `请求失败 (${status})`;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    const msg = parsed.error?.message?.trim();
    if (msg) return `请求失败 (${status})：${msg.slice(0, 120)}`;
  } catch {
    /* ignore */
  }
  return `请求失败 (${status})：${raw.slice(0, 120)}`;
}
