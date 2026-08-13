/**
 * 组合 / 古典格局成格判定。
 * 图鉴点亮 ≠ 成格。
 */
import type { ComboFormationRule } from './combo-lore.ts';
import { mutagenToCardId } from './stars.ts';
import {
  BRANCH_ORDER,
  findPalace,
  palaceByBranch,
  sanfangSizheng,
  type Branch,
} from './palace-relations.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

export type ComboFormationStatus = 'complete' | 'partial' | 'locked';

export type ComboFormationEval = {
  status: ComboFormationStatus;
  litMembers: string[];
  missingMembers: string[];
  progress: number;
  focusPalace?: string;
  ruleLine: string;
};

export type ComboFormationOpts = {
  rule?: ComboFormationRule;
};

function normPalace(name: string): string {
  return name.replace(/宫$/, '') || name;
}

function branchIndex(b: string): number {
  return BRANCH_ORDER.indexOf(b as Branch);
}

/** 星名 / 化禄… → 所在宫名列表 */
export function indexChartStarPalaces(
  view: ZiweiChartView,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (id: string, palace: string) => {
    const key = id.trim();
    if (!key) return;
    const list = map.get(key) ?? [];
    if (!list.includes(palace)) list.push(palace);
    map.set(key, list);
  };
  for (const p of view.palaces) {
    for (const s of [...p.majors, ...p.minors, ...(p.adjectives ?? [])]) {
      add(s.name, p.name);
      if (s.mutagen) {
        const card = mutagenToCardId(s.mutagen);
        if (card) add(card, p.name);
      }
    }
  }
  return map;
}

function isMutagenCombo(members: string[]): boolean {
  return members.length > 0 && members.every((m) => m.startsWith('化'));
}

function starInPalace(p: PalaceSnap, name: string): boolean {
  return [...p.majors, ...p.minors, ...(p.adjectives ?? [])].some((s) => {
    if (s.name === name) return true;
    if (name === '化禄' && s.mutagen === '禄') return true;
    return false;
  });
}

function neighborPalaces(
  view: ZiweiChartView,
  palace: PalaceSnap,
): { prev: PalaceSnap | null; next: PalaceSnap | null } {
  const i = branchIndex(palace.earthlyBranch);
  if (i < 0) return { prev: null, next: null };
  const prev = palaceByBranch(view, BRANCH_ORDER[(i + 11) % 12]!) ?? null;
  const next = palaceByBranch(view, BRANCH_ORDER[(i + 1) % 12]!) ?? null;
  return { prev, next };
}

function evalSanfang(
  members: string[],
  view: ZiweiChartView,
  index: Map<string, string[]>,
): ComboFormationEval {
  const empty: ComboFormationEval = {
    status: 'locked',
    litMembers: [],
    missingMembers: [...members],
    progress: 0,
    ruleLine: '先排盘；成格看成员是否在同一三方四正会照，不是图鉴集齐。',
  };

  const present = members.filter((m) => (index.get(m)?.length ?? 0) > 0);
  const absent = members.filter((m) => !present.includes(m));

  if (isMutagenCombo(members)) {
    if (absent.length === 0) {
      return {
        status: 'complete',
        litMembers: [...members],
        missingMembers: [],
        progress: 1,
        ruleLine: '生年四化在盘上齐全，视为四化组合到位。',
      };
    }
    return {
      status: present.length ? 'partial' : 'locked',
      litMembers: present,
      missingMembers: absent,
      progress: present.length / members.length,
      ruleLine: '生年四化尚未在盘上齐。',
    };
  }

  if (!present.length) {
    return {
      ...empty,
      missingMembers: [...members],
      ruleLine: '盘上未见这些成员星。',
    };
  }

  type Cand = { focus: string; covered: string[] };
  let best: Cand | null = null;

  for (const m of present) {
    const palaces = index.get(m) ?? [];
    for (const palaceName of palaces) {
      const palace = view.palaces.find((p) => p.name === palaceName);
      if (!palace) continue;
      const rel = sanfangSizheng(view, palace);
      const zone = new Set(rel.sizheng.map((p) => normPalace(p.name)));
      const covered = members.filter((id) => {
        const ps = index.get(id) ?? [];
        return ps.some((pn) => zone.has(normPalace(pn)));
      });
      if (!best || covered.length > best.covered.length) {
        best = { focus: palaceName, covered };
      }
      if (covered.length === members.length) break;
    }
  }

  const litMembers = best?.covered ?? [];
  const missingMembers = members.filter((m) => !litMembers.includes(m));
  const progress = litMembers.length / members.length;
  let status: ComboFormationStatus = 'locked';
  if (progress >= 1) status = 'complete';
  else if (litMembers.length > 0) status = 'partial';

  const focus = best?.focus;
  const ruleLine =
    status === 'complete'
      ? `成格：成员会照于「${focus}」的三方四正（同宫/对宫/三合）。`
      : status === 'partial'
        ? `未成格：以「${focus}」为锚，已会照 ${litMembers.join('、')}；还差 ${missingMembers.join('、')}。`
        : '盘上未见可会照的成员星。';

  return {
    status,
    litMembers,
    missingMembers,
    progress,
    focusPalace: focus,
    ruleLine,
  };
}

/** 文昌文曲俱在命宫三方四正 */
function evalWenxingGongming(
  view: ZiweiChartView,
  index: Map<string, string[]>,
): ComboFormationEval {
  const ming = view.soulPalace ?? findPalace(view, '命宫');
  if (!ming) {
    return {
      status: 'locked',
      litMembers: [],
      missingMembers: ['文昌', '文曲'],
      progress: 0,
      ruleLine: '未见命宫，无法判文星拱命。',
    };
  }
  const zone = new Set(
    sanfangSizheng(view, ming).sizheng.map((p) => normPalace(p.name)),
  );
  const lit = ['文昌', '文曲'].filter((id) =>
    (index.get(id) ?? []).some((pn) => zone.has(normPalace(pn))),
  );
  const missing = ['文昌', '文曲'].filter((id) => !lit.includes(id));
  if (lit.length === 2) {
    return {
      status: 'complete',
      litMembers: lit,
      missingMembers: [],
      progress: 1,
      focusPalace: ming.name,
      ruleLine: `成格：文昌、文曲会照命宫「${ming.name}」三方四正。`,
    };
  }
  return {
    status: lit.length ? 'partial' : 'locked',
    litMembers: lit,
    missingMembers: missing,
    progress: lit.length / 2,
    focusPalace: ming.name,
    ruleLine: lit.length
      ? `未成格：命宫三方已见 ${lit.join('、')}，还差 ${missing.join('、')}。`
      : '未成格：命宫三方未见文昌文曲。',
  };
}

/** 命在巳/亥，天马坐命，邻宫武曲与禄存（或化禄）相夹 */
function evalCailuJiama(
  view: ZiweiChartView,
  _index: Map<string, string[]>,
): ComboFormationEval {
  const ming = view.soulPalace ?? findPalace(view, '命宫');
  if (!ming) {
    return {
      status: 'locked',
      litMembers: [],
      missingMembers: ['天马', '武曲', '禄存'],
      progress: 0,
      ruleLine: '未见命宫，无法判财禄夹马。',
    };
  }
  const br = ming.earthlyBranch;
  const branchOk = br === '巳' || br === '亥';
  const hasMa = starInPalace(ming, '天马');
  const { prev, next } = neighborPalaces(view, ming);
  const sides = [prev, next].filter(Boolean) as PalaceSnap[];
  const hasWu = sides.some((p) => starInPalace(p, '武曲'));
  const hasLu = sides.some(
    (p) => starInPalace(p, '禄存') || starInPalace(p, '化禄'),
  );
  const lit: string[] = [];
  if (hasMa) lit.push('天马');
  if (hasWu) lit.push('武曲');
  if (hasLu) lit.push('禄存');
  const missingClean = [
    !hasMa ? '天马' : '',
    !hasWu ? '武曲' : '',
    !hasLu ? '禄存/化禄' : '',
  ].filter(Boolean);

  if (branchOk && hasMa && hasWu && hasLu) {
    return {
      status: 'complete',
      litMembers: lit,
      missingMembers: [],
      progress: 1,
      focusPalace: ming.name,
      ruleLine: `成格：命坐${br}、天马守命，邻宫武曲与禄（存/化）相夹。`,
    };
  }

  const progressBits = [branchOk, hasMa, hasWu, hasLu].filter(Boolean).length;
  return {
    status: progressBits > 0 ? 'partial' : 'locked',
    litMembers: lit,
    missingMembers: missingClean,
    progress: progressBits / 4,
    focusPalace: ming.name,
    ruleLine: !branchOk
      ? `未成格：财禄夹马多要求命在巳/亥（本盘命支「${br || '—'}」）。`
      : `未成格：巳/亥命已满足；还差 ${missingClean.join('、') || '条件'}。`,
  };
}

/** 日月在命宫三方四正 */
function evalRiyueBingming(
  view: ZiweiChartView,
  index: Map<string, string[]>,
): ComboFormationEval {
  const ming = view.soulPalace ?? findPalace(view, '命宫');
  if (!ming) {
    return {
      status: 'locked',
      litMembers: [],
      missingMembers: ['太阳', '太阴'],
      progress: 0,
      ruleLine: '未见命宫，无法判日月并明。',
    };
  }
  const zone = new Set(
    sanfangSizheng(view, ming).sizheng.map((p) => normPalace(p.name)),
  );
  const lit = ['太阳', '太阴'].filter((id) =>
    (index.get(id) ?? []).some((pn) => zone.has(normPalace(pn))),
  );
  const missing = ['太阳', '太阴'].filter((id) => !lit.includes(id));
  if (lit.length === 2) {
    return {
      status: 'complete',
      litMembers: lit,
      missingMembers: [],
      progress: 1,
      focusPalace: ming.name,
      ruleLine: `成格：太阳、太阴会照命宫三方四正（古典亦称丹墀桂墀之一说）。`,
    };
  }
  return {
    status: lit.length ? 'partial' : 'locked',
    litMembers: lit,
    missingMembers: missing,
    progress: lit.length / 2,
    focusPalace: ming.name,
    ruleLine: lit.length
      ? `未成格：命宫三方已见 ${lit.join('、')}，还差 ${missing.join('、')}。`
      : '未成格：命宫三方未见日月。',
  };
}

/** 昌曲一在命、一在迁 */
function evalDanchiGuichi(
  view: ZiweiChartView,
  index: Map<string, string[]>,
): ComboFormationEval {
  const ming = view.soulPalace ?? findPalace(view, '命宫');
  const qian = findPalace(view, '迁移') ?? findPalace(view, '迁移宫');
  if (!ming || !qian) {
    return {
      status: 'locked',
      litMembers: [],
      missingMembers: ['文昌', '文曲'],
      progress: 0,
      ruleLine: '未见命/迁宫，无法判丹墀桂墀。',
    };
  }
  const inMing = ['文昌', '文曲'].filter((id) =>
    (index.get(id) ?? []).some((pn) => normPalace(pn) === normPalace(ming.name)),
  );
  const inQian = ['文昌', '文曲'].filter((id) =>
    (index.get(id) ?? []).some((pn) => normPalace(pn) === normPalace(qian.name)),
  );
  const split =
    inMing.length === 1 &&
    inQian.length === 1 &&
    inMing[0] !== inQian[0];
  if (split) {
    return {
      status: 'complete',
      litMembers: ['文昌', '文曲'],
      missingMembers: [],
      progress: 1,
      focusPalace: ming.name,
      ruleLine: `成格：${inMing[0]}在命、${inQian[0]}在迁（丹墀桂墀分居）。`,
    };
  }
  const lit = [...new Set([...inMing, ...inQian])];
  return {
    status: lit.length ? 'partial' : 'locked',
    litMembers: lit,
    missingMembers: ['文昌', '文曲'].filter((id) => !lit.includes(id)),
    progress: lit.length / 2,
    focusPalace: ming.name,
    ruleLine: '未成格：需文昌、文曲分居命宫与迁移宫。',
  };
}

/**
 * 成格判定：
 * - sanfang / 缺省：成员同三方四正
 * - 古典格：见 formationRule
 */
export function evaluateComboFormation(
  members: string[],
  view: ZiweiChartView | null | undefined,
  opts?: ComboFormationOpts,
): ComboFormationEval {
  const empty: ComboFormationEval = {
    status: 'locked',
    litMembers: [],
    missingMembers: [...members],
    progress: 0,
    ruleLine: '先排盘；成格看成员是否在同一三方四正会照，不是图鉴集齐。',
  };
  if (!view || 'error' in view || !members.length) return empty;

  const index = indexChartStarPalaces(view);
  const rule = opts?.rule ?? 'sanfang';

  if (rule === 'wenxing-gongming') return evalWenxingGongming(view, index);
  if (rule === 'cailu-jiama') return evalCailuJiama(view, index);
  if (rule === 'riyue-bingming') return evalRiyueBingming(view, index);
  if (rule === 'danchi-guichi') return evalDanchiGuichi(view, index);
  if (rule === 'catalog') {
    return {
      status: 'locked',
      litMembers: [],
      missingMembers: [...members],
      progress: 0,
      ruleLine: '名录释义：成格条件因流派而细，本条暂不自动判成格；可对照成员落宫自学。',
    };
  }
  return evalSanfang(members, view, index);
}

