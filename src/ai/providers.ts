export type AiProviderPreset = {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  /** 拉取失败时的备选模型 */
  fallbackModels: string[];
  hint?: string;
};

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI · GPT',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    fallbackModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    fallbackModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'openrouter-claude',
    name: 'Claude · OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    fallbackModels: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'anthropic/claude-sonnet-4',
    ],
    hint: 'Claude 官方接口非 OpenAI 格式，此处经 OpenRouter 网关调用',
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    defaultModel: '',
    fallbackModels: [],
  },
];

export function getProviderPreset(id: string): AiProviderPreset {
  return AI_PROVIDER_PRESETS.find((p) => p.id === id) ?? AI_PROVIDER_PRESETS[0]!;
}

export function inferProviderId(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\/$/, '').toLowerCase();
  if (!normalized) return 'custom';
  const hit = AI_PROVIDER_PRESETS.find(
    (p) => p.id !== 'custom' && normalized === p.baseUrl.replace(/\/$/, '').toLowerCase(),
  );
  return hit?.id ?? 'custom';
}
