import type { IntentId, RiskPreference, SceneAction, Tone, UserContext } from '../types.ts';

type ActionRow = {
  intent: IntentId;
  tones: Tone[];
  breakthrough: { title: string; body: string };
  checklist: Array<{ title: string; body: string }>;
};

/** 时机 / 纠结 / 开放探索：通用意图动作库 */
export const GENERAL_ACTION_ROWS: ActionRow[] = [
  // —— timing ——
  {
    intent: 'timing',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '设一个可核对窗口',
      body: '把「何时」压成一个可核对的时间窗（如月底前 / 下个季度初）：到期只看事实有没有到位，不到位就按 Plan B，不跟感觉耗。',
    },
    checklist: [
      { title: '写清触发条件', body: '窗口内要出现什么才算「时机到了」（回复、合同、指标），写下来。' },
      { title: '并行缓冲', body: '窗口期内同时铺一条后路，避免单点等死。' },
    ],
  },
  {
    intent: 'timing',
    tones: ['cut'],
    breakthrough: {
      title: '尽快定调截止日期',
      body: '拖越久越耗。本周给自己定一个决定日：到期用清单拍板加码或撤，忌无限观望。',
    },
    checklist: [
      { title: '公开给对方期限', body: '若涉及他人答复，把截止日期说清楚，逾期即转 Plan B。' },
    ],
  },
  {
    intent: 'timing',
    tones: ['open', 'hard', 'neutral'],
    breakthrough: {
      title: '用事实对齐时机',
      body: '先列「已具备 / 还缺」两栏；缺的若两周内补不上，就承认窗口未开，改做准备动作而非硬冲。',
    },
    checklist: [
      { title: '日历落点', body: '在日历标一个复盘日，只核对事实，不改心情叙事。' },
    ],
  },

  // —— anxiety_decide ——
  {
    intent: 'anxiety_decide',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '把纠结拆成可逆一步',
      body: '「要不要 / 该不该」先别求终局答案。写出最怕发生的两件事，本周只做一件可逆的小实验来验证，再决定加码。',
    },
    checklist: [
      { title: '身体信号', body: '记下纠结时身体哪里紧；连续紧三天就先停加码，护住自己。' },
      { title: '少问站队的人', body: '只问走过类似路的人核对盲点，不找只会替你选边的人。' },
    ],
  },
  {
    intent: 'anxiety_decide',
    tones: ['cut', 'open'],
    breakthrough: {
      title: '设决定日，清单拍板',
      body: '给纠结设一个可核对的决定日；到期用「成本 / 可逆性 / 三个月后样子」三行得分拍板，避免无限内耗。',
    },
    checklist: [
      { title: '写清底线', body: '先写不可接受的三条，谈或做时少当场让步。' },
    ],
  },
  {
    intent: 'anxiety_decide',
    tones: ['hard', 'neutral'],
    breakthrough: {
      title: '先核对事实再决定',
      body: '纠结多半缺信息。本周只补一块最关键的事实（问清规则 / 要一份书面 / 做一次试探），再谈要不要。',
    },
    checklist: [
      { title: '一句话问题', body: '把「我最想确认什么」写成一句，贴在显眼处，防跑题。' },
    ],
  },

  // —— open_explore ——
  {
    intent: 'open_explore',
    tones: ['soft', 'flow'],
    breakthrough: {
      title: '柔进探路，不求一次定音',
      body: '局面宜渗透而非硬推：本周选一个低成本接触点（问一句、试一天、看一份材料），用回应质量决定要不要加码。',
    },
    checklist: [
      { title: '两手准备', body: '探索同时留 Plan B，避免把自我价值绑死在单一结果。' },
      { title: '记录体感', body: '每次试探后写一行：发生了什么、身体紧不紧。' },
    ],
  },
  {
    intent: 'open_explore',
    tones: ['cut'],
    breakthrough: {
      title: '先定一问，少摊多题',
      body: '开放探索也忌发散。本周只锁定一个最想看清的点，推一个能打勾的动作，定了就做，少自我说服「再等等」。',
    },
    checklist: [
      { title: '写清「看清了就怎样」', body: '事先写：若验证为真/假，我分别会怎么做——防事后改口。' },
    ],
  },
  {
    intent: 'open_explore',
    tones: ['open'],
    breakthrough: {
      title: '抓住窗口做可见动作',
      body: '有聚拢的窗口：本周做一件「能被看见」的事（发出去、约上、交出去），用外部反馈校准方向，别只在脑子里盘。',
    },
    checklist: [
      { title: '落袋再谈丰盛', body: '口头机会一律留痕；感觉会好不等于已经到手。' },
    ],
  },
  {
    intent: 'open_explore',
    tones: ['hard'],
    breakthrough: {
      title: '先过最弱一环',
      body: '局面偏紧：先找出卡住的最弱一环（信息 / 钱 / 关系 / 体能），本周只补这一环，再谈扩张。',
    },
    checklist: [
      { title: '保底再探索', body: '先稳住现金流与睡眠，探索才有力气。' },
    ],
  },
  {
    intent: 'open_explore',
    tones: ['neutral'],
    breakthrough: {
      title: '一句话 + 一个勾',
      body: '把「我最想确认什么」写成一句话；本周只推一个能打勾的动作，用结果决定加码、等待或撤。',
    },
    checklist: [
      { title: '对照卦象关键词', body: '复盘时对照本/变卦关键词，看动作有没有贴着主调走。' },
      { title: '忌情绪梭哈', body: '一次验证不够就再来一次小步，别用情绪一把定终身。' },
    ],
  },
];

function fillSlots(text: string, ctx: UserContext | null): string {
  const occ = ctx?.occupation?.trim() || '你现在的岗位';
  const stage = ctx?.currentStage?.trim() || '当前阶段';
  return text.replaceAll('{occupation}', occ).replaceAll('{stage}', stage);
}

function riskAdjust(action: SceneAction, risk: RiskPreference): SceneAction {
  if (risk === 'cautious' && !/稳|缓冲|可逆|保底/.test(action.body)) {
    return { ...action, body: `${action.body} 偏稳健：先验证再加码。` };
  }
  if (risk === 'bold' && /可逆|小实验|低成本/.test(action.body)) {
    return { ...action, body: `${action.body} 若底线已清，可略加快节奏。` };
  }
  return action;
}

export function pickGeneralActions(
  intent: IntentId,
  tone: Tone,
  ctx: UserContext | null,
): { breakthrough: SceneAction; checklist: SceneAction[] } | null {
  const rows = GENERAL_ACTION_ROWS.filter((r) => r.intent === intent);
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
