/** 已有人格海报的星名（仅 webp）：十四主星 + 六吉 */
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
]);

/** 紫微人格海报路径（仅 webp；主星 + 六吉） */
export function majorStarArtUrl(starName: string): string | null {
  const name = starName.trim().replace(/星$/, '');
  if (!name) return null;
  if (!STARS_WITH_ART.has(name)) return null;
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
