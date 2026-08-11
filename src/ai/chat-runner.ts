/**
 * 统一聊天出口：BYOK / Mystic（可接接口）
 */
import { loadAiServiceMode } from './ai-mode.ts';
import { isAiConfigured, loadAiSettings } from './settings.ts';
import { isMysticAiEndpointReady, mysticChatCompletions } from './mystic-ai-client.ts';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type AiRunReady =
  | { ok: true; via: 'byok' | 'mystic' }
  | { ok: false; reason: 'need_byok' | 'mystic_soon' | 'mystic_quota' };

export function resolveAiRunReady(opts?: {
  /** mystic 深度是否还有免费体验 */
  mysticDeepOk?: boolean;
  mysticFollowOk?: boolean;
  kind?: 'deep' | 'follow';
}): AiRunReady {
  const mode = loadAiServiceMode();
  if (mode === 'byok') {
    if (isAiConfigured()) return { ok: true, via: 'byok' };
    return { ok: false, reason: 'need_byok' };
  }
  // mystic
  if (!isMysticAiEndpointReady()) {
    // 接口未接：若用户已配自己的 Key，可临时回落 BYOK 真跑
    if (isAiConfigured()) return { ok: true, via: 'byok' };
    return { ok: false, reason: 'mystic_soon' };
  }
  const kind = opts?.kind ?? 'deep';
  if (kind === 'deep' && opts?.mysticDeepOk === false) {
    return { ok: false, reason: 'mystic_quota' };
  }
  if (kind === 'follow' && opts?.mysticFollowOk === false) {
    return { ok: false, reason: 'mystic_quota' };
  }
  return { ok: true, via: 'mystic' };
}

export async function runChatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number },
): Promise<string> {
  const mode = loadAiServiceMode();
  if (mode === 'mystic' && isMysticAiEndpointReady()) {
    return mysticChatCompletions({
      messages,
      temperature: opts?.temperature,
    });
  }
  const settings = loadAiSettings();
  if (!isAiConfigured(settings)) throw new Error('NO_AI');
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: opts?.temperature ?? 0.55,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`AI 请求失败 (${res.status})`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) throw new Error('AI 返回为空');
  return text;
}
