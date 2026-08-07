/**
 * 图鉴知识库骨架目录：纳音 / 六十甲子 / 神煞分类 / 组合关系 / 大运流年概念。
 * 正文可短；排盘可点对象应引用同一实体 ID。
 */
import { LunarUtil } from 'lunar-javascript';
import type { BaziEncyclopediaEntry } from './codex-encyclopedia-types.ts';
import type { BaziCodexKind } from './codex.ts';
import { nayinOf } from './pillar-meta.ts';
import { shenshaCardId } from './codex-tags.ts';

export type ShenshaCategory =
  | '贵人类'
  | '桃花感情类'
  | '文学才华类'
  | '权力事业类'
  | '财富资源类'
  | '移动变化类'
  | '孤独精神类'
  | '灾厄风险类'
  | '婚恋家庭类'
  | '子女晚年类';

export const SHENSHA_CATEGORIES: readonly ShenshaCategory[] = [
  '贵人类',
  '桃花感情类',
  '文学才华类',
  '权力事业类',
  '财富资源类',
  '移动变化类',
  '孤独精神类',
  '灾厄风险类',
  '婚恋家庭类',
  '子女晚年类',
] as const;

/** 神煞名录（骨架 ≥80；查法/排盘规则后续补） */
export const SHENSHA_ATLAS: ReadonlyArray<{
  name: string;
  category: ShenshaCategory;
  gloss: string;
  tone: '吉' | '凶' | '中性';
}> = [
  // 贵人类
  { name: '天乙贵人', category: '贵人类', gloss: '传统贵人星 · 逢凶化吉、提携与化解。', tone: '吉' },
  { name: '天德', category: '贵人类', gloss: '天德贵人 · 逢事多得化解与庇佑。', tone: '吉' },
  { name: '月德', category: '贵人类', gloss: '月德贵人 · 柔和贵人气，偏人际托住。', tone: '吉' },
  { name: '天德合', category: '贵人类', gloss: '天德之合 · 贵人气以合象显。', tone: '吉' },
  { name: '月德合', category: '贵人类', gloss: '月德之合 · 贵人气以合象显。', tone: '吉' },
  { name: '福星', category: '贵人类', gloss: '福星贵人 · 有福气托底的稳定感。', tone: '吉' },
  { name: '天赦', category: '贵人类', gloss: '天赦日贵人 · 宽恕与解厄象。', tone: '吉' },
  { name: '三奇贵人', category: '贵人类', gloss: '天上/地下/人中三奇 · 异禀与机遇象。', tone: '吉' },
  { name: '天医', category: '贵人类', gloss: '天医星 · 医药、调理、救治象。', tone: '吉' },
  { name: '解神', category: '贵人类', gloss: '解神 · 解开纠结、化解阻滞。', tone: '吉' },
  // 桃花感情类
  { name: '桃花', category: '桃花感情类', gloss: '咸池桃花 · 人缘、吸引、情感磁场。', tone: '中性' },
  { name: '咸池', category: '桃花感情类', gloss: '与桃花同族 · 情感与欲望磁场。', tone: '中性' },
  { name: '红鸾', category: '婚恋家庭类', gloss: '红鸾星 · 喜庆、婚恋缘动。', tone: '吉' },
  { name: '天喜', category: '婚恋家庭类', gloss: '天喜星 · 喜事、庆典、开怀。', tone: '吉' },
  { name: '沐浴', category: '桃花感情类', gloss: '十二长生沐浴位 · 情欲、曝光与敏感。', tone: '中性' },
  { name: '风流', category: '桃花感情类', gloss: '风流煞 · 情感多线、魅力与是非。', tone: '中性' },
  { name: '流霞', category: '桃花感情类', gloss: '流霞煞 · 感情波折、妒合之象。', tone: '中性' },
  { name: '血刃', category: '灾厄风险类', gloss: '血刃 · 血光、手术、尖锐冲突提醒。', tone: '凶' },
  // 文学才华类
  { name: '文昌', category: '文学才华类', gloss: '文昌星 · 学业、考试、文书才华。', tone: '吉' },
  { name: '学堂', category: '文学才华类', gloss: '学堂 · 学习场、开智之象。', tone: '吉' },
  { name: '词馆', category: '文学才华类', gloss: '词馆 · 文章、表达、馆阁气。', tone: '吉' },
  { name: '文曲', category: '文学才华类', gloss: '文曲 · 文采、艺能、巧思。', tone: '吉' },
  { name: '华盖', category: '孤独精神类', gloss: '华盖星 · 宗教艺术、孤独高格。', tone: '中性' },
  { name: '正印', category: '文学才华类', gloss: '（十神对照）印星气场的神煞化说法入口。', tone: '中性' },
  { name: '魁罡', category: '权力事业类', gloss: '魁罡 · 刚果、权威、决断气。', tone: '中性' },
  { name: '金舆', category: '财富资源类', gloss: '金舆 · 车马仪仗、体面与抬举。', tone: '吉' },
  // 权力事业类
  { name: '将星', category: '权力事业类', gloss: '将星 · 主心骨、统领与担当。', tone: '吉' },
  { name: '国印', category: '权力事业类', gloss: '国印贵人 · 印信、职权、名位。', tone: '吉' },
  { name: '台阁', category: '权力事业类', gloss: '台阁 · 仕途、机构平台象。', tone: '吉' },
  { name: '权星', category: '权力事业类', gloss: '权星 · 掌控与决策场。', tone: '中性' },
  { name: '飞刃', category: '灾厄风险类', gloss: '飞刃 · 刚锐冲突、刀剑之象。', tone: '凶' },
  { name: '羊刃', category: '权力事业类', gloss: '羊刃 · 锋芒、魄力与过刚风险。', tone: '中性' },
  { name: '紫微', category: '权力事业类', gloss: '紫微（命理神煞口径）· 尊贵、中枢感。', tone: '吉' },
  { name: '天官', category: '权力事业类', gloss: '天官贵人 · 官贵、名望提携。', tone: '吉' },
  // 财富资源类
  { name: '禄神', category: '财富资源类', gloss: '禄神 · 食禄、俸给、稳定收入象。', tone: '吉' },
  { name: '天厨', category: '财富资源类', gloss: '天厨 · 口福、供养、被养。', tone: '吉' },
  { name: '仓廪', category: '财富资源类', gloss: '仓廪 · 库藏、积蓄、物资。', tone: '吉' },
  { name: '飞财', category: '财富资源类', gloss: '飞财 · 横财或财来财去之象。', tone: '中性' },
  { name: '进神', category: '财富资源类', gloss: '进神 · 进取、推进、财气前行。', tone: '吉' },
  { name: '退神', category: '移动变化类', gloss: '退神 · 收缩、退后、宜守。', tone: '中性' },
  { name: '富星', category: '财富资源类', gloss: '富星 · 富裕、资源丰厚象。', tone: '吉' },
  { name: '马头带剑', category: '移动变化类', gloss: '马头带剑 · 奔波中带锋芒与风险。', tone: '中性' },
  // 移动变化类
  { name: '驿马', category: '移动变化类', gloss: '驿马 · 奔波、出行、变动。', tone: '中性' },
  { name: '华盖（驿）', category: '移动变化类', gloss: '与驿马同见时的漂泊艺文象（壳）。', tone: '中性' },
  { name: '劫煞', category: '灾厄风险类', gloss: '劫煞 · 突发变化、截夺提醒。', tone: '凶' },
  { name: '亡神', category: '灾厄风险类', gloss: '亡神 · 耗散、计划易散。', tone: '凶' },
  { name: '灾煞', category: '灾厄风险类', gloss: '灾煞 · 关口警示，宜谨慎。', tone: '凶' },
  { name: '天马', category: '移动变化类', gloss: '天马 · 远行、调动、升迁动象。', tone: '中性' },
  { name: '动态', category: '移动变化类', gloss: '动象总入口 · 见驿马/冲合则动。', tone: '中性' },
  { name: '空亡', category: '孤独精神类', gloss: '旬空 · 落空、虚位、需实证。', tone: '中性' },
  // 孤独精神类
  { name: '孤辰', category: '孤独精神类', gloss: '孤辰 · 早年孤独、自立感。', tone: '中性' },
  { name: '寡宿', category: '孤独精神类', gloss: '寡宿 · 晚年清寂、独处。', tone: '中性' },
  { name: '孤辰寡宿', category: '孤独精神类', gloss: '孤辰寡宿 · 复合孤独象。', tone: '中性' },
  { name: '隔角', category: '孤独精神类', gloss: '隔角 · 隔阂、难贴合。', tone: '中性' },
  { name: '阴差阳错', category: '婚恋家庭类', gloss: '阴差阳错 · 婚恋错位、时机拧巴。', tone: '中性' },
  { name: '童子', category: '子女晚年类', gloss: '童子煞 · 幼年缘、宗教缘说法（慎断）。', tone: '中性' },
  { name: '元辰', category: '孤独精神类', gloss: '元辰 · 内耗、别扭、不得劲。', tone: '凶' },
  { name: '大耗', category: '灾厄风险类', gloss: '大耗 · 破耗、流失提醒。', tone: '凶' },
  // 灾厄风险类
  { name: '白虎', category: '灾厄风险类', gloss: '白虎 · 刚猛、冲突、手术意象。', tone: '凶' },
  { name: '挂剑', category: '灾厄风险类', gloss: '挂剑 · 刀剑、意外锋芒。', tone: '凶' },
  { name: '病符', category: '灾厄风险类', gloss: '病符 · 身体小恙、需养护。', tone: '凶' },
  { name: '死符', category: '灾厄风险类', gloss: '死符 · 停滞、沉重（非字面生死）。', tone: '凶' },
  { name: '天哭', category: '灾厄风险类', gloss: '天哭 · 愁绪、感伤。', tone: '凶' },
  { name: '天虚', category: '灾厄风险类', gloss: '天虚 · 空虚、抓不住实感。', tone: '凶' },
  { name: '吊客', category: '灾厄风险类', gloss: '吊客 · 告别、送别、低潮。', tone: '凶' },
  { name: '丧门', category: '灾厄风险类', gloss: '丧门 · 哀感、丧事场（慎断）。', tone: '凶' },
  { name: '破碎', category: '灾厄风险类', gloss: '破碎 · 易碎、宜留备份。', tone: '凶' },
  { name: '绞煞', category: '灾厄风险类', gloss: '绞煞 · 纠缠、缠绕难解。', tone: '凶' },
  { name: '天罗', category: '灾厄风险类', gloss: '天罗 · 困局、难脱身。', tone: '凶' },
  { name: '地网', category: '灾厄风险类', gloss: '地网 · 困局、纠缠落地。', tone: '凶' },
  { name: '五鬼', category: '灾厄风险类', gloss: '五鬼 · 扰心、小人与怪异变动。', tone: '凶' },
  { name: '羊刃（凶读）', category: '灾厄风险类', gloss: '羊刃过刚时的风险读法入口。', tone: '凶' },
  // 婚恋家庭类（补）
  { name: '天喜红鸾', category: '婚恋家庭类', gloss: '喜鸾并见 · 婚喜气场加强。', tone: '吉' },
  { name: '勾绞', category: '婚恋家庭类', gloss: '勾绞煞 · 感情纠缠。', tone: '中性' },
  { name: '咸池桃花', category: '桃花感情类', gloss: '咸池/桃花并称入口。', tone: '中性' },
  { name: '妻妾', category: '婚恋家庭类', gloss: '妻星相关神煞说法入口（壳）。', tone: '中性' },
  { name: '夫星', category: '婚恋家庭类', gloss: '夫星相关说法入口（壳）。', tone: '中性' },
  { name: '披麻', category: '灾厄风险类', gloss: '披麻 · 孝服、告别场（慎断）。', tone: '凶' },
  { name: '六厄', category: '灾厄风险类', gloss: '六厄 · 关卡、阻滞。', tone: '凶' },
  // 子女晚年类
  { name: '词馆学堂', category: '子女晚年类', gloss: '子女学业场的神煞对照入口。', tone: '吉' },
  { name: '子孙星', category: '子女晚年类', gloss: '食伤/子孙议题入口（壳）。', tone: '中性' },
  { name: '胎神', category: '子女晚年类', gloss: '胎神 · 孕育、安胎方位说法。', tone: '中性' },
  { name: '养神', category: '子女晚年类', gloss: '十二长生「养」· 孕育准备。', tone: '中性' },
  { name: '长生', category: '子女晚年类', gloss: '十二长生「长生」· 起势与生机。', tone: '吉' },
  { name: '帝旺', category: '权力事业类', gloss: '十二长生「帝旺」· 巅峰气场。', tone: '中性' },
  { name: '墓库', category: '财富资源类', gloss: '墓库 · 收藏、入库、沉淀。', tone: '中性' },
  { name: '截路空亡', category: '灾厄风险类', gloss: '截路空亡 · 路被截、宜绕行。', tone: '凶' },
  { name: '旬空', category: '孤独精神类', gloss: '旬空别称 · 落空需实证。', tone: '中性' },
  { name: '天罗地网', category: '灾厄风险类', gloss: '天罗地网 · 困局总称。', tone: '凶' },
];

export const NAYIN_ATLAS: ReadonlyArray<{ name: string; wuxing: string; gloss: string }> = [
  { name: '海中金', wuxing: '金', gloss: '藏于深海之金 · 蓄势待发。' },
  { name: '炉中火', wuxing: '火', gloss: '炉冶之火 · 锤炼与热力。' },
  { name: '大林木', wuxing: '木', gloss: '森林成片 · 群体生长。' },
  { name: '路旁土', wuxing: '土', gloss: '路旁之土 · 承载往来。' },
  { name: '剑锋金', wuxing: '金', gloss: '锋刃之金 · 决断锐利。' },
  { name: '山头火', wuxing: '火', gloss: '山巅之火 · 外放可见。' },
  { name: '涧下水', wuxing: '水', gloss: '山涧细流 · 清澈渗透。' },
  { name: '城头土', wuxing: '土', gloss: '城垣之土 · 防卫与边界。' },
  { name: '白蜡金', wuxing: '金', gloss: '白蜡之金 · 精致可塑。' },
  { name: '杨柳木', wuxing: '木', gloss: '杨柳柔枝 · 柔韧善弯。' },
  { name: '泉中水', wuxing: '水', gloss: '泉涌之水 · 源头清润。' },
  { name: '屋上土', wuxing: '土', gloss: '屋上之土 · 覆盖与庇护。' },
  { name: '霹雳火', wuxing: '火', gloss: '雷火骤发 · 爆发力强。' },
  { name: '松柏木', wuxing: '木', gloss: '松柏常青 · 坚韧长久。' },
  { name: '长流水', wuxing: '水', gloss: '长河之水 · 源远流长。' },
  { name: '沙中金', wuxing: '金', gloss: '沙里淘金 · 细筛得精。' },
  { name: '山下火', wuxing: '火', gloss: '山下之火 · 内蕴待扬。' },
  { name: '平地木', wuxing: '木', gloss: '平地之木 · 开阔生长。' },
  { name: '壁上土', wuxing: '土', gloss: '墙壁之土 · 屏障与成形。' },
  { name: '金箔金', wuxing: '金', gloss: '金箔薄金 · 装饰与贴合。' },
  { name: '覆灯火', wuxing: '火', gloss: '灯火覆照 · 照明一方。' },
  { name: '天河水', wuxing: '水', gloss: '天河之水 · 高远清流。' },
  { name: '大驿土', wuxing: '土', gloss: '驿路厚土 · 通行与承载。' },
  { name: '钗钏金', wuxing: '金', gloss: '钗钏饰金 · 精美佩饰。' },
  { name: '桑柘木', wuxing: '木', gloss: '桑柘之木 · 养蚕生业。' },
  { name: '大溪水', wuxing: '水', gloss: '溪涧壮流 · 奔涌有声。' },
  { name: '沙中土', wuxing: '土', gloss: '沙中之土 · 细碎可聚。' },
  { name: '天上火', wuxing: '火', gloss: '天上之火 · 日照普照。' },
  { name: '石榴木', wuxing: '木', gloss: '石榴之木 · 多子与华彩。' },
  { name: '大海水', wuxing: '水', gloss: '大海之水 · 吞吐包容。' },
];

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export function listSixtyJiazi(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 60; i++) {
    out.push(`${GAN[i % 10]}${ZHI[i % 12]}`);
  }
  return out;
}

export type RelationAtlasItem = {
  id: string;
  title: string;
  group: '天干关系' | '地支关系';
  gloss: string;
};

export const RELATION_ATLAS: readonly RelationAtlasItem[] = [
  { id: 'rel:天干五合', title: '天干五合', group: '天干关系', gloss: '甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火。' },
  { id: 'rel:天干相冲', title: '天干相冲', group: '天干关系', gloss: '甲庚、乙辛、丙壬、丁癸等对冲，力大易震荡。' },
  { id: 'rel:天干相克', title: '天干相克', group: '天干关系', gloss: '按五行相克看干与干的压力与成器。' },
  { id: 'rel:天干相生', title: '天干相生', group: '天干关系', gloss: '按五行相生看干与干的滋养与泄秀。' },
  { id: 'rel:六合', title: '地支六合', group: '地支关系', gloss: '子丑、寅亥、卯戌、辰酉、巳申、午未。' },
  { id: 'rel:三合', title: '地支三合', group: '地支关系', gloss: '申子辰水、寅午戌火、巳酉丑金、亥卯未木。' },
  { id: 'rel:半合', title: '地支半合', group: '地支关系', gloss: '三合缺一仍成半合，气场偏一方。' },
  { id: 'rel:三会', title: '地支三会', group: '地支关系', gloss: '寅卯辰木、巳午未火、申酉戌金、亥子丑水。' },
  { id: 'rel:六冲', title: '地支六冲', group: '地支关系', gloss: '子午、丑未、寅申、卯酉、辰戌、巳亥。' },
  { id: 'rel:相刑', title: '地支相刑', group: '地支关系', gloss: '三刑、子卯刑、自刑等，内耗与纠结。' },
  { id: 'rel:相害', title: '地支相害', group: '地支关系', gloss: '六害 · 暗中掣肘、合中带损。' },
  { id: 'rel:相破', title: '地支相破', group: '地支关系', gloss: '破 · 结构松动、计划易裂。' },
  { id: 'rel:相穿', title: '地支相穿', group: '地支关系', gloss: '穿（害的另一说法）· 暗损。' },
];

export type LuckConceptItem = {
  id: string;
  title: string;
  gloss: string;
};

export const LUCK_ATLAS: readonly LuckConceptItem[] = [
  { id: 'luck:大运', title: '大运', gloss: '十年一段气运主题 · 如何触发原局、改写人生舞台。' },
  { id: 'luck:流年', title: '流年', gloss: '一年之干支 · 点醒原局哪些柱、对应哪些现实主题。' },
  { id: 'luck:流月', title: '流月', gloss: '月尺度的细触发 · 看当月干支与原局冲合。' },
  { id: 'luck:小运', title: '小运', gloss: '与流年并行的岁运线索 · 辅助看节奏。' },
  { id: 'luck:起运', title: '起运', gloss: '何时步入第一大运 · 出生后若干年交运。' },
  { id: 'luck:交运', title: '交运', gloss: '大运交接节点 · 主题切换的关键年。' },
  { id: 'luck:原局触发', title: '原局触发', gloss: '运岁如何冲合刑害原局，使某柱/十神/神煞显化。' },
  { id: 'luck:宫位影响', title: '宫位影响', gloss: '运岁落在年/月/日/时，对应早年、事业、配偶、子女等议题。' },
];

function emptyRels(): BaziEncyclopediaEntry['relations'] {
  return { generates: [], controls: [], helpedBy: [], drainedBy: [] };
}

function shell(
  id: string,
  kind: BaziCodexKind,
  title: string,
  tags: BaziEncyclopediaEntry['tags'],
  oneLiner: string,
  keywords: string[] = [],
): BaziEncyclopediaEntry {
  return {
    id,
    kind,
    title,
    tags,
    oneLiner,
    structure: {
      diagram: `${title} · 图鉴骨架条目。完整查法、案例与命盘细则将持续补全。`,
      keywords: keywords.length ? keywords : [title, tags.category],
      mappings: ['打开词条学习', '对照命盘落点', '勿单独当断语'],
    },
    dimensions: {
      personality: oneLiner,
      work: '结合十神与格局看事业面向；本条为知识库骨架。',
      love: '结合日支与桃花类神煞看感情；勿单断。',
      health: '身体对应须合五行与季节，本条仅作索引。',
    },
    relations: emptyRels(),
  };
}

export function nayinId(name: string): string {
  return `ny:${name}`;
}

export function jiaziId(gz: string): string {
  return `jz:${gz}`;
}

/** 构建骨架词条表（不覆盖已有完整百科） */
export function buildAtlasShellEncyclopedia(): Record<string, BaziEncyclopediaEntry> {
  const out: Record<string, BaziEncyclopediaEntry> = {};

  for (const n of NAYIN_ATLAS) {
    const id = nayinId(n.name);
    out[id] = shell(id, 'nayin', n.name, { wuxing: n.wuxing, category: '纳音' }, n.gloss, [
      n.wuxing,
      '纳音',
      n.name,
    ]);
  }

  for (const gz of listSixtyJiazi()) {
    const id = jiaziId(gz);
    const ny = nayinOf(gz);
    const stem = gz.charAt(0);
    const branch = gz.charAt(1);
    out[id] = shell(
      id,
      'jiazi',
      gz,
      { category: '六十甲子', wuxing: undefined, yinyang: undefined },
      `${gz} · 纳音${ny} · 天干${stem}、地支${branch}。`,
      [ny, '六十甲子', `${stem}${branch}`],
    );
  }

  for (const s of SHENSHA_ATLAS) {
    const id = shenshaCardId(s.name);
    // 已有完整词条（如天乙）由 merge 时保留旧稿
    out[id] = shell(
      id,
      'shensha',
      s.name,
      { category: `神煞·${s.category}`, yinyang: s.tone },
      s.gloss,
      [s.category, s.tone, s.name],
    );
  }

  for (const r of RELATION_ATLAS) {
    out[r.id] = shell(r.id, 'relation', r.title, { category: r.group }, r.gloss, [
      r.group,
      r.title,
    ]);
  }

  for (const l of LUCK_ATLAS) {
    out[l.id] = shell(l.id, 'luck', l.title, { category: '大运流年' }, l.gloss, [
      '运程',
      l.title,
    ]);
  }

  return out;
}

/** 校验 lunar 纳音表是否覆盖六十甲子 */
export function assertNayinCoverage(): { ok: boolean; missing: string[] } {
  const table = LunarUtil.NAYIN as Record<string, string>;
  const missing: string[] = [];
  for (const gz of listSixtyJiazi()) {
    if (!table[gz]) missing.push(gz);
  }
  return { ok: missing.length === 0, missing };
}

export function shenshaAtlasByCategory(): Record<
  ShenshaCategory,
  { name: string; category: ShenshaCategory; gloss: string; tone: '吉' | '凶' | '中性' }[]
> {
  const map = {} as Record<
    ShenshaCategory,
    { name: string; category: ShenshaCategory; gloss: string; tone: '吉' | '凶' | '中性' }[]
  >;
  for (const c of SHENSHA_CATEGORIES) map[c] = [];
  for (const s of SHENSHA_ATLAS) map[s.category].push(s);
  return map;
}
