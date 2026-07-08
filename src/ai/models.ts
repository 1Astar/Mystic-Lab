import { getProviderPreset } from './providers.ts';

export async function fetchAvailableModels(
  baseUrl: string,
  apiKey: string,
  providerId?: string,
): Promise<string[]> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error('请先填写 API Key');
  }

  const root = baseUrl.trim().replace(/\/$/, '');
  if (!root) {
    throw new Error('请先填写 API Base URL');
  }

  const res = await fetch(`${root}/models`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`拉取失败 (${res.status})${errText ? `: ${errText.slice(0, 80)}` : ''}`);
  }

  const data = (await res.json()) as { data?: { id?: string }[] };
  const ids = (data.data ?? [])
    .map((item) => item.id?.trim())
    .filter((id): id is string => Boolean(id));

  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    throw new Error('接口未返回可用模型');
  }

  return sortModels(unique, providerId);
}

export function getFallbackModels(providerId: string, currentModel?: string): string[] {
  const preset = getProviderPreset(providerId);
  const list = [...preset.fallbackModels];
  if (currentModel && !list.includes(currentModel)) {
    list.unshift(currentModel);
  }
  return list;
}

function sortModels(models: string[], providerId?: string): string[] {
  const preset = providerId ? getProviderPreset(providerId) : null;
  const priority = preset?.fallbackModels ?? [];

  return [...models].sort((a, b) => {
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.localeCompare(b);
  });
}
