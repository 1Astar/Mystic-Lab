/**
 * Mystic AI 托管客户端
 * 浏览器只请求同源 `/api/mystic`；上游 Key 只在 Cloudflare / 本地 Vite 服务端。
 * 禁止任何 VITE_*_KEY / VITE_*_TOKEN / VITE_*_SECRET。
 */
export type MysticChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export const MYSTIC_AI_BASE_URL = String(
  import.meta.env.VITE_MYSTIC_AI_URL || '',
)
  .trim()
  .replace(/\/$/, '');

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
