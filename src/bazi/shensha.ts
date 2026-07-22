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

const SAN_HE_GROUPS: { members: string[]; ma: string; tao: string; hua: string; jiang: string }[] = [
  { members: ['申', '子', '辰'], ma: '寅', tao: '酉', hua: '辰', jiang: '子' },
  { members: ['寅', '午', '戌'], ma: '申', tao: '卯', hua: '戌', jiang: '午' },
  { members: ['巳', '酉', '丑'], ma: '亥', tao: '午', hua: '丑', jiang: '酉' },
  { members: ['亥', '卯', '未'], ma: '巳', tao: '子', hua: '未', jiang: '卯' },
];

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

  if (HONG_LUAN[yearBranch] === branch) out.push('红鸾');
  if (TIAN_XI[yearBranch] === branch) out.push('天喜');

  return [...new Set(out)];
}
