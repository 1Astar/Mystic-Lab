/**
 * Mystic AI 托管客户端（接口占位）
 * 就绪条件：构建时注入 VITE_MYSTIC_AI_URL（OpenAI 兼容 /chat/completions）
 */
export type MysticChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export const MYSTIC_AI_BASE_URL = (
  (import.meta.env.VITE_MYSTIC_AI_URL as string | undefined)?.trim() || ''
).replace(/\/$/, '');

/** 可选：托管鉴权；未接时为空 */
export const MYSTIC_AI_TOKEN = (
  (import.meta.env.VITE_MYSTIC_AI_TOKEN as string | undefined)?.trim() || ''
);

export function isMysticAiEndpointReady(): boolean {
  return Boolean(MYSTIC_AI_BASE_URL);
}

export async function mysticChatCompletions(input: {
  messages: MysticChatMessage[];
  temperature?: number;
  model?: string;
}): Promise<string> {
  if (!isMysticAiEndpointReady()) {
    throw new Error('MYSTIC_NOT_READY');
  }
  const res = await fetch(`${MYSTIC_AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(MYSTIC_AI_TOKEN ? { Authorization: `Bearer ${MYSTIC_AI_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      model: input.model || 'mystic-default',
      temperature: input.temperature ?? 0.55,
      messages: input.messages,
    }),
  });
  if (!res.ok) throw new Error(`Mystic AI 请求失败 (${res.status})`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) throw new Error('Mystic AI 返回为空');
  return text;
}
