/**
 * Mystic AI 托管客户端
 * 就绪条件：构建时注入 VITE_MYSTIC_AI_URL（指向 /api/mystic 或完整代理基址）
 * 上游 Key 只放 Cloudflare Runtime / 本地 .env.local 的 MYSTIC_UPSTREAM_*，勿用 VITE_ 前缀。
 */
export type MysticChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export const MYSTIC_AI_BASE_URL = String(
  import.meta.env.VITE_MYSTIC_AI_URL || '',
)
  .trim()
  .replace(/\/$/, '');

/** 可选：与代理 MYSTIC_PROXY_SECRET 对齐；多数情况留空即可 */
export const MYSTIC_AI_TOKEN = String(
  import.meta.env.VITE_MYSTIC_AI_TOKEN || '',
).trim();

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
