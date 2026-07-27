import type { CastResult } from '../liuyao/engine.ts';
import { pickActions } from './actions.ts';
import { resolveUserContext } from './context.ts';
import { mapEvidence } from './evidence.ts';
import { detectIntents } from './intent.ts';
import { leanForIntent } from './lean.ts';
import { detectTone } from './tone.ts';
import type { OfflineAnswerPack, UserContext } from './types.ts';

export type BuildPackInput = {
  question: string;
  cast: CastResult;
  castAt?: Date;
  useProfile?: boolean;
  /** 测试可注入 */
  context?: UserContext | null;
};

function buildDecision(packAnswers: OfflineAnswerPack['answers'], cast: CastResult): string {
  if (packAnswers.length >= 2) {
    const bits = packAnswers.map((a) => a.lean).join('；');
    return `几件事绑在一起看：${bits} 综合建议：先做破局动作里那一件可验证的事，再用结果决定加码还是撤。`;
  }
  if (packAnswers[0]) return packAnswers[0].lean;
  const to = cast.changed?.keywords[0] ?? cast.primary.keywords[0] ?? '';
  return `当前主调偏「${to}」：先把可核对的事实看清，再决定加码还是收手。`;
}

/**
 * Mystic Engine 主入口：问题 → Intent → Context → Evidence → Action → Pack
 */
export function buildOfflineAnswerPack(input: BuildPackInput): OfflineAnswerPack {
  const castAt = input.castAt ?? new Date();
  const intents = detectIntents(input.question);
  const tone = detectTone(input.cast);
  const ctx =
    input.context !== undefined
      ? input.context
      : resolveUserContext({ useProfile: input.useProfile });

  const answers = intents.map((hit) => ({
    intentId: hit.id,
    questionSlice: hit.slice,
    lean: leanForIntent(hit.id, input.cast, tone),
    evidence: mapEvidence(input.cast, hit.id, input.question, castAt),
  }));

  const primaryIntent = intents[0]?.id ?? 'open_explore';
  const { breakthrough, checklist } = pickActions(primaryIntent, tone, ctx);

  // 多意图时：若含谈薪/转正，破局优先用谈薪动作
  const salaryHit = intents.find(
    (h) => h.id === 'salary_negotiate' || h.id === 'probation_convert',
  );
  const stayHit = intents.find(
    (h) => h.id === 'quit_vs_stay' || h.id === 'quit_now',
  );
  let finalBt = breakthrough;
  let finalCheck = checklist;
  if (salaryHit) {
    const sal = pickActions(salaryHit.id, tone, ctx);
    finalBt = sal.breakthrough;
    finalCheck = sal.checklist;
    if (stayHit) {
      const stay = pickActions(stayHit.id, tone, ctx);
      finalCheck = [...finalCheck, ...stay.checklist].slice(0, 3);
    }
  } else if (stayHit) {
    const stay = pickActions(stayHit.id, tone, ctx);
    finalBt = stay.breakthrough;
    finalCheck = stay.checklist;
  }

  const from = input.cast.primary.keywords[0] ?? input.cast.primary.name;
  const to = input.cast.changed?.keywords[0];
  const boardExpand = input.cast.changed
    ? `盘面辅读：本卦偏「${from}」→ 变卦偏「${to}」。世爻在关注你的目标落点；动爻处是松动点，宜小步核对。`
    : `盘面辅读：本卦偏「${from}」，格局偏静——先对齐事实再加码。`;

  return {
    intents,
    answers,
    decision: buildDecision(answers, input.cast),
    breakthrough: finalBt,
    checklist: finalCheck,
    boardExpand,
    contextUsed: Boolean(ctx),
  };
}
