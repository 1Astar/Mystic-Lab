/** 神煞独立插画元数据（图源统一走 covers webp） */

export type ShenshaVisual = {
  /** 传统名，对应 ss:name */
  name: string;
  /** /bazi/covers/*.webp */
  src: string;
  /** warm | cold — 吉星暖光 / 凶中性冷光 */
  light: 'warm' | 'cold';
  /** 文物标签 · 意象提取 */
  motif: string;
  /** 文物标签 · 字面意 */
  literal: string;
};

export const SHENSHA_VISUALS: Record<string, ShenshaVisual> = {
  天乙贵人: {
    name: '天乙贵人',
    src: '/bazi/covers/tianyi.webp',
    light: 'warm',
    motif: '古铜提灯 × 护盾光晕',
    literal: '暗夜遇明灯',
  },
  桃花: {
    name: '桃花',
    src: '/bazi/covers/taohua.webp',
    light: 'warm',
    motif: '菱形古铜镜 × 红线',
    literal: '镜中花 · 易逝缘',
  },
  文昌: {
    name: '文昌',
    src: '/bazi/covers/wenchang.webp',
    light: 'warm',
    motif: '暗金书卷 × 青铜箭矢',
    literal: '灵感如箭 · 命中题眼',
  },
  驿马: {
    name: '驿马',
    src: '/bazi/covers/yima.webp',
    light: 'cold',
    motif: '银白风痕 × 马蹄印',
    literal: '此地留不住 · 必须走出去',
  },
  羊刃: {
    name: '羊刃',
    src: '/bazi/covers/yangren.webp',
    light: 'cold',
    motif: '鞘中出鞘之刀 × 石台',
    literal: '锋利在握 · 下一秒可能伤人',
  },
  孤辰寡宿: {
    name: '孤辰寡宿',
    src: '/bazi/covers/guchen.webp',
    light: 'cold',
    motif: '残棋 × 落单黑子 × 冷雾',
    literal: '一人与生活对弈',
  },
  劫煞: {
    name: '劫煞',
    src: '/bazi/covers/jiesha.webp',
    light: 'cold',
    motif: '断衡 × 骤雨',
    literal: '势在必得时突然崩塌',
  },
};

export function getShenshaVisual(name: string): ShenshaVisual | undefined {
  return SHENSHA_VISUALS[name];
}
