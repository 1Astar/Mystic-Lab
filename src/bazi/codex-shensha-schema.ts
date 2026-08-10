/**
 * 天乙贵人级神煞全文 schema
 * 必填：定义 / 查法表 / 四柱落柱 / 使用边界
 * 精品手写走 materialize；其余图鉴名录按 atlas 元数据推广生成。
 */

import type { CodexDossier } from './codex-encyclopedia-types.ts';
import type { ShenshaCategory } from './codex-atlas-catalog.ts';
import { SHENSHA_ATLAS } from './codex-atlas-catalog.ts';
import { getStarCardByName } from './codex-tags.ts';
import {
  resolveSchoolDiff,
  type ShenshaSchoolDiff,
  isSchoolDiffReady,
} from './codex-shensha-school-diff.ts';

export const SHENSHA_USAGE_BOUNDARY =
  '神煞只能作为辅助信息，不能脱离日主强弱、格局、十神和大运单独判断。';

/** 查法表：短行列表，供详情「生克/关系」页与 season 复用 */
export type ShenshaLookupSpec = {
  label: string;
  lines: string[];
  peer: string;
};

/**
 * 天乙级全文输入（手写精品与 atlas 推广共用）
 * - whatIs：定义
 * - lookup：查法表
 * - pillarMeaning：落柱
 * - pillarNote + USAGE_BOUNDARY：使用边界
 */
export type ShenshaFullTextInput = {
  name: string;
  whatIs: string;
  lookup: ShenshaLookupSpec;
  likes: string[];
  dislikes: string[];
  strength: string;
  career: string;
  wealth: string;
  love: string;
  body: string;
  /** 接在通用边界后的落柱说明 */
  pillarNote: string;
  positive: string;
  memory: string;
  coreKeyword: string;
  pillarMeaning: CodexDossier['pillarMeaning'];
  schoolDiff?: ShenshaSchoolDiff;
};

/** 兼容旧 featuredShenshaRich 字段名 */
export type FeaturedShenshaCfg = {
  name: string;
  whatIs: string;
  lookupLabel: string;
  lookupLines: string[];
  lookupPeer: string;
  likes: string[];
  dislikes: string[];
  strength: string;
  career: string;
  wealth: string;
  love: string;
  body: string;
  chartExtra: string;
  positive: string;
  memory: string;
  coreKeyword: string;
  pillarMeaning: CodexDossier['pillarMeaning'];
  schoolDiff?: ShenshaSchoolDiff;
};

export function featuredCfgToFullText(cfg: FeaturedShenshaCfg): ShenshaFullTextInput {
  return {
    name: cfg.name,
    whatIs: cfg.whatIs,
    lookup: {
      label: cfg.lookupLabel,
      lines: cfg.lookupLines,
      peer: cfg.lookupPeer,
    },
    likes: cfg.likes,
    dislikes: cfg.dislikes,
    strength: cfg.strength,
    career: cfg.career,
    wealth: cfg.wealth,
    love: cfg.love,
    body: cfg.body,
    pillarNote: cfg.chartExtra,
    positive: cfg.positive,
    memory: cfg.memory,
    coreKeyword: cfg.coreKeyword,
    pillarMeaning: cfg.pillarMeaning,
    schoolDiff: cfg.schoolDiff,
  };
}

/** 将全文 schema 物化为 CodexDossier 片段 */
export function materializeShenshaFullText(input: ShenshaFullTextInput): Partial<CodexDossier> {
  const card = getStarCardByName('shensha', input.name);
  const lines = input.lookup.lines.length
    ? input.lookup.lines
    : ['查法待补；落柱以排盘标注为准，勿凭空安宫。'];
  return {
    whatIs: input.whatIs,
    season: `查法（${input.lookup.label}）：${lines.join('；')}`,
    likes: input.likes,
    dislikes: input.dislikes,
    personality: card?.impression || `${input.name}：见定义与分类象义。`,
    strength: input.strength,
    imbalance:
      card?.trap ||
      '常见误读：把神煞当成单独断语。须回到日主、格局、十神与大运一起看。',
    career: input.career,
    wealth: input.wealth,
    love: input.love,
    body: input.body,
    chartRole: `${SHENSHA_USAGE_BOUNDARY}${input.pillarNote}`,
    combos: lines.map((line) => ({
      peer: input.lookup.peer,
      note: line,
    })),
    positive: input.positive,
    memory: input.memory,
    coreKeyword: input.coreKeyword,
    pillarMeaning: input.pillarMeaning,
    schoolDiff:
      input.schoolDiff ??
      resolveSchoolDiff(input.name, input.lookup.label),
  };
}

export function featuredShenshaRich(cfg: FeaturedShenshaCfg): Partial<CodexDossier> {
  return materializeShenshaFullText(featuredCfgToFullText(cfg));
}

/** 验收：是否达到天乙级全文（查法 / 落柱 / 边界） */
export function isShenshaFullTextReady(d: CodexDossier): boolean {
  if (!d.whatIs?.trim()) return false;
  if (!/查法/.test(d.season || '')) return false;
  if (!d.combos || d.combos.length < 1) return false;
  if (!d.chartRole || !/辅助|不能脱离/.test(d.chartRole)) return false;
  const p = d.pillarMeaning;
  if (!p?.year || !p?.month || !p?.day || !p?.hour) return false;
  if (!/年柱/.test(p.year) || !/月柱/.test(p.month) || !/日柱/.test(p.day) || !/时柱/.test(p.hour)) {
    return false;
  }
  if (!d.memory?.trim()) return false;
  if (!isSchoolDiffReady(d.schoolDiff)) return false;
  return true;
}

const CATEGORY_HINT: Record<
  ShenshaCategory,
  { strength: string; career: string; love: string; body: string }
> = {
  贵人类: {
    strength: '提携、化解、关键时刻的助力感。',
    career: '贵人型窗口多；仍要自己交付难段。',
    love: '易遇帮扶型缘分；分清援助与依赖。',
    body: '急难时易得援助，仍重预防。',
  },
  桃花感情类: {
    strength: '人缘、吸引、情感磁场。',
    career: '利对外与关系经营；忌纠缠耗神。',
    love: '缘分窗口；分清滋养与消耗。',
    body: '情绪与睡眠；纠缠期降温。',
  },
  文学才华类: {
    strength: '学业、文书、表达与巧思。',
    career: '利文职、考试、内容；要练手落地。',
    love: '用表达连接；别只停留在想。',
    body: '用脑过度伤睡眠。',
  },
  权力事业类: {
    strength: '担当、权柄、决断气场。',
    career: '利管理与关键局；学会授权。',
    love: '能扛事；别把控制当负责。',
    body: '肩颈与压力；扛事前先睡够。',
  },
  财富资源类: {
    strength: '食禄、资源、积蓄或供养象。',
    career: '利稳定变现与资源岗；忌空谈横财。',
    love: '用实质照顾表达；边界要清。',
    body: '脾胃与作息；福在规律。',
  },
  移动变化类: {
    strength: '奔波、调动、动中求变。',
    career: '利出差项目制；要有归岸。',
    love: '要自由度；说清动的边界。',
    body: '劳顿与睡眠；动后要恢复。',
  },
  孤独精神类: {
    strength: '独处、精神深度、清高或隔阂提醒。',
    career: '利深耕研究；开一扇连结门。',
    love: '慢热深交；别活成拒绝靠近。',
    body: '情志与睡眠；孤独时找可信出口。',
  },
  灾厄风险类: {
    strength: '风险提醒、关口刹车感。',
    career: '大节点宜备份；忌硬冲。',
    love: '冲突先降温。',
    body: '防护与体检；高风险活动留心。',
  },
  婚恋家庭类: {
    strength: '婚恋、喜庆或家庭议题窗口。',
    career: '关系经营可助协作；忌上头决策。',
    love: '窗口要经营；不是保票。',
    body: '情绪波动时护作息。',
  },
  子女晚年类: {
    strength: '子女、晚成、幼年缘等出口议题。',
    career: '晚成与传承场；忌恐吓式断语。',
    love: '家庭议题宜沟通；慎重断。',
    body: '情志稳定优先。',
  },
};

function toneLikes(tone: '吉' | '凶' | '中性'): { likes: string[]; dislikes: string[] } {
  if (tone === '吉') {
    return {
      likes: ['合日主格局看', '主动对接窗口', '先难后成'],
      dislikes: ['当作单独好运断语', '因吉星懈怠', '恐吓式「无此必凶」'],
    };
  }
  if (tone === '凶') {
    return {
      likes: ['留缓冲', '备份验证', '合原局忌神看'],
      dislikes: ['恐吓式重断', '赌最后一口气', '脱离格局空喊灾'],
    };
  }
  return {
    likes: ['对照原局', '合十神大运看', '分清滋养与消耗'],
    dislikes: ['单独当命运标签', '恐吓或神化', '脱离日主强弱'],
  };
}

/** 由名录元数据推广生成天乙级全文（查法索引级；精查法仍以手写/计算表为准） */
export function buildAtlasShenshaFullText(meta: {
  name: string;
  category: ShenshaCategory;
  gloss: string;
  tone: '吉' | '凶' | '中性';
}): ShenshaFullTextInput {
  const hint = CATEGORY_HINT[meta.category];
  const { likes, dislikes } = toneLikes(meta.tone);
  const name = meta.name;
  return {
    name,
    whatIs: `${name}是什么：${meta.gloss}属「${meta.category}」（基调${meta.tone}）。图鉴定义如下；排盘落柱以计算规则为准。`,
    lookup: {
      label: '图鉴索引（精查法以排盘/专条为准）',
      lines: [
        `分类：${meta.category}`,
        `基调：${meta.tone}`,
        '落柱：以排盘标注为准；未标注则勿凭空安宫',
        '合日主强弱、格局、十神、大运同看',
      ],
      peer: '查法索引',
    },
    likes,
    dislikes,
    strength: hint.strength,
    career: hint.career,
    wealth:
      meta.tone === '凶'
        ? '防关口破耗；留应急，勿梭哈。'
        : '须合财星与运岁；本神煞只提供议题窗口。',
    love: hint.love,
    body: hint.body,
    pillarNote: `${name}落柱标「${meta.category}」议题窗口，不是单独判决书。`,
    positive: `正面参考：${meta.gloss}失衡时勿恐吓式或神化式断语。`,
    memory: `${name} · ${meta.category} · ${meta.tone}：${meta.gloss}辅助信息，勿单独断。`,
    coreKeyword: `${name} · ${meta.category}`,
    pillarMeaning: {
      year: `年柱见${name}：早年/家族场对照「${meta.gloss}」。`,
      month: `月柱见${name}：事业与社会场议题窗口。`,
      day: `日柱见${name}：自我与伴侣场对照；仍以日主十神为准。`,
      hour: `时柱见${name}：子女与晚成出口对照。`,
    },
  };
}

export function findShenshaAtlasMeta(name: string) {
  return SHENSHA_ATLAS.find((s) => s.name === name);
}

/** 无手写 RICH 时，用 atlas 推广生成全文片段 */
export function atlasShenshaDossierPatch(name: string): Partial<CodexDossier> | null {
  const meta = findShenshaAtlasMeta(name);
  if (!meta) return null;
  return materializeShenshaFullText(buildAtlasShenshaFullText(meta));
}
