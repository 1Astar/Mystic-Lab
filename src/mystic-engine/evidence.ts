import type { CastResult } from '../liuyao/engine.ts';
import { LINE_LABELS } from '../liuyao/hexagrams.ts';
import { buildReadingFacts, LINE_ROLE } from '../liuyao/reading-facts.ts';
import type { EvidenceLine, IntentId } from './types.ts';

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

/** 按意图挑选 2–4 条可回溯证据（只引用盘面已有事实） */
export function mapEvidence(
  cast: CastResult,
  intentId: IntentId,
  question = '',
  castAt = new Date(),
): EvidenceLine[] {
  const facts = buildReadingFacts(cast, question, castAt);
  const lines: EvidenceLine[] = [primaryChangedEvidence(cast), shiEvidence(cast)];
  const ch = changingEvidence(cast);
  if (ch) lines.push(ch);

  if (facts.yong?.name) {
    lines.push({
      factKey: 'yong',
      plain: `本题用神倾向「${facts.yong.name}」：${facts.yong.tip || facts.yong.why}`,
    });
  }

  // 职场意图强调变卦方向感
  if (
    (intentId === 'salary_negotiate' ||
      intentId === 'probation_convert' ||
      intentId === 'quit_now' ||
      intentId === 'quit_vs_stay' ||
      intentId === 'job_search_window' ||
      intentId === 'career_promote' ||
      intentId === 'career_transfer' ||
      intentId === 'career_startup' ||
      intentId === 'wealth_income' ||
      intentId === 'wealth_invest') &&
    cast.changed
  ) {
    lines.push({
      factKey: 'changed_gist',
      plain: `变卦方向：「${cast.changed.gist}」——当决策参考，不是死刑判决。`,
    });
  }

  // 去重 factKey，最多 4 条
  const seen = new Set<string>();
  return lines.filter((e) => {
    if (seen.has(e.factKey)) return false;
    seen.add(e.factKey);
    return true;
  }).slice(0, 4);
}
