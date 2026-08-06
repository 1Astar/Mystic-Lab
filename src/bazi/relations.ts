/** 地支关系文案（合冲刑害半合） */

export const LIU_HE: [string, string, string][] = [
  ['子', '丑', '土'],
  ['寅', '亥', '木'],
  ['卯', '戌', '火'],
  ['辰', '酉', '金'],
  ['巳', '申', '水'],
  ['午', '未', '土'],
];

export const LIU_CHONG: [string, string][] = [
  ['子', '午'],
  ['丑', '未'],
  ['寅', '申'],
  ['卯', '酉'],
  ['辰', '戌'],
  ['巳', '亥'],
];

export const LIU_HAI: [string, string][] = [
  ['子', '未'],
  ['丑', '午'],
  ['寅', '巳'],
  ['卯', '辰'],
  ['申', '亥'],
  ['酉', '戌'],
];

export const SAN_HE: { members: string[]; result: string }[] = [
  { members: ['申', '子', '辰'], result: '水' },
  { members: ['寅', '午', '戌'], result: '火' },
  { members: ['巳', '酉', '丑'], result: '金' },
  { members: ['亥', '卯', '未'], result: '木' },
];

export const SAN_XING = [
  ['寅', '巳', '申'],
  ['丑', '戌', '未'],
];

export const ZI_XING = new Set(['辰', '午', '酉', '亥']);

/** 天干五合 */
export const TIAN_GAN_HE: [string, string, string][] = [
  ['甲', '己', '土'],
  ['乙', '庚', '金'],
  ['丙', '辛', '水'],
  ['丁', '壬', '木'],
  ['戊', '癸', '火'],
];

function pairKey(a: string, b: string): string {
  return a < b ? `${a}${b}` : `${b}${a}`;
}

function uniquePairs(branches: string[]): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i];
      const b = branches[j];
      if (!a || !b || a === '—' || b === '—') continue;
      const k = pairKey(a, b);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push([a, b]);
    }
  }
  return out;
}

export function describeBranchRelations(branches: string[]): string[] {
  const lines: string[] = [];
  const pairs = uniquePairs(branches);
  const present = new Set(branches.filter((b) => b && b !== '—'));

  for (const [a, b, el] of LIU_HE) {
    if (pairs.some(([x, y]) => pairKey(x, y) === pairKey(a, b))) {
      lines.push(`${a}${b}合${el}`);
    }
  }

  for (const group of SAN_HE) {
    const hit = group.members.filter((m) => present.has(m));
    if (hit.length === 3) {
      lines.push(`${hit.join('')}三合${group.result}`);
    } else if (hit.length === 2) {
      lines.push(`${hit.join('')}半合${group.result}`);
    }
  }

  for (const [a, b] of LIU_CHONG) {
    if (pairs.some(([x, y]) => pairKey(x, y) === pairKey(a, b))) {
      lines.push(`${a}${b}相冲`);
    }
  }

  for (const group of SAN_XING) {
    const hit = group.filter((m) => present.has(m));
    if (hit.length >= 2) {
      lines.push(`${hit.join('')}相刑`);
    }
  }

  if (present.has('子') && present.has('卯')) {
    lines.push('子卯相刑');
  }

  for (const z of ZI_XING) {
    if (branches.filter((b) => b === z).length >= 2) {
      lines.push(`${z}${z}自刑`);
    }
  }

  for (const [a, b] of LIU_HAI) {
    if (pairs.some(([x, y]) => pairKey(x, y) === pairKey(a, b))) {
      lines.push(`${a}${b}相害`);
    }
  }

  return lines;
}

/** 某地支相关的合冲刑害条目（图鉴对照用） */
export type BranchRelationHit = {
  kind: '合' | '冲' | '刑' | '害' | '三合';
  label: string;
  peers: string[];
};

export function relationsForBranch(branch: string): BranchRelationHit[] {
  const out: BranchRelationHit[] = [];
  for (const [a, b, el] of LIU_HE) {
    if (a === branch || b === branch) {
      const peer = a === branch ? b : a;
      out.push({ kind: '合', label: `${a}${b}合化${el}`, peers: [peer] });
    }
  }
  for (const [a, b] of LIU_CHONG) {
    if (a === branch || b === branch) {
      const peer = a === branch ? b : a;
      out.push({ kind: '冲', label: `${a}${b}相冲`, peers: [peer] });
    }
  }
  for (const [a, b] of LIU_HAI) {
    if (a === branch || b === branch) {
      const peer = a === branch ? b : a;
      out.push({ kind: '害', label: `${a}${b}相害`, peers: [peer] });
    }
  }
  for (const group of SAN_XING) {
    if (group.includes(branch)) {
      out.push({
        kind: '刑',
        label: `${group.join('')}相刑`,
        peers: group.filter((x) => x !== branch),
      });
    }
  }
  if (branch === '子' || branch === '卯') {
    out.push({
      kind: '刑',
      label: '子卯相刑',
      peers: [branch === '子' ? '卯' : '子'],
    });
  }
  if (ZI_XING.has(branch)) {
    out.push({ kind: '刑', label: `${branch}${branch}自刑`, peers: [branch] });
  }
  for (const group of SAN_HE) {
    if (group.members.includes(branch)) {
      out.push({
        kind: '三合',
        label: `${group.members.join('')}三合${group.result}`,
        peers: group.members.filter((x) => x !== branch),
      });
    }
  }
  return out;
}

export type StemRelationHit = {
  kind: '合';
  label: string;
  peers: string[];
};

export function relationsForStem(stem: string): StemRelationHit[] {
  const out: StemRelationHit[] = [];
  for (const [a, b, el] of TIAN_GAN_HE) {
    if (a === stem || b === stem) {
      const peer = a === stem ? b : a;
      out.push({ kind: '合', label: `${a}${b}合化${el}`, peers: [peer] });
    }
  }
  return out;
}
