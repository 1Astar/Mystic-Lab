import type { WuXing } from './elements.ts';

export type WuxingLore = {
  id: WuXing;
  title: string;
  epithet: string;
  glyph: string;
  portrait: string;
  meaning: string;
  bodyHint: string;
  remedy: {
    color: string;
    direction: string;
    food: string;
    mood: string;
  };
};

export type StemBranchLore = {
  id: string;
  kind: 'stem' | 'branch';
  wuxing: WuXing;
  title: string;
  epithet: string;
  portrait: string;
};

export const WUXING_ORDER: WuXing[] = ['木', '火', '土', '金', '水'];

export const WUXING_LORE: Record<WuXing, WuxingLore> = {
  木: {
    id: '木',
    title: '木',
    epithet: '生长与伸展',
    glyph: '木',
    portrait: '木代表方向、意义感与向外生长的力气。',
    meaning: '当木能量被点亮时，说明你最近的「想伸展 / 想长出来」这一面正在主导或需要关照。',
    bodyHint: '对应肝胆与筋络的节律感——僵住时，往往也是方向感卡住了。',
    remedy: {
      color: '多接触绿色、青色衣物与植物。',
      direction: '卧室或书桌偏东方，更易感到舒展。',
      food: '多吃绿色蔬果，如菠菜、青菜、芽苗类。',
      mood: '焦虑卡住时，去户外走走或做伸展，给计划留一点生长空间。',
    },
  },
  火: {
    id: '火',
    title: '火',
    epithet: '热度与表达',
    glyph: '火',
    portrait: '火代表可见度、热情与被看见的勇气。',
    meaning: '火被点亮时，说明你的「热度」偏高或偏缺——要么太烫，要么需要一点点火种。',
    bodyHint: '对应心与循环的「通透感」——闷住时，表达欲也会一起堵住。',
    remedy: {
      color: '适度加入红色、橙色点缀（过旺则少穿大红）。',
      direction: '南向采光处更易被「点燃」。',
      food: '红豆、番茄、少量辛香料；过旺则少熬夜硬撑。',
      mood: '完成一次被看见的小输出；或晒一点太阳，把热度落到行动上。',
    },
  },
  土: {
    id: '土',
    title: '土',
    epithet: '承载与根基',
    glyph: '土',
    portrait: '土代表稳定、消化与把事情扛住的能力。',
    meaning: '土被点亮时，说明你的「根基感」正在说话——太厚会钝，太薄会飘。',
    bodyHint: '对应脾胃与消化节奏——吃不定时，人生落地感也会跟着晃。',
    remedy: {
      color: '米白、土黄、咖色带来踏实感。',
      direction: '中央区域保持整洁，少堆杂物。',
      food: '小米、山药、南瓜等温润主食。',
      mood: '把事写成可勾的清单，规律作息，少同时开太多坑。',
    },
  },
  金: {
    id: '金',
    title: '金',
    epithet: '边界与收口',
    glyph: '金',
    portrait: '金代表决断、标准与干净的切割。',
    meaning: '金被点亮时，说明你的「边界」偏利或偏软——需要练收口，或给锋利降温。',
    bodyHint: '对应肺与呼吸的清爽感——边界乱时，呼吸也会变浅。',
    remedy: {
      color: '白、银、浅灰帮助收束。',
      direction: '西向安静角落适合整理与断舍离。',
      food: '白色食物如百合、杏仁、白萝卜。',
      mood: '断舍离一件事，把话说干净；少用「算了」逃避收口。',
    },
  },
  水: {
    id: '水',
    title: '水',
    epithet: '流动与智慧',
    glyph: '水',
    portrait: '水代表冷静、智慧、流动与情绪的润泽。',
    meaning: '水被点亮时，说明你的「流动感」偏多或偏枯——要么散，要么旱。',
    bodyHint: '对应肾与深层储备——焦虑久了，往往是水能量在喊渴。',
    remedy: {
      color: '黑、深蓝系衣物与环境。',
      direction: '北方或靠水的位置更易安静下来。',
      food: '黑豆、海带、黑芝麻等黑色食物。',
      mood: '游泳，或去江河湖边发呆；把过热的情绪降下来。',
    },
  },
};

export const STEM_LORE: StemBranchLore[] = [
  { id: '甲', kind: 'stem', wuxing: '木', title: '甲木', epithet: '参天大树', portrait: '天干第一位，属阳木。性格刚直有骨气，也容易固执倔强。' },
  { id: '乙', kind: 'stem', wuxing: '木', title: '乙木', epithet: '藤萝花草', portrait: '天干第二位，属阴木。柔韧善绕，适应力强，也易优柔。' },
  { id: '丙', kind: 'stem', wuxing: '火', title: '丙火', epithet: '太阳大火', portrait: '天干第三位，属阳火。光明外放，热情可见，也易急躁灼人。' },
  { id: '丁', kind: 'stem', wuxing: '火', title: '丁火', epithet: '烛光灯火', portrait: '天干第四位，属阴火。细腻照明，重感受，也易内耗。' },
  { id: '戊', kind: 'stem', wuxing: '土', title: '戊土', epithet: '高山厚土', portrait: '天干第五位，属阳土。承载稳重，可靠，也易固执沉重。' },
  { id: '己', kind: 'stem', wuxing: '土', title: '己土', epithet: '田园湿土', portrait: '天干第六位，属阴土。滋养细作，能藏能容，也易黏滞。' },
  { id: '庚', kind: 'stem', wuxing: '金', title: '庚金', epithet: '刀剑矿石', portrait: '天干第七位，属阳金。锋利果断，重原则，也易伤人伤己。' },
  { id: '辛', kind: 'stem', wuxing: '金', title: '辛金', epithet: '珠玉精金', portrait: '天干第八位，属阴金。精致敏锐，重品质，也易挑剔敏感。' },
  { id: '壬', kind: 'stem', wuxing: '水', title: '壬水', epithet: '江河大海', portrait: '天干第九位，属阳水。气魄流动，智谋开阔，也易散漫。' },
  { id: '癸', kind: 'stem', wuxing: '水', title: '癸水', epithet: '雨露甘泉', portrait: '天干第十位，属阴水。润物无声，直觉细，也易忧思。' },
];

export const BRANCH_LORE: StemBranchLore[] = [
  { id: '子', kind: 'branch', wuxing: '水', title: '子水', epithet: '小溪潜流', portrait: '地支第一位，属阳水。潜能、内在智慧与隐秘储备。' },
  { id: '丑', kind: 'branch', wuxing: '土', title: '丑土', epithet: '冻土仓库', portrait: '地支第二位，属阴土。忍耐、收藏与固定资产感。' },
  { id: '寅', kind: 'branch', wuxing: '木', title: '寅木', epithet: '山林起步', portrait: '地支第三位，属阳木。冲动生长、开创与行动欲。' },
  { id: '卯', kind: 'branch', wuxing: '木', title: '卯木', epithet: '花木满园', portrait: '地支第四位，属阴木。细腻审美、关系感与柔韧伸展。' },
  { id: '辰', kind: 'branch', wuxing: '土', title: '辰土', epithet: '水库湿泥', portrait: '地支第五位，属阳土。吞吐变化、资源整合与过渡力。' },
  { id: '巳', kind: 'branch', wuxing: '火', title: '巳火', epithet: '文明之火', portrait: '地支第六位，属阴火。谋略、文书与内热的聪明。' },
  { id: '午', kind: 'branch', wuxing: '火', title: '午火', epithet: '烈日当空', portrait: '地支第七位，属阳火。外放表达、声誉与高热能量。' },
  { id: '未', kind: 'branch', wuxing: '土', title: '未土', epithet: '田园燥土', portrait: '地支第八位，属阴土。滋养、照顾与情感沉淀。' },
  { id: '申', kind: 'branch', wuxing: '金', title: '申金', epithet: '驿路刀兵', portrait: '地支第九位，属阳金。变动、技能与果断推进。' },
  { id: '酉', kind: 'branch', wuxing: '金', title: '酉金', epithet: '精金华贵', portrait: '地支第十位，属阴金。审美、标准与精细收口。' },
  { id: '戌', kind: 'branch', wuxing: '土', title: '戌土', epithet: '火库堡垒', portrait: '地支第十一位，属阳土。忠诚、防卫与沉淀成果。' },
  { id: '亥', kind: 'branch', wuxing: '水', title: '亥水', epithet: '深海夜雨', portrait: '地支第十二位，属阴水。想象、慈悲与深层流动。' },
];

export const ALL_STEM_BRANCH = [...STEM_LORE, ...BRANCH_LORE];

export function stemBranchById(id: string): StemBranchLore | undefined {
  return ALL_STEM_BRANCH.find((x) => x.id === id);
}

export function stemsOfWuxing(wx: WuXing): StemBranchLore[] {
  return STEM_LORE.filter((s) => s.wuxing === wx);
}

export function branchesOfWuxing(wx: WuXing): StemBranchLore[] {
  return BRANCH_LORE.filter((b) => b.wuxing === wx);
}
