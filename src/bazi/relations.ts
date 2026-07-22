/** 地支关系文案（合冲刑害半合） */

const LIU_HE: [string, string, string][] = [
  ['子', '丑', '土'],
  ['寅', '亥', '木'],
  ['卯', '戌', '火'],
  ['辰', '酉', '金'],
  ['巳', '申', '水'],
  ['午', '未', '土'],
];

const LIU_CHONG: [string, string][] = [
  ['子', '午'],
  ['丑', '未'],
  ['寅', '申'],
  ['卯', '酉'],
  ['辰', '戌'],
  ['巳', '亥'],
];

const LIU_HAI: [string, string][] = [
  ['子', '未'],
  ['丑', '午'],
  ['寅', '巳'],
  ['卯', '辰'],
  ['申', '亥'],
  ['酉', '戌'],
];

const SAN_HE: { members: string[]; result: string }[] = [
  { members: ['申', '子', '辰'], result: '水' },
  { members: ['寅', '午', '戌'], result: '火' },
  { members: ['巳', '酉', '丑'], result: '金' },
  { members: ['亥', '卯', '未'], result: '木' },
];

const SAN_XING = [
  ['寅', '巳', '申'],
  ['丑', '戌', '未'],
];

const ZI_XING = new Set(['辰', '午', '酉', '亥']);

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
