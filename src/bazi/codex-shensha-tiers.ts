/**
 * 神煞分档：精品（小徽章）/ 影响因子（文字）/ 更多（折叠名录）
 * 精品挑「常好奇」或「字面看不懂」的。
 */

export type ShenShaTier = 'featured' | 'tag' | 'more';

export type ShenShaMoreEntry = {
  name: string;
  /** 一句白话，降低打开门槛 */
  gloss: string;
};

/** 精品 · 小徽章卡（有百科 / 可点亮） */
export const SHENSHA_FEATURED: readonly string[] = [
  '天乙贵人', // 最常被问：到底贵人是谁
  '文昌', // 字面不像「学业才华」
  '华盖', // 「盖」字面难懂
  '驿马', // 奔波之星，好奇度高
  '羊刃', // 名字吓人，人人想点开
  '将星', // 不像「主心骨」
  '红鸾', // 喜庆缘，常与桃花搞混
  '天喜', // 同上
  '禄神', // 「禄」对新手不直观
  '孤辰寡宿', // 复合名，想知道是什么孤独
  '桃花', // 人人会点，但做成精品小徽章
] as const;

/** 影响因子 · 文字 + 小图标（像标签，不做史诗图） */
export const SHENSHA_TAG: readonly string[] = [
  '劫煞', // 突发变化提醒，因子感强
] as const;

/**
 * 更多神煞 · 名录（现阶段多数尚未排盘计算 / 无独立百科）
 * 只展示名 + 一句释义入口文案
 */
export const SHENSHA_MORE: readonly ShenShaMoreEntry[] = [
  { name: '天德', gloss: '天德贵人 · 逢事多得化解与庇佑的感觉。' },
  { name: '月德', gloss: '月德贵人 · 柔和的贵人气，偏人际与情绪托住。' },
  { name: '福星', gloss: '福星贵人 · 偏「有福气托底」的稳定感。' },
  { name: '咸池', gloss: '与桃花同族 · 人缘与情感磁场的另一说法。' },
  { name: '金舆', gloss: '车马仪仗之象 · 常联想到体面出行与被抬举。' },
  { name: '天厨', gloss: '食禄之星 · 与口福、供养、被养有关。' },
  { name: '灾煞', gloss: '警示因子 · 提醒关键节点别硬冲。' },
  { name: '亡神', gloss: '耗散因子 · 计划易散、力气被抽走的感觉。' },
  { name: '白虎', gloss: '刚猛因子 · 冲突、手术、硬碰的意象提醒。' },
  { name: '吊客', gloss: '哀感因子 · 告别、送别、情绪低潮的注脚。' },
  { name: '天哭', gloss: '愁绪因子 · 易感伤、想诉说的情绪底色。' },
  { name: '天虚', gloss: '空虚因子 · 心里发空、抓不住实感。' },
  { name: '破碎', gloss: '破损因子 · 器物/计划易碎，宜留备份。' },
] as const;

export function shenshaTierOf(name: string): ShenShaTier | null {
  if ((SHENSHA_FEATURED as readonly string[]).includes(name)) return 'featured';
  if ((SHENSHA_TAG as readonly string[]).includes(name)) return 'tag';
  if (SHENSHA_MORE.some((e) => e.name === name)) return 'more';
  return null;
}

export function isFeaturedShensha(name: string): boolean {
  return shenshaTierOf(name) === 'featured';
}

export function isTagShensha(name: string): boolean {
  return shenshaTierOf(name) === 'tag';
}
