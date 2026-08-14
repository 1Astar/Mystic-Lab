/**
 * 图鉴「实战组合」：按日主 / 流年干支生成可绑盘卡片。
 * Soft copy：行程节奏与可留意点，避「必凶 / 必贵」。
 */
import type { BaziChart } from './cast.ts';
import { stemTenGod } from './cast.ts';
import { buildCodexDossier } from './codex-dossier.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { STEM_WUXING } from './elements.ts';
import type { LuckCycles } from './luck-cycles.ts';

export type PracticeComboCard = {
  /** 如：实战组合（流年遇甲木） */
  title: string;
  /** 经典名，可空 */
  classicName?: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** 是否按用户原局/流年生成 */
  bound: boolean;
};

type ClassicPair = {
  dayMaster: string;
  focusStem: string;
  name: string;
  body: string;
};

/** 少量经典「日主 × 遇某干」话术；其余走十神模板 */
const CLASSIC_STEM_PAIRS: ClassicPair[] = [
  {
    dayMaster: '乙',
    focusStem: '甲',
    name: '藤萝系甲',
    body:
      '你是乙木（花草藤萝），遇到甲木（大树）像找到可攀的支架。这一年更易遇到提携节奏或可依靠的平台；宜主动连结、也留意别把柔韧活成过度依附。',
  },
  {
    dayMaster: '甲',
    focusStem: '乙',
    name: '栋梁有藤',
    body:
      '甲木为骨，乙木为绕。盘上或流年见乙，像大树旁多了攀缘与美饰——协作、审美、迂回推进更顺；也提醒别被细枝牵得忘了主干方向。',
  },
  {
    dayMaster: '甲',
    focusStem: '庚',
    name: '栋梁遇斧',
    body:
      '甲遇庚：规则、权威与成器同场。压力感可能上来，也常是被修剪成材的窗口——宜立边界、做可交付的硬成果，少硬碰硬空耗。',
  },
  {
    dayMaster: '乙',
    focusStem: '庚',
    name: '乙庚合化',
    body:
      '乙庚相遇：柔韧与规则结盟。适合签协议、定流程、把审美落到可验收的交付；也留意别被约束绑死、或合而不清。',
  },
  {
    dayMaster: '丙',
    focusStem: '壬',
    name: '水火既济',
    body:
      '丙见壬：热度遇见江河。表达与扩张仍在，但需要降温与航道——适合公开场合后立刻沉淀，少只烧热情不落现金流。',
  },
  {
    dayMaster: '壬',
    focusStem: '丙',
    name: '洪波映日',
    body:
      '壬遇丙：奔流被照亮。可见度上升，想法更易被看见；宜选一个出口说清楚，也防过曝耗水、散点太多。',
  },
];

const TEN_GOD_HINT: Record<string, string> = {
  比肩: '同气并肩——适合协作成事，也留意资源怎么分。',
  劫财: '同气异性——分享与较劲同场，宜明算账、清边界。',
  食神: '食神泄秀——表达与才艺出口更顺，宜做可见交付。',
  伤官: '伤官见官忌硬刚——创新与突破窗口，宜破旧立新但留余地。',
  偏财: '偏财窗——机会与流动变现，宜抓窗口也别空追热点。',
  正财: '正财程——稳定回报与合同节奏，宜守约细作。',
  七杀: '七杀压——压力与速度同来，宜立目标、切一块可攻克的硬仗。',
  正官: '正官位——平台规则与责任上身，宜对齐标准再出手。',
  偏印: '偏印径——冷门路径与直觉，宜深钻一条，少发散空耗。',
  正印: '正印护——学习与庇护感增强，宜充电、拜师、做长期积累。',
};

function currentLiunian(luck: LuckCycles | null | undefined) {
  if (!luck) return null;
  return luck.liunian.find((l) => l.current) || luck.liunian.find((l) => l.selected) || null;
}

function stemLabel(stem: string): string {
  const e = getBaziEncyclopedia(stem);
  return e?.title || stem;
}

function findClassic(dayMaster: string, focusStem: string): ClassicPair | undefined {
  return CLASSIC_STEM_PAIRS.find(
    (p) => p.dayMaster === dayMaster && p.focusStem === focusStem,
  );
}

function tenGodBody(dayMaster: string, focusStem: string, context: string): string {
  const god = stemTenGod(dayMaster, focusStem);
  const hint = TEN_GOD_HINT[god] || '看干支旺衰与全局喜忌，再定进退节奏。';
  const dm = stemLabel(dayMaster);
  const fo = stemLabel(focusStem);
  return `你的日主是${dm}，${context}${fo}，相对你是「${god || '组合'}」。${hint}`;
}

/**
 * 为当前词条生成 0～2 张实战组合卡（优先绑盘）。
 */
export function buildPracticeComboCards(
  id: string,
  chart: BaziChart | null | undefined,
  luck: LuckCycles | null | undefined,
): PracticeComboCard[] {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return [];
  const cards: PracticeComboCard[] = [];
  const ln = currentLiunian(luck);
  const yearLabel = ln ? `${ln.year}流年` : '流年';
  const cta = chart
    ? { ctaLabel: '查看你的流年预测', ctaHref: '/bazi/reading' as const }
    : {};

  if (entry.kind === 'stem') {
    const focus = entry.id;
    const dm = chart?.dayMaster;

    if (dm && ln?.stem === focus && dm !== focus) {
      const classic = findClassic(dm, focus);
      cards.push({
        title: `实战组合（${yearLabel}遇${entry.title}）`,
        classicName: classic?.name,
        body: classic
          ? classic.body
          : tenGodBody(dm, focus, `${yearLabel}遇到`),
        bound: true,
        ...cta,
      });
    } else if (dm && dm !== focus) {
      const classic = findClassic(dm, focus);
      const inNatal = chart!.pillars.some(
        (p) => !p.empty && p.key !== 'liunian' && (p.stem === focus || p.hideGan.includes(focus)),
      );
      if (classic || inNatal) {
        cards.push({
          title: classic
            ? `实战组合（${classic.name}）`
            : `实战组合（日主${stemLabel(dm)}遇${entry.title}）`,
          classicName: classic?.name,
          body: classic
            ? `${classic.body}${inNatal ? ' 你的原局里已见这一干，可对照四柱落点细读。' : ''}`
            : tenGodBody(dm, focus, inNatal ? '原局见到' : '若流年或大运遇到'),
          bound: true,
          ...cta,
        });
      }
    }

    // 无原局：给一条可感的经典示例（乙日主 × 甲）
    if (!cards.length && focus === '甲') {
      const classic = findClassic('乙', '甲')!;
      cards.push({
        title: '实战组合（流年遇甲木）',
        classicName: classic.name,
        body: `示例：若日主是乙木（花草木），流年遇到甲木（大树），叫「${classic.name}」。${classic.body} 排盘后会按你的日主改写这一段。`,
        bound: false,
        ctaLabel: '去排盘看你的组合',
        ctaHref: '/bazi/reading',
      });
    } else if (!cards.length) {
      const dossier = buildCodexDossier(id);
      const top = dossier?.combos[0];
      if (top) {
        cards.push({
          title: '实战组合（常见）',
          body: `${top.peer} · ${top.note} 排盘后可按你的日主与流年改写。`,
          bound: false,
          ctaLabel: '去排盘看你的组合',
          ctaHref: '/bazi/reading',
        });
      }
    }
  } else if (entry.kind === 'branch') {
    const br = entry.id;
    const dm = chart?.dayMaster;
    const lnBr = ln?.branch;
    if (dm && lnBr === br) {
      cards.push({
        title: `实战组合（${yearLabel}支见${entry.title}）`,
        body: `今年地支落在「${entry.title}」。对照你日主${stemLabel(dm)}（${STEM_WUXING[dm] || ''}），看原局是否有冲合刑害对象——行程上更宜留意移动、合同与场域变化的节奏，而非单断吉凶。`,
        bound: true,
        ...cta,
      });
    } else {
      const dossier = buildCodexDossier(id);
      const top = dossier?.combos[0];
      cards.push({
        title: lnBr === br ? `实战组合（${yearLabel}）` : '实战组合（地支）',
        body: top
          ? `${top.note} 有原局时，会优先写「今年支 vs 你盘上的冲合」。`
          : entry.oneLiner,
        bound: Boolean(chart && lnBr === br),
        ...(chart ? cta : { ctaLabel: '去排盘看你的组合', ctaHref: '/bazi/reading' }),
      });
    }
  } else {
    // 十神 / 神煞 / 其它：有盘则写落点节奏，无则 dossier 首条组合
    const dossier = buildCodexDossier(id);
    const top = dossier?.combos[0];
    if (chart) {
      cards.push({
        title: `实战组合（对照你的盘）`,
        body: top
          ? `${top.note} 打开「命盘」页可看它落在哪一柱、是否被大运流年触发。`
          : `${entry.oneLiner} 打开「命盘」页看落点与运限触发。`,
        bound: true,
        ...cta,
      });
    } else if (top) {
      cards.push({
        title: '实战组合（常见）',
        body: `${top.peer} · ${top.note}`,
        bound: false,
        ctaLabel: '去排盘看你的组合',
        ctaHref: '/bazi/reading',
      });
    }
  }

  return cards.slice(0, 2);
}
