import type { BaziChart } from './cast.ts';
import { buildBaziFacts } from './bazi-facts.ts';
import { detectBaziTone, mapBaziEvidence } from './bazi-evidence.ts';
import { leanForBaziIntent } from './bazi-lean.ts';
import { buildBaziWhyItems } from './bazi-why.ts';
import { buildBaziScriptPlay } from './bazi-script.ts';
import { buildBaziPortrait } from './portrait-template.ts';
import { pickActions } from '../mystic-engine/actions.ts';
import { resolveUserContext } from '../mystic-engine/context.ts';
import { detectIntents } from '../mystic-engine/intent.ts';
import type {
  OfflineAnswerPack,
  SceneAction,
  UserContext,
} from '../mystic-engine/types.ts';

export type BuildBaziPackInput = {
  question: string;
  chart: BaziChart;
  gender?: '' | 'female' | 'male';
  useProfile?: boolean;
  /** 测试可注入 */
  context?: UserContext | null;
};

function boardExpandText(chart: BaziChart): string {
  const pillars = chart.pillars
    .filter((p) => !p.empty && p.key !== 'liunian')
    .map((p) => `${p.title}${p.stem}${p.branch}（${p.stemGod}）`)
    .join(' · ');
  const season = chart.season
    .map((s) => `${s.label}${s.strength}`)
    .join(' ');
  const rel = chart.relations.length
    ? chart.relations.join(' · ')
    : '地支暂无明显合冲刑害';
  return [
    `日主 ${chart.dayMaster}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''}`,
    `四柱：${pillars}`,
    `月令五行：${season}`,
    `地支：${rel}`,
    `真太阳时：${chart.trueSolarLabel}`,
  ].join('\n');
}

/**
 * 八字 → OfflineAnswerPack（与六爻同 schema，可共用 renderAnswerPackHtml）
 */
export function buildBaziAnswerPack(
  input: BuildBaziPackInput,
): OfflineAnswerPack {
  const q = input.question.trim() || '我的命盘速读';
  const facts = buildBaziFacts(input.chart);
  const tone = detectBaziTone(facts);
  const ctx =
    input.context !== undefined
      ? input.context
      : resolveUserContext({ useProfile: input.useProfile });
  const portrait = buildBaziPortrait(input.chart, {
    gender: input.gender,
  });

  const intents = detectIntents(q);
  const primaryIntent = intents[0]?.id ?? 'open_explore';

  const answers = intents.map((hit) => ({
    intentId: hit.id,
    questionSlice: hit.slice,
    lean: leanForBaziIntent(hit.id, tone, facts, hit.slice || q),
    evidence: mapBaziEvidence(input.chart, {
      intentId: hit.id,
      question: hit.slice || q,
      facts,
    }),
  }));

  const { breakthrough, checklist } = pickActions(primaryIntent, tone, ctx);
  const weekActions: SceneAction[] = [breakthrough, ...checklist].filter((a) =>
    a.body.trim(),
  );

  const decision =
    answers[0]?.lean ??
    leanForBaziIntent(primaryIntent, tone, facts, q);

  const script = buildBaziScriptPlay({
    question: q,
    facts,
    intentId: primaryIntent,
    tone,
    actionBody: weekActions[0]?.body ?? breakthrough.body,
  });

  return {
    intents,
    answers,
    decision,
    breakthrough: weekActions[0] ?? breakthrough,
    checklist: weekActions.slice(1),
    boardExpand: boardExpandText(input.chart),
    contextUsed: Boolean(ctx),
    verdict: {
      headline: portrait.keyword,
      parse: [
        `性格：${portrait.personality}`,
        `事业：${portrait.career}`,
        `关系：${portrait.relationship}`,
        `财富：${portrait.wealth}`,
        `课题：${portrait.innerWork}`,
      ].join('\n'),
      decision,
    },
    why: buildBaziWhyItems(facts, q),
    energy: `主题：${portrait.themes.join(' · ')}`,
    reassurance:
      facts.dayStrength === '囚' || facts.dayStrength === '死'
        ? '弱时硬扛最伤。先找补给与边界，再谈冲刺——你不是不够好，只是节奏需要先蓄。'
        : '气场够用时，更怕空转与自我鞭打。允许自己停一拍对齐，再加速——地图在，路要你走。',
    coreMetaphor: `核心隐喻：出生密码像一张「${portrait.themes[0]}」的底图，行动写在上面。`,
    script,
  };
}
