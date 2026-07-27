import type { IntentId, RiskPreference, SceneAction, Tone, UserContext } from '../types.ts';

type ActionRow = {
  intent: IntentId;
  tones: Tone[];
  breakthrough: { title: string; body: string };
  checklist: Array<{ title: string; body: string }>;
};

/** 职场高频场景动作库（intent × tone） */
export const CAREER_ACTION_ROWS: ActionRow[] = [
  {
    intent: 'salary_negotiate',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '约谈薪资评定标准',
      body: '找直属领导或 HR，先问清转正/调薪的评定标准与时间表，再用{occupation}能交付的价值做柔顺沟通；暂不到位就问绩效或补贴能否补差。',
    },
    checklist: [
      { title: '书面核对', body: '口头承诺一律落到书面或邮件确认，防信息不对等。' },
      { title: '设期限', body: '给答复设一个可核对截止日期；逾期即启动 Plan B。' },
    ],
  },
  {
    intent: 'salary_negotiate',
    tones: ['cut', 'open', 'hard', 'neutral'],
    breakthrough: {
      title: '一次可核对的谈薪',
      body: '本周约一次正式沟通：带着市场区间与你的交付清单，明确期望数字与对方底牌。',
    },
    checklist: [
      { title: '列事实清单', body: '先写清对方已承诺的条件、时间与缺口，再决定是否加码。' },
    ],
  },
  {
    intent: 'probation_convert',
    tones: ['soft', 'flow', 'neutral', 'open', 'cut', 'hard'],
    breakthrough: {
      title: '问清转正考核标准',
      body: '约领导确认转正考核标准与薪资结构：接下来工作重点怎么对齐才能符合转正要求；把问题抛给对方，看底牌再决定去留。',
    },
    checklist: [
      { title: '先假设留下求证', body: '暂不纠结裸辞，用一次沟通验证公司诚意。' },
    ],
  },
  {
    intent: 'quit_vs_stay',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '先内部谈清再决定走留',
      body: '不宜冲动裸辞。先把「想要的条件」谈一轮；谈拢可留，谈不拢再骑驴找马——安全第一。',
    },
    checklist: [
      { title: '铺 Plan B', body: '边谈边更新简历与下家，不把鸡蛋放一个篮子。' },
      { title: '忌一拍两散', body: '强行断裂可能阵痛更大；给自己留缓冲。' },
    ],
  },
  {
    intent: 'quit_vs_stay',
    tones: ['cut', 'hard', 'open', 'neutral'],
    breakthrough: {
      title: '定去留红线',
      body: '写下「留下的最低可接受条件」与截止日期；逾期未满足即按离职节奏推进。',
    },
    checklist: [
      { title: '现金流', body: '先算清离开后能撑多久，再谈加码或走人。' },
    ],
  },
  {
    intent: 'quit_now',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '柔退 + 留后路',
      body: '若要走，宜柔、留后路：先谈清交接与时间，同时铺下家，避免一次性撕破。',
    },
    checklist: [
      { title: '找下家再断', body: '有 offer 或明确窗口再递辞呈更稳。' },
    ],
  },
  {
    intent: 'quit_now',
    tones: ['cut', 'hard', 'open', 'neutral'],
    breakthrough: {
      title: '公开明确地断',
      body: '宜尽早定调离职节奏，少拖泥带水；把精力留给下一局。',
    },
    checklist: [
      { title: '交接清单', body: '用书面交接降低口舌与扯皮。' },
    ],
  },
  {
    intent: 'job_search_window',
    tones: ['cut', 'open', 'soft', 'flow', 'hard', 'neutral'],
    breakthrough: {
      title: '求职过渡：先稳住再加码',
      body: '离职/求职窗口期先保证现金流不断档：找到底薪可接受的坑位稳住，再谈超出市场价很多的加码。',
    },
    checklist: [
      { title: '面试核对条款', body: '把口头大饼与合同条款逐项核对，防信息不对等踩坑。' },
      { title: '小步验证', body: '本周只推进一个可打勾动作（投递/约面/要时间表）。' },
    ],
  },
  {
    intent: 'offer_decide',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '条款核对后再定',
      body: '先把薪资、岗级、到岗日写成清单；缺书面的不算数，再决定接不接。',
    },
    checklist: [],
  },
  {
    intent: 'team_conflict',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '只谈一个堵点',
      body: '本周只挑一个最堵的协作点谈开，不摊多题；看对方是配合还是含糊。',
    },
    checklist: [],
  },
  {
    intent: 'career_promote',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '对齐晋升标准',
      body: '约直属领导确认晋升/评级标准与时间窗，用{occupation}最近可举证的交付做柔顺汇报，先要规则再谈结果。',
    },
    checklist: [
      { title: '举证清单', body: '把可写进述职的成果列成三条，缺证据的先补再冲。' },
    ],
  },
  {
    intent: 'career_promote',
    tones: ['cut', 'open', 'hard', 'neutral'],
    breakthrough: {
      title: '一次正式晋升沟通',
      body: '本周约一次正式谈话：明确你要的职级/时间，以及对方还缺你哪块证明。',
    },
    checklist: [
      { title: '设观察期', body: '给一个可核对截止日期；逾期无反馈则调整策略或外部机会。' },
    ],
  },
  {
    intent: 'career_transfer',
    tones: ['soft', 'flow', 'open', 'cut', 'hard', 'neutral'],
    breakthrough: {
      title: '摸清转岗条件',
      body: '分别问清：目标组要什么人、现组放不放、时间表如何——三方信息对齐前，不轻易摊牌离职式转岗。',
    },
    checklist: [
      { title: '试岗一小步', body: '能借调/项目协作先试两周，用事实决定是否正式转。' },
    ],
  },
  {
    intent: 'career_startup',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '副业验证再全职',
      body: '先用业余时间做一次可验证的小闭环（付费/用户/订单），再决定是否全职创业；忌一上来梭哈辞职。',
    },
    checklist: [
      { title: '现金流底线', body: '算清全职后能撑几个月，再谈加码投入。' },
      { title: '留后路', body: '主业未断前，同步铺客户与作品集。' },
    ],
  },
  {
    intent: 'career_startup',
    tones: ['cut', 'open', 'hard', 'neutral'],
    breakthrough: {
      title: '定创业最小实验',
      body: '本周只定一个最小可行实验（产品/客群/渠道三选一先跑通），用结果决定加码还是停。',
    },
    checklist: [
      { title: '写清赌注', body: '写下你愿意投入的时间/金钱上限，超线即复盘。' },
    ],
  },
];

function fillSlots(text: string, ctx: UserContext | null): string {
  const occ = ctx?.occupation?.trim() || '你现在的岗位';
  const stage = ctx?.currentStage?.trim() || '当前阶段';
  return text.replaceAll('{occupation}', occ).replaceAll('{stage}', stage);
}

function riskAdjust(
  action: SceneAction,
  risk: RiskPreference,
): SceneAction {
  if (risk === 'cautious' && !/核对|期限|后路|清单|书面/.test(action.body)) {
    return {
      ...action,
      body: `${action.body} 若不确定，先把事实清单与期限写清再摊牌。`,
    };
  }
  if (risk === 'bold' && /暂不|不宜冲动|先假设/.test(action.body)) {
    return {
      ...action,
      body: action.body.replace(/暂不纠结裸辞，/, '可以加快节奏，'),
    };
  }
  return action;
}

export function pickCareerActions(
  intent: IntentId,
  tone: Tone,
  ctx: UserContext | null,
): { breakthrough: SceneAction; checklist: SceneAction[] } | null {
  const rows = CAREER_ACTION_ROWS.filter((r) => r.intent === intent);
  if (!rows.length) return null;
  const row = rows.find((r) => r.tones.includes(tone)) ?? rows[0]!;
  const risk = ctx?.riskPreference ?? 'balanced';
  const breakthrough = riskAdjust(
    {
      id: `${intent}-bt`,
      title: row.breakthrough.title,
      body: fillSlots(row.breakthrough.body, ctx),
    },
    risk,
  );
  const checklist = row.checklist.slice(0, 3).map((c, i) =>
    riskAdjust(
      {
        id: `${intent}-c${i}`,
        title: c.title,
        body: fillSlots(c.body, ctx),
      },
      risk,
    ),
  );
  return { breakthrough, checklist };
}
