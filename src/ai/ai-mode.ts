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

/** 统一剩余次数文案（深度 + 追问 + 分享奖励合计） */
export function formatQuotaCounts(quota: AiQuotaState = loadAiQuota()): string {
  return `剩余 ${freeAiRemaining(quota)} 次`;
}

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

  const deepLeft = Math.max(0, FREE_DEEP_LIMIT - quota.deepUsed);
  const followLeft = Math.max(0, FREE_FOLLOW_LIMIT - quota.followUsed);
  const bonus = Math.max(0, quota.bonusCredits);
  const headline = formatQuotaCounts(quota);

  if (deepLeft > 0) {
    return {
      phase: 'deep_free',
      headline,
      detail: '深度解读与追问共用次数；用完可分享再得，或改用自己的 AI。',
    };
  }
  if (followLeft > 0) {
    return {
      phase: 'follow',
      headline,
      detail: '深度解读与追问共用次数；用完可分享再得，或改用自己的 AI。',
    };
  }
  if (bonus > 0) {
    return {
      phase: 'bonus',
      headline,
      detail: '来自分享被打开，或你打开了别人的分享。',
    };
  }
  return {
    phase: 'exhausted',
    headline,
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
