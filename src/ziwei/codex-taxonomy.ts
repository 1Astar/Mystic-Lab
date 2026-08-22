/**
 * 星系档案信息架构：星曜 / 宫位 / 四化 / 结构
 * 组合不做成几百张卡，走「基础图鉴 + 动态组合解释」
 */
import { MINOR_STAR_LORE, type MinorStarLore } from './minor-star-lore.ts';
import { SHENSHA_LORE, getShenshaLore, type ShenshaLore } from './shensha-lore.ts';
import { SHENSHA_CODEX_GROUPS } from './shensha-policy.ts';
import {
  AUX_STARS,
  MAJOR_STARS,
  MUTAGEN_STARS,
  getStarLore,
  type StarCard,
} from './stars.ts';

/** 六吉星 */
export const LUCKY_STAR_IDS = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺'] as const;
/** 六煞星 */
export const SHA_STAR_IDS = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'] as const;

export type StarBucket = 'major' | 'lucky' | 'sha' | 'aux' | 'minor' | 'shensha';

export const STAR_BUCKET_META: Record<
  StarBucket,
  { title: string; blurb: string }
> = {
  major: { title: '主星', blurb: '十四主星' },
  lucky: { title: '吉星', blurb: '六吉星' },
  sha: { title: '煞星', blurb: '六煞星' },
  aux: { title: '辅曜', blurb: '重要辅曜' },
  minor: { title: '杂曜', blurb: '细部色调' },
  shensha: { title: '神煞', blurb: '盘中有 · 议题色调' },
};

export type CatalogSection = 'stars' | 'palaces' | 'mutagen' | 'structure';

export const CATALOG_SECTIONS: Array<{
  id: CatalogSection;
  title: string;
  blurb: string;
}> = [
  { id: 'stars', title: '星曜', blurb: '百科查阅' },
  { id: 'palaces', title: '宫位格局', blurb: '十二宫 · 成格' },
  { id: 'mutagen', title: '四化断事', blurb: '禄权科忌 · 运限' },
  { id: 'structure', title: '命盘规则', blurb: '庙旺 · 局 · 运限' },
];

/** 图鉴顶栏（「我的相遇」为独立页 layer=meet，不进此列） */
export const ATLAS_TOP_TABS: Array<{
  id: CatalogSection;
  title: string;
}> = [
  { id: 'palaces', title: '宫位格局' },
  { id: 'stars', title: '星曜' },
  { id: 'mutagen', title: '四化断事' },
  { id: 'structure', title: '命盘规则' },
];

export type PalaceBucket = 'twelve' | 'geju' | 'read';
export const PALACE_BUCKET_META: Record<PalaceBucket, { title: string; blurb: string }> = {
  twelve: { title: '十二宫', blurb: '人生场景' },
  geju: { title: '格局名录', blurb: '古典格 + 星曜组合全表' },
  read: { title: '读宫规则', blurb: '三方四正 · 对宫' },
};

export type MutagenBucket = 'stars' | 'birth' | 'limit';
export const MUTAGEN_BUCKET_META: Record<MutagenBucket, { title: string; blurb: string }> = {
  stars: { title: '四化星', blurb: '禄权科忌' },
  birth: { title: '生年四化', blurb: '本命催化' },
  limit: { title: '运限四化', blurb: '大限 · 流年' },
};

export type StructureBucket = 'brightness' | 'wuxing' | 'soul' | 'limits';
export const STRUCTURE_BUCKET_META: Record<
  StructureBucket,
  { title: string; blurb: string; term?: string }
> = {
  brightness: { title: '庙旺落陷', blurb: '发挥亮度', term: '庙旺落陷' },
  wuxing: { title: '五行局', blurb: '局数节奏', term: '五行局' },
  soul: { title: '命主身主', blurb: '主星指针', term: '命主' },
  limits: { title: '大限流年', blurb: '时间叠层', term: '大限' },
};

function byIds(ids: readonly string[]): StarCard[] {
  return ids.map((id) => getStarLore(id)).filter((s): s is StarCard => Boolean(s));
}

export function starsInBucket(bucket: StarBucket): StarCard[] {
  if (bucket === 'major') return [...MAJOR_STARS];
  if (bucket === 'lucky') return byIds(LUCKY_STAR_IDS);
  if (bucket === 'sha') return byIds(SHA_STAR_IDS);
  if (bucket === 'aux') {
    const reserved = new Set<string>([...LUCKY_STAR_IDS, ...SHA_STAR_IDS]);
    return AUX_STARS.filter((s) => !reserved.has(s.id));
  }
  if (bucket === 'shensha') return [];
  return [];
}

export function minorStarsInBucket(): MinorStarLore[] {
  return [...MINOR_STAR_LORE];
}

export function shenshaInBucket(): ShenshaLore[] {
  return [...SHENSHA_LORE];
}

/** 图鉴神煞：按组完整名录（十二神 roster 补齐；杂曜排除已进十二神名录的重名） */
export function shenshaCodexSections(): Array<{
  id: string;
  title: string;
  blurb: string;
  items: ShenshaLore[];
}> {
  const rosterNames = new Set(
    SHENSHA_CODEX_GROUPS.flatMap((g) => g.roster ?? []),
  );

  return SHENSHA_CODEX_GROUPS.map((g) => {
    let items: ShenshaLore[];
    if (g.roster?.length) {
      items = g.roster.map((name) => {
        const lore = getShenshaLore(name);
        return (
          lore ?? {
            id: name,
            epithet: name,
            oneLiner: '词条待补；流派有此名目时可对照盘面。',
            traditional: `${name}属${g.title}。完整释义持续补全。`,
            when: g.title,
            group: g.id,
          }
        );
      });
    } else {
      items = SHENSHA_LORE.filter((s) => {
        const group = s.group ?? 'adjective';
        if (group !== g.id) return false;
        if (g.id === 'adjective' && rosterNames.has(s.id)) return false;
        return true;
      });
    }
    return { id: g.id, title: g.title, blurb: g.blurb, items };
  });
}

export function mutagenStarCards(): StarCard[] {
  return [...MUTAGEN_STARS];
}

/** 列表短卡副标题：分类｜epithet */
export function starListKicker(star: StarCard): string {
  if (star.category === 'major') {
    const g = star.majorGroup === 'six' ? '六正星' : '八正星';
    return `${g}｜${star.epithet}`;
  }
  if (star.category === 'mutagen') return `四化｜${star.epithet}`;
  if ((LUCKY_STAR_IDS as readonly string[]).includes(star.id))
    return `六吉星｜${star.epithet}`;
  if ((SHA_STAR_IDS as readonly string[]).includes(star.id))
    return `六煞星｜${star.epithet}`;
  return `辅曜｜${star.epithet}`;
}
