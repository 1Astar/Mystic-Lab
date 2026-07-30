/**
 * 剧本导演 = 编排器
 * 意图库 → 盘面信号 → 事实规则（真相）→ 动作规则（行动+底线）→ 四段输出
 * 文案不复读整段问题（问题已在页头展示）。
 */
import type { CastResult } from '../liuyao/engine.ts';
import { collectBoardSignals, type BoardSignals } from './board-signals.ts';
import { buildTruthFromFacts } from './fact-rules.ts';
import { buildActionAndBoundary } from './action-rules.ts';
import { detectIntents } from './intent.ts';
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
  metrics: BoardSignals;
  headline: string;
  /** 解卦综合论断：吉凶成败 / 趋势 / 应期 / 细节 */
  synthesis: ScriptSynthesis;
  beats: ScriptBeat[];
  actionRuleId: string;
};

export type { ScriptScene };
export { sceneFromIntent };

function buildCalm(s: BoardSignals): string {
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

function buildHeadline(s: BoardSignals): string {
  if (s.bareQuit) {
    return `更支持先写清底线与期限，再决定是否裸辞——不是催你立刻交辞呈，也不是让你无限耗着。把「留下还能接受什么 / 什么情况必须走 / 最晚哪天决定」写成可核对的三行，再执行。`;
  }
  if (s.intentId === 'offer_decide' || s.intentId === 'job_search_window') {
    if (s.tugOfWar || s.pace === 'slow_then_stop') {
      return `能推进，但靠反复沟通与补材料，不是一次定音；同时准备好该停则停。书面跟进换节点，比干等更贴这一卦的节奏。`;
    }
    return `有推进空间，用可核对的动作去换回应，别干等。把口头好感落到邮件/材料上，才算接住窗口。`;
  }
  if (s.intentId === 'love_reunion') {
    if (s.tugOfWar || s.pace === 'stop') {
      return `窗口偏窄或会反复；用一次低压力试探核对回应质量，不逼结局。有温度再加码，没有就及时收回注意力。`;
    }
    return `先探温度，再谈复合叙事。一次清晰、低姿态的互动，比长篇复合剧本更有用。`;
  }
  if (s.intentId === 'quit_vs_stay' || s.intentId === 'quit_now' || s.intentId === 'love_stay_leave') {
    return `该停则停，守住边界比继续推进更重要；把去留写成可核对的条件。期限到就执行，留下或离开都要干净。`;
  }
  if (s.timingAsk) {
    return `应期宜边验证边估窗口，不要先钉死一个日子。先做一个可打勾的动作，再用对方的回应日当近窗锚点。`;
  }
  if (s.tugOfWar) {
    return `局面偏拉锯，宜小步核对，别一次下死结论。能推进也有拦阻时，先换到一份可核对信息，再决定加码。`;
  }
  if (s.yongWeak) {
    return `你盯的关键点力气不足，先补条件再加压。地基补上之前，硬冲容易空耗。`;
  }
  return `先观后动，用一件可核对的事验证，再决定加码或停。小探针有结果，再谈大动作。`;
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
  const calm = buildCalm(signals);
  const truth = buildTruthFromFacts(signals);
  const { action, boundary, ruleId } = buildActionAndBoundary(signals);
  const headline = buildHeadline(signals);
  const synthesis = buildSynthesis(signals, input.cast, castAt);

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
