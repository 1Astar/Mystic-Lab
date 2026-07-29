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
 * Mystic Engine 主入口：场景×三指标 → 四段剧本；旧字段同步填充以兼容
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

  const actionBeat = script.beats.find((b) => b.id === 'action');
  const boundaryBeat = script.beats.find((b) => b.id === 'boundary');
  const calmBeat = script.beats.find((b) => b.id === 'calm');
  const truthBeat = script.beats.find((b) => b.id === 'truth');

  const scriptBt: SceneAction = {
    id: 'script-action',
    title: actionBeat?.title ?? '具体动作',
    body: actionBeat?.body ?? breakthrough.body,
  };
  const scriptBoundary: SceneAction = {
    id: 'script-boundary',
    title: boundaryBeat?.title ?? '底线',
    body: boundaryBeat?.body ?? '',
  };

  const weekFromDirect = parseWeekActions(direct.nextSteps);
  let weekActions: SceneAction[] = [scriptBt];
  if (scriptBoundary.body) weekActions.push(scriptBoundary);
  if (weekActions.length < 2 && weekFromDirect.length) {
    weekActions = [...weekActions, ...weekFromDirect].slice(0, 3);
  } else if (weekActions.length < 2 && checklist.length) {
    weekActions = [...weekActions, ...checklist].slice(0, 3);
  }

  const whyFromScript: WhyItem[] = [
    {
      title: '局势推演',
      hook: truthBeat?.body.split('\n\n')[0] ?? script.headline,
      points: (truthBeat?.body ?? '')
        .split(/\n\n+/)
        .slice(1)
        .filter(Boolean),
      tip: boundaryBeat?.body?.slice(0, 80),
      body: truthBeat?.body ?? '',
    },
  ];

  return {
    intents,
    answers,
    decision: boundaryBeat?.body ?? direct.decision,
    breakthrough: weekActions[0] ?? scriptBt,
    checklist: weekActions.slice(1),
    boardExpand: buildBoardExpandText(input.cast, castAt),
    contextUsed: Boolean(ctx),
    verdict: {
      headline: script.headline,
      parse: direct.analysis,
      decision: boundaryBeat?.body ?? direct.decision,
    },
    why: whyFromScript.length && truthBeat ? whyFromScript : buildWhyItems(input.cast, direct.domain, input.question, castAt),
    energy: undefined,
    reassurance: calmBeat?.body ?? direct.reassurance,
    coreMetaphor: direct.coreMetaphor,
    script,
  };
}
