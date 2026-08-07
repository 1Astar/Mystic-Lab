/**
 * 学习抽屉：统一四层
 * ①一句话 ②传统含义 ③在你的命盘里 ④继续探索
 */
import { COMBO_LORE } from './combo-lore.ts';
import { getPalaceLore } from './palace-lore.ts';
import { sanfangSizheng } from './palace-relations.ts';
import { getStarProfile } from './star-profiles.ts';
import { getStarLore, mutagenToCardId } from './stars.ts';
import {
  getGlossaryByName,
  normalizeStatus,
  STATUS_DISCLAIMER,
  STATUS_PRODUCT,
  TERM_CATEGORY_LABEL,
  type TermCategory,
} from './term-glossary.ts';
import type { PalaceSnap, StarSnap, ZiweiChartView } from './types.ts';

export type LearnFocus = {
  /** 显式类型；缺省时根据字段推断 */
  kind?: TermCategory;
  starName?: string;
  palaceName?: string;
  /** 庙旺得利平陷 */
  status?: string;
  /** 结构/四化/运限等词条名 */
  term?: string;
};

export type LearnRelated = {
  label: string;
  kind: TermCategory;
  focus: LearnFocus;
};

export type LearnExplain = {
  title: string;
  subtitle: string;
  category: TermCategory;
  categoryLabel: string;
  oneLiner: string;
  traditional: string;
  inChart: string;
  related: LearnRelated[];
  /** 星曜详情内：星曜状态入口（非盘面主入口） */
  statusLink?: {
    status: string;
    product: string;
    focus: LearnFocus;
  };
  /** 如「阴木」 */
  elementLabel?: string;
  /** 宫位关系地图（可选） */
  relationMap?: {
    self: string;
    opposite: string;
    sanhe: string[];
    note: string;
  };
};

function palaceKey(name: string): string {
  const n = name.trim();
  if (n === '交友' || n === '交友宫' || n === '奴仆' || n === '奴仆宫') return '仆役';
  if (n === '命' || n === '命宫') return '命宫';
  return n.replace(/宫$/, '');
}

function findPalace(view: ZiweiChartView, name: string): PalaceSnap | undefined {
  const key = palaceKey(name);
  return view.palaces.find((p) => palaceKey(p.name) === key);
}

function findStarPalace(view: ZiweiChartView, starName: string): PalaceSnap | undefined {
  return view.palaces.find((p) =>
    [...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === starName),
  );
}

function findStarSnap(palace: PalaceSnap, starName: string): StarSnap | undefined {
  return [...palace.majors, ...palace.minors, ...palace.adjectives].find((s) => s.name === starName);
}

function rel(
  label: string,
  kind: TermCategory,
  focus: LearnFocus,
): LearnRelated {
  return { label, kind, focus };
}

function inferKind(focus: LearnFocus): TermCategory {
  if (focus.kind) return focus.kind;
  if (focus.status) return 'status';
  if (focus.term) {
    const g = getGlossaryByName(focus.term);
    if (g) return g.category;
  }
  if (focus.starName) return 'star';
  if (focus.palaceName) return 'palace';
  return 'structure';
}

function buildStatusExplain(
  view: ZiweiChartView,
  statusRaw: string,
  starName?: string,
  palaceName?: string,
): LearnExplain {
  const status = normalizeStatus(statusRaw);
  const product = STATUS_PRODUCT[status] ?? STATUS_PRODUCT.平!;
  const g = getGlossaryByName(status) ?? getGlossaryByName('庙旺落陷');
  const palace = palaceName ? findPalace(view, palaceName) : undefined;
  const starPalace = starName ? findStarPalace(view, starName) : palace;
  const snap =
    starName && starPalace ? findStarSnap(starPalace, starName) : undefined;

  let inChart = `星曜状态「${status}」：${product.userLine}`;
  if (starName && starPalace) {
    inChart = `${starName}在${starPalace.name}为「${status}」（${product.product}）。${product.userLine}`;
    if (snap?.mutagen) inChart += `\n同宫还见化${snap.mutagen}，发挥会叠一层四化作用。`;
  }
  inChart += `\n\n请注意：\n${STATUS_DISCLAIMER}`;

  const related: LearnRelated[] = [
    rel('庙旺落陷', 'status', { term: '庙旺落陷', kind: 'status' }),
    rel('三方四正', 'structure', { term: '三方四正', kind: 'structure' }),
    rel('四化', 'mutagen', { term: '四化', kind: 'mutagen' }),
  ];
  if (starName) related.unshift(rel(starName, 'star', { starName, palaceName: starPalace?.name, kind: 'star' }));
  if (starPalace) related.push(rel(starPalace.name, 'palace', { palaceName: starPalace.name, kind: 'palace' }));

  return {
    title: `星曜状态｜${status}`,
    subtitle: product.product,
    category: 'status',
    categoryLabel: TERM_CATEGORY_LABEL.status,
    oneLiner: g?.shortMeaning ?? product.userLine,
    traditional: g?.traditional ?? '',
    inChart,
    related,
  };
}

function buildTermExplain(view: ZiweiChartView, termName: string): LearnExplain {
  const g = getGlossaryByName(termName);
  if (!g) {
    return {
      title: termName,
      subtitle: '',
      category: 'structure',
      categoryLabel: TERM_CATEGORY_LABEL.structure,
      oneLiner: `${termName}：盘面术语，后续会补全释义。`,
      traditional: '',
      inChart: '可先结合当前点亮的宫位与星曜阅读。',
      related: [
        rel('三方四正', 'structure', { term: '三方四正', kind: 'structure' }),
        rel('庙旺落陷', 'status', { term: '庙旺落陷', kind: 'status' }),
      ],
    };
  }

  let inChart = `你正在查看结构/术语「${g.name}」。`;
  if (g.name === '五行局' || g.aliases?.some((a) => a.includes('局'))) {
    inChart = `本盘五行局为「${view.fiveElementsClass}」。${g.shortMeaning}`;
  }
  if (g.name === '六冲') {
    inChart =
      '地支六冲：子午 · 丑未 · 寅申 · 卯酉 · 辰戌 · 巳亥。盘上隔六宫即对冲，也是对宫的地支底色。切到「地支关系」图层可看本宫冲线。';
  }
  if (g.name === '六合') {
    inChart =
      '地支六合：子丑合土 · 寅亥合木 · 卯戌合火 · 辰酉合金 · 巳申合水 · 午未合土。与三合不同：六合两支牵绊，三合三支成局。';
  }
  let relationMap: LearnExplain['relationMap'];
  if (g.name === '三方四正' || g.name === '对宫') {
    const soul = view.soulPalace;
    const relSet = sanfangSizheng(view, soul);
    inChart = `以命宫为例：本宫${relSet.self.name}，对宫${relSet.opposite?.name ?? '—'}，三合${relSet.sanhe.map((p) => p.name).join('、') || '—'}。点其他宫名可切换三方四正高亮。`;
    relationMap = {
      self: relSet.self.name,
      opposite: relSet.opposite?.name ?? '—',
      sanhe: relSet.sanhe.map((p) => p.name),
      note: '三方四正由地支位决定：对宫隔 6，三合隔 4 与 8。',
    };
  }

  return {
    title:
      g.name === '五行局' && view.fiveElementsClass
        ? view.fiveElementsClass
        : g.name,
    subtitle: TERM_CATEGORY_LABEL[g.category],
    category: g.category,
    categoryLabel: TERM_CATEGORY_LABEL[g.category],
    oneLiner: g.shortMeaning,
    traditional: g.traditional,
    inChart,
    related: g.relatedTerms.map((t) => {
      const gg = getGlossaryByName(t);
      if (gg) return rel(t, gg.category, { term: t, kind: gg.category });
      if (getStarLore(t)) return rel(t, 'star', { starName: t, kind: 'star' });
      if (getPalaceLore(t) || getPalaceLore(t.replace(/宫$/, '')))
        return rel(t, 'palace', { palaceName: t, kind: 'palace' });
      return rel(t, 'structure', { term: t, kind: 'structure' });
    }),
    relationMap,
  };
}

function buildStarExplain(
  view: ZiweiChartView,
  starName: string,
  palaceName?: string,
): LearnExplain {
  const profile = getStarProfile(starName);
  const lore = getStarLore(starName);
  const palace =
    (palaceName ? findPalace(view, palaceName) : undefined) ??
    findStarPalace(view, starName);
  const snap = palace ? findStarSnap(palace, starName) : undefined;
  const status = snap?.brightness ? normalizeStatus(snap.brightness) : '';
  const statusInfo = status ? STATUS_PRODUCT[status] : undefined;

  const oneLiner =
    profile?.oneLiner ??
    lore?.myth ??
    `${starName}：盘中星曜之一。`;
  const traditional = lore
    ? `${lore.portrait}\n${lore.trait}`
    : profile?.metaphor ?? '';

  let inChart = `盘面尚未定位到「${starName}」的落宫。`;
  if (palace) {
    const hit = profile?.palaces.find(
      (h) =>
        h.palaceId === palace.name ||
        h.palaceId === palaceKey(palace.name) ||
        h.title.includes(palaceKey(palace.name)),
    );
    inChart = `${starName}落入${palace.name}，说明「${
      profile?.keywords.slice(0, 3).join('、') || oneLiner.replace(/^[^：]*：/, '').slice(0, 24)
    }」会直接影响该场域里的性格与选择。`;
    if (hit) inChart += `\n${hit.line}`;
    if (snap?.mutagen) {
      const mid = mutagenToCardId(snap.mutagen);
      inChart += `\n本星带${mid ?? `化${snap.mutagen}`}，读法要叠四化作用。`;
    }
    const co = palace.majors.filter((s) => s.name !== starName).map((s) => s.name);
    if (co.length) inChart += `\n同宫主星：${co.join('、')}。`;
  }

  const elementLabel =
    profile?.tags.yinYang && profile.tags.wuxing && profile.tags.wuxing !== '—'
      ? `${profile.tags.yinYang}${profile.tags.wuxing}`
      : undefined;

  const combos = COMBO_LORE.filter((c) => c.members.includes(starName));
  const related: LearnRelated[] = [];
  if (palace) related.push(rel(palace.name, 'palace', { palaceName: palace.name, kind: 'palace' }));
  related.push(rel('三方四正', 'structure', { term: '三方四正', kind: 'structure' }));
  related.push(rel('庙旺落陷', 'status', { term: '庙旺落陷', kind: 'status' }));
  for (const c of combos) {
    for (const m of c.members) {
      if (m !== starName && related.length < 10)
        related.push(rel(m, 'star', { starName: m, kind: 'star' }));
    }
  }

  return {
    title: starName,
    subtitle: palace?.name ?? '',
    category: 'star',
    categoryLabel: TERM_CATEGORY_LABEL.star,
    oneLiner,
    traditional,
    inChart,
    related,
    elementLabel,
    statusLink: status
      ? {
          status,
          product: statusInfo?.product ?? '发挥状态',
          focus: {
            kind: 'status',
            status,
            starName,
            palaceName: palace?.name,
          },
        }
      : undefined,
  };
}

function buildPalaceExplain(view: ZiweiChartView, palaceName: string): LearnExplain {
  const palace = findPalace(view, palaceName) ?? view.soulPalace;
  const lore = getPalaceLore(palace.name) ?? getPalaceLore(palaceKey(palace.name));
  const relSet = sanfangSizheng(view, palace);
  const majors = palace.majors.map((s) => s.name + (s.brightness ? `（${s.brightness}）` : ''));
  const minors = palace.minors.map((s) => s.name + (s.mutagen ? `化${s.mutagen}` : ''));
  const adjectives = palace.adjectives.map((s) => s.name);

  const oneLiner = lore?.oneLiner ?? `${palace.name}：人生场景之一。`;
  const traditional = lore
    ? `${lore.asks}\n强时：${lore.strongWhen}\n留意：${lore.watchOut}\n${lore.oppositeHint}`
    : '';

  const inChart = [
    `你正在查看：${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）`,
    majors.length ? `本宫主星：${majors.join('、')}` : '本宫主星空象，更依赖对宫与三合会照。',
    minors.length ? `辅星：${minors.join('、')}` : '',
    adjectives.length ? `杂曜：${adjectives.join('、')}` : '',
    `三方：${relSet.sanhe.map((p) => p.name).join('、') || '—'}`,
    `对宫：${relSet.opposite?.name ?? '—'}`,
    '读法顺序：本宫最重要 → 对宫其次 → 三合再次。',
  ]
    .filter(Boolean)
    .join('\n');

  const related: LearnRelated[] = [
    rel('三方四正', 'structure', { term: '三方四正', kind: 'structure' }),
    rel('对宫', 'structure', { term: '对宫', kind: 'structure' }),
  ];
  if (relSet.opposite)
    related.push(
      rel(relSet.opposite.name, 'palace', {
        palaceName: relSet.opposite.name,
        kind: 'palace',
      }),
    );
  for (const s of relSet.sanhe) {
    related.push(rel(s.name, 'palace', { palaceName: s.name, kind: 'palace' }));
  }
  for (const s of palace.majors.slice(0, 3)) {
    related.push(
      rel(s.name, 'star', { starName: s.name, palaceName: palace.name, kind: 'star' }),
    );
  }

  return {
    title: lore?.title ?? palace.name,
    subtitle: lore?.hint ?? '人生场景',
    category: 'palace',
    categoryLabel: TERM_CATEGORY_LABEL.palace,
    oneLiner,
    traditional,
    inChart,
    related,
    relationMap: {
      self: palace.name,
      opposite: relSet.opposite?.name ?? '—',
      sanhe: relSet.sanhe.map((p) => p.name),
      note: '三方四正通常由本宫、两个三合宫和对宫构成。',
    },
  };
}

function isStatusLevel(name: string): boolean {
  const n = normalizeStatus(name);
  return Boolean(STATUS_PRODUCT[n]) && n !== '庙旺落陷';
}

export function buildLearnExplain(view: ZiweiChartView, focus: LearnFocus): LearnExplain {
  const kind = inferKind(focus);

  if (focus.status && isStatusLevel(focus.status)) {
    return buildStatusExplain(view, focus.status, focus.starName, focus.palaceName);
  }

  if (kind === 'status') {
    const name = focus.term ?? focus.status ?? '庙旺落陷';
    if (isStatusLevel(name)) {
      return buildStatusExplain(view, name, focus.starName, focus.palaceName);
    }
    return buildTermExplain(view, name);
  }

  if (focus.term || kind === 'structure' || kind === 'mutagen' || kind === 'limit') {
    const name = focus.term ?? focus.palaceName ?? focus.starName ?? '三方四正';
    if (getStarLore(name) && !getGlossaryByName(name))
      return buildStarExplain(view, name, focus.palaceName);
    if ((getPalaceLore(name) || getPalaceLore(name.replace(/宫$/, ''))) && !getGlossaryByName(name))
      return buildPalaceExplain(view, name);
    return buildTermExplain(view, name);
  }

  if (focus.starName) return buildStarExplain(view, focus.starName, focus.palaceName);
  if (focus.palaceName) return buildPalaceExplain(view, focus.palaceName);

  return buildTermExplain(view, '三方四正');
}

/** 兼容旧调用：生年四化列表 */
export function collectMutagenFlow(
  palaces: PalaceSnap[],
): Array<{ star: string; mutagen: string; palace: string }> {
  const out: Array<{ star: string; mutagen: string; palace: string }> = [];
  for (const p of palaces) {
    for (const s of [...p.majors, ...p.minors]) {
      if (s.mutagen) out.push({ star: s.name, mutagen: s.mutagen, palace: p.name });
    }
  }
  const order = ['禄', '权', '科', '忌'];
  return out.sort((a, b) => order.indexOf(a.mutagen) - order.indexOf(b.mutagen));
}

export { BRANCH_GRID } from './learn-explain-grid.ts';
