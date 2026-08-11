/**
 * 十二宫地支关系与宫干四化飞星
 * 三方四正 / 六合六冲三刑 / 禄权科忌飞线 —— 由地支位与天干表决定，不依赖星曜临时推演
 */
import type { PalaceSnap, ZiweiChartView } from './types.ts';

export const BRANCH_ORDER = [
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

export type Branch = (typeof BRANCH_ORDER)[number];

/** 天干四化：禄、权、科、忌 */
export const STEM_MUTAGEN: Record<string, [string, string, string, string]> = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
};

export type MutagenKind = '禄' | '权' | '科' | '忌';

export type PalaceRelationSet = {
  self: PalaceSnap;
  opposite: PalaceSnap | null;
  sanhe: PalaceSnap[];
  /** 本宫 + 对宫 + 三合 */
  sizheng: PalaceSnap[];
};

export type BranchLinkKind = '冲' | '合' | '刑';

export type BranchLink = {
  kind: BranchLinkKind;
  from: PalaceSnap;
  to: PalaceSnap;
  label: string;
};

export type FeixingArrow = {
  kind: MutagenKind;
  star: string;
  from: PalaceSnap;
  to: PalaceSnap;
  self: boolean;
};

function branchIndex(b: string): number {
  return BRANCH_ORDER.indexOf(b as Branch);
}

export function palaceByBranch(view: ZiweiChartView, branch: string): PalaceSnap | undefined {
  return view.palaces.find((p) => p.earthlyBranch === branch);
}

export function findPalace(
  view: ZiweiChartView,
  name: string,
): PalaceSnap | undefined {
  const key = name.replace(/宫$/, '');
  return view.palaces.find((p) => {
    const pk = p.name.replace(/宫$/, '');
    if (key === '命' || key === '命宫') return pk === '命' || p.name === '命宫';
    if (key === '交友' || key === '奴仆') return pk === '仆役' || pk === '交友';
    return pk === key || p.name === name;
  });
}

/** 点某宫：本宫 / 对宫(+6) / 三合(+4,+8) —— 按地支位 */
export function sanfangSizheng(view: ZiweiChartView, palace: PalaceSnap): PalaceRelationSet {
  const i = branchIndex(palace.earthlyBranch);
  if (i < 0) {
    return { self: palace, opposite: null, sanhe: [], sizheng: [palace] };
  }
  const oppBr = BRANCH_ORDER[(i + 6) % 12]!;
  const s4 = BRANCH_ORDER[(i + 4) % 12]!;
  const s8 = BRANCH_ORDER[(i + 8) % 12]!;
  const opposite = palaceByBranch(view, oppBr) ?? null;
  const sanhe = [palaceByBranch(view, s4), palaceByBranch(view, s8)].filter(
    (p): p is PalaceSnap => Boolean(p),
  );
  const sizheng = [palace, opposite, ...sanhe].filter(
    (p, idx, arr): p is PalaceSnap => Boolean(p) && arr.indexOf(p) === idx,
  );
  return { self: palace, opposite, sanhe, sizheng };
}

/** 六合：地支相差 1？ 实际固定配对 */
const LIUHE_PAIRS: Array<[Branch, Branch]> = [
  ['子', '丑'],
  ['寅', '亥'],
  ['卯', '戌'],
  ['辰', '酉'],
  ['巳', '申'],
  ['午', '未'],
];

function hePartner(b: string): Branch | null {
  for (const [a, c] of LIUHE_PAIRS) {
    if (a === b) return c;
    if (c === b) return a;
  }
  return null;
}

/** 三刑：返回与 b 成刑的地支 */
function xingPartners(b: string): Branch[] {
  const groups: Branch[][] = [
    ['寅', '巳', '申'],
    ['丑', '未', '戌'],
    ['子', '卯'],
  ];
  const selfXing: Branch[] = ['辰', '午', '酉', '亥'];
  for (const g of groups) {
    if (g.includes(b as Branch)) return g.filter((x) => x !== b);
  }
  if (selfXing.includes(b as Branch)) return [b as Branch];
  return [];
}

/** 相对本宫的地支关系线（冲/合/刑），避免全盘蜘蛛网 */
export function branchLinksForPalace(view: ZiweiChartView, palace: PalaceSnap): BranchLink[] {
  const i = branchIndex(palace.earthlyBranch);
  if (i < 0) return [];
  const out: BranchLink[] = [];

  const oppBr = BRANCH_ORDER[(i + 6) % 12]!;
  const opp = palaceByBranch(view, oppBr);
  if (opp) {
    out.push({
      kind: '冲',
      from: palace,
      to: opp,
      label: `${palace.earthlyBranch}${opp.earthlyBranch}冲`,
    });
  }

  const he = hePartner(palace.earthlyBranch);
  if (he) {
    const hp = palaceByBranch(view, he);
    if (hp) {
      out.push({
        kind: '合',
        from: palace,
        to: hp,
        label: `${palace.earthlyBranch}${he}合`,
      });
    }
  }

  for (const xb of xingPartners(palace.earthlyBranch)) {
    const xp = palaceByBranch(view, xb);
    if (!xp) continue;
    if (xp.name === palace.name && xb === palace.earthlyBranch) {
      out.push({
        kind: '刑',
        from: palace,
        to: palace,
        label: `${xb}自刑`,
      });
    } else if (xp.name !== palace.name) {
      out.push({
        kind: '刑',
        from: palace,
        to: xp,
        label: `${palace.earthlyBranch}${xb}刑`,
      });
    }
  }

  return out;
}

export function findStarPalace(view: ZiweiChartView, starName: string): PalaceSnap | undefined {
  return view.palaces.find((p) =>
    [...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === starName),
  );
}

/** 宫干四化：从本宫天干发出 → 星曜落入宫 */
export function feixingFromPalace(view: ZiweiChartView, palace: PalaceSnap): FeixingArrow[] {
  const stem = palace.heavenlyStem;
  const stars = STEM_MUTAGEN[stem];
  if (!stars) return [];
  const kinds: MutagenKind[] = ['禄', '权', '科', '忌'];
  const out: FeixingArrow[] = [];
  stars.forEach((star, i) => {
    const to = findStarPalace(view, star);
    if (!to) return;
    const kind = kinds[i]!;
    out.push({
      kind,
      star,
      from: palace,
      to,
      self: to.name === palace.name,
    });
  });
  return out;
}

export function plainSanfangExplain(rel: PalaceRelationSet): string {
  const self = rel.self.name;
  const opp = rel.opposite?.name ?? '对宫';
  const san = rel.sanhe.map((p) => p.name).join('、') || '三合宫';
  return `${self}与${san}构成三合，并对冲${opp}——合称三方四正。读此宫时：先看本宫星曜，再看对宫，再看三合会照。`;
}

export function branchPoint(branch: string): { x: number; y: number } | null {
  // 与 BRANCH_GRID 一致，导出给 SVG
  const map: Record<string, { row: number; col: number }> = {
    巳: { row: 0, col: 0 },
    午: { row: 0, col: 1 },
    未: { row: 0, col: 2 },
    申: { row: 0, col: 3 },
    辰: { row: 1, col: 0 },
    酉: { row: 1, col: 3 },
    卯: { row: 2, col: 0 },
    戌: { row: 2, col: 3 },
    寅: { row: 3, col: 0 },
    丑: { row: 3, col: 1 },
    子: { row: 3, col: 2 },
    亥: { row: 3, col: 3 },
  };
  const g = map[branch];
  if (!g) return null;
  return { x: g.col + 0.5, y: g.row + 0.5 };
}
