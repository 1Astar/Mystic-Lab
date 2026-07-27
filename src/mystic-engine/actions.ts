import { pickCareerActions } from './packs/career-actions.ts';
import { pickGrowthActions } from './packs/growth-actions.ts';
import { pickRelationActions } from './packs/relation-actions.ts';
import { pickWealthActions } from './packs/wealth-actions.ts';
import type { IntentId, SceneAction, Tone, UserContext } from './types.ts';

const FALLBACK: SceneAction = {
  id: 'open-bt',
  title: '本周一个可打勾动作',
  body: '把你最想确认的一点写成一句话，本周只推一个能打勾的动作，用结果决定加码还是停。',
};

/** 查场景动作库：intent × tone × context */
export function pickActions(
  intent: IntentId,
  tone: Tone,
  ctx: UserContext | null,
): { breakthrough: SceneAction; checklist: SceneAction[] } {
  return (
    pickCareerActions(intent, tone, ctx) ??
    pickRelationActions(intent, tone, ctx) ??
    pickWealthActions(intent, tone, ctx) ??
    pickGrowthActions(intent, tone, ctx) ?? {
      breakthrough: FALLBACK,
      checklist: [],
    }
  );
}
