import { intentActionsPlain } from '../mystic-engine/intent-actions.ts';
import type { BaziChart } from './cast.ts';
import { buildBaziFacts } from './bazi-facts.ts';
import { detectBaziTone } from './bazi-evidence.ts';

/** 有问句 → 共享意图动作（有盘时用盘面 tone）；无问句 → 引导 */
export function buildBaziSuggestion(
  question: string,
  chart?: BaziChart,
): string {
  const q = question.trim();
  if (!q) {
    return '可先写下此刻最在意的一件事，再对照命盘结构看倾向。';
  }
  const tone = chart ? detectBaziTone(buildBaziFacts(chart)) : 'neutral';
  return intentActionsPlain(q, { ctx: null, tone });
}
