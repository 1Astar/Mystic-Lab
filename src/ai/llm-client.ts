import type { CardReading } from '../interpretation/types.ts';
import { loadAiSettings, type AiSettings } from './settings.ts';

export type LlmContextualRequest = {
  question: string;
  card: CardReading;
};

function buildPrompt({ question, card }: LlmContextualRequest): string {
  const orient = card.orientation === 'reversed' ? '逆位' : '正位';
  return [
    '你是 Mystic Lab 塔罗解读助手。请用温柔、具体、中文自然语言写「结合问题的解读」。',
    '要求：',
    '1. 必须结合用户问题与牌阵位置解读，不要只背牌义',
    '2. 不要给非黑即白预言，不要模板句如「能量正流动」',
    '3. 2–4 段，每段 1–3 句，总字数 120–220 字',
    '4. 只输出解读正文，不要标题、不要 markdown',
    '',
    `用户问题：${question || '（未填写）'}`,
    `牌阵位置：${card.position || '未知'}`,
    `位置含义：${card.positionMeaning || '—'}`,
    `牌名：${card.cardName}（${orient}）`,
    `关键词：${card.keywords.join('、')}`,
    `标准牌义：${card.selectedCard.oneSentence}`,
  ].join('\n');
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
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: '你是塔罗解读助手，输出简洁、有人味的中文解读。',
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
