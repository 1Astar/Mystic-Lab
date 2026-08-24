/**
 * 古典格局传统门类（图鉴分类，不是成格算法）。
 * 对照常见名录：帝府将相 / 日月明堂 / 文贵 / 禄马 / 火铃贪 / 凶格。
 */
import type { ComboLore } from './combo-lore.ts';

export type GeCategory =
  | 'di-fu'
  | 'ji-sha'
  | 'ri-yue'
  | 'wen-gui'
  | 'lu-ma'
  | 'huo-tan'
  | 'xiong'
  | 'star-combo';

export const GE_CATEGORY_ORDER: GeCategory[] = [
  'di-fu',
  'ji-sha',
  'ri-yue',
  'wen-gui',
  'lu-ma',
  'huo-tan',
  'xiong',
  'star-combo',
];

export const GE_CATEGORY_META: Record<
  GeCategory,
  { id: GeCategory; label: string; blurb: string }
> = {
  'di-fu': { id: 'di-fu', label: '帝府将相', blurb: '紫府君臣、将星朝斗' },
  'ji-sha': { id: 'ji-sha', label: '机月杀破', blurb: '机月同梁、杀破狼、贪武' },
  'ri-yue': { id: 'ri-yue', label: '日月明堂', blurb: '日月并明、明珠出海、极向离明' },
  'wen-gui': { id: 'wen-gui', label: '文贵辅佐', blurb: '昌曲魁钺、辅弼夹拱' },
  'lu-ma': { id: 'lu-ma', label: '禄马财权', blurb: '三奇禄马、财荫将星' },
  'huo-tan': { id: 'huo-tan', label: '火铃贪', blurb: '火贪、铃贪、火铃贪' },
  xiong: { id: 'xiong', label: '凶格警示', blurb: '夹忌空劫、桃花飘荡、命无正曜' },
  'star-combo': { id: 'star-combo', label: '星曜组合', blurb: '盘上会照的软成格，条件比古典格宽' },
};

/** 名录 id → 门类；未列出则按 family/tone 推断 */
const GE_ID_CATEGORY: Record<string, GeCategory> = {
  紫府同宫: 'di-fu',
  紫府朝垣: 'di-fu',
  紫府夹命: 'di-fu',
  紫贪同宫: 'di-fu',
  君臣庆会: 'di-fu',
  府相朝垣: 'di-fu',
  紫相朝垣: 'di-fu',
  七杀朝斗: 'di-fu',
  雄宿朝垣: 'di-fu',
  英星入庙: 'di-fu',
  将星得地: 'di-fu',
  武曲守垣: 'di-fu',
  寿星入庙: 'di-fu',
  擎羊入庙: 'di-fu',
  机月同梁格: 'ji-sha',
  机月同梁: 'ji-sha',
  杀破狼格: 'ji-sha',
  杀破狼: 'ji-sha',
  贪武同行: 'ji-sha',
  巨机同宫: 'ji-sha',
  善荫朝纲: 'ji-sha',
  日月并明: 'ri-yue',
  丹墀桂墀: 'ri-yue',
  日月夹命: 'ri-yue',
  日月同宫: 'ri-yue',
  明珠出海: 'ri-yue',
  巨日同宫: 'ri-yue',
  极向离明: 'ri-yue',
  金灿光辉: 'ri-yue',
  日出扶桑: 'ri-yue',
  月朗天门: 'ri-yue',
  月生沧海: 'ri-yue',
  太阴得水: 'ri-yue',
  文星拱命: 'wen-gui',
  文星暗拱: 'wen-gui',
  昌曲夹命: 'wen-gui',
  昌曲同宫: 'wen-gui',
  文桂文华: 'wen-gui',
  辅拱文星: 'wen-gui',
  左右夹命: 'wen-gui',
  左右同宫: 'wen-gui',
  魁钺拱命: 'wen-gui',
  魁钺夹命: 'wen-gui',
  天乙拱命: 'wen-gui',
  坐贵向贵: 'wen-gui',
  廉贞文星: 'wen-gui',
  廉贞文武: 'wen-gui',
  天同逢贵: 'wen-gui',
  甲第登科: 'wen-gui',
  科名会禄: 'wen-gui',
  阳梁昌禄: 'wen-gui',
  财禄夹马: 'lu-ma',
  三奇嘉会: 'lu-ma',
  权禄巡逢: 'lu-ma',
  科权禄夹: 'lu-ma',
  双禄交流: 'lu-ma',
  禄马交驰: 'lu-ma',
  禄马配印: 'lu-ma',
  禄合鸳鸯: 'lu-ma',
  武曲守财: 'lu-ma',
  财荫夹印: 'lu-ma',
  石中隐玉: 'lu-ma',
  火贪: 'huo-tan',
  铃贪: 'huo-tan',
  火铃贪: 'huo-tan',
  火羊: 'huo-tan',
  铃陀: 'huo-tan',
  日月反背: 'xiong',
  马头带箭: 'xiong',
  马头带剑: 'xiong',
  梁马飘荡: 'xiong',
  泛水桃花: 'xiong',
  风流彩杖: 'xiong',
  命无正曜: 'xiong',
  刑囚夹印: 'xiong',
  刑忌夹印: 'xiong',
  空劫守命: 'xiong',
  命里逢空: 'xiong',
  空劫夹命: 'xiong',
  巨逢空劫: 'xiong',
  巨逢四煞: 'xiong',
  羊陀夹忌: 'xiong',
  羊陀夹命: 'xiong',
  火铃夹命: 'xiong',
  天罗地网: 'xiong',
  马落空亡: 'xiong',
  文星遇煞: 'xiong',
  极居卯酉: 'xiong',
  巨机化酉: 'xiong',
  贞杀同宫: 'xiong',
  两重华盖: 'xiong',
  禄逢冲破: 'xiong',
};

export function resolveGeCategory(
  c: Pick<ComboLore, 'id' | 'family' | 'tone' | 'category'>,
): GeCategory {
  if (c.category) return c.category;
  const mapped = GE_ID_CATEGORY[c.id];
  if (mapped) return mapped;
  if (c.family === 'star-combo') return 'star-combo';
  if (c.tone === 'xiong') return 'xiong';
  return 'di-fu';
}

export function stampGeCategory<T extends ComboLore>(c: T): T {
  return { ...c, category: resolveGeCategory(c) };
}

export function parseGeCategory(raw: string | null | undefined): GeCategory | 'all' {
  if (!raw || raw === 'all') return 'all';
  return (GE_CATEGORY_ORDER as string[]).includes(raw) ? (raw as GeCategory) : 'all';
}

export function geCategoryLabel(id: GeCategory | 'all'): string {
  if (id === 'all') return '全部';
  return GE_CATEGORY_META[id].label;
}
