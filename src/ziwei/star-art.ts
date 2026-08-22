/** 已有人格海报的星名（仅 webp）：十四主星 + 六吉六煞 + 辅曜/杂曜精选 */
const STARS_WITH_ART = new Set([
  // 十四主星
  '紫微',
  '天机',
  '太阳',
  '武曲',
  '天同',
  '廉贞',
  '天府',
  '太阴',
  '贪狼',
  '巨门',
  '天相',
  '天梁',
  '七杀',
  '破军',
  // 六吉
  '左辅',
  '右弼',
  '天魁',
  '天钺',
  '文昌',
  '文曲',
  // 六煞
  '擎羊',
  '陀罗',
  '火星',
  '铃星',
  '地空',
  '地劫',
  // 辅曜重点
  '禄存',
  '天马',
  // 杂曜 / 神煞精选
  '红鸾',
  '天喜',
  '华盖',
  '孤辰',
  '寡宿',
  '咸池',
  '天姚',
  '龙池',
  '凤阁',
  '天刑',
  '解神',
  '天哭',
  '天虚',
  '阴煞',
  '三台',
  '八座',
  '恩光',
  '天贵',
  '台辅',
  '封诰',
  '天巫',
  '天月',
  '天使',
  '天伤',
  '天寿',
  '蜚廉',
  '天德',
  '月德',
  '天空',
  '天官',
  '天福',
  '天厨',
  '天才',
  '将星',
  '龙德',
  '大耗',
  '岁破',
  '年解',
  '旬空',
  '截路',
  '截空',
  '空亡',
  '劫杀',
  '小耗',
  '破碎',
  '斗君',
  '攀鞍',
  '岁建',
  '文昌贵人',
]);

/** 别名 → 实际文件名（无独立图时复用） */
const ART_ALIASES: Record<string, string> = {
  飞廉: '蜚廉',
};

function resolveArtKey(starName: string): string | null {
  const raw = starName.trim();
  if (!raw) return null;
  const candidates = [raw];
  if (raw.endsWith('星') && raw.length > 1) candidates.push(raw.slice(0, -1));
  for (const c of candidates) {
    const mapped = ART_ALIASES[c] ?? c;
    if (STARS_WITH_ART.has(mapped)) return mapped;
  }
  return null;
}

/** 紫微人格海报路径（仅 webp） */
export function majorStarArtUrl(starName: string): string | null {
  const name = resolveArtKey(starName);
  if (!name) return null;
  return `/ziwei/stars/${encodeURIComponent(name)}.webp`;
}

export function majorStarArtImgHtml(
  starName: string,
  opts?: { className?: string; alt?: string },
): string {
  const url = majorStarArtUrl(starName);
  if (!url) return '';
  const cls = opts?.className ? ` class="${opts.className}"` : '';
  const alt = opts?.alt ?? starName;
  return `<img${cls} src="${url}" alt="${alt}" loading="lazy" decoding="async" />`;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 无海报时：字标缩略图（神煞/杂曜/辅曜共用） */
export function starGlyphThumbHtml(
  name: string,
  opts?: { tone?: 'major' | 'lucky' | 'sha' | 'aux' | 'minor' | 'shensha' },
): string {
  const label = name.trim().replace(/星$/, '') || '?';
  const glyph = [...label][0] ?? '?';
  const tone = opts?.tone ?? 'aux';
  return `<span class="ziwei-codex-short-glyph is-${tone}" aria-hidden="true">${escapeAttr(glyph)}</span>`;
}

/** 优先海报，否则字标 */
export function starListThumbInnerHtml(
  name: string,
  opts?: { tone?: 'major' | 'lucky' | 'sha' | 'aux' | 'minor' | 'shensha'; alt?: string },
): string {
  const img = majorStarArtImgHtml(name, {
    className: 'ziwei-codex-short-thumb-img',
    alt: opts?.alt ?? name,
  });
  if (img) return img;
  return starGlyphThumbHtml(name, { tone: opts?.tone });
}
