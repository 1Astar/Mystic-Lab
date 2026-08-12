/**
 * 学习抽屉：统一四层
 * ①一句话 ②传统含义 ③在你的命盘里 ④继续探索
 */
import { COMBO_LORE } from './combo-lore.ts';
import { getPalaceLore } from './palace-lore.ts';
import { sanfangSizheng, branchLinksForPalace } from './palace-relations.ts';
import { resolveDecoStarLore } from './shensha-resolve.ts';
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
  /** 生年四化对照表（可选） */
  mutagenMap?: Array<{
    label: string;
    star: string;
    palace: string;
    effect: string;
  }>;
  /** 地支关系对照表（可选）：冲/合/刑 → 落宫 + 影响 */
  branchMap?: Array<{
    kind: string;
    label: string;
    from: string;
    to: string;
    fromPalace: string;
    toPalace: string;
    effect: string;
  }>;
  /** 神煞等：跳图鉴同源条目 */
  atlasHint?: { path: string; label: string };
};

function palaceKey(name: string): string {
  const n = name.trim();
  if (n === '交友' || n === '交友宫' || n === '奴仆' || n === '奴仆宫') return '仆役';
  if (n === '命' || n === '命宫') return '命宫';
  return n.replace(/宫$/, '');
}

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

/** 四化单字 → 影响一句话（与盘面「顺/扛/名/卡」对应） */
const MUTAGEN_IMPACT: Record<string, { label: string; effect: string }> = {
  禄: { label: '化禄', effect: '顺与得：该星所主领域更容易有收获、资源与满足感' },
  权: { label: '化权', effect: '主导要扛：更适合拍板推进，也易显得强势、责任变重' },
  科: { label: '化科', effect: '名声贵人：易被看见、求教与文书口碑，忌只活在评价里' },
  忌: { label: '化忌', effect: '卡点执念：此处易卡住、内耗；宜降预期、复盘止损，非死刑' },
};

/** 本盘生年四化：对应哪星落哪宫 + 影响 */
function buildMutagenMap(
  view: ZiweiChartView,
): NonNullable<LearnExplain['mutagenMap']> {
  return collectMutagenFlow(view.palaces).map((f) => {
    const impact = MUTAGEN_IMPACT[f.mutagen];
    return {
      label: impact?.label ?? `化${f.mutagen}`,
      star: f.star,
      palace: palaceTagged(f.palace),
      effect: impact?.effect ?? '催化该星所主领域',
    };
  });
}

function formatBirthMutagenInChart(view: ZiweiChartView): string {
  const map = buildMutagenMap(view);
  if (!map.length) {
    return '本盘暂未读出生年四化落点。可先看词条「化禄 / 化权 / 化科 / 化忌」了解四态含义。';
  }
  const lines = map.map(
    (f) => `· ${f.label} → ${f.star}（${f.palace}）\n  影响：${f.effect}`,
  );
  return `本盘生年四化（与中央「命主档案」四化徽章对应）：\n${lines.join('\n')}`;
}

/** 单化：本盘落在哪 + 影响 */
function formatSingleMutagenInChart(view: ZiweiChartView, mutagenChar: string): string {
  const impact = MUTAGEN_IMPACT[mutagenChar];
  const label = impact?.label ?? `化${mutagenChar}`;
  const effect = impact?.effect ?? '';
  const hit = collectMutagenFlow(view.palaces).find((f) => f.mutagen === mutagenChar);
  if (!hit) {
    return `${label}：${effect || '四化之一'}。\n本盘生年四化里暂未标到「${label}」落点（或该化在辅星层未收录）。`;
  }
  return `${label}在本盘落在「${hit.star}」· ${palaceTagged(hit.palace)}。\n影响：${effect}`;
}

function mutagenCharFromTerm(name: string): string | null {
  if (name === '化禄' || name === '禄') return '禄';
  if (name === '化权' || name === '权') return '权';
  if (name === '化科' || name === '科') return '科';
  if (name === '化忌' || name === '忌') return '忌';
  return null;
}

/** 地支关系三态 → 影响（与图层冲/合/刑线对应） */
const BRANCH_IMPACT: Record<string, { title: string; effect: string }> = {
  冲: {
    title: '六冲',
    effect: '对撞与变动：内外对照强，节奏易被拉开或推着变；宜对照看，勿只当凶',
  },
  合: {
    title: '六合',
    effect: '牵绊与成局：易合作也易黏着，人事拉在一处；成局时要防缠',
  },
  刑: {
    title: '相刑',
    effect: '别扭与内耗：规矩摩擦或自我拉扯；宜谈清边界，少硬刚（含自刑）',
  },
};

function resolveAnchorPalace(view: ZiweiChartView, palaceName?: string): PalaceSnap {
  return (palaceName ? findPalace(view, palaceName) : undefined) ?? view.soulPalace;
}

function buildBranchMap(
  view: ZiweiChartView,
  palaceName?: string,
  kindFilter?: string,
): NonNullable<LearnExplain['branchMap']> {
  const palace = resolveAnchorPalace(view, palaceName);
  return branchLinksForPalace(view, palace)
    .filter((link) => !kindFilter || link.kind === kindFilter)
    .map((link) => {
      const impact = BRANCH_IMPACT[link.kind];
      const selfXing = link.from.name === link.to.name;
      const toLabel = selfXing
        ? `${link.to.earthlyBranch}自刑（本宫）`
        : `${palaceTagged(link.to.name)}·${link.to.earthlyBranch}`;
      return {
        kind: link.kind,
        label: link.label,
        from: `${palaceTagged(link.from.name)}·${link.from.earthlyBranch}`,
        to: toLabel,
        fromPalace: link.from.name,
        toPalace: link.to.name,
        effect: impact?.effect ?? '地支互动提醒',
      };
    });
}

function formatBranchOverviewInChart(
  view: ZiweiChartView,
  palaceName?: string,
): string {
  const palace = resolveAnchorPalace(view, palaceName);
  const map = buildBranchMap(view, palace.name);
  if (!map.length) {
    return `以「${palaceTagged(palace.name)}」为锚，暂未画出冲/合/刑线。可切图层「地支关系」再点宫查看。`;
  }
  return `以「${palaceTagged(palace.name)}」为锚。下表列出本宫相关的冲/合/刑及影响。`;
}

/** 宫名 + 场景 hint，如「官禄（事业轨道）」 */
function palaceTagged(name: string): string {
  const lore = getPalaceLore(name);
  const s = shortPalace(name);
  return lore?.hint ? `${s}（${lore.hint}）` : s;
}

function findPalace(view: ZiweiChartView, name: string): PalaceSnap | undefined {
  const key = palaceKey(name);
  return view.palaces.find((p) => palaceKey(p.name) === key);
}

/**
 * 对宫/三合怎么用：落到宫义。
 * 命宫常例 → 对宫迁移；三合官禄、财帛。
 */
function describeSanfangForPalace(
  view: ZiweiChartView,
  palace: PalaceSnap,
): {
  inChart: string;
  relationMap: NonNullable<LearnExplain['relationMap']>;
} {
  const relSet = sanfangSizheng(view, palace);
  const selfLore = getPalaceLore(palace.name);
  const theme = selfLore?.hint ?? shortPalace(palace.name);
  const opp = relSet.opposite;

  const sanheLines = relSet.sanhe.map((p) => {
    const l = getPalaceLore(p.name);
    const role = l?.oneLiner ?? '与本宫会照';
    return `· 三合${palaceTagged(p.name)}：${role}——会照「${theme}」，看它如何托住或拉扯本宫。`;
  });

  const oppLine = opp
    ? `· 对宫${palaceTagged(opp.name)}：${
        selfLore?.oppositeHint ?? '对照本宫的内外/互补面。'
      }用途是对照，不是单纯好坏。`
    : '· 对宫：—';

  const isMing = palaceKey(palace.name) === '命宫';
  const note = isMing
    ? '命宫常例：对宫迁移＝外面如何看见我；三合官禄＝事业轨道如何塑造我；三合财帛＝资源进账如何托住我。'
    : `读${shortPalace(palace.name)}时，对宫与两座三合是同一套「三方四正」镜头，不是刑克判决。`;

  const inChart = [
    `以「${palace.name}」为例（本盘 ${palace.heavenlyStem}${palace.earthlyBranch}）。`,
    selfLore ? `本宫主题：${theme}——${selfLore.oneLiner}` : `本宫：${palace.name}`,
    oppLine,
    ...sanheLines,
    '读法：本宫最重 → 对宫对照 → 三合会照。盘上「对」=对宫，「合」=三合。',
  ].join('\n');

  return {
    inChart,
    relationMap: {
      self: palaceTagged(palace.name),
      opposite: opp ? palaceTagged(opp.name) : '—',
      sanhe: relSet.sanhe.map((p) => palaceTagged(p.name)),
      note,
    },
  };
}

function findStarPalace(view: ZiweiChartView, starName: string): PalaceSnap | undefined {
  return view.palaces.find((p) =>
    [...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === starName) ||
    (p.series ?? []).some((s) => s.name === starName),
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

function buildTermExplain(
  view: ZiweiChartView,
  termName: string,
  palaceName?: string,
): LearnExplain {
  const g = getGlossaryByName(termName);
  if (!g) {
    const deco = resolveDecoStarLore(termName);
    if (deco) {
      return buildStarExplain(view, termName, palaceName);
    }
    return {
      title: termName,
      subtitle: TERM_CATEGORY_LABEL.structure,
      category: 'structure',
      categoryLabel: TERM_CATEGORY_LABEL.structure,
      oneLiner: `${termName}：盘面结构用语。先看它落在哪宫、同宫主星是什么，再叠四化与三方四正。`,
      traditional:
        '词条仍在扩充。陌生神煞/术语名不要单独当吉凶判决；以宫职主题 + 主星组合为主，它只作细部色调。',
      inChart: palaceName
        ? `你正在「${palaceName}」语境下点到「${termName}」。可先读该宫主题与主星，再回来对照这个词。`
        : '可先结合当前点亮的宫位与主星阅读；需要时再到图鉴神煞桶核对同名条目。',
      related: [
        rel('三方四正', 'structure', { term: '三方四正', kind: 'structure' }),
        rel('庙旺落陷', 'status', { term: '庙旺落陷', kind: 'status' }),
        rel('四化', 'mutagen', { term: '四化', kind: 'mutagen' }),
      ],
    };
  }

  let inChart = `你正在查看结构/术语「${g.name}」。`;
  let mutagenMap: LearnExplain['mutagenMap'];
  let branchMap: LearnExplain['branchMap'];
  if (g.name === '五行局' || g.aliases?.some((a) => a.includes('局'))) {
    inChart = `本盘五行局为「${view.fiveElementsClass}」。${g.shortMeaning}`;
  }
  if (g.name === '四化' || g.name === '生年四化') {
    mutagenMap = buildMutagenMap(view);
    inChart = mutagenMap.length
      ? '下表即本盘生年四化：与中央「命主档案」四化徽章一一对应。点相关探索可看单化详解。'
      : formatBirthMutagenInChart(view);
  }
  const singleMutagen = mutagenCharFromTerm(g.name);
  if (singleMutagen) {
    const hit = collectMutagenFlow(view.palaces).find((f) => f.mutagen === singleMutagen);
    if (hit) {
      const impact = MUTAGEN_IMPACT[singleMutagen];
      mutagenMap = [
        {
          label: impact?.label ?? `化${singleMutagen}`,
          star: hit.star,
          palace: palaceTagged(hit.palace),
          effect: impact?.effect ?? '催化该星所主领域',
        },
      ];
      inChart = `${impact?.label ?? `化${singleMutagen}`}在本盘的落点与影响见下表；也可点「${hit.star}」继续看星曜。`;
    } else {
      inChart = formatSingleMutagenInChart(view, singleMutagen);
    }
  }
  if (g.name === '地支关系') {
    branchMap = buildBranchMap(view, palaceName);
    inChart = formatBranchOverviewInChart(view, palaceName);
  }
  if (g.name === '六冲') {
    branchMap = buildBranchMap(view, palaceName, '冲');
    inChart = branchMap.length
      ? `六冲＝对撞与变动。下表是以「${palaceTagged(resolveAnchorPalace(view, palaceName).name)}」为锚的冲线（图层线对应）。`
      : '地支六冲：子午 · 丑未 · 寅申 · 卯酉 · 辰戌 · 巳亥。盘上隔六宫即对冲，也是对宫的地支底色。';
  }
  if (g.name === '六合') {
    branchMap = buildBranchMap(view, palaceName, '合');
    inChart = branchMap.length
      ? `六合＝牵绊与成局（≠三合）。下表是以「${palaceTagged(resolveAnchorPalace(view, palaceName).name)}」为锚的合线。`
      : '地支六合：子丑 · 寅亥 · 卯戌 · 辰酉 · 巳申 · 午未。与三合不同：六合两支牵绊，三合三支成局。';
  }
  if (g.name === '刑') {
    branchMap = buildBranchMap(view, palaceName, '刑');
    inChart = branchMap.length
      ? `刑＝别扭与内耗（含自刑）。下表是以「${palaceTagged(resolveAnchorPalace(view, palaceName).name)}」为锚的刑线。`
      : '刑：寅巳申、丑未戌、子卯；辰午酉亥自刑。宜谈清边界，少硬刚。';
  }
  let relationMap: LearnExplain['relationMap'];
  if (g.name === '三方四正' || g.name === '对宫' || g.name === '三合') {
    const anchor =
      (palaceName ? findPalace(view, palaceName) : undefined) ?? view.soulPalace;
    const desc = describeSanfangForPalace(view, anchor);
    const lead =
      g.name === '对宫'
        ? '对宫＝正对面（隔六宫），用来对照内外或互补。\n'
        : g.name === '三合'
          ? '三合＝两座会照宫（隔四、隔八），与本宫成局；不是六合。\n'
          : '三方四正＝本宫 + 对宫 + 两座三合。\n';
    inChart = `${lead}${desc.inChart}`;
    relationMap = desc.relationMap;
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
    mutagenMap,
    branchMap,
  };
}

function buildStarExplain(
  view: ZiweiChartView,
  starName: string,
  palaceName?: string,
): LearnExplain {
  const profile = getStarProfile(starName);
  const lore = getStarLore(starName);
  const deco = resolveDecoStarLore(starName);
  const palace =
    (palaceName ? findPalace(view, palaceName) : undefined) ??
    findStarPalace(view, starName);
  const snap = palace ? findStarSnap(palace, starName) : undefined;
  const status = snap?.brightness ? normalizeStatus(snap.brightness) : '';
  const statusInfo = status ? STATUS_PRODUCT[status] : undefined;

  const oneLiner =
    profile?.oneLiner ??
    lore?.myth ??
    deco?.oneLiner ??
    `${starName}：盘面神煞/杂曜之一，作细部色调；主戏仍看同宫主星。`;
  const traditional = lore
    ? `${lore.portrait}\n${lore.trait}`
    : profile?.metaphor ||
      (deco
        ? deco.when
          ? `${deco.traditional}\n\n何时用：${deco.when}`
          : deco.traditional
        : '') ||
      '本星为盘面神煞/杂曜，图鉴正在补全。先看落宫主题与同宫主星，再把它当细部色调。';

  let inChart = `盘面尚未定位到「${starName}」的落宫。`;
  if (palace) {
    const hit = profile?.palaces.find(
      (h) =>
        h.palaceId === palace.name ||
        h.palaceId === palaceKey(palace.name) ||
        h.title.includes(palaceKey(palace.name)),
    );
    const palaceLore = getPalaceLore(palace.name);
    if (deco && !profile && !lore) {
      const tag =
        deco.kind === 'minor' ? `杂曜·${deco.epithet}` : `神煞·${deco.epithet}`;
      inChart = `${starName}（${tag}）落在${palace.name}${
        palaceLore?.hint ? `「${palaceLore.hint}」` : ''
      }。力轻于主星，先读同宫主星与三方四正，再叠这层色调。`;
      if (deco.when) inChart += `\n语境：${deco.when}。`;
    } else {
      inChart = `${starName}落入${palace.name}，说明「${
        profile?.keywords.slice(0, 3).join('、') || oneLiner.replace(/^[^：]*：/, '').slice(0, 24)
      }」会直接影响该场域里的性格与选择。`;
    }
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
    subtitle: deco && !profile ? `${deco.epithet}${palace ? `｜${palace.name}` : ''}` : palace?.name ?? '',
    category: 'star',
    categoryLabel: TERM_CATEGORY_LABEL.star,
    oneLiner,
    traditional,
    inChart,
    related,
    elementLabel,
    atlasHint: deco?.shenshaId
      ? {
          path: `/ziwei/tujian?bucket=shensha&shensha=${encodeURIComponent(deco.shenshaId)}`,
          label: '打开图鉴同源条目',
        }
      : undefined,
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
  const sanfang = describeSanfangForPalace(view, palace);

  const oneLiner = lore?.oneLiner ?? `${palace.name}：人生场景之一。`;
  const traditional = lore
    ? `${lore.asks}\n强时：${lore.strongWhen}\n留意：${lore.watchOut}\n${lore.oppositeHint}`
    : '';

  const inChart = [
    `你正在查看：${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）`,
    majors.length ? `本宫主星：${majors.join('、')}` : '本宫主星空象，更依赖对宫与三合会照。',
    minors.length ? `辅星：${minors.join('、')}` : '',
    adjectives.length ? `杂曜：${adjectives.join('、')}` : '',
    '',
    sanfang.inChart,
  ]
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n');

  const related: LearnRelated[] = [
    rel('三方四正', 'structure', {
      term: '三方四正',
      kind: 'structure',
      palaceName: palace.name,
    }),
    rel('对宫', 'structure', { term: '对宫', kind: 'structure', palaceName: palace.name }),
    rel('三合', 'structure', { term: '三合', kind: 'structure', palaceName: palace.name }),
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
    relationMap: sanfang.relationMap,
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
    return buildTermExplain(view, name, focus.palaceName);
  }

  if (focus.term || kind === 'structure' || kind === 'mutagen' || kind === 'limit') {
    const name = focus.term ?? focus.palaceName ?? focus.starName ?? '三方四正';
    if (getStarLore(name) && !getGlossaryByName(name))
      return buildStarExplain(view, name, focus.palaceName);
    if (resolveDecoStarLore(name) && !getGlossaryByName(name))
      return buildStarExplain(view, name, focus.palaceName);
    if ((getPalaceLore(name) || getPalaceLore(name.replace(/宫$/, ''))) && !getGlossaryByName(name))
      return buildPalaceExplain(view, name);
    return buildTermExplain(view, name, focus.palaceName);
  }

  if (focus.starName) return buildStarExplain(view, focus.starName, focus.palaceName);
  if (focus.palaceName) return buildPalaceExplain(view, focus.palaceName);

  return buildTermExplain(view, '三方四正', focus.palaceName);
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
