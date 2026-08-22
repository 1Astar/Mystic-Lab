import {
  canUseMysticDeep,
  friendlyQuotaCopy,
  loadAiServiceMode,
} from '../ai/ai-mode.ts';
import { isMysticAiEndpointReady } from '../ai/mystic-ai-client.ts';
import { isAiConfigured } from '../ai/settings.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type ReadingStatusOpts = {
  provider?: 'mock' | 'llm';
  loading?: boolean;
  error?: string;
};

/** 结果页顶部：解析中 / 离线 / 额度 / AI 已增强 */
export function renderReadingStatusBanner(opts: ReadingStatusOpts): string {
  if (opts.loading) {
    return `<p class="reading-status-banner is-loading" role="status" aria-live="polite">正在解析牌阵，请稍候…</p>`;
  }
  if (opts.error?.trim()) {
    return `<p class="reading-status-banner is-error" role="alert">${escapeHtml(opts.error.trim())}</p>`;
  }

  if (opts.provider === 'llm') {
    return `<p class="reading-status-banner is-llm" role="status">已用 AI 增强本局解读 · 需要更长叙事可点右侧 <strong>✦ 深度解读</strong></p>`;
  }

  const mode = loadAiServiceMode();
  const copy = friendlyQuotaCopy(mode);
  const configured = isAiConfigured();
  const mysticReady = isMysticAiEndpointReady();

  if (mode === 'byok' && !configured) {
    return `<p class="reading-status-banner is-offline" role="status">当前为<strong>离线规则解读</strong>（尚未配置 AI Key）。下方是按牌规则串讲；配置 Key 或点右侧 <strong>✦ 深度解读</strong> 可生成更贴你的长文。</p>`;
  }
  if (mode === 'mystic' && !mysticReady) {
    return `<p class="reading-status-banner is-offline" role="status">当前为<strong>离线规则解读</strong>（Mystic AI 即将开放）。可先配置自己的 Key，或点 <strong>✦ 深度解读</strong> 查看说明。</p>`;
  }
  if (mode === 'mystic' && !canUseMysticDeep()) {
    return `<p class="reading-status-banner is-quota" role="status">当前为<strong>离线规则解读</strong>（免费 AI 次数已用完：${escapeHtml(copy.headline)}）。${escapeHtml(copy.detail)} 也可改用自己的 Key。</p>`;
  }

  return `<p class="reading-status-banner is-offline" role="status">当前为<strong>离线规则解读</strong>。下方已按牌阵串讲；点右侧 <strong>✦ 深度解读</strong> 可开启 AI 长文（${escapeHtml(copy.headline)}）。</p>`;
}
