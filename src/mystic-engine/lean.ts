import type { CastResult } from '../liuyao/engine.ts';
import type { IntentId, Tone } from './types.ts';
import { toneFlags } from './tone.ts';

/** intent × tone → 有条件倾向句（非死刑） */
export function leanForIntent(
  intent: IntentId,
  cast: CastResult,
  tone: Tone,
): string {
  const f = toneFlags(cast);
  const soft = tone === 'soft' || f.soft;
  const flow = tone === 'flow' || f.flow;
  const hard = tone === 'hard' || f.hard;
  const open = tone === 'open' || f.open;
  const cut = tone === 'cut' || f.cut;
  const to = cast.changed?.keywords[0] ?? cast.primary.keywords[0] ?? cast.primary.name;

  switch (intent) {
    case 'salary_negotiate':
    case 'probation_convert':
    case 'wealth_income':
      if (hard) return '钱难痛快落地，别只盯数字；先把条件写死再谈。';
      if (open) return '数字有机会谈成，但仍要用书面确认，别只听口头。';
      if (soft || flow) return '有希望谈到，但需要反复沟通，不是一蹴而就。';
      return `收入/谈薪结果跟「${to}」同向——能谈，但别一次梭哈。`;
    case 'quit_vs_stay':
      if (flow || soft) return '不宜冲动离职；若沟通方式能改，留下仍有空间，但别为现状死磕。';
      if (cut) return '留下的理由在变弱，宜把「走」当成真实选项，仍建议留后路。';
      if (open) return '可以留，但要换条件（职责/钱/节奏），原样硬留易憋屈。';
      if (hard) return '硬留会更困；先看有没有可改的局部，再谈去留。';
      return `去留关键看你能不能接受「${to}」式的相处与推进方式。`;
    case 'quit_now':
      if (flow || cut) return '走是合理选项；卦象也支持把重心挪向新机会，仍忌赌气拍板。';
      if (soft) return '若要走，宜柔、留后路，别一次性撕破——边谈边铺 Plan B。';
      if (open) return '不是必须立刻走，但要谈清条件；谈不拢再走更干净。';
      return `离职节奏宜对准「${to}」：小步验证，忌情绪化梭哈。`;
    case 'job_search_window':
      if (cut || open) return '窗口支持你迈出过渡；前段务实稳住，再谈丰盛加码。';
      if (soft || flow) return '求职路径会磨、会绕；先保现金流，再抬期望。';
      return `求职与发展跟「${to}」同向，用可验证的一小步换确定性。`;
    case 'career_promote':
      if (soft || flow) return '晋升有空间，但靠反复对齐标准与举证，不是一次表态定音。';
      if (hard) return '晋升关偏紧，先补最弱的一环证明再冲。';
      if (open || cut) return '可以推进晋升沟通，仍要把规则与时间窗核对清楚。';
      return `晋升走向偏「${to}」，用可举证的交付换对话。`;
    case 'career_transfer':
      if (soft || flow) return '转岗宜柔进：先试协作/借调，再谈正式调动。';
      if (hard) return '转岗阻力不小，先摸清三方条件再摊牌。';
      return `转岗节奏宜对准「${to}」，小步验证。`;
    case 'career_startup':
      if (soft || flow) return '创业窗口偏「渗」：先副业验证，忌立刻梭哈辞职。';
      if (cut || open) return '有行动窗口，但仍建议最小实验后再加码。';
      if (hard) return '创业阻力偏大，先降赌注、保现金流。';
      return `创业路径跟「${to}」同向，用小闭环换确定性。`;
    case 'offer_decide':
      if (hard) return '过关不易，先补最弱的一环再冲。';
      if (open) return '有过关倾向，仍要把关键条款核对清楚。';
      if (soft) return '能推进，但靠反复沟通与补材料，不是一次定音。';
      return `录取/过关与「${to}」同向，用一次可验证动作试探。`;
    case 'team_conflict':
      return `协作冲突宜用「${to}」的方式处理：先对齐一件事，再谈立场。`;
    case 'love_ambiguous':
      if (soft || flow) return '暧昧局宜轻推试探，硬表白易散；先看对方动作。';
      if (cut) return '宜尽快把期待说清，拖久了双方都耗。';
      return `暧昧走向偏「${to}」，用一次清晰互动验证。`;
    case 'love_conflict':
      if (soft) return '冲突要靠降温后逐点谈，摊多题易炸。';
      if (flow) return '关系偏散，先确认还想不想修，再谈对错。';
      return `冲突处理宜「${to}」：先事实后感受。`;
    case 'love_reunion':
      if (soft || flow) return '复合不宜硬推；先看对方是否主动修复。';
      if (open || cut) return '可以谈一次明确条件，谈不成也把句号画清。';
      return `复合可能偏「${to}」，用回应质量决定加码。`;
    case 'love_marriage':
      if (soft || flow) return '婚姻议题宜分项对齐现实（钱/城/时间），忌催着先结。';
      if (hard) return '婚姻阻力偏大，先把分歧清单摊开再谈仪式。';
      return `婚姻推进跟「${to}」同向，一项一项核对。`;
    case 'love_likes':
    case 'love_contact':
    case 'love_stay_leave':
      if (soft) return '关系要靠反复低姿态沟通推进，硬推易反弹。';
      if (flow) return '关系偏散、不定，先看双方是否还想聚，再谈结果。';
      return `感情走向偏「${to}」，先对齐期待再表态。`;
    case 'wealth_invest':
      if (hard) return '投资关偏紧，先降仓、设止损，忌加杠杆情绪单。';
      if (soft || flow) return '宜小步试错，反复核对逻辑后再加仓。';
      if (open) return '有窗口，但仍要把退出条件写清。';
      return `投资节奏偏「${to}」，用规则代替感觉。`;
    case 'wealth_spend':
      if (cut) return '可以买，但建议冷静期后再下单。';
      if (hard || soft) return '消费宜缓：先核现金流与必要性。';
      return `这笔支出跟「${to}」同向评估，别冲动。`;
    case 'growth_study':
      if (soft || flow) return '学习宜拆小步，反复打卡，忌空定宏大计划。';
      if (open || cut) return '适合推进一个可考节点，尽快用模考/作业验证。';
      return `学习节奏偏「${to}」，本周一个可完成小节。`;
    case 'growth_choice':
      if (soft || flow) return '选择宜先做可逆的一小步验证，再谈梭哈。';
      if (cut) return '宜尽快定调，设截止日期避免无限纠结。';
      return `选择策略偏「${to}」：对照成本与可逆性。`;
    case 'growth_plan':
      if (soft || flow) return '长期规划先压成一季主题，反复校准。';
      if (cut || open) return '可以把方向定清，再用季度动作落地。';
      return `规划主调偏「${to}」，远景拆近步。`;
    case 'timing':
      if (soft || flow) return '窗口偏「磨」不偏「冲」：给对方明确期限，逾期就按 Plan B。';
      if (cut) return '宜尽快定调，拖越久越耗。';
      if (hard) return '时机未齐：先补最弱一环，再谈冲窗口。';
      if (open) return '窗口可能已开：用可核对的事实对齐，再加码。';
      return '先定一个可核对的截止日期，再用事实决定加码还是撤。';
    case 'anxiety_decide':
      if (soft || flow) return '纠结宜拆成可逆的一小步验证，忌求一次定终身。';
      if (cut || open) return '给纠结设决定日，到期用清单拍板，少无限内耗。';
      if (hard) return '先补最缺的那块事实，再谈要不要。';
      return `纠结处宜用「${to}」的方式推进：先事实，后决定。`;
    case 'open_explore':
      if (soft || flow) return '宜柔进探路：低成本试探，用回应质量决定加码。';
      if (cut) return '开放也忌发散：先锁一问，推一个能打勾的动作。';
      if (open) return '有聚拢窗口：做一件能被看见的事，用反馈校准。';
      if (hard) return '先过最弱一环，再谈扩张与探索。';
      return `本题核心宜用「${to}」的方式推进，少用蛮力；卦象是参考不是判决。`;
    default:
      return `本题核心宜用「${to}」的方式推进，少用蛮力；卦象是参考不是判决。`;
  }
}
