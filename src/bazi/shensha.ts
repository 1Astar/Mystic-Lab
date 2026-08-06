/** 常见神煞（按日干 / 年日支落柱，探索对照用） */

const TIAN_YI: Record<string, string[]> = {
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

const SAN_HE_GROUPS: {
  members: string[];
  ma: string;
  tao: string;
  hua: string;
  jiang: string;
  /** 劫煞：三合局之对冲位 */
  jie: string;
}[] = [
  { members: ['申', '子', '辰'], ma: '寅', tao: '酉', hua: '辰', jiang: '子', jie: '巳' },
  { members: ['寅', '午', '戌'], ma: '申', tao: '卯', hua: '戌', jiang: '午', jie: '亥' },
  { members: ['巳', '酉', '丑'], ma: '亥', tao: '午', hua: '丑', jiang: '酉', jie: '寅' },
  { members: ['亥', '卯', '未'], ma: '巳', tao: '子', hua: '未', jiang: '卯', jie: '申' },
];

/** 以年支起孤辰 / 寡宿；图鉴合并为「孤辰寡宿」 */
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

function sanHeOf(branch: string) {
  return SAN_HE_GROUPS.find((g) => g.members.includes(branch));
}

export function shenshaForBranch(opts: {
  branch: string;
  dayStem: string;
  yearBranch: string;
  dayBranch: string;
}): string[] {
  const { branch, dayStem, yearBranch, dayBranch } = opts;
  if (!branch || branch === '—') return [];
  const out: string[] = [];

  const tianYi = TIAN_YI[dayStem] ?? [];
  if (tianYi.includes(branch)) out.push('天乙贵人');

  if (WEN_CHANG[dayStem] === branch) out.push('文昌');
  if (LU[dayStem] === branch) out.push('禄神');
  if (YANG_REN[dayStem] === branch) out.push('羊刃');

  for (const base of [yearBranch, dayBranch]) {
    const g = sanHeOf(base);
    if (!g) continue;
    if (g.ma === branch) out.push('驿马');
    if (g.tao === branch) out.push('桃花');
    if (g.hua === branch) out.push('华盖');
    if (g.jiang === branch) out.push('将星');
  }

  // 劫煞：传统多用年支三合起；日支同表作补充（与驿马等一致）
  for (const base of [yearBranch, dayBranch]) {
    const g = sanHeOf(base);
    if (g && g.jie === branch) out.push('劫煞');
  }

  if (HONG_LUAN[yearBranch] === branch) out.push('红鸾');
  if (TIAN_XI[yearBranch] === branch) out.push('天喜');

  const guPair = GU_CHEN_GUA_SU[yearBranch];
  if (guPair && (guPair.gu === branch || guPair.gua === branch)) {
    out.push('孤辰寡宿');
  }

  return [...new Set(out)];
}

/** 某天干作日干时，常见神煞落点提示（静态图鉴用） */
export function shenshaHintsForStem(stem: string): string[] {
  if (!stem || !TIAN_YI[stem]) return [];
  const out: string[] = ['天乙贵人'];
  if (WEN_CHANG[stem]) out.push('文昌');
  if (LU[stem]) out.push('禄神');
  if (YANG_REN[stem]) out.push('羊刃');
  return out;
}

/** 某地支可能承载的神煞名（静态图鉴用，不依赖具体日干） */
export function shenshaHintsForBranch(branch: string): string[] {
  if (!branch || branch === '—') return [];
  const out = new Set<string>();
  for (const branches of Object.values(TIAN_YI)) {
    if (branches.includes(branch)) out.add('天乙贵人');
  }
  if (Object.values(WEN_CHANG).includes(branch)) out.add('文昌');
  if (Object.values(LU).includes(branch)) out.add('禄神');
  if (Object.values(YANG_REN).includes(branch)) out.add('羊刃');
  for (const g of SAN_HE_GROUPS) {
    if (g.ma === branch) out.add('驿马');
    if (g.tao === branch) out.add('桃花');
    if (g.hua === branch) out.add('华盖');
    if (g.jiang === branch) out.add('将星');
    if (g.jie === branch) out.add('劫煞');
  }
  if (Object.values(HONG_LUAN).includes(branch)) out.add('红鸾');
  if (Object.values(TIAN_XI).includes(branch)) out.add('天喜');
  for (const pair of Object.values(GU_CHEN_GUA_SU)) {
    if (pair.gu === branch || pair.gua === branch) out.add('孤辰寡宿');
  }
  return [...out];
}
