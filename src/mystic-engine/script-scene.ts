/**
 * 场景检测：与意图库对齐（不再另起一套正则旁路）
 */
import { detectIntents } from './intent.ts';
import type { IntentId } from './types.ts';

export type ScriptScene =
  | 'interview'
  | 'reunion'
  | 'quit_stay'
  | 'career'
  | 'love'
  | 'fallback';

export function sceneFromIntent(intentId: IntentId): ScriptScene {
  if (intentId === 'offer_decide' || intentId === 'job_search_window') return 'interview';
  if (intentId === 'love_reunion') return 'reunion';
  if (
    intentId === 'quit_now' ||
    intentId === 'quit_vs_stay' ||
    intentId === 'love_stay_leave'
  ) {
    return 'quit_stay';
  }
  if (
    intentId.startsWith('career_') ||
    intentId === 'salary_negotiate' ||
    intentId === 'probation_convert' ||
    intentId === 'team_conflict'
  ) {
    return 'career';
  }
  if (intentId.startsWith('love_')) return 'love';
  return 'fallback';
}

export function detectScriptScene(question: string): ScriptScene {
  const intentId = detectIntents(question)[0]?.id ?? 'open_explore';
  return sceneFromIntent(intentId);
}
