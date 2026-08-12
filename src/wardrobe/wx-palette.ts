/**
 * 五行 → 可穿色名 / 材质 / 剪裁 / 配饰（软建议，非吉凶）
 */
import type { WuXing } from '../bazi/elements.ts';

export type WxWearLexicon = {
  colorNames: string[];
  materials: string[];
  cuts: string[];
  accessories: string[];
  occasion: string;
};

export const WX_WEAR: Record<WuXing, WxWearLexicon> = {
  木: {
    colorNames: ['青绿', '松绿', '茶青'],
    materials: ['棉麻', '针织'],
    cuts: ['有呼吸感的自然线', '略宽松不垮'],
    accessories: ['木质/绿石小点缀', '帆布或编织袋'],
    occasion: '适合需要伸展、开会走动的日子',
  },
  火: {
    colorNames: ['暖玫', '朱红点缀', '低饱和橘'],
    materials: ['丝光混纺', '轻薄层叠'],
    cuts: ['有焦点的一层外套', '利落短外搭'],
    accessories: ['暖色小包或细金属点', '一枚提气色饰'],
    occasion: '适合要被看见、表达或开场的场合',
  },
  土: {
    colorNames: ['暖米', '驼', '赭'],
    materials: ['羊毛', '帆布', '麂皮触感'],
    cuts: ['稳定直筒', '有结构的肩线'],
    accessories: ['皮质/编织袋', '哑光扣饰'],
    occasion: '适合要托底、沟通与落地推进的日子',
  },
  金: {
    colorNames: ['米白', '浅灰', '银白'],
    materials: ['精纺', '挺括衬衫料'],
    cuts: ['干净剪裁', '利落直线'],
    accessories: ['简约银饰', '结构感小包'],
    occasion: '适合要决断、面试或把标准说清的场合',
  },
  水: {
    colorNames: ['靛蓝', '墨蓝', '雾灰蓝'],
    materials: ['垂坠混纺', '牛仔', '薄羊毛'],
    cuts: ['可叠穿的垂坠线', '柔和层次'],
    accessories: ['深色包袋', '冷光小饰'],
    occasion: '适合要独处充电、深谈或顺流推进的日子',
  },
};

/** 克我者：用于「可以少一点」的软对冲（非忌） */
export const KE_ME: Record<WuXing, WuXing> = {
  木: '金',
  火: '水',
  土: '木',
  金: '火',
  水: '土',
};

/** 我克者 */
export const WO_KE: Record<WuXing, WuXing> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};
