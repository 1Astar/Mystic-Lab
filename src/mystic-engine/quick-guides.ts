import type { IntentHit } from './types.ts';

export type QuickGuideChip = {
  id: string;
  label: string;
  /** 弹层正文；若有 path 则优先跳转 */
  body?: string;
  path?: string;
};

const HANDOVER: QuickGuideChip = {
  id: 'handover',
  label: '离职交接清单',
  body:
    '交接备忘（极简）\n' +
    '· 工作文档、账号权限、未结事项列一张表交给接手人\n' +
    '· 问清离职证明何时开、找谁开；口头不算，邮件留痕\n' +
    '· 社保/公积金停缴或转移节点问 HR，写进离职确认\n' +
    '· 年假、报销、奖金结算一次问清，避免事后扯皮',
};

const SALARY: QuickGuideChip = {
  id: 'salary',
  label: '薪资避坑谈判',
  body:
    '谈薪避坑\n' +
    '· 先拆：底薪 / 绩效 / 补贴 / 年终，别只盯一个总数\n' +
    '· 口头承诺一律要书面或邮件确认\n' +
    '· 对方画饼时，问「落到哪份文件、哪个月能核对」\n' +
    '· 底线数字先写给自己看，谈时少当场让步',
};

const JOURNAL: QuickGuideChip = {
  id: 'journal',
  label: '记入我的旅程',
  path: '/records',
  body: '打开「我的旅程」，记下这次问卦时的条件与底线，方便对照。',
};

const LOVE_BOUNDARY: QuickGuideChip = {
  id: 'love-boundary',
  label: '关系边界备忘',
  body:
    '边界备忘\n' +
    '· 写下你可接受与不可接受的各三条\n' +
    '· 本周只核对一件事：对方是否尊重你的一条底线\n' +
    '· 少用「你总是」开场，改用「我需要…」',
};

const WEALTH_RISK: QuickGuideChip = {
  id: 'wealth-risk',
  label: '金钱决策冷静期',
  body:
    '金钱冷静期\n' +
    '· 大额先设 48 小时：写下必须买/投的理由与不买的代价\n' +
    '· 定风险上限：这笔钱最多亏多少，超线即停\n' +
    '· 标的、金额、持有期、退出条件写成四行，缺一项不动手\n' +
    '· 确认不影响未来 3 个月刚性支出',
};

const GROWTH_PLAN: QuickGuideChip = {
  id: 'growth-plan',
  label: '本周学习节点',
  body:
    '学习 / 选择备忘\n' +
    '· 把目标压成「本周可完成的一小节」（一章 / 一套题 / 一次对照）\n' +
    '· 若是 A/B 选择：写成本、可逆性、三个月后样子，先做可逆的一小步\n' +
    '· 锁一个不被打断的时段，比多买资料更重要\n' +
    '· 日历标一个复盘日，用事实改计划',
};

const TIMING_WINDOW: QuickGuideChip = {
  id: 'timing-window',
  label: '时机窗口备忘',
  body:
    '时机窗口\n' +
    '· 把「何时」压成可核对时间窗（月底前 / 下季度初）\n' +
    '· 写清触发条件：出现什么才算「时机到了」\n' +
    '· 到期只看事实，不到位就 Plan B，不跟感觉耗\n' +
    '· 窗口期内并行一条缓冲，避免单点等死',
};

const OPEN_PROBE: QuickGuideChip = {
  id: 'open-probe',
  label: '探索探针清单',
  body:
    '开放探索\n' +
    '· 本周只锁一个最想看清的点\n' +
    '· 选一个低成本接触点：问一句 / 试一天 / 看一份材料\n' +
    '· 事先写：验证为真/假，我分别会怎么做\n' +
    '· 每次试探后记一行：发生了什么、身体紧不紧',
};

const ANXIETY_DECIDE: QuickGuideChip = {
  id: 'anxiety-decide',
  label: '纠结拍板三行',
  body:
    '纠结拍板\n' +
    '· 设一个决定日，到期必须拍板\n' +
    '· 三行对照：成本 / 可逆性 / 三个月后样子\n' +
    '· 先写不可接受的三条底线\n' +
    '· 本周只补一块最缺的事实，再谈要不要',
};

/** 按意图给出可点行动胶囊（决策工具，不是装饰） */
export function pickQuickGuideChips(intents: IntentHit[]): QuickGuideChip[] {
  const ids = new Set(intents.map((h) => h.id));
  const chips: QuickGuideChip[] = [];

  const careerQuit =
    ids.has('quit_now') ||
    ids.has('quit_vs_stay') ||
    ids.has('job_search_window') ||
    ids.has('offer_decide');
  const careerPay =
    ids.has('salary_negotiate') ||
    ids.has('probation_convert') ||
    ids.has('career_promote');
  const careerAny =
    careerQuit ||
    careerPay ||
    ids.has('team_conflict') ||
    ids.has('career_transfer') ||
    ids.has('career_startup');

  if (careerQuit || careerAny) chips.push(HANDOVER);
  if (careerPay || careerAny) chips.push(SALARY);
  if (careerAny || careerQuit || careerPay) chips.push(JOURNAL);

  const love =
    ids.has('love_likes') ||
    ids.has('love_stay_leave') ||
    ids.has('love_contact') ||
    ids.has('love_ambiguous') ||
    ids.has('love_conflict') ||
    ids.has('love_reunion') ||
    ids.has('love_marriage');
  if (love && chips.length === 0) {
    chips.push(LOVE_BOUNDARY, JOURNAL);
  }

  const wealth =
    ids.has('wealth_invest') || ids.has('wealth_spend') || ids.has('wealth_income');
  if (wealth && chips.length === 0) {
    chips.push(WEALTH_RISK, JOURNAL);
  }

  const growth =
    ids.has('growth_study') || ids.has('growth_plan') || ids.has('growth_choice');
  if (growth && chips.length === 0) {
    chips.push(GROWTH_PLAN, JOURNAL);
  }

  if (ids.has('timing') && chips.length === 0) {
    chips.push(TIMING_WINDOW, JOURNAL);
  }
  if (ids.has('anxiety_decide') && chips.length === 0) {
    chips.push(ANXIETY_DECIDE, JOURNAL);
  }
  if (ids.has('open_explore') && chips.length === 0) {
    chips.push(OPEN_PROBE, JOURNAL);
  }

  // 去重保序，最多 3 个
  const seen = new Set<string>();
  return chips
    .filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    })
    .slice(0, 3);
}

export const QUICK_GUIDE_BY_ID: Record<string, QuickGuideChip> = {
  handover: HANDOVER,
  salary: SALARY,
  journal: JOURNAL,
  'love-boundary': LOVE_BOUNDARY,
  'wealth-risk': WEALTH_RISK,
  'growth-plan': GROWTH_PLAN,
  'timing-window': TIMING_WINDOW,
  'open-probe': OPEN_PROBE,
  'anxiety-decide': ANXIETY_DECIDE,
};
