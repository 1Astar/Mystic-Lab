/**
 * AI 双模式 + 本地额度文案（去工具感）
 * Mystic 托管接口未就绪时：模式可存、额度可演示；真请求走 BYOK。
 */
export type AiServiceMode = 'byok' | 'mystic';

export type AiQuotaState = {
  /** 已用深度解读次数 */
  deepUsed: number;
  /** 深度之后已用追问次数 */
  followUsed: number;
};

const MODE_KEY = 'mystic-lab-ai-service-mode';
const QUOTA_KEY = 'mystic-lab-ai-quota-v1';

/** 免费：1 次深度 + 2 次追问（Mystic 模式本地计数；BYOK 不限） */
export const FREE_DEEP_LIMIT = 1;
export const FREE_FOLLOW_LIMIT = 2;

export function loadAiServiceMode(): AiServiceMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === 'mystic' ? 'mystic' : 'byok';
  } catch {
    return 'byok';
  }
}

export function saveAiServiceMode(mode: AiServiceMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function loadAiQuota(): AiQuotaState {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { deepUsed: 0, followUsed: 0 };
    const p = JSON.parse(raw) as Partial<AiQuotaState>;
    return {
      deepUsed: Math.max(0, Number(p.deepUsed) || 0),
      followUsed: Math.max(0, Number(p.followUsed) || 0),
    };
  } catch {
    return { deepUsed: 0, followUsed: 0 };
  }
}

export function saveAiQuota(state: AiQuotaState): void {
  localStorage.setItem(QUOTA_KEY, JSON.stringify(state));
}

export function recordDeepUse(): AiQuotaState {
  const q = loadAiQuota();
  const next = { ...q, deepUsed: q.deepUsed + 1 };
  saveAiQuota(next);
  return next;
}

export function recordFollowUse(): AiQuotaState {
  const q = loadAiQuota();
  const next = { ...q, followUsed: q.followUsed + 1 };
  saveAiQuota(next);
  return next;
}

export type FriendlyQuotaCopy = {
  /** 短引导，如「免费体验一次深度解读」 */
  headline: string;
  /** 一句说明 */
  detail: string;
  /** deep | follow | exhausted | byok */
  phase: 'deep_free' | 'follow' | 'exhausted' | 'byok';
};

/** 禁止「今日剩余 N 次」式工具文案 */
export function friendlyQuotaCopy(
  mode: AiServiceMode = loadAiServiceMode(),
  quota: AiQuotaState = loadAiQuota(),
): FriendlyQuotaCopy {
  if (mode === 'byok') {
    return {
      phase: 'byok',
      headline: '用你的 AI，把这卦读得更贴你',
      detail: '已接上你的接口：深度解读与追问都按你的配置走。',
    };
  }
  if (quota.deepUsed < FREE_DEEP_LIMIT) {
    return {
      phase: 'deep_free',
      headline: '免费体验一次深度解读',
      detail: '第一次：让这卦结合你的经历与顾虑，重新分析一遍。',
    };
  }
  const left = Math.max(0, FREE_FOLLOW_LIMIT - quota.followUsed);
  if (left > 0) {
    return {
      phase: 'follow',
      headline: left === 2 ? '还可以继续追问 2 次' : `还可以继续追问 ${left} 次`,
      detail: '深度解读之后，把没问清的再问清楚。',
    };
  }
  return {
    phase: 'exhausted',
    headline: '这轮免费体验用完了',
    detail: '想继续的话，可用你自己的 AI，或之后开通 Mystic AI。',
  };
}

export function canUseMysticDeep(quota = loadAiQuota()): boolean {
  return quota.deepUsed < FREE_DEEP_LIMIT;
}

export function canUseMysticFollow(quota = loadAiQuota()): boolean {
  return quota.deepUsed >= FREE_DEEP_LIMIT && quota.followUsed < FREE_FOLLOW_LIMIT;
}
