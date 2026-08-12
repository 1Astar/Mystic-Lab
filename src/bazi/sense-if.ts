/**
 * 运势「如果」因果模拟：反面行动 → 基于盘的可能后果（规则模板）。
 */
import type { BaziChart } from './cast.ts';
import { buildBaziFacts } from './bazi-facts.ts';
import type { SeasonLabel } from './elements.ts';
import type { YearForecast } from './sense-forecast.ts';
import type { TenGodCategory } from './ten-gods.ts';

export type IfScenario = {
  id: string;
  /** 按钮短标签 */
  ifLabel: string;
  /** 完整如果问句 */
  question: string;
  /** 可能后果 */
  outcome: string;
  /** 一句底层逻辑（可含学名括注） */
  logic: string;
};

const WEAK: SeasonLabel[] = ['休', '囚', '死'];

const CAT_IF: Record<
  TenGodCategory,
  { ifLabel: string; question: string; outcome: string; logic: string }
> = {
  shi_shang: {
    ifLabel: '如果全网开播、多口输出',
    question: '如果你今年不选一个出口专注输出，而是全网开播、到处亮相，会发生什么？',
    outcome:
      '注意力会被撕成很多薄片：表面热闹，交付跟不上；人容易烦躁、睡不好，作品也难沉淀成可报价的成果。',
    logic:
      '食伤（创造力）需要出口，但出口太多等于空转。先一个频道跑通，再谈扩张——否则「秀」把根气泄光。',
  },
  guan_sha: {
    ifLabel: '如果硬顶所有压力',
    question: '如果你今年不拆步骤，而是硬顶所有评价与压力，会发生什么？',
    outcome:
      '短期像很能扛，中期更容易耗空：关系变硬、身体先抗议，关键窗口反而因为没有备份而失手。',
    logic:
      '官杀年主调是责任与评价。硬刚只会把「考」变成「耗」；留缓冲才是顺着风走。',
  },
  cai: {
    ifLabel: '如果只谈机会不谈交付',
    question: '如果你今年见机会就冲、却不设止损与交付，会发生什么？',
    outcome:
      '账面上像有很多「可能」，现金与信任却对不上；一次失手会把后面的窗口也弄脏。',
    logic:
      '财星气候要结果也要边界。机会是风，止损与交付才是锚——没有锚就会漂。',
  },
  yin: {
    ifLabel: '如果拒绝求助硬刚不确定',
    question: '如果你今年不补信息、不求援，而是硬刚所有不确定，会发生什么？',
    outcome:
      '容易在雾里空耗：学不到真正用得上的规则，人也更孤立，错过本该托住你的窗口。',
    logic:
      '印星年宜「弄懂再上场」。硬刚不确定是在跟气候作对——先借势再出手。',
  },
  bi_jie: {
    ifLabel: '如果跟所有人并肩赛跑',
    question: '如果你今年不辨队友与赛道，而是跟所有人并肩硬杠，会发生什么？',
    outcome:
      '精力散在比较与内耗上：同温层变战场，真正能一起交付的伙伴反而走远。',
    logic:
      '比劫年有并肩之力，也易争锋。分清赛道，才能把「同」用成助力而不是内耗。',
  },
};

function rootFrag(strength: SeasonLabel, wx: string): string {
  if (WEAK.includes(strength)) {
    return `你眼下「根」偏${strength}${wx ? `（${wx}）` : ''}，更经不起分散消耗`;
  }
  return `即便根气不弱${wx ? `（${wx}）` : ''}，分散火力仍会把优势磨成焦虑`;
}

/**
 * 生成 1～3 条「如果」剧本：主气候一条 + 宜忌反面一条 + 可选根基加强。
 */
export function buildIfScenarios(
  chart: BaziChart,
  forecast: YearForecast,
): IfScenario[] {
  const facts = buildBaziFacts(chart);
  const top = facts.dominantCategories[0] ?? null;
  const out: IfScenario[] = [];

  // 1) 流年/大运气候主剧本（用 forecast 的 dont 气质；分类取盘上主导或默认食伤）
  const catKey: TenGodCategory =
    top && CAT_IF[top] ? top : 'shi_shang';
  const base = CAT_IF[catKey];
  out.push({
    id: `if:climate:${catKey}`,
    ifLabel: base.ifLabel,
    question: base.question,
    outcome: `${base.outcome}${rootFrag(facts.dayStrength, facts.dayMasterWx || '')}。`,
    logic: base.logic,
  });

  // 2) 把第一条「忌」翻成如果问句
  const dont = forecast.donts[0];
  if (dont) {
    const cleaned = dont.replace(/^忌|^别|^少/, '').trim();
    out.push({
      id: 'if:dont:0',
      ifLabel: `如果偏要：${cleaned.slice(0, 14)}${cleaned.length > 14 ? '…' : ''}`,
      question: `如果偏要「${cleaned}」，今年的气候会怎么反噬？`,
      outcome: `这正是今年气候下的高耗玩法：短期可能有刺激感，随后常见精力涣散、交付对不上承诺，信任与身体先报警。${rootFrag(facts.dayStrength, facts.dayMasterWx || '')}。`,
      logic: `宜忌里的「忌」不是恐吓，是同一气候的反面路径。顺着宜走省力，逆着忌走费根。`,
    });
  }

  // 3) 根基专项（弱根 + 食伤多 → 用户举例那种）
  if (
    WEAK.includes(facts.dayStrength) &&
    facts.categoryCounts.shi_shang >= 2 &&
    !out.some((s) => s.id === 'if:root:shishang')
  ) {
    out.push({
      id: 'if:root:shishang',
      ifLabel: '如果先盖楼再打地基',
      question: '如果根基还没稳住，就先谈大规模扩张与曝光，会发生什么？',
      outcome:
        '创造力会被透支成焦虑：计划很多、落地很少；人越忙越空，像大楼盖得越高越晃。',
      logic:
        '食伤（创造力）旺而根不稳时，要先活、再谈扩张——「我克者为财」也要先有可交付的创造，财富才接得住。',
    });
  }

  return out.slice(0, 3);
}
