export { buildOfflineAnswerPack } from './build-pack.ts';
export type { BuildPackInput } from './build-pack.ts';
export { buildBaziAnswerPack } from '../bazi/build-pack.ts';
export type { BuildBaziPackInput } from '../bazi/build-pack.ts';
export { renderAnswerPackHtml, bindAnswerPackGestures } from './render-pack.ts';
export type { RenderPackOpts } from './render-pack.ts';
export type {
  AnswerBlock,
  EvidenceLine,
  IntentHit,
  IntentId,
  OfflineAnswerPack,
  RiskPreference,
  SceneAction,
  SceneDomain,
  Tone,
  UserContext,
  VerdictBlock,
  WhyItem,
} from './types.ts';
export { detectIntents } from './intent.ts';
export { resolveUserContext } from './context.ts';
export { detectTone } from './tone.ts';
export { mapEvidence } from './evidence.ts';
export { pickActions } from './actions.ts';
export {
  formatSceneActionsPlain,
  intentActionsPlain,
  resolveIntentActions,
} from './intent-actions.ts';
export type { IntentActionsResult } from './intent-actions.ts';
