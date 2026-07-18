import type { CastResult } from './engine.ts';
import { LINE_LABELS, upperLowerFromLines } from './hexagrams.ts';
import { buildFiveSteps } from './compose-teach.ts';
import {
  composeScene,
  detectSceneDomain,
  pickSceneLine,
} from './scene-map.ts';
import { lineApproxWuXing, shiYingRelation } from './wuxing.ts';

export interface FourLayerReading {
  summary: string;
  basis: string;
  context: string;
  action: string;
}

export function buildFourLayerReading(
  cast: CastResult,
  question: string,
): FourLayerReading {
  const { primary, changed, changingIndexes, shiLine, yingLine } = cast;
  const domain = detectSceneDomain(question);
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const scene = composeScene(upper, lower, primary);
  const steps = buildFiveSteps(cast, question, domain);
  const movingLabels = changingIndexes.map((i) => LINE_LABELS[i]!).join('、');
  const shiWx = lineApproxWuXing(shiLine, upper.id, lower.id);
  const yingWx = lineApproxWuXing(yingLine, upper.id, lower.id);
  const rel = shiYingRelation(shiWx, yingWx);

  const summary = `五步速览：世应${rel.rel}（${rel.verdict}）· ${
    changingIndexes.length
      ? `动爻 ${changingIndexes.length} 处`
      : '无动爻'
  } · 本卦「${primary.keywords[0]}」${changed ? `→「${changed.keywords[0]}」` : ''}。`;

  const basis = [
    `【Step1 世应】世在${LINE_LABELS[shiLine - 1]}（我），应在${LINE_LABELS[yingLine - 1]}（外界）。${rel.rel}→${rel.verdict}。`,
    changingIndexes.length === 0
      ? '【Step2 动爻】无动爻。动得越少方向越明确。'
      : `【Step2 动爻】${changingIndexes.length} 个变心爻：${movingLabels}。`,
    `【Step3 取象】${scene.formula} ${pickSceneLine(scene, domain)}`,
    changed
      ? `【Step4 过程】${primary.fullName} →（动爻）→ ${changed.fullName}`
      : '【Step4 过程】无变卦，时间轴停在本卦。',
    `【Step5】${steps[4]!.body[0]}`,
  ].join('\n');

  const context = [
    question.trim()
      ? `你问的是「${question.trim()}」。`
      : '尚未写下具体问题——用五步回想真正卡点。',
    rel.tip,
    pickSceneLine(scene, domain),
  ].join('\n');

  const action =
    changingIndexes.length > 0
      ? `按五步收束：先对齐世应，再只动「动爻那一层」相关的事，朝「${changed?.keywords[0] ?? '新方向'}」做可验证一小步。`
      : `按五步收束：世应已标清，无动则先稳结构——围绕「${primary.keywords[0]}」列下一步与边界。`;

  return { summary, basis, context, action };
}
