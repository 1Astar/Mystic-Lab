import type { IntentId, RiskPreference, SceneAction, Tone, UserContext } from '../types.ts';

type ActionRow = {
  intent: IntentId;
  tones: Tone[];
  breakthrough: { title: string; body: string };
  checklist: Array<{ title: string; body: string }>;
};

/** 成长场景动作库 */
export const GROWTH_ACTION_ROWS: ActionRow[] = [
  {
    intent: 'growth_study',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '本周一个可考节点',
      body: '把学习目标拆成「本周可完成的一小节」（一章/一套题/一次模考），打勾再加码，忌空定宏大计划。',
    },
    checklist: [
      { title: '固定时段', body: '先锁一个不被打断的学习时段，比多买资料重要。' },
    ],
  },
  {
    intent: 'growth_choice',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '两选项对照表',
      body: '把 A/B 写成：成本、可逆性、三个月后样子；先做可逆的一小步验证，再谈梭哈。',
    },
    checklist: [
      { title: '问懂行人', body: '找一个走过类似路的人核对盲点，不找只会站队的人。' },
    ],
  },
  {
    intent: 'growth_choice',
    tones: ['cut', 'open', 'hard', 'neutral'],
    breakthrough: {
      title: '设选择截止日期',
      body: '给自己一个可核对的决定日；到期用清单得分拍板，避免无限纠结。',
    },
    checklist: [],
  },
  {
    intent: 'growth_plan',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '一年拆成一季',
      body: '长期规划先压成「这一季唯一主题」（技能/作品/关系/健康四选一），本周只推进该主题的一个动作。',
    },
    checklist: [
      { title: '复盘点', body: '在日历标一个季度复盘日，用事实改计划。' },
    ],
  },
];

function fillSlots(text: string, ctx: UserContext | null): string {
  const occ = ctx?.occupation?.trim() || '你现在的岗位';
  const stage = ctx?.currentStage?.trim() || '当前阶段';
  return text.replaceAll('{occupation}', occ).replaceAll('{stage}', stage);
}

function riskAdjust(action: SceneAction, risk: RiskPreference): SceneAction {
  if (risk === 'cautious') {
    return { ...action, body: `${action.body} 节奏宜稳，验证后再加码。` };
  }
  return action;
}

export function pickGrowthActions(
  intent: IntentId,
  tone: Tone,
  ctx: UserContext | null,
): { breakthrough: SceneAction; checklist: SceneAction[] } | null {
  const rows = GROWTH_ACTION_ROWS.filter((r) => r.intent === intent);
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
