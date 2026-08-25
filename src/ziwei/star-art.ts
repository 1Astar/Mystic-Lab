import { artSizeForClass, ziweiArtDisplayUrl, type ZiweiArtSize } from './cf-image-resize.ts';

/** 已有人格海报的星名（仅 webp）：十四主星 + 六吉六煞 + 辅曜/杂曜 + 四化 */
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
  '文卷',
  '长生',
  '沐浴',
  '冠带',
  '临官',
  '帝旺',
  '衰',
  '病',
  '死',
  '墓',
  '绝',
  '胎',
  '养',
  '博士',
  '力士',
  '青龙',
  '将军',
  '奏书',
  '喜神',
  '病符',
  '伏兵',
  '官府',
  '岁驿',
  '息神',
  '劫煞',
  '灾煞',
  '天煞',
  '指背',
  '月煞',
  '亡神',
  '晦气',
  '丧门',
  '贯索',
  '官符',
  '白虎',
  '吊客',
  // 四化
  '化禄',
  '化权',
  '化科',
  '化忌',
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

function artImgTag(
  url: string,
  opts?: { className?: string; alt?: string; size?: ZiweiArtSize },
): string {
  const size = opts?.size ?? artSizeForClass(opts?.className);
  const src = ziweiArtDisplayUrl(url, size);
  const cls = opts?.className ? ` class="${opts.className}"` : '';
  const alt = opts?.alt ?? '';
  const fallback =
    src !== url
      ? ` onerror="this.onerror=null;this.src='${url.replace(/'/g, '%27')}'"`
      : '';
  return `<img${cls} src="${src}" alt="${alt}" loading="lazy" decoding="async"${fallback} />`;
}

export function majorStarArtImgHtml(
  starName: string,
  opts?: { className?: string; alt?: string; size?: ZiweiArtSize },
): string {
  const url = majorStarArtUrl(starName);
  if (!url) return '';
  return artImgTag(url, { ...opts, alt: opts?.alt ?? starName });
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

/** 已有封面的十二宫（文件名=图鉴 id） */
const PALACES_WITH_ART = new Set([
  '命宫',
  '兄弟',
  '夫妻',
  '子女',
  '财帛',
  '疾厄',
  '迁移',
  '仆役',
  '官禄',
  '田宅',
  '福德',
  '父母',
]);

const PALACE_ART_ALIASES: Record<string, string> = {
  奴仆: '仆役',
  奴仆宫: '仆役',
};

function resolvePalaceArtKey(palaceId: string): string | null {
  const raw = palaceId.trim();
  if (!raw) return null;
  const stripped = raw.replace(/宫$/, '');
  for (const c of [raw, stripped]) {
    const mapped = PALACE_ART_ALIASES[c] ?? c;
    if (PALACES_WITH_ART.has(mapped)) return mapped;
  }
  return null;
}

export function palaceArtUrl(palaceId: string): string | null {
  const name = resolvePalaceArtKey(palaceId);
  if (!name) return null;
  return `/ziwei/palaces/${encodeURIComponent(name)}.webp`;
}

export function palaceArtImgHtml(
  palaceId: string,
  opts?: { className?: string; alt?: string; size?: ZiweiArtSize },
): string {
  const url = palaceArtUrl(palaceId);
  if (!url) return '';
  return artImgTag(url, { ...opts, alt: opts?.alt ?? palaceId });
}

export function palaceListThumbInnerHtml(
  palaceId: string,
  opts?: { glyph?: string; alt?: string },
): string {
  const img = palaceArtImgHtml(palaceId, {
    className: 'ziwei-codex-short-thumb-img',
    alt: opts?.alt ?? palaceId,
  });
  if (img) return img;
  const glyph = (opts?.glyph ?? palaceId).trim() || '?';
  return `<span class="ziwei-palace-glyph" aria-hidden="true">${escapeAttr(glyph)}</span>`;
}

/** 已有独立海报的格局（文件名=名录 id；其余用成员星图叠放） */
const COMBOS_WITH_ART = new Set([
  '财禄夹马',
  '财荫夹印',
  '昌曲夹命',
  '昌曲同宫',
  '昌曲',
  '丹墀桂墀',
  '泛水桃花',
  '风流彩杖',
  '府相朝垣',
  '府相',
  '辅拱文星',
  '辅弼',
  '火铃夹命',
  '火铃贪',
  '火铃',
  '火贪',
  '火羊',
  '机月同梁格',
  '机梁',
  '极居卯酉',
  '极向离明',
  '甲第登科',
  '将星得地',
  '金灿光辉',
  '巨逢空劫',
  '巨逢四煞',
  '巨机化酉',
  '巨机同宫',
  '巨日同宫',
  '君臣庆会',
  '科名会禄',
  '科权禄夹',
  '空劫守命',
  '魁钺拱命',
  '魁钺夹命',
  '魁钺',
  '廉贞文武',
  '廉贞文星',
  '梁马飘荡',
  '两重华盖',
  '铃贪',
  '铃陀',
  '禄逢冲破',
  '禄权科忌',
  '禄合鸳鸯',
  '禄马交驰',
  '禄马配印',
  '马落空亡',
  '马头带剑',
  '马头带箭',
  '明珠出海',
  '命里逢空',
  '命无正曜',
  '七杀朝斗',
  '擎羊入庙',
  '权禄巡逢',
  '日出扶桑',
  '日月并明',
  '日月反背',
  '日月夹命',
  '日月同宫',
  '三奇嘉会',
  '杀破狼格',
  '杀府',
  '善荫朝纲',
  '石中隐玉',
  '寿星入庙',
  '双禄交流',
  '太阴得水',
  '贪武同行',
  '天罗地网',
  '天同逢贵',
  '天乙拱命',
  '文桂文华',
  '文星暗拱',
  '文星拱命',
  '文星遇煞',
  '武曲守财',
  '武曲守垣',
  '刑忌夹印',
  '刑囚夹印',
  '雄宿朝垣',
  '羊陀夹忌',
  '羊陀夹命',
  '羊陀',
  '阳梁昌禄',
  '英星入庙',
  '月朗天门',
  '月生沧海',
  '贞杀同宫',
  '紫府朝垣',
  '紫府夹命',
  '紫府同宫',
  '紫贪同宫',
  '紫相朝垣',
  '左右夹命',
  '左右同宫',
  '坐贵向贵',
]);

const COMBO_ART_ALIASES: Record<string, string> = {
  杀破狼: '杀破狼格',
  机月同梁: '机月同梁格',
  紫府: '紫府同宫',
  日月: '日月并明',
  空劫: '空劫守命',
  空劫夹命: '空劫守命',
  日照雷门: '日出扶桑',
  日丽中天: '金灿光辉',
  月落亥宫: '月朗天门',
  官封三代: '巨日同宫',
};

function resolveComboArtKey(comboId: string): string | null {
  const raw = comboId.trim();
  if (!raw) return null;
  const mapped = COMBO_ART_ALIASES[raw] ?? raw;
  if (COMBOS_WITH_ART.has(mapped)) return mapped;
  return null;
}

export function comboArtUrl(comboId: string): string | null {
  const name = resolveComboArtKey(comboId);
  if (!name) return null;
  return `/ziwei/combos/${encodeURIComponent(name)}.webp`;
}

export function comboArtImgHtml(
  comboId: string,
  opts?: { className?: string; alt?: string; size?: ZiweiArtSize },
): string {
  const url = comboArtUrl(comboId);
  if (!url) return '';
  return artImgTag(url, { ...opts, alt: opts?.alt ?? comboId });
}

export type ComboArtInput = {
  id: string;
  title: string;
  members: string[];
  tone?: 'ji' | 'xiong' | 'neutral';
};

function comboMemberStackHtml(members: string[], className: string): string {
  const urls = members
    .map((m) => ({ name: m, url: majorStarArtUrl(m) }))
    .filter((x): x is { name: string; url: string } => Boolean(x.url))
    .slice(0, 3);
  if (!urls.length) return '';
  return `<span class="${className}" aria-hidden="true">${urls
    .map((x) => artImgTag(x.url, { className: 'ziwei-combo-stack-img', alt: '' }))
    .join('')}</span>`;
}

/** 优先独立海报，否则成员星图叠放，再否则字标 */
export function comboListThumbInnerHtml(combo: ComboArtInput): string {
  const dedicated = comboArtImgHtml(combo.id, {
    className: 'ziwei-codex-short-thumb-img',
    alt: combo.title,
  });
  if (dedicated) return dedicated;
  const stack = comboMemberStackHtml(combo.members, 'ziwei-combo-stack');
  if (stack) return stack;
  return starGlyphThumbHtml(combo.title, {
    tone: combo.tone === 'xiong' ? 'sha' : 'lucky',
  });
}

export function comboHeroInnerHtml(combo: ComboArtInput): string {
  const dedicated = comboArtImgHtml(combo.id, {
    className: 'ziwei-detail-hero-img',
    alt: combo.title,
  });
  if (dedicated) return dedicated;
  const stack = comboMemberStackHtml(combo.members, 'ziwei-combo-hero-stack');
  if (stack) return stack;
  return '';
}
