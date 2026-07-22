import type { CastResult } from './engine.ts';
import { buildReadingFacts } from './reading-facts.ts';
import { buildCausalReading } from './narrative-learn.ts';
import { buildStrategyPack } from './strategy.ts';

export interface FourLayerReading {
  summary: string;
  basis: string;
  context: string;
  action: string;
}

/** 学习模式用的四层结构：改为因果链文案（仍兼容旧字段名） */
export function buildFourLayerReading(
  cast: CastResult,
  question: string,
): FourLayerReading {
  const facts = buildReadingFacts(cast, question);
  const causal = buildCausalReading(facts);
  const pack = buildStrategyPack(cast, facts.domain, question);

  const summary = `核心在于「${causal.anchor}」`;
  const basis = causal.because
    .map((s) => `【${s.step}】${s.short}\n${s.detail}`)
    .join('\n\n');
  const context = [
    question.trim()
      ? `你问的是「${question.trim()}」。`
      : '尚未写下具体问题——先用卦象回想真正卡点。',
    `所以：${causal.conclusion}`,
  ].join('\n');
  const action = [causal.actionLead, ...pack.items.map((i) => `${i.label}：${i.text}`)].join(
    '\n',
  );

  return { summary, basis, context, action };
}

/** 速断短结论（无长因果链） */
export function buildQuickSummary(cast: CastResult, question: string): string {
  const facts = buildReadingFacts(cast, question);
  const move =
    facts.changing.labels.length === 0
      ? '无动爻'
      : `动爻 ${facts.changing.labels.length} 处`;
  const arrow = facts.changed
    ? `「${facts.primary.keywords[0]}」→「${facts.changed.keywords[0]}」`
    : `「${facts.primary.keywords[0]}」`;
  return `${facts.primary.gist} ${arrow} · 世应${facts.shiYingRel.rel} · ${move}。`;
}
