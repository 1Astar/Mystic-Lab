/**
 * AI 双模式 + 本地额度（免费深度/追问 + 分享赠送 bonusCredits）
 */
export type AiServiceMode = 'byok' | 'mystic';

export type AiQuotaState = {
  deepUsed: number;
  followUsed: number;
  /** 分享奖励：深度或追问各扣 1 */
  bonusCredits: number;
};

const MODE_KEY = 'mystic-lab-ai-service-mode';
const QUOTA_KEY = 'mystic-lab-ai-quota-v1';

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
    if (!raw) return { deepUsed: 0, followUsed: 0, bonusCredits: 0 };
    const p = JSON.parse(raw) as Partial<AiQuotaState>;
    return {
      deepUsed: Math.max(0, Number(p.deepUsed) || 0),
      followUsed: Math.max(0, Number(p.followUsed) || 0),
      bonusCredits: Math.max(0, Number(p.bonusCredits) || 0),
    };
  } catch {
    return { deepUsed: 0, followUsed: 0, bonusCredits: 0 };
  }
}

export function saveAiQuota(state: AiQuotaState): void {
  localStorage.setItem(
    QUOTA_KEY,
    JSON.stringify({
      deepUsed: state.deepUsed,
      followUsed: state.followUsed,
      bonusCredits: state.bonusCredits ?? 0,
    }),
  );
}

/** 还剩多少次免费 AI（含分享赠送） */
export function freeAiRemaining(quota = loadAiQuota()): number {
  const deepLeft = Math.max(0, FREE_DEEP_LIMIT - quota.deepUsed);
  const followLeft = Math.max(0, FREE_FOLLOW_LIMIT - quota.followUsed);
  return deepLeft + followLeft + quota.bonusCredits;
}

export function grantBonusCredits(n: number): AiQuotaState {
  const q = loadAiQuota();
  const next = {
    ...q,
    bonusCredits: q.bonusCredits + Math.max(0, Math.floor(n)),
  };
  saveAiQuota(next);
  return next;
}

function consumeBonusOr(record: () => AiQuotaState): AiQuotaState {
  const q = loadAiQuota();
  if (q.bonusCredits > 0) {
    const next = { ...q, bonusCredits: q.bonusCredits - 1 };
    saveAiQuota(next);
    return next;
  }
  return record();
}

export function recordDeepUse(): AiQuotaState {
  return consumeBonusOr(() => {
    const q = loadAiQuota();
    const next = { ...q, deepUsed: q.deepUsed + 1 };
    saveAiQuota(next);
    return next;
  });
}

export function recordFollowUse(): AiQuotaState {
  return consumeBonusOr(() => {
    const q = loadAiQuota();
    const next = { ...q, followUsed: q.followUsed + 1 };
    saveAiQuota(next);
    return next;
  });
}

export type FriendlyQuotaCopy = {
  headline: string;
  detail: string;
  phase: 'deep_free' | 'follow' | 'exhausted' | 'byok' | 'bonus';
};

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
  const followLeft = Math.max(0, FREE_FOLLOW_LIMIT - quota.followUsed);
  if (followLeft > 0) {
    return {
      phase: 'follow',
      headline:
        followLeft === 2
          ? '还可以继续追问 2 次'
          : `还可以继续追问 ${followLeft} 次`,
      detail: '深度解读之后，把没问清的再问清楚。',
    };
  }
  if (quota.bonusCredits > 0) {
    return {
      phase: 'bonus',
      headline:
        quota.bonusCredits === 1
          ? '还有 1 次免费 AI（分享奖励）'
          : `还有 ${quota.bonusCredits} 次免费 AI（分享奖励）`,
      detail: '来自分享被打开，或你打开了别人的分享。',
    };
  }
  return {
    phase: 'exhausted',
    headline: '这轮免费体验用完了',
    detail: '分享结果给好友，对方打开后你也可再得次数；或用自己的 AI。',
  };
}

export function canUseMysticDeep(quota = loadAiQuota()): boolean {
  return quota.bonusCredits > 0 || quota.deepUsed < FREE_DEEP_LIMIT;
}

export function canUseMysticFollow(quota = loadAiQuota()): boolean {
  if (quota.bonusCredits > 0) return true;
  return quota.deepUsed >= FREE_DEEP_LIMIT && quota.followUsed < FREE_FOLLOW_LIMIT;
}
