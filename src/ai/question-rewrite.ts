import { buildNegativeMemoryBlock } from './question-feedback-sync.ts';
import type { RewriteCandidate } from './question-feedback.ts';
import { isAiConfigured, loadAiSettings, type AiSettings } from './settings.ts';

export type QuestionRewriteResult = {
  candidates: RewriteCandidate[];
  raw: string;
};

function stripFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fence ? fence[1].trim() : trimmed;
}

export function parseRewriteResponse(raw: string): RewriteCandidate[] {
  const text = stripFence(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('AI 返回不是合法 JSON');
    parsed = JSON.parse(text.slice(start, end + 1));
  }

  const obj = parsed as { candidates?: unknown };
  if (!Array.isArray(obj.candidates) || obj.candidates.length === 0) {
    throw new Error('AI 未返回候选问题');
  }

  const candidates: RewriteCandidate[] = [];
  for (const item of obj.candidates.slice(0, 3)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { label?: unknown; question?: unknown };
    const label = String(row.label ?? '').trim() || '开放式';
    const question = String(row.question ?? '').trim();
    if (question.length >= 2) candidates.push({ label, question });
  }

  if (candidates.length < 1) throw new Error('候选问题解析失败');
  while (candidates.length < 3 && candidates[0]) {
    candidates.push({ ...candidates[0], label: `${candidates[0].label}·另法` });
  }
  return candidates.slice(0, 3);
}

function buildUserPrompt(
  originalQuestion: string,
  previous?: RewriteCandidate[],
): string {
  const memory = buildNegativeMemoryBlock();
  const parts = [
    `用户原问题：${originalQuestion}`,
    '',
    '请改写成 3 条更适合塔罗占问的开放式问题。',
    '要求：',
    '1. 必须比原问更开放，避免「会不会/能不能/什么时候一定/吗」式封闭收束',
    '2. 保留原问主题与人称，不跑题',
    '3. 中文；每条问话不超过 40 字',
    '4. label 用短词，如「看阻碍」「看行动」「看两面」',
    '5. 只输出 JSON，格式：{"candidates":[{"label":"...","question":"..."},...]}，恰好 3 条',
  ];
  if (previous && previous.length > 0) {
    parts.push(
      '',
      '上一轮候选（请给出不同表述，勿原样重复）：',
      ...previous.map((c, i) => `${i + 1}. [${c.label}] ${c.question}`),
    );
  }
  if (memory) {
    parts.push('', '用户近期不满意的反馈（请避开同类问题）：', memory);
  }
  return parts.join('\n');
}

export async function rewriteQuestionOpen(
  originalQuestion: string,
  options?: {
    previous?: RewriteCandidate[];
    settings?: AiSettings;
  },
): Promise<QuestionRewriteResult> {
  const settings = options?.settings ?? loadAiSettings();
  if (!isAiConfigured(settings)) {
    throw new Error('请先在「AI 解读」中启用并配置 API Key');
  }

  const q = originalQuestion.trim();
  if (q.length < 2) throw new Error('请先填写问题');

  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.75,
      messages: [
        {
          role: 'system',
          content:
            '你是塔罗提问教练。只输出合法 JSON，不要 markdown，不要解释。帮助用户把封闭式问题改成开放式占问。',
        },
        {
          role: 'user',
          content: buildUserPrompt(q, options?.previous),
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
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('AI 返回为空');

  return { candidates: parseRewriteResponse(raw), raw };
}
