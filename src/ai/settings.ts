import { inferProviderId } from './providers.ts';

export type AiSettings = {
  enabled: boolean;
  providerId: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Star PM 根地址，用于问法反馈同步，如 https://xxx.vercel.app */
  starPmBaseUrl: string;
  /** Ideas capture secret，仅本机保存 */
  starPmCaptureSecret: string;
};

const STORAGE_KEY = 'mystic-lab-ai-settings';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  providerId: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  starPmBaseUrl: '',
  starPmCaptureSecret: '',
};

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    const baseUrl = parsed.baseUrl?.trim() || DEFAULT_AI_SETTINGS.baseUrl;
    const providerId = parsed.providerId ?? inferProviderId(baseUrl);
    return {
      enabled: parsed.enabled ?? false,
      providerId,
      baseUrl,
      apiKey: parsed.apiKey ?? '',
      model: parsed.model?.trim() || DEFAULT_AI_SETTINGS.model,
      starPmBaseUrl: parsed.starPmBaseUrl?.trim() || DEFAULT_AI_SETTINGS.starPmBaseUrl,
      starPmCaptureSecret: parsed.starPmCaptureSecret ?? '',
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

export function isStarPmCaptureConfigured(settings = loadAiSettings()): boolean {
  return settings.starPmBaseUrl.trim().length > 0 && settings.starPmCaptureSecret.trim().length > 0;
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}
