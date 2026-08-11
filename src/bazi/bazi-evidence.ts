import type { EvidenceLine, IntentId, SceneDomain, Tone } from '../mystic-engine/types.ts';
import { detectIntents } from '../mystic-engine/intent.ts';
import type { BaziChart } from './cast.ts';
import { STRENGTH_MOD } from './portrait-copy.ts';
import { buildBaziFacts, type BaziFacts } from './bazi-facts.ts';
import type { TenGodCategory } from './ten-gods.ts';

const CAT_PLAIN: Record<TenGodCategory, string> = {
  guan_sha: '责任与评价结构',
  cai: '资源与结果',
  shi_shang: '表达与输出',
  yin: '学习与支持',
  bi_jie: '同侪与协作',
};

const CAT_GLOSS: Record<TenGodCategory, { term: string; gloss: string }> = {
  guan_sha: { term: '官杀', gloss: '盘里代表责任、规则与外界评价的那一类结构。' },
  cai: { term: '财星', gloss: '盘里代表资源、报酬与可变现结果的那一类。' },
  shi_shang: { term: '食伤', gloss: '盘里代表表达、创意与对外输出的那一类。' },
  yin: { term: '印星', gloss: '盘里代表学习、庇护与信息支持的那一类。' },
  bi_jie: { term: '比劫', gloss: '盘里代表同辈、搭档与竞争协作的那一类。' },
};

function dayMasterEvidence(facts: BaziFacts): EvidenceLine {
  const wx = facts.dayMasterWx || '未知';
  const mod = STRENGTH_MOD[facts.dayStrength];
  return {
    factKey: 'day_master_wx',
    plain: `核心气质偏「${wx}」一侧：${mod}。`,
    gloss: {
      term: '日主',
      gloss: `四柱里代表「你自己」的那一干。月令强度学习名：${facts.dayStrength}。`,
    },
  };
}

function monthEvidence(facts: BaziFacts): EvidenceLine | null {
  if (!facts.monthCategory) return null;
  const plainCat = CAT_PLAIN[facts.monthCategory];
  return {
    factKey: 'month_structure',
    plain: `月令结构更靠近「${plainCat}」：事业与对外角色容易往这个方向长。`,
    gloss: CAT_GLOSS[facts.monthCategory],
  };
}

function bagEvidence(facts: BaziFacts): EvidenceLine | null {
  const top = facts.dominantCategories[0];
  if (!top || facts.categoryCounts[top] < 1) return null;
  const n = facts.categoryCounts[top];
  const second = facts.dominantCategories[1];
  let plain = `盘面结构里「${CAT_PLAIN[top]}」出现较多（约 ${n} 处），做事时更容易被这一层牵动。`;
  if (second && facts.categoryCounts[second] > 0) {
    plain += `其次是「${CAT_PLAIN[second]}」。`;
  }
  return {
    factKey: 'structure_bag',
    plain,
    gloss: CAT_GLOSS[top],
  };
}

function relationEvidence(facts: BaziFacts): EvidenceLine | null {
  if (facts.relationCount <= 0) return null;
  return {
    factKey: 'branch_tension',
    plain: `地支关系里有 ${facts.relationCount} 处合冲刑害一类拉扯：人际与节奏上宜主动对齐，少硬扛。`,
    gloss: {
      term: '地支关系',
      gloss: '四柱地支之间的合、冲、刑、害等互动——常映射人际与事件上的牵引。',
    },
  };
}

function hourEvidence(facts: BaziFacts): EvidenceLine | null {
  if (facts.hasHour) return null;
  return {
    factKey: 'hour_missing',
    plain: '时辰未填：时柱相关的细致结构暂缺，结论先看年月日本层，补时辰后可更准。',
  };
}

/** 意图相关：把盘面事实接到具体问题域 */
function intentEvidence(facts: BaziFacts, intentId: IntentId): EvidenceLine | null {
  const c = facts.categoryCounts;
  if (
    intentId.startsWith('career_') ||
    intentId === 'salary_negotiate' ||
    intentId === 'quit_now' ||
    intentId === 'quit_vs_stay' ||
    intentId === 'job_search_window' ||
    intentId === 'offer_decide' ||
    intentId === 'probation_convert' ||
    intentId === 'team_conflict'
  ) {
    if (c.guan_sha >= 1 || facts.monthCategory === 'guan_sha') {
      return {
        factKey: 'intent_career_guan',
        plain: '就事业问题看：盘里责任/评价结构不弱，宜用「可核对标准」推进，少凭感觉硬冲。',
        gloss: CAT_GLOSS.guan_sha,
      };
    }
    if (c.shi_shang >= 2) {
      return {
        factKey: 'intent_career_output',
        plain: '就事业问题看：表达与输出结构偏显，适合把成果做成可被看见的交付再谈条件。',
        gloss: CAT_GLOSS.shi_shang,
      };
    }
  }
  if (intentId.startsWith('love_')) {
    if (c.yin >= 2) {
      return {
        factKey: 'intent_love_yin',
        plain: '就关系问题看：支持与被理解的需求偏强，靠近时宜慢热，先确认安全感再加码。',
        gloss: CAT_GLOSS.yin,
      };
    }
    if (c.guan_sha >= 2) {
      return {
        factKey: 'intent_love_guan',
        plain: '就关系问题看：对边界与承诺更敏感，含糊表态容易内耗，宜要一个可核对的回应。',
        gloss: CAT_GLOSS.guan_sha,
      };
    }
  }
  if (intentId.startsWith('wealth_')) {
    if (c.cai >= 1) {
      return {
        factKey: 'intent_wealth_cai',
        plain: '就财富问题看：资源/结果结构有着落，更适合小步可核对的积累或止损，而非一次赌大。',
        gloss: CAT_GLOSS.cai,
      };
    }
    if (c.shi_shang >= 2) {
      return {
        factKey: 'intent_wealth_skill',
        plain: '就财富问题看：输出结构更显，收入常跟「别人愿不愿为你的本事付钱」绑在一起。',
        gloss: CAT_GLOSS.shi_shang,
      };
    }
  }
  return null;
}

/**
 * 盘面事实 → 证据句（可回溯 factKey；plain 尽量少术语，术语进 gloss）
 */
export function mapBaziEvidence(
  chart: BaziChart,
  opts?: { question?: string; intentId?: IntentId; facts?: BaziFacts },
): EvidenceLine[] {
  const facts = opts?.facts ?? buildBaziFacts(chart);
  let intentId = opts?.intentId;
  if (!intentId && opts?.question?.trim()) {
    intentId = detectIntents(opts.question)[0]?.id;
  }

  const lines: EvidenceLine[] = [dayMasterEvidence(facts)];
  const month = monthEvidence(facts);
  if (month) lines.push(month);
  const bag = bagEvidence(facts);
  if (bag) lines.push(bag);
  const rel = relationEvidence(facts);
  if (rel) lines.push(rel);
  const hour = hourEvidence(facts);
  if (hour) lines.push(hour);
  if (intentId) {
    const ie = intentEvidence(facts, intentId);
    if (ie) lines.push(ie);
  }

  const seen = new Set<string>();
  return lines
    .filter((e) => {
      if (seen.has(e.factKey)) return false;
      seen.add(e.factKey);
      return true;
    })
    .slice(0, 5);
}

/** 从强度粗映射语气，供后续动作库选用 */
export function detectBaziTone(facts: BaziFacts): Tone {
  if (facts.dayStrength === '旺' || facts.dayStrength === '相') return 'cut';
  if (facts.dayStrength === '囚' || facts.dayStrength === '死') return 'soft';
  return 'neutral';
}

export function domainFromIntent(intentId?: IntentId): SceneDomain {
  if (!intentId) return 'general';
  if (
    intentId.startsWith('career_') ||
    ['salary_negotiate', 'quit_now', 'quit_vs_stay', 'job_search_window', 'offer_decide', 'probation_convert', 'team_conflict'].includes(
      intentId,
    )
  ) {
    return 'career';
  }
  if (intentId.startsWith('love_')) return 'love';
  if (intentId.startsWith('wealth_')) return 'wealth';
  if (intentId.startsWith('growth_')) return 'growth';
  return 'general';
}
