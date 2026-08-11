import { appendExtraShensha, EXTRA_SHENSHA_NAMES } from './shensha-calc-extra.ts';
import { SHENSHA_ATLAS } from './codex-atlas-catalog.ts';

/** 日干 → 天乙贵人落支（可供图鉴查法表复用） */
export const TIAN_YI: Record<string, string[]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  庚: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  壬: ['巳', '卯'],
  癸: ['巳', '卯'],
  辛: ['寅', '午'],
};

/** 查法表短行（合并同支日干） */
export function tianYiLookupLines(): string[] {
  return [
    '甲、戊、庚日 → 丑、未',
    '乙、己日 → 子、申',
    '丙、丁日 → 亥、酉',
    '壬、癸日 → 卯、巳',
    '辛日 → 寅、午',
  ];
}

const STEM_ORDER = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

/** 日干→落支表：合并同支日干为短行 */
function stemToBranchLookupLines(map: Record<string, string>): string[] {
  const byBranch = new Map<string, string[]>();
  for (const stem of STEM_ORDER) {
    const br = map[stem];
    if (!br) continue;
    const list = byBranch.get(br) ?? [];
    list.push(stem);
    byBranch.set(br, list);
  }
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const stem of STEM_ORDER) {
    const br = map[stem];
    if (!br || seen.has(br)) continue;
    seen.add(br);
    lines.push(`${byBranch.get(br)!.join('、')}日 → ${br}`);
  }
  return lines;
}

const WEN_CHANG: Record<string, string> = {
  甲: '巳',
  乙: '午',
  丙: '申',
  丁: '酉',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
};

const LU: Record<string, string> = {
  甲: '寅',
  乙: '卯',
  丙: '巳',
  丁: '午',
  戊: '巳',
  己: '午',
  庚: '申',
  辛: '酉',
  壬: '亥',
  癸: '子',
};

const YANG_REN: Record<string, string> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
};

export function wenChangLookupLines(): string[] {
  return stemToBranchLookupLines(WEN_CHANG);
}

export function luLookupLines(): string[] {
  return stemToBranchLookupLines(LU);
}

export function yangRenLookupLines(): string[] {
  return stemToBranchLookupLines(YANG_REN);
}

const SAN_HE_GROUPS: {
  members: string[];
  ma: string;
  tao: string;
  hua: string;
  jiang: string;
  /** 劫煞：三合局之对冲位 */
  jie: string;
  /** 灾煞 */
  zai: string;
  /** 亡神 */
  wang: string;
}[] = [
  { members: ['申', '子', '辰'], ma: '寅', tao: '酉', hua: '辰', jiang: '子', jie: '巳', zai: '午', wang: '亥' },
  { members: ['寅', '午', '戌'], ma: '申', tao: '卯', hua: '戌', jiang: '午', jie: '亥', zai: '子', wang: '巳' },
  { members: ['巳', '酉', '丑'], ma: '亥', tao: '午', hua: '丑', jiang: '酉', jie: '寅', zai: '卯', wang: '申' },
  { members: ['亥', '卯', '未'], ma: '巳', tao: '子', hua: '未', jiang: '卯', jie: '申', zai: '酉', wang: '寅' },
];

export type SanHeStarKey = 'ma' | 'tao' | 'hua' | 'jiang' | 'jie' | 'zai' | 'wang';

/** 三合局起神煞查法（年/日支入局后取对应落支） */
export function sanHeStarLookupLines(key: SanHeStarKey): string[] {
  return SAN_HE_GROUPS.map((g) => `${g.members.join('')}局 → ${g[key]}`);
}

/** 月支 → 天德（可能是干或支，见柱干或柱支即是） */
const TIAN_DE: Record<string, string> = {
  寅: '丁',
  卯: '申',
  辰: '壬',
  巳: '辛',
  午: '亥',
  未: '甲',
  申: '癸',
  酉: '寅',
  戌: '丙',
  亥: '乙',
  子: '巳',
  丑: '庚',
};

/** 月支 → 月德（只落天干） */
const YUE_DE_STEM: Record<string, string> = {
  寅: '丙',
  午: '丙',
  戌: '丙',
  申: '壬',
  子: '壬',
  辰: '壬',
  亥: '甲',
  卯: '甲',
  未: '甲',
  巳: '庚',
  酉: '庚',
  丑: '庚',
};

/** 日干 → 金舆落支 */
const JIN_YU: Record<string, string> = {
  甲: '辰',
  乙: '巳',
  丙: '未',
  戊: '未',
  丁: '申',
  己: '申',
  庚: '戌',
  辛: '子',
  壬: '丑',
  癸: '寅',
};

/** 日干 → 天厨落支 */
const TIAN_CHU: Record<string, string> = {
  甲: '巳',
  乙: '午',
  丙: '巳',
  丁: '午',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
};

/** 日干 → 福星贵人落支（可多支） */
const FU_XING: Record<string, string[]> = {
  甲: ['寅', '子'],
  丙: ['寅', '子'],
  乙: ['酉', '亥'],
  丁: ['酉', '亥'],
  戊: ['未'],
  己: ['午'],
  庚: ['巳'],
  辛: ['巳'],
  壬: ['亥'],
  癸: ['卯'],
};

/** 破碎：以年支三合类取 */
const PO_SUI: Record<string, string> = {
  寅: '酉',
  申: '酉',
  巳: '酉',
  亥: '酉',
  子: '巳',
  午: '巳',
  卯: '巳',
  酉: '巳',
  辰: '丑',
  戌: '丑',
  丑: '丑',
  未: '丑',
};

export function tianDeLookupLines(): string[] {
  return [
    '寅月 → 丁；卯月 → 申；辰月 → 壬',
    '巳月 → 辛；午月 → 亥；未月 → 甲',
    '申月 → 癸；酉月 → 寅；戌月 → 丙',
    '亥月 → 乙；子月 → 巳；丑月 → 庚',
  ];
}

export function yueDeLookupLines(): string[] {
  return [
    '寅午戌月 → 天干丙',
    '申子辰月 → 天干壬',
    '亥卯未月 → 天干甲',
    '巳酉丑月 → 天干庚',
  ];
}

export function jinYuLookupLines(): string[] {
  return stemToBranchLookupLines(JIN_YU);
}

export function tianChuLookupLines(): string[] {
  return stemToBranchLookupLines(TIAN_CHU);
}

export function fuXingLookupLines(): string[] {
  const byKey = new Map<string, string[]>();
  for (const stem of STEM_ORDER) {
    const brs = FU_XING[stem];
    if (!brs?.length) continue;
    const key = brs.join('、');
    const list = byKey.get(key) ?? [];
    list.push(stem);
    byKey.set(key, list);
  }
  return [...byKey.entries()].map(([brs, stems]) => `${stems.join('、')}日 → ${brs}`);
}

export function poSuiLookupLines(): string[] {
  return [
    '寅申巳亥年 → 酉',
    '子午卯酉年 → 巳',
    '辰戌丑未年 → 丑',
  ];
}

/** 以年支起孤辰 / 寡宿；探索合并为「孤辰寡宿」 */
const GU_CHEN_GUA_SU: Record<string, { gu: string; gua: string }> = {
  寅: { gu: '巳', gua: '丑' },
  卯: { gu: '巳', gua: '丑' },
  辰: { gu: '巳', gua: '丑' },
  巳: { gu: '申', gua: '辰' },
  午: { gu: '申', gua: '辰' },
  未: { gu: '申', gua: '辰' },
  申: { gu: '亥', gua: '未' },
  酉: { gu: '亥', gua: '未' },
  戌: { gu: '亥', gua: '未' },
  亥: { gu: '寅', gua: '戌' },
  子: { gu: '寅', gua: '戌' },
  丑: { gu: '寅', gua: '戌' },
};

export function guChenGuaSuLookupLines(): string[] {
  return [
    '寅、卯、辰年 → 孤辰巳、寡宿丑',
    '巳、午、未年 → 孤辰申、寡宿辰',
    '申、酉、戌年 → 孤辰亥、寡宿未',
    '亥、子、丑年 → 孤辰寅、寡宿戌',
  ];
}

const HONG_LUAN: Record<string, string> = {
  子: '卯',
  丑: '寅',
  寅: '丑',
  卯: '子',
  辰: '亥',
  巳: '戌',
  午: '酉',
  未: '申',
  申: '未',
  酉: '午',
  戌: '巳',
  亥: '辰',
};

const TIAN_XI: Record<string, string> = {
  子: '酉',
  丑: '申',
  寅: '未',
  卯: '午',
  辰: '巳',
  巳: '辰',
  午: '卯',
  未: '寅',
  申: '丑',
  酉: '子',
  戌: '亥',
  亥: '戌',
};

const BRANCH_ORDER = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const;

function yearBranchLookupLines(map: Record<string, string>): string[] {
  return BRANCH_ORDER.filter((b) => map[b]).map((b) => `年支${b} → ${map[b]}`);
}

export function hongLuanLookupLines(): string[] {
  return yearBranchLookupLines(HONG_LUAN);
}

export function tianXiLookupLines(): string[] {
  return yearBranchLookupLines(TIAN_XI);
}

function sanHeOf(branch: string) {
  return SAN_HE_GROUPS.find((g) => g.members.includes(branch));
}

function branchIndex(branch: string): number {
  return BRANCH_ORDER.indexOf(branch as (typeof BRANCH_ORDER)[number]);
}

/** 自年支起算偏移（流年十二神类） */
function branchFromYear(yearBranch: string, delta: number): string {
  const i = branchIndex(yearBranch);
  if (i < 0) return '';
  return BRANCH_ORDER[(i + delta + 12) % 12]!;
}

export function yearOffsetLookupLines(delta: number, label: string): string[] {
  return BRANCH_ORDER.map((b) => `年支${b} → ${label}${branchFromYear(b, delta)}`);
}

export function shenshaForBranch(opts: {
  branch: string;
  /** 本柱天干：天德/月德需要 */
  stem?: string;
  dayStem: string;
  yearBranch: string;
  dayBranch: string;
  /** 月支：天德/月德需要 */
  monthBranch?: string;
  yearStem?: string;
  yearNayin?: string;
  /** 日柱干支，用于旬空/魁罡等 */
  dayGz?: string;
}): string[] {
  const {
    branch,
    stem = '',
    dayStem,
    yearBranch,
    dayBranch,
    monthBranch = '',
    yearStem = '',
    yearNayin = '',
    dayGz = '',
  } = opts;
  if (!branch || branch === '—') return [];
  const out: string[] = [];

  const tianYi = TIAN_YI[dayStem] ?? [];
  if (tianYi.includes(branch)) out.push('天乙贵人');

  if (WEN_CHANG[dayStem] === branch) out.push('文昌');
  if (LU[dayStem] === branch) out.push('禄神');
  if (YANG_REN[dayStem] === branch) out.push('羊刃');
  if (JIN_YU[dayStem] === branch) out.push('金舆');
  if (TIAN_CHU[dayStem] === branch) out.push('天厨');
  if ((FU_XING[dayStem] ?? []).includes(branch)) out.push('福星');

  for (const base of [yearBranch, dayBranch]) {
    const g = sanHeOf(base);
    if (!g) continue;
    if (g.ma === branch) out.push('驿马');
    if (g.tao === branch) {
      out.push('桃花');
      out.push('咸池');
    }
    if (g.hua === branch) out.push('华盖');
    if (g.jiang === branch) out.push('将星');
    if (g.jie === branch) out.push('劫煞');
    if (g.zai === branch) out.push('灾煞');
    if (g.wang === branch) out.push('亡神');
  }

  if (HONG_LUAN[yearBranch] === branch) out.push('红鸾');
  if (TIAN_XI[yearBranch] === branch) out.push('天喜');

  const guPair = GU_CHEN_GUA_SU[yearBranch];
  if (guPair && (guPair.gu === branch || guPair.gua === branch)) {
    out.push('孤辰寡宿');
  }

  if (PO_SUI[yearBranch] === branch) out.push('破碎');

  // 流年十二神类：白虎(+8)、吊客(-2)；天哭(+6 冲)、天虚(+7)
  if (branchFromYear(yearBranch, 8) === branch) out.push('白虎');
  if (branchFromYear(yearBranch, -2) === branch) out.push('吊客');
  if (branchFromYear(yearBranch, 6) === branch) out.push('天哭');
  if (branchFromYear(yearBranch, 7) === branch) out.push('天虚');

  if (monthBranch) {
    const tianDe = TIAN_DE[monthBranch];
    if (tianDe && (stem === tianDe || branch === tianDe)) out.push('天德');
    const yueDe = YUE_DE_STEM[monthBranch];
    if (yueDe && stem === yueDe) out.push('月德');
  }

  appendExtraShensha(out, {
    branch,
    stem,
    dayStem,
    yearBranch,
    dayBranch,
    monthBranch,
    yearStem,
    yearNayin,
    dayGz: dayGz || `${dayStem}${dayBranch}`,
    baseNames: new Set(out),
  });

  return [...new Set(out)];
}

/** 核心+扩展已实现计算的神煞名 */
export function listImplementedShenshaCalcNames(): string[] {
  const core = [
    '天乙贵人',
    '文昌',
    '禄神',
    '羊刃',
    '金舆',
    '天厨',
    '福星',
    '驿马',
    '桃花',
    '咸池',
    '华盖',
    '将星',
    '劫煞',
    '灾煞',
    '亡神',
    '红鸾',
    '天喜',
    '孤辰寡宿',
    '破碎',
    '白虎',
    '吊客',
    '天哭',
    '天虚',
    '天德',
    '月德',
  ];
  return [...new Set([...core, ...EXTRA_SHENSHA_NAMES])];
}

/**
 * 相对 SHENSHA_ATLAS 的计算覆盖率。
 * shellOnly：刻意不进排盘计算的十神/关系入口壳。
 */
export function shenshaCalcCoverageAgainstAtlas(): {
  total: number;
  implemented: number;
  ratio: number;
  missing: string[];
  shellOnly: string[];
} {
  const shellOnly = new Set(['正印', '妻妾', '夫星', '子孙星', '飞财']);
  const impl = new Set(listImplementedShenshaCalcNames());
  const missing: string[] = [];
  const shells: string[] = [];
  for (const s of SHENSHA_ATLAS) {
    if (shellOnly.has(s.name)) {
      shells.push(s.name);
      continue;
    }
    if (!impl.has(s.name)) missing.push(s.name);
  }
  const countable = SHENSHA_ATLAS.length - shells.length;
  const implemented = countable - missing.length;
  return {
    total: SHENSHA_ATLAS.length,
    implemented,
    ratio: countable === 0 ? 0 : implemented / countable,
    missing,
    shellOnly: shells,
  };
}

/** 某天干作日干时，常见神煞落点提示（静态探索用） */
export function shenshaHintsForStem(stem: string): string[] {
  if (!stem || !TIAN_YI[stem]) return [];
  const out: string[] = ['天乙贵人'];
  if (WEN_CHANG[stem]) out.push('文昌');
  if (LU[stem]) out.push('禄神');
  if (YANG_REN[stem]) out.push('羊刃');
  if (JIN_YU[stem]) out.push('金舆');
  if (TIAN_CHU[stem]) out.push('天厨');
  if (FU_XING[stem]?.length) out.push('福星');
  return out;
}

/** 某地支可能承载的神煞名（静态探索用，不依赖具体日干） */
export function shenshaHintsForBranch(branch: string): string[] {
  if (!branch || branch === '—') return [];
  const out = new Set<string>();
  for (const branches of Object.values(TIAN_YI)) {
    if (branches.includes(branch)) out.add('天乙贵人');
  }
  if (Object.values(WEN_CHANG).includes(branch)) out.add('文昌');
  if (Object.values(LU).includes(branch)) out.add('禄神');
  if (Object.values(YANG_REN).includes(branch)) out.add('羊刃');
  if (Object.values(JIN_YU).includes(branch)) out.add('金舆');
  if (Object.values(TIAN_CHU).includes(branch)) out.add('天厨');
  for (const brs of Object.values(FU_XING)) {
    if (brs.includes(branch)) out.add('福星');
  }
  for (const g of SAN_HE_GROUPS) {
    if (g.ma === branch) out.add('驿马');
    if (g.tao === branch) {
      out.add('桃花');
      out.add('咸池');
    }
    if (g.hua === branch) out.add('华盖');
    if (g.jiang === branch) out.add('将星');
    if (g.jie === branch) out.add('劫煞');
    if (g.zai === branch) out.add('灾煞');
    if (g.wang === branch) out.add('亡神');
  }
  if (Object.values(HONG_LUAN).includes(branch)) out.add('红鸾');
  if (Object.values(TIAN_XI).includes(branch)) out.add('天喜');
  for (const pair of Object.values(GU_CHEN_GUA_SU)) {
    if (pair.gu === branch || pair.gua === branch) out.add('孤辰寡宿');
  }
  if (Object.values(PO_SUI).includes(branch)) out.add('破碎');
  // 年支偏移类：十二支皆可能
  out.add('白虎');
  out.add('吊客');
  out.add('天哭');
  out.add('天虚');
  // 天德可能落干或支
  if (Object.values(TIAN_DE).includes(branch)) out.add('天德');
  out.add('月德');
  return [...out];
}
