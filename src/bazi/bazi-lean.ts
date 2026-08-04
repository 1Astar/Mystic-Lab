import type { IntentId, Tone } from '../mystic-engine/types.ts';
import { isMetaUxQuestion } from '../mystic-engine/meta-ux.ts';
import type { BaziFacts } from './bazi-facts.ts';
import type { TenGodCategory } from './ten-gods.ts';

const CAT_HOOK: Record<TenGodCategory, string> = {
  guan_sha: '责任与评价',
  cai: '资源与结果',
  shi_shang: '表达与输出',
  yin: '学习与支持',
  bi_jie: '同侪与协作',
};

function topCat(facts: BaziFacts): TenGodCategory | null {
  return facts.dominantCategories[0] ?? facts.monthCategory;
}

/** 八字 lean：有条件倾向，非死刑判决 */
export function leanForBaziIntent(
  intent: IntentId,
  tone: Tone,
  facts: BaziFacts,
  questionSlice = '',
): string {
  if (isMetaUxQuestion(questionSlice)) {
    return '命盘速读会压成可核对的几步：先定调，再看盘面依据与本周动作。';
  }
  const soft = tone === 'soft' || tone === 'flow';
  const cut = tone === 'cut' || tone === 'hard' || tone === 'open';
  const hook = topCat(facts);
  const hookPlain = hook ? CAT_HOOK[hook] : '你的核心气质';

  switch (intent) {
    case 'salary_negotiate':
    case 'probation_convert':
    case 'wealth_income':
      if (soft) return `谈薪/收入有空间，但宜反复对齐标准——别一次梭哈；结构上更贴「${hookPlain}」。`;
      return `能谈，但要把数字与条件写死；命盘侧更提醒你用「${hookPlain}」换可核对结果。`;
    case 'quit_vs_stay':
      if (soft) return '不宜冲动离职；若沟通方式能改，留下仍有空间，但别为现状死磕。';
      if (cut) return '留下的理由在变弱，宜把「走」当成真实选项，仍建议留后路。';
      return `去留关键看你能不能接受「${hookPlain}」式的相处与推进方式。`;
    case 'quit_now':
      if (soft) return '若要走，宜柔、留后路，别一次性撕破——边谈边铺 Plan B。';
      return `离职节奏宜小步验证：先写清底线与期限，再执行；忌情绪化梭哈。`;
    case 'job_search_window':
    case 'offer_decide':
      return `窗口支持你迈出过渡；用一次可验证动作试探，结构上更贴「${hookPlain}」。`;
    case 'career_promote':
    case 'career_transfer':
    case 'career_startup':
    case 'team_conflict':
      return `职场推进宜对准「${hookPlain}」：先对齐一件可核对的事，再谈加码。`;
    case 'love_ambiguous':
    case 'love_likes':
    case 'love_contact':
      if (soft) return '暧昧/好感宜轻推试探，硬表白易散；先看对方动作。';
      return `关系走向宜用一次清晰互动验证，别空耗在猜测上。`;
    case 'love_conflict':
    case 'love_stay_leave':
    case 'love_reunion':
    case 'love_marriage':
      return `关系议题宜降温后逐点谈：先事实后感受，用回应质量决定加码还是停。`;
    case 'wealth_invest':
    case 'wealth_spend':
      return '钱事宜小步可核对：先设止损/上限，再决定加码——忌一次赌大。';
    case 'growth_study':
    case 'growth_choice':
    case 'growth_plan':
      return `成长路径更贴「${hookPlain}」：本周只推一个可打勾动作，用结果决定下一步。`;
    case 'timing':
    case 'anxiety_decide':
      return '时机未一边倒时，先用一件小事验证，再决定加码或停——急不来，也不等于否决。';
    default:
      return `结合命盘结构，更宜对准「${hookPlain}」做一小步可核对动作，再决定加码还是收手。`;
  }
}
