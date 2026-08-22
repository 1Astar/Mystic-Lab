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

/** 神煞名录（骨架 ≥80；天乙级全文 schema 已推广，精查法/排盘规则持续补） */
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
  { name: '天德合', category: '贵人类', gloss: '天德合 · 合象缓冲（非免灾金牌）。', tone: '吉' },
  { name: '月德合', category: '贵人类', gloss: '月德合 · 人情缓冲（非人际免检）。', tone: '吉' },
  { name: '福星', category: '贵人类', gloss: '福星贵人 · 有福气托底的稳定感。', tone: '吉' },
  { name: '天赦', category: '贵人类', gloss: '天赦 · 宽恕解厄窗口（非免责金牌）。', tone: '吉' },
  { name: '三奇贵人', category: '贵人类', gloss: '三奇 · 异禀机遇入口（成局另论）。', tone: '吉' },
  { name: '天医', category: '贵人类', gloss: '天医 · 调理与救治线索（护持感，非免检）。', tone: '吉' },
  { name: '解神', category: '贵人类', gloss: '解神 · 解开纠结、化解阻滞（宜主动疏通）。', tone: '吉' },
  // 桃花感情类
  { name: '桃花', category: '桃花感情类', gloss: '咸池桃花 · 人缘、吸引、情感磁场。', tone: '中性' },
  { name: '咸池', category: '桃花感情类', gloss: '与桃花同族 · 情感与欲望磁场。', tone: '中性' },
  { name: '红鸾', category: '婚恋家庭类', gloss: '红鸾星 · 喜庆、婚恋缘动。', tone: '吉' },
  { name: '天喜', category: '婚恋家庭类', gloss: '天喜星 · 喜事、庆典、开怀。', tone: '吉' },
  { name: '沐浴', category: '桃花感情类', gloss: '沐浴 · 敏感曝光（护边界，非情欲判决）。', tone: '中性' },
  { name: '风流', category: '桃花感情类', gloss: '风流 · 魅力与是非提醒（对照桃花）。', tone: '中性' },
  { name: '流霞', category: '桃花感情类', gloss: '流霞 · 感情波折提醒（慢热核实）。', tone: '中性' },
  { name: '血刃', category: '灾厄风险类', gloss: '血刃 · 尖锐防护提醒（非恐吓判决）。', tone: '凶' },
  // 文学才华类
  { name: '文昌', category: '文学才华类', gloss: '文昌星 · 学业、考试、文书才华。', tone: '吉' },
  { name: '学堂', category: '文学才华类', gloss: '学堂 · 开智学习场（要练手，非学历保票）。', tone: '吉' },
  { name: '词馆', category: '文学才华类', gloss: '词馆 · 文章表达、宜交稿。', tone: '吉' },
  { name: '文曲', category: '文学才华类', gloss: '文曲 · 文采巧思（忌油滑）。', tone: '吉' },
  { name: '华盖', category: '孤独精神类', gloss: '华盖 · 精神独处与艺术信仰。', tone: '中性' },
  { name: '正印', category: '文学才华类', gloss: '正印入口 · 托底学习（对照十神）。', tone: '中性' },
  { name: '魁罡', category: '权力事业类', gloss: '魁罡 · 刚果决断（练收放）。', tone: '中性' },
  { name: '金舆', category: '财富资源类', gloss: '金舆 · 仪仗体面与抬举感。', tone: '吉' },
  // 权力事业类
  { name: '将星', category: '权力事业类', gloss: '将星 · 主心骨、统领与担当。', tone: '吉' },
  { name: '国印', category: '权力事业类', gloss: '国印 · 印信职权与名位（章要盖对）。', tone: '吉' },
  { name: '台阁', category: '权力事业类', gloss: '台阁 · 机构平台（要交付，非必升官）。', tone: '吉' },
  { name: '权星', category: '权力事业类', gloss: '权星 · 决策掌控（对照将星，非必掌权）。', tone: '中性' },
  { name: '飞刃', category: '灾厄风险类', gloss: '飞刃 · 刚锐防护提醒（羊刃冲，非恐吓）。', tone: '凶' },
  { name: '羊刃', category: '权力事业类', gloss: '羊刃 · 锋芒、魄力与过刚风险。', tone: '中性' },
  { name: '紫微', category: '权力事业类', gloss: '紫微入口 · 中枢感（简化帝旺，非斗数整盘）。', tone: '吉' },
  { name: '天官', category: '权力事业类', gloss: '天官 · 名望提携（名要配德）。', tone: '吉' },
  // 财富资源类
  { name: '禄神', category: '财富资源类', gloss: '禄神 · 食禄、俸给、稳定收入象。', tone: '吉' },
  { name: '天厨', category: '财富资源类', gloss: '天厨 · 口福、供养、被养。', tone: '吉' },
  { name: '仓廪', category: '财富资源类', gloss: '仓廪 · 库藏积蓄（要出入流通）。', tone: '吉' },
  { name: '飞财', category: '财富资源类', gloss: '飞财 · 财来财去提醒（非必发/必破）。', tone: '中性' },
  { name: '进神', category: '财富资源类', gloss: '进神 · 进取推进窗口（要落地）。', tone: '吉' },
  { name: '退神', category: '移动变化类', gloss: '退神 · 收缩宜守（非永久退场）。', tone: '中性' },
  { name: '富星', category: '财富资源类', gloss: '富星 · 资源丰厚（≈仓廪，要流通）。', tone: '吉' },
  { name: '马头带剑', category: '移动变化类', gloss: '马头带剑 · 动中锋芒（要防护）。', tone: '中性' },
  // 移动变化类
  { name: '驿马', category: '移动变化类', gloss: '驿马 · 奔波、出行、变动。', tone: '中性' },
  { name: '华盖（驿）', category: '移动变化类', gloss: '华盖（驿）· 动中求静（要归岸）。', tone: '中性' },
  { name: '劫煞', category: '灾厄风险类', gloss: '劫煞 · 突发变化提醒（宜备份，非判决）。', tone: '凶' },
  { name: '亡神', category: '灾厄风险类', gloss: '亡神 · 耗散、计划易散（提醒收束）。', tone: '凶' },
  { name: '灾煞', category: '灾厄风险类', gloss: '灾煞 · 关口警示，宜谨慎。', tone: '凶' },
  { name: '天马', category: '移动变化类', gloss: '天马 · 远行调动（要归岸，非必升迁）。', tone: '中性' },
  { name: '动态', category: '移动变化类', gloss: '动态 · 动象总览（要归岸）。', tone: '中性' },
  { name: '空亡', category: '孤独精神类', gloss: '旬空 · 力气虚着，宜借实处（非一切落空）。', tone: '中性' },
  // 孤独精神类
  { name: '孤辰', category: '孤独精神类', gloss: '孤辰 · 自立提醒（留连结门）。', tone: '中性' },
  { name: '寡宿', category: '孤独精神类', gloss: '寡宿 · 清寂提醒（慎断晚景）。', tone: '中性' },
  { name: '孤辰寡宿', category: '孤独精神类', gloss: '孤辰寡宿 · 复合孤独象。', tone: '中性' },
  { name: '隔角', category: '孤独精神类', gloss: '隔角 · 隔阂提醒（宜对齐）。', tone: '中性' },
  { name: '阴差阳错', category: '婚恋家庭类', gloss: '阴差阳错 · 时机拧巴提醒（慎断婚破）。', tone: '中性' },
  { name: '童子', category: '子女晚年类', gloss: '童子 · 清修入口（慎断，非必出家）。', tone: '中性' },
  { name: '元辰', category: '孤独精神类', gloss: '元辰 · 内耗提醒（非小人判决）。', tone: '凶' },
  { name: '大耗', category: '灾厄风险类', gloss: '大耗 · 流失提醒（记账备份，非必破财）。', tone: '凶' },
  // 灾厄风险类
  { name: '白虎', category: '灾厄风险类', gloss: '白虎 · 刚猛、冲突、手术意象。', tone: '凶' },
  { name: '挂剑', category: '灾厄风险类', gloss: '挂剑 · 锋芒防护（对照白虎）。', tone: '凶' },
  { name: '病符', category: '灾厄风险类', gloss: '病符 · 养护提醒（非恐吓必病）。', tone: '凶' },
  { name: '死符', category: '灾厄风险类', gloss: '死符 · 停滞提醒（非字面生死）。', tone: '凶' },
  { name: '天哭', category: '灾厄风险类', gloss: '天哭 · 愁绪、感伤。', tone: '凶' },
  { name: '天虚', category: '灾厄风险类', gloss: '天虚 · 空虚、抓不住实感。', tone: '凶' },
  { name: '吊客', category: '灾厄风险类', gloss: '吊客 · 告别、送别、低潮。', tone: '凶' },
  { name: '丧门', category: '灾厄风险类', gloss: '丧门 · 哀感提醒（慎断丧事）。', tone: '凶' },
  { name: '破碎', category: '灾厄风险类', gloss: '破碎 · 易碎、宜留备份。', tone: '凶' },
  { name: '绞煞', category: '灾厄风险类', gloss: '绞煞 · 纠缠提醒（宜拆题，非死结）。', tone: '凶' },
  { name: '天罗', category: '灾厄风险类', gloss: '天罗 · 困局提醒（宜绕行，非绝路）。', tone: '凶' },
  { name: '地网', category: '灾厄风险类', gloss: '地网 · 落地困局（宜小步清淤）。', tone: '凶' },
  { name: '五鬼', category: '灾厄风险类', gloss: '五鬼 · 扰心提醒（先核实，非见鬼）。', tone: '凶' },
  { name: '羊刃（凶读）', category: '灾厄风险类', gloss: '羊刃凶读 · 过刚风险入口。', tone: '凶' },
  // 婚恋家庭类（补）
  { name: '天喜红鸾', category: '婚恋家庭类', gloss: '天喜红鸾 · 喜气加强（非必婚保票）。', tone: '吉' },
  { name: '勾绞', category: '婚恋家庭类', gloss: '勾绞 · 纠缠提醒（宜拆题）。', tone: '中性' },
  { name: '咸池桃花', category: '桃花感情类', gloss: '咸池桃花 · 磁场要边界。', tone: '中性' },
  { name: '妻妾', category: '婚恋家庭类', gloss: '妻妾入口 · 配偶议题对齐（对照十神）。', tone: '中性' },
  { name: '夫星', category: '婚恋家庭类', gloss: '夫星入口 · 伴侣议题对齐（对照十神）。', tone: '中性' },
  { name: '披麻', category: '灾厄风险类', gloss: '披麻 · 告别提醒（慎断丧事）。', tone: '凶' },
  { name: '六厄', category: '灾厄风险类', gloss: '六厄 · 关卡提醒（宜备份，非绝路）。', tone: '凶' },
  // 子女晚年类
  { name: '词馆学堂', category: '子女晚年类', gloss: '词馆学堂 · 学写一体（要交稿）。', tone: '吉' },
  { name: '子孙星', category: '子女晚年类', gloss: '子孙星入口 · 食伤对照（慎断子嗣）。', tone: '中性' },
  { name: '胎神', category: '子女晚年类', gloss: '胎神 · 孕育入口（医疗优先，慎断）。', tone: '中性' },
  { name: '养神', category: '子女晚年类', gloss: '养神 · 滋养准备（育苗耐心）。', tone: '中性' },
  { name: '长生', category: '子女晚年类', gloss: '长生 · 起势生机（呵护验证）。', tone: '吉' },
  { name: '帝旺', category: '权力事业类', gloss: '帝旺 · 巅峰气场（防过曝）。', tone: '中性' },
  { name: '墓库', category: '财富资源类', gloss: '墓库 · 收藏沉淀（要出入流通）。', tone: '中性' },
  { name: '截路空亡', category: '灾厄风险类', gloss: '截路空亡 · 封路宜绕行（非永久封死）。', tone: '凶' },
  { name: '旬空', category: '孤独精神类', gloss: '旬空 · 空亡别称（虚处借实）。', tone: '中性' },
  { name: '天罗地网', category: '灾厄风险类', gloss: '天罗地网 · 困局总览（绕行清淤）。', tone: '凶' },
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
  { id: 'luck:大运', title: '大运', gloss: '十年一段气运主题 · 点对应甲子词条看「作大运时」专区。' },
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
      work: '结合十神与格局看事业面向。',
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

/** 某纳音对应的六十甲子（通常两对） */
export function jiaziPairsOfNayin(name: string): string[] {
  return listSixtyJiazi().filter((gz) => nayinOf(gz) === name);
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
      `${gz} · 纳音${ny} · 天干${stem}、地支${branch}。可看作大运十年滤镜。`,
      [ny, '六十甲子', `${stem}${branch}`, '大运'],
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
