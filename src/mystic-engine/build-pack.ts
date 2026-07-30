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
import { buildScriptPlay } from './script-play.ts';
import type { OfflineAnswerPack, SceneAction, UserContext, WhyItem } from './types.ts';

export type BuildPackInput = {
  question: string;
  cast: CastResult;
  castAt?: Date;
  useProfile?: boolean;
  /** 测试可注入 */
  context?: UserContext | null;
};

/**
 * Mystic Engine 主入口：
 * 内容以 direct-reading 四层为主（核心方向 / 现状与转机 / 具体动作 / 心理定心丸），
 * 剧本导演补充：问题回应、综合论断、条件触发行动与底线。
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
  const script = buildScriptPlay({
    question: input.question,
    cast: input.cast,
    castAt,
  });

  const answers = intents.map((hit) => ({
    intentId: hit.id,
    questionSlice: hit.slice,
    lean: leanForIntent(hit.id, input.cast, tone),
    evidence: mapEvidence(input.cast, hit.id, input.question, castAt),
  }));

  const primaryIntent = intents[0]?.id ?? 'open_explore';
  const { breakthrough, checklist } = pickActions(primaryIntent, tone, ctx);
  const weekFromDirect = parseWeekActions(direct.nextSteps);

  const actionBeat = script.beats.find((b) => b.id === 'action');
  const boundaryBeat = script.beats.find((b) => b.id === 'boundary');

  /** 旧内容为主：本周动作优先用 direct / pickActions；剧本行动与底线作补充 */
  const scriptExtras: SceneAction[] = [];
  if (actionBeat?.body.trim()) {
    scriptExtras.push({
      id: 'script-action',
      title: '针对你的问题',
      body: actionBeat.body,
    });
  }
  if (boundaryBeat?.body.trim()) {
    scriptExtras.push({
      id: 'script-boundary',
      title: '什么时候该停',
      body: boundaryBeat.body,
    });
  }

  let weekActions: SceneAction[] = [];
  if (weekFromDirect.length) {
    weekActions = [...weekFromDirect];
  } else {
    weekActions = [breakthrough, ...checklist].filter((a) => a.body.trim());
  }
  for (const extra of scriptExtras) {
    if (weekActions.length >= 4) break;
    if (!weekActions.some((w) => w.body === extra.body)) {
      weekActions.push(extra);
    }
  }
  if (!weekActions.length && scriptExtras.length) {
    weekActions = scriptExtras.slice(0, 3);
  }

  const why: WhyItem[] = buildWhyItems(
    input.cast,
    direct.domain,
    input.question,
    castAt,
  );

  return {
    intents,
    answers,
    decision: direct.decision,
    breakthrough: weekActions[0] ?? breakthrough,
    checklist: weekActions.slice(1),
    boardExpand: buildBoardExpandText(input.cast, castAt),
    contextUsed: Boolean(ctx),
    verdict: {
      /** 旧版卦象主调一句话（核心方向大标题） */
      headline: direct.verdict,
      parse: direct.analysis,
      decision: direct.decision,
    },
    why,
    energy: undefined,
    reassurance: direct.reassurance,
    coreMetaphor: direct.coreMetaphor,
    script,
  };
}
