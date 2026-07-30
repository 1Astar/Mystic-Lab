import type { CastResult } from '../liuyao/engine.ts';
import { LINE_LABELS } from '../liuyao/hexagrams.ts';
import { LINE_ROLE } from '../liuyao/reading-facts.ts';
import type { EvidenceLine, IntentId } from './types.ts';
import { collectBoardSignals } from './board-signals.ts';
import { mapConditionEvidence } from './fact-rules.ts';

function primaryChangedEvidence(cast: CastResult): EvidenceLine {
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const to = cast.changed?.keywords[0];
  if (cast.changed && to) {
    return {
      factKey: 'primary_changed',
      plain: `本卦「${cast.primary.fullName}」偏「${from}」→ 变卦「${cast.changed.fullName}」偏「${to}」：方向在变，宜用变卦的方式推进，而不是死磕本卦旧法。`,
    };
  }
  return {
    factKey: 'primary_static',
    plain: `本卦「${cast.primary.fullName}」主调「${from}」，无动则先把现状与底线看清，再决定加码还是收手。`,
  };
}

function shiEvidence(cast: CastResult): EvidenceLine {
  const label = LINE_LABELS[cast.shiLine - 1]!;
  const role = LINE_ROLE[cast.shiLine - 1] ?? '';
  return {
    factKey: 'shi',
    plain: `世爻在${label}${role ? `（${role}）` : ''}：你站在「自己在意的结果」这一侧，说明你很在乎这件事的落点。`,
    gloss: {
      term: '世爻',
      gloss: '卦里代表「你自己」的那一爻——你的立场与在意的落点。',
    },
  };
}

function changingEvidence(cast: CastResult): EvidenceLine | null {
  if (!cast.changingIndexes.length) return null;
  const move = cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、');
  return {
    factKey: 'changing',
    plain: `动在${move}：变化不是全局翻盘，而是这些位置在松动——过程可能拉扯，宜小步核对。`,
  };
}

/** 按意图 + 条件事实挑选可回溯证据 */
export function mapEvidence(
  cast: CastResult,
  intentId: IntentId,
  question = '',
  castAt = new Date(),
): EvidenceLine[] {
  const signals = collectBoardSignals({ question, cast, castAt, intentId });
  const conditioned = mapConditionEvidence(signals).map((e) => ({
    factKey: e.factKey,
    plain: e.plain,
  }));

  const lines: EvidenceLine[] = [
    primaryChangedEvidence(cast),
    shiEvidence(cast),
    ...conditioned,
  ];
  const ch = changingEvidence(cast);
  if (ch) lines.push(ch);

  const seen = new Set<string>();
  return lines
    .filter((e) => {
      if (seen.has(e.factKey)) return false;
      seen.add(e.factKey);
      return true;
    })
    .slice(0, 5);
}
