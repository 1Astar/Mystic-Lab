import { pickActions } from './actions.ts';
import { resolveUserContext } from './context.ts';
import { detectIntents } from './intent.ts';
import type {
  IntentHit,
  IntentId,
  SceneAction,
  SceneDomain,
  Tone,
  UserContext,
} from './types.ts';

export type IntentActionsResult = {
  intents: IntentHit[];
  primary: IntentHit;
  breakthrough: SceneAction;
  checklist: SceneAction[];
};

const OPEN_EXPLORE: IntentHit = {
  id: 'open_explore',
  slice: '',
  confidence: 'mid',
  domain: 'general',
};

/**
 * 多系统共用：问题 → 意图 → 场景动作（不依赖六爻盘面）。
 * tone 默认 neutral；有盘面 tone 的体系可自行传入。
 */
export function resolveIntentActions(
  question: string,
  opts?: {
    tone?: Tone;
    /** 显式传入；`undefined` 时读 Lab 档案；`null` 表示不用档案 */
    ctx?: UserContext | null;
  },
): IntentActionsResult {
  const intents = detectIntents(question);
  const primary: IntentHit = intents[0]
    ? intents[0]
    : {
        ...OPEN_EXPLORE,
        slice: question.trim() || '（未填写）',
        id: 'open_explore' as IntentId,
        domain: 'general' as SceneDomain,
      };

  const tone = opts?.tone ?? 'neutral';
  const ctx = opts && 'ctx' in opts ? (opts.ctx ?? null) : resolveUserContext();
  const { breakthrough, checklist } = pickActions(primary.id, tone, ctx);

  return { intents, primary, breakthrough, checklist };
}

/** 单段纯文本，适合小六壬 suggestion / 塔罗 action 字段 */
export function formatSceneActionsPlain(
  breakthrough: SceneAction,
  checklist: SceneAction[] = [],
): string {
  const main = `${breakthrough.title}：${breakthrough.body}`;
  if (!checklist.length) return main;
  const extras = checklist.map((c) => `${c.title}——${c.body}`).join('；');
  return `${main}；${extras}`;
}

/** 一步：问题 → 可展示动作文案 */
export function intentActionsPlain(
  question: string,
  opts?: Parameters<typeof resolveIntentActions>[1],
): string {
  const { breakthrough, checklist } = resolveIntentActions(question, opts);
  return formatSceneActionsPlain(breakthrough, checklist);
}
