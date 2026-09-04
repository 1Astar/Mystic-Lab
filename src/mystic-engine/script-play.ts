/**
 * 剧本导演 = 编排器
 * 意图库 → 盘面信号 → 事实规则（真相）→ 动作规则（行动+底线）→ 四段输出
 * 文案不复读整段问题（问题已在页头展示）。
 *
 * 「对你这个问题」headline：必须随 意图 × 本/变卦 × 盘面 变化，禁止单一死句盖住所有卦。
 */
import type { CastResult } from '../liuyao/engine.ts';
import { collectBoardSignals, type BoardSignals } from './board-signals.ts';
import { buildTruthFromFacts } from './fact-rules.ts';
import { buildActionAndBoundary } from './action-rules.ts';
import { detectIntents } from './intent.ts';
import { isMetaUxQuestion } from './meta-ux.ts';
import {
  buildInstantDirectAnswer,
  buildHumanTruthFromFacts,
  routeQuestion,
} from './instant-answer.ts';
import type { IntentId } from './types.ts';
import { sceneFromIntent, type ScriptScene } from './script-scene.ts';
import { buildSynthesis, type ScriptSynthesis } from './synthesis.ts';

export type ScriptBeat = {
  id: 'calm' | 'truth' | 'action' | 'boundary';
  title: string;
  body: string;
};

export type ScriptPlay = {
  scene: ScriptScene;
  intentId: IntentId;
  /** 六爻盘面信号；八字等体系可不填 */
  metrics?: BoardSignals;
  headline: string;
  /** 解卦综合论断：吉凶成败 / 趋势 / 应期 / 细节 */
  synthesis: ScriptSynthesis;
  beats: ScriptBeat[];
  actionRuleId: string;
};

export type { ScriptScene };
export { sceneFromIntent };

function buildCalm(s: BoardSignals, question: string): string {
  if (isMetaUxQuestion(question)) {
    return `先别急着给「太长 / 太空」下结论。六步铜钱是仪式，结果页会先给定调与下一步；术语能点开再看。你已经把问题问清楚了，下面按体验落地说。`;
  }
  if (s.bareQuit) {
    return `先别急着给一个是/否。你已经扛得够辛苦了——可以先松一口气。下面会谈节奏、条件与底线，不是催你今天立刻交辞呈，也不是让你继续无意义地耗着。`;
  }
  if (s.pace === 'slow_then_stop' || s.pace === 'slow') {
    return `急不来，往往不是你不够好，而是节奏本身偏慢。先稳住心神：慢不等于否决，只是提醒你用可核对的一小步去换信息，而不是空等或硬冲。`;
  }
  if (s.pace === 'stop' || s.yongWeak) {
    return `可以先松一口气。眼下更适合守住边界或补条件，而不是加码硬冲——停不是失败，是护住自己，好让后面真正能走的时候走得干净。`;
  }
  if (s.tugOfWar) {
    return `局面会反复，先深呼吸。拉锯不是对你的判决，只是提醒：一边有推力，一边有拦阻，用小步去核对就好，别把一次拉扯当成终局。`;
  }
  return `卦象是灯，不是判决书。先安住：你已经把问题问清楚了，下面会把象意、盘面信号与可执行下一步分开说，好让你心里有地儿落地。`;
}

/** 本→变关键词桥，保证不同卦 headline 字面就不同 */
function hexArc(cast: CastResult): string {
  const fromKw = cast.primary.keywords.slice(0, 2).join('·') || cast.primary.name;
  if (cast.changed) {
    const toKw = cast.changed.keywords.slice(0, 2).join('·') || cast.changed.name;
    return `${cast.primary.name}偏「${fromKw}」→${cast.changed.name}偏「${toKw}」`;
  }
  return `${cast.primary.name}偏「${fromKw}」`;
}

type TopicKind =
  | 'family'
  | 'love'
  | 'career'
  | 'money'
  | 'health'
  | 'study'
  | 'decide'
  | 'open';

function topicKind(question: string, intentId: IntentId): TopicKind {
  const q = question;
  if (/爸|妈|父亲|母亲|父母|家里|家人|家暴|家事|威胁.*(?:爸|妈)|(?:爸|妈).*威胁/.test(q)) {
    return 'family';
  }
  if (
    intentId.startsWith('love_') ||
    /对象|分手|复合|恋爱|婚姻|男朋友|女朋友|伴侣/.test(q)
  ) {
    return 'love';
  }
  if (
    intentId.startsWith('wealth_') ||
    /钱|投资|回款|理财|花不花|该不该买/.test(q)
  ) {
    return 'money';
  }
  if (
    intentId.startsWith('career_') ||
    intentId === 'quit_vs_stay' ||
    intentId === 'quit_now' ||
    intentId === 'offer_decide' ||
    intentId === 'job_search_window' ||
    intentId === 'salary_negotiate' ||
    intentId === 'probation_convert' ||
    intentId === 'team_conflict'
  ) {
    return 'career';
  }
  if (intentId.startsWith('growth_') || /考研|考试|学习|留学/.test(q)) {
    return 'study';
  }
  if (/身体|健康|看病|手术|失眠|生病/.test(q)) return 'health';
  if (intentId === 'anxiety_decide' || intentId === 'timing') return 'decide';
  return 'open';
}

/** 盘面修饰：同是拉锯也要随 pace / 卦象变说法 */
function boardBit(s: BoardSignals, cast: CastResult): string {
  if (s.bareQuit) {
    return '先写清底线与期限，再决定是否裸辞。';
  }
  if (s.tugOfWar) {
    if (s.pace === 'cut_open' || /夬|革|噬嗑/.test(cast.primary.name)) {
      return '盘面一边催决断、一边有拦阻：宜公开说清，先换一份可核对事实，再加码。';
    }
    if (s.pace === 'slow_then_stop' || s.pace === 'slow') {
      return '盘面推进慢且有拦：宜书面/小步跟进换节点，准备好该停则停。';
    }
    if (s.pace === 'stop' || /艮|遁|否|困/.test(cast.changed?.name ?? cast.primary.name)) {
      return '盘面有推也有停：先守边界，用一次低压力核对再决定要不要加压。';
    }
    if (/复|屯|蒙|需/.test(cast.primary.name)) {
      return '转机刚冒头又有拦：宜从根本处小步核对，别一次定终身。';
    }
    if (/大过|坎|蹇/.test(cast.changed?.name ?? '')) {
      return '能推进也偏承压：先减负或重分压力，再谈加码。';
    }
    return `暗动与月破同现：宜对照「${s.yongName}」小步核对，别一次下死结论。`;
  }
  if (s.yongWeak) {
    return `关键点「${s.yongName}」力气偏弱，先补条件再加压。`;
  }
  if (s.pace === 'cut_open') {
    return '节奏偏决断：宜公开明确，忌拖泥带水。';
  }
  if (s.pace === 'stop') {
    return '节奏偏守：先稳住边界，再谈推进。';
  }
  if (s.pace === 'slow' || s.pace === 'slow_then_stop') {
    return '节奏偏慢：用可核对的一小步换信息，别空等或硬冲。';
  }
  if (s.timingAsk) {
    return '应期宜边验证边估窗口，先做一个可打勾动作再锚近窗。';
  }
  return '先观后动：一件可核对的事有结果，再谈大动作。';
}

function topicLead(topic: TopicKind, intentId: IntentId): string {
  switch (topic) {
    case 'family':
      return '家事宜先护住安全与可核对信息，再谈谁对谁错';
    case 'love':
      if (intentId === 'love_reunion') return '复合宜先探温度，再谈叙事';
      if (intentId === 'love_stay_leave') return '感情去留意先写清继续条件与必须停的信号';
      if (intentId === 'love_conflict') return '关系冲突宜先降温对齐一件事实，再摊牌';
      return '关系题宜小步核对回应质量，有温度再加码';
    case 'career':
      if (intentId === 'offer_decide' || intentId === 'job_search_window') {
        return '求职/面试宜把口头好感落到书面节点';
      }
      if (intentId === 'quit_vs_stay' || intentId === 'quit_now') {
        return '职场去留意写成可核对条件再动';
      }
      if (intentId === 'team_conflict') {
        return '团队冲突宜先对齐权责与事实，少意气';
      }
      return '事业题宜用可交付动作换反馈';
    case 'money':
      return '钱事项先设止损与核对点，再决定加码';
    case 'health':
      return '健康题以可核对的医疗信息为准，卦象只作节奏参考';
    case 'study':
      return '学业/考试宜拆成可打勾的一小段，再估窗口';
    case 'decide':
      return '决策题别一次下死结论，先换一份可核对信息';
    default:
      return '先把局面拆成可核对的一小步';
  }
}

function buildHeadline(s: BoardSignals, question: string, cast: CastResult): string {
  if (isMetaUxQuestion(question)) {
    return `流程有仪式感，但不会劝退；解读也会压成可核对的几步——不是只剩「跟随对象」这类空话。先扫定调，再看下一步。`;
  }
  if (s.bareQuit) {
    return `更支持先写清底线与期限，再决定是否裸辞——不是催你立刻交辞呈，也不是让你无限耗着。把「留下还能接受什么 / 什么情况必须走 / 最晚哪天决定」写成可核对的三行，再执行。`;
  }

  const topic = topicKind(question, s.intentId);
  const lead = topicLead(topic, s.intentId);
  const arc = hexArc(cast);
  const board = boardBit(s, cast);

  // 面试金样：保留「推进 / 补材料 / 该停则停」等可测措辞
  if (s.intentId === 'offer_decide' || s.intentId === 'job_search_window') {
    if (s.tugOfWar || s.pace === 'slow_then_stop') {
      return `${lead}。${arc}：能推进，但靠反复沟通与补材料，不是一次定音；同时准备好该停则停。`;
    }
    return `${lead}。${arc}：有推进空间，书面跟进换节点，比干等更贴这一卦。`;
  }

  if (s.intentId === 'love_reunion') {
    if (s.tugOfWar || s.pace === 'stop') {
      return `${lead}。${arc}：窗口偏窄或会反复；一次低压力试探核对回应，不逼结局。`;
    }
    return `${lead}。${arc}：一次清晰、低姿态的互动，比长篇复合剧本更有用。`;
  }

  if (s.intentId === 'love_stay_leave') {
    if (s.tugOfWar || s.pace === 'stop' || s.pace === 'slow_then_stop') {
      return `${lead}。${arc}：有温度再推进，没有就及时收回注意力。`;
    }
    return `${lead}。${arc}：先对齐一件可核对的事，再谈去留叙事。`;
  }

  if (s.intentId === 'quit_vs_stay' || s.intentId === 'quit_now') {
    if (s.tugOfWar || s.pace === 'slow_then_stop') {
      return `${lead}。${arc}：去留还在拉扯——写「留下还能接受什么 / 必须走的信号 / 最晚哪天定」，少空耗。`;
    }
    if (s.pace === 'stop' || s.yongWeak) {
      return `${lead}。${arc}：更支持先守边界；期限到就执行，留下或离开都要干净。`;
    }
    return `${lead}。${arc}：期限到就执行；关键是别拖成内耗。`;
  }

  const route = routeQuestion(question, s.intentId);
  const instant = buildInstantDirectAnswer({
    question,
    cast,
    route,
    intentId: s.intentId,
    paceSlow: s.pace === 'slow' || s.pace === 'slow_then_stop',
    paceStop: s.pace === 'stop',
    yongWeak: s.yongWeak,
    tugOfWar: s.tugOfWar,
  });
  if (instant) return instant;

  // 通用：话题定调 + 卦桥 + 盘面，三者都变则整句必变
  return `${lead}。${arc}。${board}`;
}

export function buildScriptPlay(input: {
  question: string;
  cast: CastResult;
  castAt?: Date;
}): ScriptPlay {
  const castAt = input.castAt ?? new Date();
  const intents = detectIntents(input.question);
  const intentId = intents[0]?.id ?? 'open_explore';
  const signals = collectBoardSignals({
    question: input.question,
    cast: input.cast,
    castAt,
    intentId,
  });
  const scene = sceneFromIntent(intentId);
  const route = routeQuestion(input.question, intentId);
  const calm = buildCalm(signals, input.question);
  const truth =
    buildHumanTruthFromFacts(signals, input.question, route) ||
    buildTruthFromFacts(signals, { question: input.question, route });
  const { action, boundary, ruleId } = buildActionAndBoundary(signals);
  const headline = buildHeadline(signals, input.question, input.cast);
  const synthesis = buildSynthesis(signals, input.cast, castAt, route);

  return {
    scene,
    intentId,
    metrics: signals,
    headline,
    synthesis,
    actionRuleId: ruleId,
    beats: [
      { id: 'calm', title: '先给你一颗定心丸', body: calm },
      { id: 'truth', title: '为何这样看', body: truth },
      { id: 'action', title: '接下来可以做什么', body: action },
      { id: 'boundary', title: '什么时候该停', body: boundary },
    ],
  };
}
