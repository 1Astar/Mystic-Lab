/**
 * 场景动作库 · 条件触发（⭐）
 * 若出现现象 A 且意图 B → 触发行动指令 C + 底线 D
 */
import type { IntentId } from './types.ts';
import type { BoardSignals, Phenomenon } from './board-signals.ts';
import { allPhenomena } from './board-signals.ts';

export type ActionRule = {
  id: string;
  priority: number;
  intents?: IntentId[];
  when: Phenomenon[];
  action: (s: BoardSignals) => string;
  boundary: (s: BoardSignals) => string;
};

function intentMatches(rule: ActionRule, intentId: IntentId): boolean {
  return !rule.intents?.length || rule.intents.includes(intentId);
}

const CAREER_INTENTS: IntentId[] = [
  'salary_negotiate',
  'probation_convert',
  'quit_now',
  'quit_vs_stay',
  'job_search_window',
  'offer_decide',
  'team_conflict',
  'career_promote',
  'career_transfer',
  'career_startup',
];

const LOVE_INTENTS: IntentId[] = [
  'love_likes',
  'love_stay_leave',
  'love_contact',
  'love_ambiguous',
  'love_conflict',
  'love_reunion',
  'love_marriage',
];

/** 规则按优先级从高到低匹配，取第一条全中者 */
export const ACTION_RULES: ActionRule[] = [
  // —— 裸辞 ——
  {
    id: 'bare_quit_stop',
    priority: 100,
    intents: ['quit_now', 'quit_vs_stay'],
    when: ['bare_quit'],
    action: (_s) =>
      `先写出三行——留下还能接受什么 / 什么情况必须走 / 最晚哪天决定。没写清前先别交辞呈；截止日期前只做一件落地动作（谈一次或投出一份简历）。`,
    boundary: (_s) =>
      `期限一到就执行你写好的条件。盘面支持该停则停，不支持没想清楚就裸辞，也不支持想清楚了还无限耗。`,
  },
  // —— 去留 + 拉锯/停 ——
  {
    id: 'quit_tug',
    priority: 90,
    intents: ['quit_now', 'quit_vs_stay', 'love_stay_leave'],
    when: ['tugOfWar'],
    action: (_s) =>
      `局面在拉锯。本周把留下底线与离开触发条件写成可核对的两行，并推进一件落地事（谈一次 / 投一份），禁止两边空耗。`,
    boundary: (_s) =>
      `若谈/投之后仍无增量信息，按你写好的触发条件执行离开或留下，停止内耗式拖延。`,
  },
  {
    id: 'quit_stop',
    priority: 88,
    intents: ['quit_now', 'quit_vs_stay', 'love_stay_leave'],
    when: ['pace_stop'],
    action: (_s) =>
      `走向偏停。先定截止日期与最低可接受条件；条件未满足就按离职/抽身节奏推进，少用幻想填空。`,
    boundary: (_s) =>
      `守住边界比继续推进更重要。期限到就执行，留下或离开都要干净。`,
  },
  {
    id: 'quit_default',
    priority: 70,
    intents: ['quit_now', 'quit_vs_stay'],
    when: [],
    action: (_s) =>
      `写下留下的最低条件与截止日期；本周只做一件能落地的事（谈一次或投一份简历）。`,
    boundary: (_s) =>
      `逾期未满足条件即按离开节奏推进；别把自我价值绑死在这一次结果上。`,
  },
  // —— 面试 / offer / 求职 ——
  {
    id: 'interview_tug_or_yuepo',
    priority: 92,
    intents: ['offer_decide', 'job_search_window'],
    when: ['tugOfWar'],
    action: (_s) =>
      `今晚或明天发一封短跟进（HR/面试官）——感谢对方时间，并写「若还需补充材料，我可以马上发」。用书面补上被流程撕开的缺口。`,
    boundary: (_s) =>
      `跟进后仍杳无音信超过 3 天（或不给节点），就停追、挪到下一家。能推进，但不靠无限妥协。`,
  },
  {
    id: 'interview_yuepo',
    priority: 91,
    intents: ['offer_decide', 'job_search_window'],
    when: ['yuePo'],
    action: (_s) =>
      `流程偏脆。本周主动补一份可核对材料（作品集/数据/意向），并要一个书面时间节点。`,
    boundary: (_s) =>
      `给对方一个答复期限；逾期未果启动 Plan B。`,
  },
  {
    id: 'interview_slow',
    priority: 85,
    intents: ['offer_decide', 'job_search_window'],
    when: ['pace_slow'],
    action: (_s) =>
      `节奏偏慢。本周只做一件可打勾的试探——跟进或补材料，把口头承诺落到邮件里。`,
    boundary: (_s) =>
      `逾期未果就启动 Plan B，不把希望压在一击必中上。`,
  },
  {
    id: 'interview_default',
    priority: 72,
    intents: ['offer_decide', 'job_search_window'],
    when: [],
    action: (_s) =>
      `本周发一封跟进或补一份材料，换可核对的回应。`,
    boundary: (_s) =>
      `给答复期限；逾期未果就挪精力到下一家。`,
  },
  // —— 谈薪 / 转正 ——
  {
    id: 'salary_weak',
    priority: 86,
    intents: ['salary_negotiate', 'probation_convert'],
    when: ['yong_weak'],
    action: (_s) =>
      `你盯的条件层力气不足。本周约一次沟通，先问清评定标准与时间表，再谈数字；口头承诺一律落到书面。`,
    boundary: (_s) =>
      `设答复截止日期；逾期即启动 Plan B（下家/内部调岗），忌无限等。`,
  },
  {
    id: 'salary_default',
    priority: 71,
    intents: ['salary_negotiate', 'probation_convert'],
    when: [],
    action: (_s) =>
      `本周约一次正式沟通，带着交付清单与期望区间，要一个可核对的标准或时间表。`,
    boundary: (_s) =>
      `逾期未果就按你的底线推进，不把价值绑死在这一次谈薪。`,
  },
  // —— 复合 / 暧昧 ——
  {
    id: 'reunion_stop',
    priority: 89,
    intents: ['love_reunion'],
    when: ['pace_stop'],
    action: (_s) =>
      `窗口偏窄。本周最多一次低压力、可回可不回的试探；不审判、不逼时间表。`,
    boundary: (_s) =>
      `试探无回应或再伤边界，就停止追加投入。停是护住自己。`,
  },
  {
    id: 'reunion_tug',
    priority: 88,
    intents: ['love_reunion', 'love_ambiguous'],
    when: ['tugOfWar'],
    action: (_s) =>
      `会反复。本周只发一次低压力试探（短讯/关心一件具体事），用回应质量决定是否继续。`,
    boundary: (_s) =>
      `设联系上限（例如一周一次）；超过就收回注意力。`,
  },
  {
    id: 'reunion_default',
    priority: 73,
    intents: ['love_reunion'],
    when: [],
    action: (_s) =>
      `本周一次清晰、低姿态沟通，看对方是否配合修复。`,
    boundary: (_s) =>
      `若反复内耗无进展，允许暂停加码。`,
  },
  {
    id: 'love_ambiguous',
    priority: 74,
    intents: ['love_ambiguous', 'love_likes', 'love_contact'],
    when: [],
    action: (_s) =>
      `本周一次轻量互动试探；看对方是配合、含糊还是回避，再决定是否加码。`,
    boundary: (_s) =>
      `给 1–2 周观察期，不无限拉扯。`,
  },
  // —— 忌神强 / 用神弱：通用减干扰 ——
  {
    id: 'ji_block',
    priority: 60,
    when: ['has_ji', 'yong_weak'],
    action: (_s) =>
      `先减拖累（忌神层），再推主线。本周只做一件能打勾、且不依赖幻想配合的小事。`,
    boundary: (_s) =>
      `干扰未减就加码，容易空耗；探针无增量就停。`,
  },
  // —— 时机 ——
  {
    id: 'timing',
    priority: 76,
    intents: ['timing'],
    when: [],
    action: (_s) =>
      `先完成一个可验证动作，再根据对方/环境的回应估窗口；不要先钉死一个日期。`,
    boundary: (_s) =>
      `窗口未开时少空等；条件齐了再加压。`,
  },
  // —— 创业 ——
  {
    id: 'startup',
    priority: 75,
    intents: ['career_startup'],
    when: [],
    action: (_s) =>
      `本周只验证一件最小可行事（谈一个客户 / 做一个原型 / 算一笔现金流），用结果决定是否加码全职。`,
    boundary: (_s) =>
      `现金流与退出条件写清；验证失败就缩回，忌理想化硬刚。`,
  },
  // —— 兜底 ——
  {
    id: 'fallback',
    priority: 1,
    when: [],
    action: (_s) =>
      `写出你最想确认的一点，本周只做一件小事试探（问一句、试一天、看一份材料）。`,
    boundary: (_s) =>
      `探针有结果再加码；没有结果就撤，别用空想填空。`,
  },
];

export function pickActionRule(s: BoardSignals): ActionRule {
  const ranked = ACTION_RULES.filter((r) => intentMatches(r, s.intentId))
    .filter((r) => (r.when.length === 0 ? true : allPhenomena(s, r.when)))
    .sort((a, b) => b.priority - a.priority);
  return ranked[0] ?? ACTION_RULES[ACTION_RULES.length - 1]!;
}

export function buildActionAndBoundary(s: BoardSignals): {
  action: string;
  boundary: string;
  ruleId: string;
} {
  const rule = pickActionRule(s);
  return {
    action: rule.action(s),
    boundary: rule.boundary(s),
    ruleId: rule.id,
  };
}

/** 意图族（供测试/调试） */
export const INTENT_FAMILIES = { CAREER_INTENTS, LOVE_INTENTS };
