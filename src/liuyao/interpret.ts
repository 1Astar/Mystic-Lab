import type { CastResult } from './engine.ts';
import { buildDirectReading } from './direct-reading.ts';

export interface FourLayerReading {
  summary: string;
  basis: string;
  context: string;
  action: string;
}

/** 手札四层：核心判词 + 解析依据 + 结合所问 + 决策与行动 */
export function buildFourLayerReading(
  cast: CastResult,
  question: string,
): FourLayerReading {
  const d = buildDirectReading(cast, question);
  const partLine =
    d.partLeans.length > 1
      ? d.partLeans.map((p) => `· ${p.part} → ${p.lean}`).join('\n')
      : '';

  return {
    summary: d.verdict,
    basis: `${d.frame}\n\n${d.analysis}\n\n${d.why}`,
    context: [
      question.trim() ? `你问的是「${question.trim()}」。` : '尚未写下具体问题。',
      partLine,
    ]
      .filter(Boolean)
      .join('\n'),
    action: `${d.decision}\n\n${d.nextSteps}`,
  };
}

/** 速断短结论 */
export function buildQuickSummary(cast: CastResult, question: string): string {
  const d = buildDirectReading(cast, question);
  return `${d.verdict}（${d.frame.replace(/[（）]/g, '')}）`;
}
