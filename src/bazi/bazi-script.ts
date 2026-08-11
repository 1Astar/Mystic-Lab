import type { IntentId } from '../mystic-engine/types.ts';
import { sceneFromIntent } from '../mystic-engine/script-scene.ts';
import type { ScriptPlay, ScriptBeat } from '../mystic-engine/script-play.ts';
import type { ScriptSynthesis } from '../mystic-engine/synthesis.ts';
import type { BaziFacts } from './bazi-facts.ts';
import { STRENGTH_MOD } from './portrait-copy.ts';
import { leanForBaziIntent } from './bazi-lean.ts';
import type { Tone } from '../mystic-engine/types.ts';
import type { TenGodCategory } from './ten-gods.ts';

const CAT_PLAIN: Record<TenGodCategory, string> = {
  guan_sha: '责任与评价结构',
  cai: '资源与结果',
  shi_shang: '表达与输出',
  yin: '学习与支持',
  bi_jie: '同侪与协作',
};

function outcomeFromFacts(facts: BaziFacts): ScriptSynthesis['outcome'] {
  const s = facts.dayStrength;
  if (s === '囚' || s === '死') {
    return {
      lean: 'blocked',
      label: '偏蓄 · 宜先补给',
      text: '本气偏弱或外压感更强时，短期硬冲「一次定音」概率偏低。宜先补条件、找支持，再评估能否成——不是否定你，是提醒先把地基补上。',
    };
  }
  if (s === '旺' || s === '相') {
    return {
      lean: 'favorable',
      label: '偏可推进 · 要兑现',
      text: '气场与助力不弱，倾向「有做成空间」。窗口在，仍取决于你是否把口头变成书面/行动；别空等好兆头自己落地。',
    };
  }
  if (facts.relationCount >= 2) {
    return {
      lean: 'mixed',
      label: '走平 · 偏拉扯',
      text: '人际/节奏上有多处牵引，成败未一次定音。宜小步核对后再加码，别把一次拉扯当成终局。',
    };
  }
  return {
    lean: 'neutral',
    label: '偏平 · 先观后动',
    text: '尚未出现一边倒的成/败信号，倾向「先观后动」——用一件小事验证，再决定加码或停。',
  };
}

function buildSynthesis(facts: BaziFacts, intentId: IntentId): ScriptSynthesis {
  const outcome = outcomeFromFacts(facts);
  const top = facts.dominantCategories[0];
  const structure = top
    ? `盘面「${CAT_PLAIN[top]}」更显眼`
    : `核心气质偏「${facts.dayMasterWx || '未知'}」`;
  return {
    outcome,
    trend: `${structure}；${STRENGTH_MOD[facts.dayStrength]}。趋势上更适合用可核对的小步换确定性，而不是一次梭哈。`,
    timing:
      intentId === 'timing'
        ? '时机问法：先设一个可核对截止日期，逾期即换策略——不必等「完美天时」。'
        : '应期宜按「本周一个打勾动作」来量：有回应再加码，无回应就停或改路径。',
    details: [
      `日主气质：${facts.dayMasterWx || '—'}（学习名强度 ${facts.dayStrength}）`,
      facts.monthStemGod !== '—'
        ? `月令干神学习名：${facts.monthStemGod}`
        : '月令信息不足',
      facts.relationCount
        ? `地支关系拉扯约 ${facts.relationCount} 处`
        : '地支暂无明显合冲刑害',
      facts.hasHour ? `真太阳时参考：${facts.trueSolarLabel}` : '时辰未填，时柱从略',
    ].join('\n'),
    disclaimer: '以上为命盘结构倾向，属参考而非绝对吉凶判决。',
  };
}

function buildBeats(
  facts: BaziFacts,
  intentId: IntentId,
  tone: Tone,
  question: string,
  actionBody: string,
): ScriptBeat[] {
  const lean = leanForBaziIntent(intentId, tone, facts, question);
  const calm =
    facts.dayStrength === '囚' || facts.dayStrength === '死'
      ? '可以先松一口气。眼下更适合守住边界或补条件，而不是加码硬冲——停不是失败，是护住自己。'
      : '命盘是地图，不是判决书。先安住：你已经把问题问清楚了，下面会把结构、依据与可执行下一步分开说。';

  const truthParts = [
    lean,
    `核心气质偏「${facts.dayMasterWx || '未知'}」：${STRENGTH_MOD[facts.dayStrength]}`,
  ];
  if (facts.monthCategory) {
    truthParts.push(`月令更靠近「${CAT_PLAIN[facts.monthCategory]}」。`);
  }

  return [
    { id: 'calm', title: '先安住', body: calm },
    { id: 'truth', title: '盘面怎么看', body: truthParts.join('\n') },
    {
      id: 'action',
      title: '针对你的问题',
      body: actionBody || '本周只推一个可打勾动作，用结果决定加码还是停。',
    },
    {
      id: 'boundary',
      title: '什么时候该停',
      body:
        '若关键条款仍口头、对方持续含糊、或你已越过自己写好的底线——停加码，改路径或收手。',
    },
  ];
}

export function buildBaziScriptPlay(input: {
  question: string;
  facts: BaziFacts;
  intentId: IntentId;
  tone: Tone;
  actionBody: string;
}): ScriptPlay {
  const intentId = input.intentId;
  const headline = leanForBaziIntent(
    intentId,
    input.tone,
    input.facts,
    input.question,
  );
  return {
    scene: sceneFromIntent(intentId),
    intentId,
    headline,
    synthesis: buildSynthesis(input.facts, intentId),
    beats: buildBeats(
      input.facts,
      intentId,
      input.tone,
      input.question,
      input.actionBody,
    ),
    actionRuleId: 'bazi-structure',
  };
}
