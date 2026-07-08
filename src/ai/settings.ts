export type AiSettings = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
};

const STORAGE_KEY = 'mystic-lab-ai-settings';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
};

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      enabled: parsed.enabled ?? false,
      baseUrl: parsed.baseUrl?.trim() || DEFAULT_AI_SETTINGS.baseUrl,
      apiKey: parsed.apiKey ?? '',
      model: parsed.model?.trim() || DEFAULT_AI_SETTINGS.model,
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAiSettings(settings: AiSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isAiConfigured(settings = loadAiSettings()): boolean {
  return settings.enabled && settings.apiKey.trim().length > 0;
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}
