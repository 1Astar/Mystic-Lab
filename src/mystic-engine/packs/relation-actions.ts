import type { IntentId, RiskPreference, SceneAction, Tone, UserContext } from '../types.ts';

type ActionRow = {
  intent: IntentId;
  tones: Tone[];
  breakthrough: { title: string; body: string };
  checklist: Array<{ title: string; body: string }>;
};

/** 关系场景动作库 */
export const RELATION_ACTION_ROWS: ActionRow[] = [
  {
    intent: 'love_ambiguous',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '一次低压力试探',
      body: '本周用一次轻量邀约或明确但温和的表态试探对方意愿；看回应是配合、含糊还是回避，再决定是否加码。',
    },
    checklist: [
      { title: '设观察期', body: '给 1–2 周短观察，不无限拉扯。' },
    ],
  },
  {
    intent: 'love_ambiguous',
    tones: ['cut', 'open', 'hard', 'neutral'],
    breakthrough: {
      title: '把期待说清楚',
      body: '挑一个合适时机，用一句话说清你想确认的是「继续暧昧」还是「进入明确关系」，要一个可核对的回应。',
    },
    checklist: [],
  },
  {
    intent: 'love_conflict',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '只拆一个冲突点',
      body: '本周只挑一件最堵的争执谈开，不翻旧账；先对齐事实，再谈感受与边界。',
    },
    checklist: [
      { title: '冷却再谈', body: '若当场升温，先约一个固定时间再谈，避免冷战无限延长。' },
    ],
  },
  {
    intent: 'love_reunion',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '先看对方动作',
      body: '复合不宜硬推。先观察对方是否主动修复；你只做一次清晰、低姿态的沟通，用回应决定是否继续。',
    },
    checklist: [
      { title: '护边界', body: '若反复内耗无进展，允许暂停加码。' },
    ],
  },
  {
    intent: 'love_reunion',
    tones: ['cut', 'open', 'hard', 'neutral'],
    breakthrough: {
      title: '一次明确复合对话',
      body: '约一次正式谈：各自要什么条件才能重新开始；谈不成也把句号画清楚。',
    },
    checklist: [],
  },
  {
    intent: 'love_marriage',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '对齐婚姻现实清单',
      body: '把彩礼/城市/时间表/家庭期待写成清单，分项谈清；未对齐前不催着「先结了再说」。',
    },
    checklist: [
      { title: '一小步验证', body: '本周只推进一项可打勾事项（见家长/谈时间/谈财务）。' },
    ],
  },
  {
    intent: 'love_likes',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '用行动试探好感',
      body: '少猜多验证：本周一次具体互动，看对方是否配合与主动，再判断好感深浅。',
    },
    checklist: [],
  },
  {
    intent: 'love_contact',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '一次有主题的联系',
      body: '若要联系，带一个具体事由（不是空问候）；看对方回复质量决定是否跟进。',
    },
    checklist: [],
  },
  {
    intent: 'love_stay_leave',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '说清一件去留条件',
      body: '写下「留下的最低可接受条件」与观察期；到期用事实决定继续还是分开。',
    },
    checklist: [
      { title: '护边界', body: '若反复内耗，允许暂停加码，先稳自己。' },
    ],
  },
];

function fillSlots(text: string, ctx: UserContext | null): string {
  const occ = ctx?.occupation?.trim() || '你现在的岗位';
  const stage = ctx?.currentStage?.trim() || '当前阶段';
  return text.replaceAll('{occupation}', occ).replaceAll('{stage}', stage);
}

function riskAdjust(action: SceneAction, risk: RiskPreference): SceneAction {
  if (risk === 'cautious' && !/观察|边界|清单|冷却/.test(action.body)) {
    return {
      ...action,
      body: `${action.body} 不确定时先观察再摊牌。`,
    };
  }
  return action;
}

export function pickRelationActions(
  intent: IntentId,
  tone: Tone,
  ctx: UserContext | null,
): { breakthrough: SceneAction; checklist: SceneAction[] } | null {
  const rows = RELATION_ACTION_ROWS.filter((r) => r.intent === intent);
  if (!rows.length) return null;
  const row = rows.find((r) => r.tones.includes(tone)) ?? rows[0]!;
  const risk = ctx?.riskPreference ?? 'balanced';
  return {
    breakthrough: riskAdjust(
      {
        id: `${intent}-bt`,
        title: row.breakthrough.title,
        body: fillSlots(row.breakthrough.body, ctx),
      },
      risk,
    ),
    checklist: row.checklist.slice(0, 3).map((c, i) =>
      riskAdjust(
        {
          id: `${intent}-c${i}`,
          title: c.title,
          body: fillSlots(c.body, ctx),
        },
        risk,
      ),
    ),
  };
}
