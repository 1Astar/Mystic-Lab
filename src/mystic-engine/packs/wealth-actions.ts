import type { IntentId, RiskPreference, SceneAction, Tone, UserContext } from '../types.ts';

type ActionRow = {
  intent: IntentId;
  tones: Tone[];
  breakthrough: { title: string; body: string };
  checklist: Array<{ title: string; body: string }>;
};

/** 财富场景动作库 */
export const WEALTH_ACTION_ROWS: ActionRow[] = [
  {
    intent: 'wealth_invest',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '小仓位验证逻辑',
      body: '先用可承受损失的小仓位验证你的判断；不一次梭哈。写清买入理由与止损线后再动手。',
    },
    checklist: [
      { title: '风险上限', body: '定好这笔钱最多亏多少，超线即停。' },
    ],
  },
  {
    intent: 'wealth_invest',
    tones: ['cut', 'open', 'hard', 'neutral'],
    breakthrough: {
      title: '核对后再下单',
      body: '本周只做一件：把标的、金额、持有期、退出条件写成四行清单，缺一项不下单。',
    },
    checklist: [],
  },
  {
    intent: 'wealth_income',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '拆一条增收路径',
      body: '收入问题先拆成「主业谈条件 / 副业试水 / 回款催收」之一，本周只推一条可打勾的。',
    },
    checklist: [
      { title: '书面确认', body: '涉及数字的承诺尽量落到书面。' },
    ],
  },
  {
    intent: 'wealth_spend',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '冷静期再决定',
      body: '大额消费先设 48 小时冷静期；写下「必须买的理由」与「不买的代价」，再拍板。',
    },
    checklist: [
      { title: '现金流', body: '确认这笔支出不影响未来 3 个月刚性支出。' },
    ],
  },
];

function fillSlots(text: string, ctx: UserContext | null): string {
  const occ = ctx?.occupation?.trim() || '你现在的岗位';
  const stage = ctx?.currentStage?.trim() || '当前阶段';
  return text.replaceAll('{occupation}', occ).replaceAll('{stage}', stage);
}

function riskAdjust(action: SceneAction, risk: RiskPreference): SceneAction {
  if (risk === 'cautious' && !/冷静|上限|小仓|清单/.test(action.body)) {
    return { ...action, body: `${action.body} 偏稳健：先保本再谈收益。` };
  }
  if (risk === 'bold' && /小仓位|冷静期/.test(action.body)) {
    return { ...action, body: action.body.replace(/小仓位/, '按计划仓位').replace(/48 小时冷静期/, '短冷静期') };
  }
  return action;
}

export function pickWealthActions(
  intent: IntentId,
  tone: Tone,
  ctx: UserContext | null,
): { breakthrough: SceneAction; checklist: SceneAction[] } | null {
  const rows = WEALTH_ACTION_ROWS.filter((r) => r.intent === intent);
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
