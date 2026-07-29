import type { CastResult } from '../liuyao/engine.ts';
import { buildDirectReading } from '../liuyao/direct-reading.ts';
import { buildBoardExpandText } from '../liuyao/board-lens.ts';
import { pickActions } from './actions.ts';
import { resolveUserContext } from './context.ts';
import { mapEvidence } from './evidence.ts';
import { detectIntents } from './intent.ts';
import { leanForIntent } from './lean.ts';
import { detectTone } from './tone.ts';
import { parseWeekActions } from './week-actions.ts';
import { buildWhyItems } from './why.ts';
import type { OfflineAnswerPack, SceneAction, UserContext } from './types.ts';

export type BuildPackInput = {
  question: string;
  cast: CastResult;
  castAt?: Date;
  useProfile?: boolean;
  /** 测试可注入 */
  context?: UserContext | null;
};

/**
 * Mystic Engine 主入口：问题 → Intent → DirectReading 结论 → Evidence → Action → Pack
 */
export function buildOfflineAnswerPack(input: BuildPackInput): OfflineAnswerPack {
  const castAt = input.castAt ?? new Date();
  const intents = detectIntents(input.question);
  const tone = detectTone(input.cast);
  const ctx =
    input.context !== undefined
      ? input.context
      : resolveUserContext({ useProfile: input.useProfile });

  const direct = buildDirectReading(input.cast, input.question);

  const answers = intents.map((hit) => ({
    intentId: hit.id,
    questionSlice: hit.slice,
    lean: leanForIntent(hit.id, input.cast, tone),
    evidence: mapEvidence(input.cast, hit.id, input.question, castAt),
  }));

  // 若意图切片与 direct 分题不一致，用 lean 对齐展示；单意图时用 direct 的 partLeans 补强
  if (answers.length === 0 && direct.partLeans.length) {
    // intents 至少有 open_explore；detectIntents 总有结果
  }

  const primaryIntent = intents[0]?.id ?? 'open_explore';
  const { breakthrough, checklist } = pickActions(primaryIntent, tone, ctx);

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

  // 优先用 DirectReading 的「本周三件事」（更贴问题）
  const weekFromDirect = parseWeekActions(direct.nextSteps);
  let weekActions: SceneAction[] = weekFromDirect;
  if (weekActions.length === 0) {
    weekActions = [finalBt, ...finalCheck];
  } else if (weekActions.length < 3 && finalCheck.length) {
    weekActions = [...weekActions, ...finalCheck].slice(0, 3);
  }

  return {
    intents,
    answers,
    decision: direct.decision,
    breakthrough: weekActions[0] ?? finalBt,
    checklist: weekActions.slice(1),
    boardExpand: buildBoardExpandText(input.cast, castAt),
    contextUsed: Boolean(ctx),
    verdict: {
      headline: direct.verdict,
      parse: direct.analysis,
      decision: direct.decision,
    },
    why: buildWhyItems(input.cast, direct.domain, input.question, castAt),
    // 爻相已并入 why，避免与能量块重复
    energy: undefined,
    reassurance: direct.reassurance,
    coreMetaphor: direct.coreMetaphor,
  };
}
