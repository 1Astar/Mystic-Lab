/**
 * 生成 src/bazi/codex-encyclopedia-data.ts —— 八字图鉴全量四屏词条
 * 运行：node scripts/gen-bazi-encyclopedia.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, '../src/bazi/codex-encyclopedia-data.ts');

const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
const SHENG_ME = Object.fromEntries(Object.entries(SHENG).map(([a, b]) => [b, a]));
const KE_ME = Object.fromEntries(Object.entries(KE).map(([a, b]) => [b, a]));

const WX_META = {
  木: {
    epithet: '生长与伸展',
    one: '像树木向上长：要方向、要伸展，也怕被压住。',
    kw: ['方向', '生长', '筋络', '仁', '伸展'],
    map: ['立计划与目标', '学习新技能', '户外走动', '照顾植物'],
    dim: {
      personality: '重意义感与成长；卡住时容易烦躁或钻牛角尖。',
      work: '适合开创、策划、教学、需要「长出来」的岗位。',
      love: '要共同成长；若对方压抑你的方向感，关系易僵。',
      health: '关照肝胆与筋络；久坐、熬夜、憋气时要特别留意。',
    },
  },
  火: {
    epithet: '热度与表达',
    one: '像火要被看见：要热度、要表达，也怕闷熄或过烫。',
    kw: ['表达', '热度', '可见', '礼', '点燃'],
    map: ['公开表达', '社交聚会', '晒太阳', '完成一次被看见的输出'],
    dim: {
      personality: '热情外放或细腻发光；缺火则闷，过火则急。',
      work: '适合展示、销售、表演、需要「点燃场」的角色。',
      love: '要回应与热度；冷处理会让火系心伤。',
      health: '关照心与循环；少熬夜硬撑，过旺则降一点热度。',
    },
  },
  土: {
    epithet: '承载与根基',
    one: '像土地托住一切：要稳定、要消化，也怕太沉或太飘。',
    kw: ['稳定', '承载', '消化', '信', '落地'],
    map: ['列可勾清单', '规律作息', '收拾中央空间', '温润主食'],
    dim: {
      personality: '可靠踏实；过厚会钝，过薄会飘。',
      work: '适合运营、后勤、项目管理、把事扛住的岗位。',
      love: '要安全感与承诺；空头支票最伤土。',
      health: '关照脾胃与消化节奏；饮食不定时会晃根基。',
    },
  },
  金: {
    epithet: '边界与收口',
    one: '像金属收锋：要标准、要决断，也怕过利伤人或过软无界。',
    kw: ['边界', '决断', '收口', '义', '清晰'],
    map: ['断舍离', '把话说干净', '整理西向安静角', '完成一次收口'],
    dim: {
      personality: '原则分明、审美敏锐；过利易伤人，过软易讨好。',
      work: '适合质检、法务、设计收尾、需要「砍清楚」的岗位。',
      love: '要尊重边界；模糊关系最耗金。',
      health: '关照肺与呼吸；边界乱时呼吸也会变浅。',
    },
  },
  水: {
    epithet: '流动与智慧',
    one: '像水流向下：要冷静、要智慧，也怕散漫或枯竭。',
    kw: ['流动', '智慧', '储备', '智', '润泽'],
    map: ['靠近水边', '深读与冥想', '游泳', '把情绪写下来'],
    dim: {
      personality: '直觉与谋略强；过散会飘，过枯会焦虑。',
      work: '适合研究、策略、咨询、需要「想透」的岗位。',
      love: '要心灵连接与空间；逼迫表态会让水退。',
      health: '关照肾与深层储备；久焦虑等于水在喊渴。',
    },
  },
};

const STEMS = [
  ['甲', '木', '阳', '甲木', '参天大树', '像参天大树，重方向、骨力、向上生长。'],
  ['乙', '木', '阴', '乙木', '藤萝花草', '像藤萝花草，柔韧善绕，适应力强。'],
  ['丙', '火', '阳', '丙火', '太阳大火', '像正午太阳，光明外放，热情可见。'],
  ['丁', '火', '阴', '丁火', '烛光灯火', '像烛火灯芯，细腻照明，重感受。'],
  ['戊', '土', '阳', '戊土', '高山厚土', '像高山厚土，承载稳重，可靠能扛。'],
  ['己', '土', '阴', '己土', '田园湿土', '像田园湿土，滋养细作，能藏能容。'],
  ['庚', '金', '阳', '庚金', '刀剑矿石', '像刀剑矿石，锋利果断，重原则。'],
  ['辛', '金', '阴', '辛金', '珠玉精金', '像珠玉精金，精致敏锐，重品质。'],
  ['壬', '水', '阳', '壬水', '江河大海', '像江河大海，气魄流动，智谋开阔。'],
  ['癸', '水', '阴', '癸水', '雨露甘泉', '像雨露甘泉，润物无声，直觉细腻。'],
];

const BRANCHES = [
  ['子', '水', '阳', '子水', '小溪潜流', '像小溪潜流，藏潜能与内在智慧。'],
  ['丑', '土', '阴', '丑土', '冻土仓库', '像冻土仓库，忍耐收藏、固定资产感。'],
  ['寅', '木', '阳', '寅木', '山林起步', '像山林起步，冲动生长、敢开第一脚。'],
  ['卯', '木', '阴', '卯木', '花木满园', '像花木满园，细腻审美与柔韧伸展。'],
  ['辰', '土', '阳', '辰土', '水库湿泥', '像水库湿泥，吞吐变化、整合资源。'],
  ['巳', '火', '阴', '巳火', '文明之火', '像文明之火，谋略文书与内热聪明。'],
  ['午', '火', '阳', '午火', '烈日当空', '像烈日当空，外放表达与高热能量。'],
  ['未', '土', '阴', '未土', '田园燥土', '像田园燥土，滋养照顾与情感沉淀。'],
  ['申', '金', '阳', '申金', '驿路刀兵', '像驿路刀兵，变动技能与果断推进。'],
  ['酉', '金', '阴', '酉金', '精金华贵', '像精金华贵，审美标准与精细收口。'],
  ['戌', '土', '阳', '戌土', '火库堡垒', '像火库堡垒，忠诚防卫与沉淀成果。'],
  ['亥', '水', '阴', '亥水', '深海夜雨', '像深海夜雨，想象慈悲与深层流动。'],
];

const STEM_EXTRA = {
  甲: {
    kw: ['骨力', '正直', '开创', '固执', '领袖感'],
    map: ['立大目标', '带队开荒', '户外攀爬', '少硬碰硬'],
    dim: {
      personality: '刚直有骨气，也容易固执倔强；方向一立就不轻易改。',
      work: '适合创业、管理、开拓型岗位；忌长期无目标的重复劳动。',
      love: '要尊重与并肩；被压制会硬顶，被忽视会冷撤。',
      health: '筋骨与肝气；久坐僵硬、易怒时要伸展与放慢。',
    },
    diagram: '阳木主气：外展、向上、成林。结构上喜水润根、火暖枝，忌金过度削伐。',
  },
  乙: {
    kw: ['柔韧', '绕行', '审美', '依附', '生长'],
    map: ['关系经营', '设计美感', '攀缘学习', '留退路'],
    dim: {
      personality: '柔韧善绕，适应力强，也易优柔寡断。',
      work: '适合协调、设计、咨询、需要迂回推进的岗位。',
      love: '重氛围与体贴；太直太硬的相处会让乙木萎缩。',
      health: '筋络与情绪弹性；别长期憋屈，要有小出口。',
    },
    diagram: '阴木主气：攀缘、柔曲、成花。结构上喜水滋、土培根，忌狂风硬折。',
  },
  丙: {
    kw: ['光明', '热情', '急躁', '可见', '点燃'],
    map: ['舞台表达', '公开演讲', '晒太阳', '控节奏'],
    dim: {
      personality: '光明外放，热情可见，也易急躁灼人。',
      work: '适合销售、演艺、品牌、需要高曝光的岗位。',
      love: '要热烈回应；冷暴力对丙火杀伤力极大。',
      health: '心火与血压热度；过旺少熬夜，少硬扛。',
    },
    diagram: '阳火主气：普照、外扬、成日。结构上喜木生、土泄，忌水灭、金夺光。',
  },
  丁: {
    kw: ['细腻', '照明', '感受', '内耗', '专注'],
    map: ['深夜创作', '一对一倾谈', '点灯仪式', '护心神'],
    dim: {
      personality: '细腻照明，重感受，也易内耗与敏感。',
      work: '适合研究、编辑、治疗、需要专注火候的岗位。',
      love: '要被看见细节；敷衍最伤丁火。',
      health: '心神与睡眠；过思则火虚，需养神。',
    },
    diagram: '阴火主气：烛照、内明、成灯。结构上喜木添薪、金为用，忌狂风与水灌。',
  },
  戊: {
    kw: ['承载', '稳重', '固执', '厚德', '边界'],
    map: ['扛项目', '置产', '规律作息', '少堆负重'],
    dim: {
      personality: '承载稳重，可靠，也易固执沉重。',
      work: '适合工程、管理、地产、需要「压得住」的岗位。',
      love: '要承诺与实在；空谈会让戊土关闭。',
      health: '脾胃与湿重；饮食规律比补品更重要。',
    },
    diagram: '阳土主气：厚载、成山、守中。结构上喜火暖、金泄，忌木多克破、水多成泥。',
  },
  己: {
    kw: ['滋养', '细作', '黏滞', '包容', '田园'],
    map: ['烹饪照顾', '精细运营', '整理收纳', '防内耗'],
    dim: {
      personality: '滋养细作，能藏能容，也易黏滞内耗。',
      work: '适合运营、服务、财务、需要细致落地的岗位。',
      love: '要被需要与被珍惜；被当工具会伤己土。',
      health: '脾胃湿气与思虑；思多则伤土。',
    },
    diagram: '阴土主气：田园、孕育、成壤。结构上喜火暖、水润适度，忌木过度翻掘。',
  },
  庚: {
    kw: ['锋利', '果断', '原则', '伤人', '改革'],
    map: ['砍需求', '练武健身', '立规矩', '收刀入鞘'],
    dim: {
      personality: '锋利果断，重原则，也易伤人伤己。',
      work: '适合法务、手术/技术攻坚、改革型岗位。',
      love: '要真诚直球；绕弯子会激怒庚金。',
      health: '肺与骨骼；过刚易折，要练收放。',
    },
    diagram: '阳金主气：矿石、刀兵、成器。结构上喜土生、水淬，忌火烈熔、木缠。',
  },
  辛: {
    kw: ['精致', '敏锐', '挑剔', '品质', '审美'],
    map: ['精修作品', '珠宝衣饰', '品味筛选', '防过敏式敏感'],
    dim: {
      personality: '精致敏锐，重品质，也易挑剔敏感。',
      work: '适合设计、品控、咨询、需要「打磨」的岗位。',
      love: '要被尊重审美与边界；粗糙对待最伤辛。',
      health: '肺与皮肤敏感；情绪过敏时先降噪。',
    },
    diagram: '阴金主气：珠玉、首饰、成精。结构上喜土生、水洗，忌火灼、土埋。',
  },
  壬: {
    kw: ['气魄', '流动', '智谋', '散漫', '吞吐'],
    map: ['长途旅行', '战略会议', '江海边', '定一个锚点'],
    dim: {
      personality: '气魄流动，智谋开阔，也易散漫无边。',
      work: '适合战略、贸易、媒体、需要大格局的岗位。',
      love: '要空间与信任；拴太死会逃，太空会漂。',
      health: '肾与体液代谢；过散时要规律睡眠。',
    },
    diagram: '阳水主气：江海、奔流、成势。结构上喜金生、木泄，忌土塞、火蒸。',
  },
  癸: {
    kw: ['润泽', '直觉', '忧思', '细流', '滋养'],
    map: ['写日记', '雨天独处', '助人倾听', '防过度忧'],
    dim: {
      personality: '润物无声，直觉细，也易忧思内耗。',
      work: '适合心理、研究、艺术、需要「渗透」的岗位。',
      love: '要心灵共鸣；吵闹压迫会让癸水退隐。',
      health: '肾与情绪水位；长期忧思要补睡与补水。',
    },
    diagram: '阴水主气：雨露、泉脉、成润。结构上喜金生、木吸，忌土埋、火煎。',
  },
};

const BRANCH_EXTRA = {
  子: {
    kw: ['潜能', '夜气', '智慧', '隐秘', '起始'],
    map: ['深夜思考', '储蓄能量', '少硬撑场面'],
    dim: {
      personality: '内里聪明，不爱虚张；潜能深，需被看见才愿出。',
      work: '适合研究、策略、需要冷静起手的岗位。',
      love: '慢热；安全感够才会流露。',
      health: '肾水与睡眠；子时作息尤其重要。',
    },
    diagram: '子为阳水、夜半之位：潜藏、起始、一阳初萌。',
  },
  丑: {
    kw: ['忍耐', '收藏', '固定资产', '慢', '仓库'],
    map: ['存粮存钱', '长期项目', '少急功近利'],
    dim: {
      personality: '能忍能藏，步子慢但稳。',
      work: '适合仓储、财务、农牧、长期主义岗位。',
      love: '慢热忠诚；急推会关闭。',
      health: '湿土与关节；注意湿寒与久站。',
    },
    diagram: '丑为阴土、金库：收藏、冻结、待春。',
  },
  寅: {
    kw: ['起步', '冲动', '山林', '开创', '虎气'],
    map: ['开工仪式', '短途出发', '敢试第一版'],
    dim: {
      personality: '行动欲强，敢开第一脚，也易冲动。',
      work: '适合开拓、出差、项目启动。',
      love: '热烈直接；拖沓会失去兴趣。',
      health: '肝胆与筋骨；冲动后记得收。',
    },
    diagram: '寅为阳木、正月：破土、起步、生发。',
  },
  卯: {
    kw: ['花木', '审美', '关系', '柔韧', '满园'],
    map: ['布置空间', '社交轻连', '艺术输入'],
    dim: {
      personality: '细腻审美，重关系氛围。',
      work: '适合设计、公关、园艺、内容审美岗。',
      love: '要浪漫与回应；冷漠最伤。',
      health: '肝气与过敏；情绪易随环境。',
    },
    diagram: '卯为阴木、仲春：花开、伸展、成美。',
  },
  辰: {
    kw: ['吞吐', '水库', '整合', '变化', '过渡'],
    map: ['资源盘点', '跨界整合', '处理积压'],
    dim: {
      personality: '能吞能吐，过渡力强，也易积压。',
      work: '适合资源整合、中台、项目枢纽。',
      love: '需要空间消化情绪。',
      health: '湿与消化；积食积事都伤辰。',
    },
    diagram: '辰为阳土、水库：湿泥、库藏、辰月交接。',
  },
  巳: {
    kw: ['谋略', '文书', '内热', '聪明', '文明'],
    map: ['写作策划', '学习考证', '控内耗'],
    dim: {
      personality: '聪明有谋，内热不显。',
      work: '适合文案、策划、技术文档、考试赛道。',
      love: '用脑多于用喊；需要被懂。',
      health: '心火暗耗；少憋、少通宵。',
    },
    diagram: '巳为阴火、孟夏：文明火种、蛇形智。',
  },
  午: {
    kw: ['烈日', '外放', '声誉', '高热', '可见'],
    map: ['公开发表', '竞技场', '晒光也遮荫'],
    dim: {
      personality: '外放高热，要舞台。',
      work: '适合表演、销售、竞赛、品牌曝光。',
      love: '要热烈反馈；忽视等于灭火。',
      health: '心火过旺；注意血压与失眠。',
    },
    diagram: '午为阳火、仲夏：日正中天、光热极。',
  },
  未: {
    kw: ['滋养', '照顾', '情感', '沉淀', '田园'],
    map: ['照顾他人', '烘焙家园', '情感复盘'],
    dim: {
      personality: '重照顾与情感沉淀。',
      work: '适合照护、教育、社群运营。',
      love: '要被珍惜；只索取会枯。',
      health: '脾胃与情绪吃；别用吃压情绪过度。',
    },
    diagram: '未为阴土、木库：田园燥土、养物。',
  },
  申: {
    kw: ['驿马', '技能', '变动', '果断', '刀兵'],
    map: ['出差换场', '练手艺', '快速决策'],
    dim: {
      personality: '动中求进，技能导向。',
      work: '适合技术、交通、外贸、变革岗。',
      love: '怕无聊；也要学留。',
      health: '肺与筋骨劳损；动后要养。',
    },
    diagram: '申为阳金、孟秋：驿路、肃杀、成技。',
  },
  酉: {
    kw: ['精金', '标准', '审美', '收口', '华贵'],
    map: ['精修发布', '品质筛选', '仪式感收尾'],
    dim: {
      personality: '标准高、审美强。',
      work: '适合设计、品控、礼仪、精密岗。',
      love: '要体面与尊重。',
      health: '肺与皮肤；秋燥时注意。',
    },
    diagram: '酉为阴金、仲秋：精金成器、华贵。',
  },
  戌: {
    kw: ['堡垒', '忠诚', '防卫', '成果', '火库'],
    map: ['守成果', '团队护航', '归档沉淀'],
    dim: {
      personality: '忠诚能守，也易防卫过强。',
      work: '适合安保、质控、项目收官。',
      love: '要忠诚对等；背叛难原谅。',
      health: '燥土与皮肤；情绪压抑会硬。',
    },
    diagram: '戌为阳土、火库：堡垒、收敛、戌月。',
  },
  亥: {
    kw: ['深海', '想象', '慈悲', '夜雨', '流动'],
    map: ['创作想象', '助人', '靠近水'],
    dim: {
      personality: '想象与慈悲深，也易沉溺情绪。',
      work: '适合艺术、公益、研究、夜班创作。',
      love: '要心灵深度；肤浅相处留不住。',
      health: '肾水与情绪潮汐；防过度沉溺。',
    },
    diagram: '亥为阴水、孟冬：深藏、夜雨、将生甲木。',
  },
};

const TENGODS = [
  [
    '正官',
    '结构与责任',
    '像骨架与名分：给你结构、责任与被看见的规矩。',
    ['结构', '名分', '责任', '规矩', '体面'],
    ['正式职位', '契约与头衔', '公众责任', '守时守诺'],
    {
      personality: '重秩序与体面，也容易自我要求过高。',
      work: '适合体制、管理、需要「名正言顺」的赛道。',
      love: '要稳定与公开；暧昧最伤正官感。',
      health: '压力型紧绷；学会授权与休息。',
    },
    '克日主且阴阳异性：外在规矩压成「可承之官」。',
    { generates: [['tg:正印', '正印'], ['tg:偏印', '偏印']], controls: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']], helpedBy: [['tg:正财', '正财'], ['tg:偏财', '偏财']], drainedBy: [['tg:食神', '食神'], ['tg:伤官', '伤官']] },
  ],
  [
    '七杀',
    '压力与突破',
    '像关口与刀锋：逼你突破，也考验你有没有制化。',
    ['压力', '魄力', '关口', '突破', '驾驭'],
    ['高压项目', '竞争赛道', '军令式截止', '挑战极限'],
    {
      personality: '敢冲有魄力，也易紧绷冲突。',
      work: '适合攻坚、创业高压期、竞技型岗位。',
      love: '张力强；无出口易变成互相伤害。',
      health: '应激与血压；要有疏泄渠道。',
    },
    '克日主且阴阳同性：无制为杀，有制为偏官。',
    { generates: [['tg:正印', '正印'], ['tg:偏印', '偏印']], controls: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']], helpedBy: [['tg:正财', '正财'], ['tg:偏财', '偏财']], drainedBy: [['tg:食神', '食神'], ['tg:伤官', '伤官']] },
  ],
  [
    '正财',
    '稳健资源',
    '像工资与储蓄：可预期、可累计的资源感。',
    ['稳健', '储蓄', '可预期', '正职', '经营'],
    ['固定收入', '记账理财', '长期合同', '踏实交易'],
    {
      personality: '务实重结果，也易怕变。',
      work: '适合正职、财务、销售闭环清晰的岗位。',
      love: '重现实经营；只谈感觉会不安。',
      health: '脾胃与劳碌；别只为钱透支身体。',
    },
    '日主所克且阴阳异性：我能掌控的稳定资源。',
    { generates: [['tg:正官', '正官'], ['tg:七杀', '七杀']], controls: [['tg:正印', '正印'], ['tg:偏印', '偏印']], helpedBy: [['tg:食神', '食神'], ['tg:伤官', '伤官']], drainedBy: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']] },
  ],
  [
    '偏财',
    '流动机会',
    '像项目与横财气：机会流动，来得快也要会留。',
    ['机会', '流动', '人脉', '项目', '窗口'],
    ['副业项目', '商务应酬', '投资窗口', '人脉撮合'],
    {
      personality: '嗅觉灵、出手快，也易散。',
      work: '适合商务、投资、资源撮合。',
      love: '缘广；要分清滋养与消耗。',
      health: '作息易乱；流动中也要锚点。',
    },
    '日主所克且阴阳同性：非常规、流动性资源。',
    { generates: [['tg:正官', '正官'], ['tg:七杀', '七杀']], controls: [['tg:正印', '正印'], ['tg:偏印', '偏印']], helpedBy: [['tg:食神', '食神'], ['tg:伤官', '伤官']], drainedBy: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']] },
  ],
  [
    '正印',
    '支持与学习',
    '像贵人与学位：托住你、教你、给你名分上的支持。',
    ['支持', '学习', '庇护', '证书', '托住'],
    ['进修考证', '导师贵人', '母亲式支持', '知识输入'],
    {
      personality: '爱学习、求庇护，也易依赖。',
      work: '适合学术、教育、文书、平台背书岗。',
      love: '要被理解与托住；冷漠拒绝最伤。',
      health: '思虑与睡眠；印多为懒，要动起来。',
    },
    '生日主且阴阳异性：正统滋养与名分支持。',
    { generates: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']], controls: [['tg:食神', '食神'], ['tg:伤官', '伤官']], helpedBy: [['tg:正官', '正官'], ['tg:七杀', '七杀']], drainedBy: [['tg:正财', '正财'], ['tg:偏财', '偏财']] },
  ],
  [
    '偏印',
    '独特思路',
    '像偏门学问：给你独特思路，也容易钻牛角尖。',
    ['偏门', '技艺', '孤独聪明', '非常规', '钻研'],
    ['冷门技能', '玄学艺术', '独立研究', '小众圈子'],
    {
      personality: '思路独特，也易孤僻钻牛角。',
      work: '适合研发、艺术、技术专家岗。',
      love: '需要被懂怪；强迫合群会退。',
      health: '思虑过密；定期落地沟通。',
    },
    '生日主且阴阳同性：非常规滋养与技艺印。',
    { generates: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']], controls: [['tg:食神', '食神'], ['tg:伤官', '伤官']], helpedBy: [['tg:正官', '正官'], ['tg:七杀', '七杀']], drainedBy: [['tg:正财', '正财'], ['tg:偏财', '偏财']] },
  ],
  [
    '食神',
    '表达与享受',
    '像口福与才艺：温和产出，享受过程也能养活自己。',
    ['表达', '享受', '才艺', '口福', '从容'],
    ['烹饪才艺', '内容创作', '休闲享受', '温和输出'],
    {
      personality: '从容有趣，也易散乐。',
      work: '适合创作、餐饮、内容、服务体验岗。',
      love: '要轻松滋养；高压指责会熄。',
      health: '脾胃与作息；乐后仍要结构。',
    },
    '日主所生且阴阳同性：秀气、口福、温和泄秀。',
    { generates: [['tg:正财', '正财'], ['tg:偏财', '偏财']], controls: [['tg:正官', '正官'], ['tg:七杀', '七杀']], helpedBy: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']], drainedBy: [['tg:正印', '正印'], ['tg:偏印', '偏印']] },
  ],
  [
    '伤官',
    '创意与锋芒',
    '像吐槽与革新：创意锋芒，不服管也能破局。',
    ['创意', '锋芒', '革新', '吐槽', '破局'],
    ['创新提案', '批评改进', '艺术先锋', '打破惯例'],
    {
      personality: '聪明锋利，也易顶牛。',
      work: '适合创新、设计、评论、改革岗。',
      love: '要自由表达；压抑会爆炸。',
      health: '肝气与睡眠；锋芒要对事不对人。',
    },
    '日主所生且阴阳异性：泄秀带伤、见官需慎。',
    { generates: [['tg:正财', '正财'], ['tg:偏财', '偏财']], controls: [['tg:正官', '正官'], ['tg:七杀', '七杀']], helpedBy: [['tg:比肩', '比肩'], ['tg:劫财', '劫财']], drainedBy: [['tg:正印', '正印'], ['tg:偏印', '偏印']] },
  ],
  [
    '比肩',
    '同侪并肩',
    '像并肩的朋友：自我主张、分担，也容易较劲。',
    ['并肩', '自我', '分担', '同侪', '竞争'],
    ['合伙协作', '朋友局', '健身同行', '边界清晰的合作'],
    {
      personality: '独立有主见，也易争。',
      work: '适合合伙、团队、需要「我也能」的岗位。',
      love: '要平等；控制欲会引爆。',
      health: '耗气在争执；并肩比硬刚更养生。',
    },
    '与日主同干：比和、助身、也争财。',
    { generates: [['tg:食神', '食神'], ['tg:伤官', '伤官']], controls: [['tg:正财', '正财'], ['tg:偏财', '偏财']], helpedBy: [['tg:正印', '正印'], ['tg:偏印', '偏印']], drainedBy: [['tg:正官', '正官'], ['tg:七杀', '七杀']] },
  ],
  [
    '劫财',
    '争夺与互换',
    '像拆借与竞争：流动中互换，边界不清就容易被分走。',
    ['争夺', '互换', '拆借', '竞争', '边界'],
    ['谈判分润', '合伙分账', '竞争招标', '清晰合同'],
    {
      personality: '行动力强，也易被动分享。',
      work: '适合竞争销售、资源置换、谈判岗。',
      love: '缘来缘走；要立边界。',
      health: '耗在人际拉扯；分清帮与被耗。',
    },
    '与日主同五行异阴阳：劫夺、流动、破财风险提醒。',
    { generates: [['tg:食神', '食神'], ['tg:伤官', '伤官']], controls: [['tg:正财', '正财'], ['tg:偏财', '偏财']], helpedBy: [['tg:正印', '正印'], ['tg:偏印', '偏印']], drainedBy: [['tg:正官', '正官'], ['tg:七杀', '七杀']] },
  ],
];

const SHENSHA = [
  ['天乙贵人', '贵人之星', '吉', '像暗路里的一束光：关键时刻总有人相助。', ['贵人', '逢凶化吉', '援助', '关键时刻'], ['求助名单', '困难期人脉', '关键抉择找顾问'], { personality: '遇贵则安，也易等救援。', work: '贵人型机会多；仍要自己走完难段。', love: '易遇帮扶型缘分。', health: '大病大灾时易得援助，仍重预防。' }, '多落日时附近；先难后贵。', [['木', '木'], ['水', '水']], [['火', '火']], [['土', '土']], [['金', '金']]],
  ['文昌', '学业才华之星', '吉', '像一支准箭：灵感与文字常能命中要害。', ['学业', '文书', '机智', '表达'], ['考试学习', '写作发表', '练手落地'], { personality: '聪明好学，也易停在想。', work: '利文职、考试、内容。', love: '用表达连接。', health: '用脑过度伤睡眠。' }, '日干文昌落支；利学业文书。', [['木', '木']], [['土', '土']], [['水', '水']], [['火', '火']]],
  ['禄神', '稳定根基', '吉', '像能站住吃饭的底气：根基在，心就不慌。', ['根基', '衣食', '站住', '底气'], ['主业深耕', '基本盘储蓄', '少躺平'], { personality: '有底气，也易懈怠。', work: '利正职与长期积累。', love: '要踏实经营。', health: '根基稳时抗压更好。' }, '日干之禄落支。', [['土', '土']], [['水', '水']], [['金', '金']], [['木', '木']]],
  ['将星', '主心骨感', '吉', '像被推到扛事的位置：你成了局里的主心骨。', ['担当', '权威', '扛事', '主心骨'], ['带队决策', '授权练习', '关键战役'], { personality: '能扛事，也易扛太多。', work: '利管理与关键节点。', love: '要学会被照顾。', health: '过劳是将星的税。' }, '三合将星落支。', [['火', '火']], [['金', '金']], [['土', '土']], [['水', '水']]],
  ['红鸾', '喜庆缘', '吉', '像喜事窗口：约会、庆典与被祝贺的时刻更容易来。', ['喜庆', '约会', '庆典', '缘起'], ['约会仪式', '婚礼聚会', '经营关系'], { personality: '易沾喜气。', work: '利公关庆典相关。', love: '喜庆是窗口不是保票。', health: '情绪上扬时别透支。' }, '相对年支之红鸾。', [['火', '火']], [['金', '金']], [['木', '木']], [['水', '水']]],
  ['天喜', '欢喜缘', '吉', '像气氛变暖的开关：身边更容易多一点开心事。', ['欢喜', '暖场', '开心', '气氛'], ['聚会暖场', '小惊喜', '重复连接'], { personality: '气氛制造者。', work: '利服务与社群。', love: '欢喜要落成习惯。', health: '乐极也要睡眠。' }, '相对年支之天喜。', [['火', '火']], [['金', '金']], [['木', '木']], [['水', '水']]],
  ['桃花', '姻缘人缘之煞', '吉', '像镜中花：魅力旺，也易牵出复杂红线。', ['人缘', '魅力', '姻缘', '社交'], ['社交场合', '形象管理', '分清滋养消耗'], { personality: '磁场强，也易耗。', work: '利对客与形象岗。', love: '桃花要经营边界。', health: '色欲与睡眠平衡。' }, '三合桃花落支。', [['水', '水']], [['土', '土']], [['木', '木']], [['火', '火']]],
  ['羊刃', '极端刚烈之星', '中', '像出鞘之刃：爆发力强，敢冲，也容易刺人。', ['刚烈', '爆发', '果决', '极端'], ['竞技突破', '练收放', '少硬刚全世界'], { personality: '锋利敢冲。', work: '利高压突破期。', love: '张力大；要收刀。', health: '易冲突受伤；练收。' }, '日干羊刃落支。', [['金', '金']], [['木', '木']], [['土', '土']], [['火', '火']]],
  ['华盖', '孤独感来源', '中', '像人群中的清高：精神独处是养分，隔绝是陷阱。', ['孤独', '信仰', '艺术', '清高'], ['独处创作', '信仰修习', '定期连接'], { personality: '精神独处。', work: '利艺术学术。', love: '要懂你安静的人。', health: '防自我隔绝抑郁。' }, '三合华盖落支。', [['水', '水']], [['火', '火']], [['金', '金']], [['土', '土']]],
  ['孤辰寡宿', '孤独独处之煞', '中', '像一人棋局：缘薄感强，精神世界却极深。', ['独处', '缘薄', '清冷', '内省'], ['深度爱好', '少自我惩罚', '选择性敞开'], { personality: '清冷高纬。', work: '利独立研究。', love: '缘浅不是错，封闭才是。', health: '防长期孤立。' }, '年支起孤辰寡宿。', [['水', '水']], [['火', '火']], [['金', '金']], [['土', '土']]],
  ['驿马', '奔波变动之星', '中', '像留不住的脚：奔波换场，动中求财，也要问是开拓还是逃跑。', ['奔波', '出行', '变动', '换场'], ['出差外贸', '搬家换城', '动中定目标'], { personality: '停不住。', work: '利交通外贸变动岗。', love: '远距与变动考验。', health: '奔波劳损；动后养。' }, '三合驿马落支。', [['木', '木']], [['土', '土']], [['水', '水']], [['火', '火']]],
  ['劫煞', '意外破财之煞', '凶', '像临门一脚翻车：突发阻碍与破耗感，留缓冲比硬冲活命。', ['意外', '破耗', '阻碍', '缓冲'], ['拆步骤', '买保险', '别赌最后一口气'], { personality: '遇阻易急。', work: '关键节点要备份。', love: '冲突突发时先降温。', health: '防意外与过劳事故。' }, '年支三合对冲起劫煞。', [['金', '金']], [['木', '木']], [['土', '土']], [['火', '火']]],
];

function relWx(wx) {
  return {
    generates: [{ id: SHENG[wx], label: SHENG[wx] }],
    controls: [{ id: KE[wx], label: KE[wx] }],
    helpedBy: [{ id: SHENG_ME[wx], label: SHENG_ME[wx] }],
    drainedBy: [{ id: SHENG[wx], label: `${SHENG[wx]}（泄）` }],
  };
}

function esc(s) {
  return JSON.stringify(s);
}

function links(arr) {
  return `[${arr.map(([id, label]) => `{ id: ${esc(id)}, label: ${esc(label)} }`).join(', ')}]`;
}

function entryBlock(e) {
  return `  ${esc(e.id)}: {
    id: ${esc(e.id)},
    kind: ${esc(e.kind)},
    title: ${esc(e.title)},
    tags: { wuxing: ${e.tags.wuxing ? esc(e.tags.wuxing) : 'undefined'}, yinyang: ${e.tags.yinyang ? esc(e.tags.yinyang) : 'undefined'}, category: ${esc(e.tags.category)} },
    oneLiner: ${esc(e.oneLiner)},
    structure: {
      diagram: ${esc(e.structure.diagram)},
      keywords: ${esc(e.structure.keywords)},
      mappings: ${esc(e.structure.mappings)},
    },
    dimensions: {
      personality: ${esc(e.dimensions.personality)},
      work: ${esc(e.dimensions.work)},
      love: ${esc(e.dimensions.love)},
      health: ${esc(e.dimensions.health)},
    },
    relations: {
      generates: ${links(e.relations.generates.map((x) => [x.id, x.label]))},
      controls: ${links(e.relations.controls.map((x) => [x.id, x.label]))},
      helpedBy: ${links(e.relations.helpedBy.map((x) => [x.id, x.label]))},
      drainedBy: ${links(e.relations.drainedBy.map((x) => [x.id, x.label]))},
    },
  }`;
}

const entries = [];

for (const wx of ['木', '火', '土', '金', '水']) {
  const m = WX_META[wx];
  const r = relWx(wx);
  entries.push({
    id: wx,
    kind: 'wuxing',
    title: wx,
    tags: { wuxing: wx, category: '五行' },
    oneLiner: m.one,
    structure: {
      diagram: `五行「${wx}」：${m.epithet}。相生环与相克星上的一极。`,
      keywords: m.kw,
      mappings: m.map,
    },
    dimensions: m.dim,
    relations: r,
  });
}

for (const [id, wx, yy, title, epithet, one] of STEMS) {
  const ex = STEM_EXTRA[id];
  const sameWxStems = STEMS.filter((s) => s[1] === wx).map((s) => s[0]);
  const r = relWx(wx);
  entries.push({
    id,
    kind: 'stem',
    title,
    tags: { wuxing: wx, yinyang: yy, category: '天干' },
    oneLiner: one,
    structure: {
      diagram: ex.diagram,
      keywords: ex.kw,
      mappings: ex.map,
    },
    dimensions: ex.dim,
    relations: {
      generates: r.generates.map((x) => ({ id: x.id, label: `生${x.label}` })),
      controls: r.controls.map((x) => ({ id: x.id, label: `克${x.label}` })),
      helpedBy: r.helpedBy.map((x) => ({ id: x.id, label: `${x.label}生我` })),
      drainedBy: [
        ...r.drainedBy,
        ...sameWxStems.filter((s) => s !== id).map((s) => {
          const t = STEMS.find((z) => z[0] === s);
          return { id: s, label: t[3] };
        }),
      ],
    },
  });
}

for (const [id, wx, yy, title, epithet, one] of BRANCHES) {
  const ex = BRANCH_EXTRA[id];
  const r = relWx(wx);
  entries.push({
    id,
    kind: 'branch',
    title,
    tags: { wuxing: wx, yinyang: yy, category: '地支' },
    oneLiner: one,
    structure: {
      diagram: ex.diagram,
      keywords: ex.kw,
      mappings: ex.map,
    },
    dimensions: ex.dim,
    relations: {
      generates: r.generates,
      controls: r.controls,
      helpedBy: r.helpedBy,
      drainedBy: r.drainedBy,
    },
  });
}

for (const row of TENGODS) {
  const [name, modern, one, kw, map, dim, diagram, rel] = row;
  entries.push({
    id: `tg:${name}`,
    kind: 'tengod',
    title: name,
    tags: { category: '十神', yinyang: modern },
    oneLiner: one,
    structure: { diagram, keywords: kw, mappings: map },
    dimensions: dim,
    relations: {
      generates: rel.generates.map(([id, label]) => ({ id, label })),
      controls: rel.controls.map(([id, label]) => ({ id, label })),
      helpedBy: rel.helpedBy.map(([id, label]) => ({ id, label })),
      drainedBy: rel.drainedBy.map(([id, label]) => ({ id, label })),
    },
  });
}

for (const row of SHENSHA) {
  const [name, modern, zone, one, kw, map, dim, diagram, gen, ctrl, help, drain] = row;
  entries.push({
    id: `ss:${name}`,
    kind: 'shensha',
    title: name,
    tags: { category: '星煞', wuxing: modern, yinyang: zone },
    oneLiner: one,
    structure: { diagram, keywords: kw, mappings: map },
    dimensions: dim,
    relations: {
      generates: gen.map(([id, label]) => ({ id, label })),
      controls: ctrl.map(([id, label]) => ({ id, label })),
      helpedBy: help.map(([id, label]) => ({ id, label })),
      drainedBy: drain.map(([id, label]) => ({ id, label })),
    },
  });
}

// Fix tags.wuxing undefined serialization - rewrite entryBlock for optional
function entryBlock2(e) {
  const tagParts = [`category: ${esc(e.tags.category)}`];
  if (e.tags.wuxing) tagParts.unshift(`wuxing: ${esc(e.tags.wuxing)}`);
  if (e.tags.yinyang) tagParts.push(`yinyang: ${esc(e.tags.yinyang)}`);
  const toPairs = (arr) => arr.map((x) => [x.id, x.label]);
  return `  ${esc(e.id)}: {
    id: ${esc(e.id)},
    kind: ${esc(e.kind)},
    title: ${esc(e.title)},
    tags: { ${tagParts.join(', ')} },
    oneLiner: ${esc(e.oneLiner)},
    structure: {
      diagram: ${esc(e.structure.diagram)},
      keywords: ${JSON.stringify(e.structure.keywords)},
      mappings: ${JSON.stringify(e.structure.mappings)},
    },
    dimensions: {
      personality: ${esc(e.dimensions.personality)},
      work: ${esc(e.dimensions.work)},
      love: ${esc(e.dimensions.love)},
      health: ${esc(e.dimensions.health)},
    },
    relations: {
      generates: ${links(toPairs(e.relations.generates))},
      controls: ${links(toPairs(e.relations.controls))},
      helpedBy: ${links(toPairs(e.relations.helpedBy))},
      drainedBy: ${links(toPairs(e.relations.drainedBy))},
    },
  }`;
}

const body = `/* eslint-disable */
/** Auto-generated by scripts/gen-bazi-encyclopedia.mjs — 八字图鉴全量四屏词条 */
import type { BaziEncyclopediaEntry } from './codex-encyclopedia-types.ts';

export const BAZI_ENCYCLOPEDIA: Record<string, BaziEncyclopediaEntry> = {
${entries.map(entryBlock2).join(',\n')}
};

export const BAZI_ENCYCLOPEDIA_IDS = Object.keys(BAZI_ENCYCLOPEDIA);
`;

fs.writeFileSync(out, body, 'utf8');
console.log('wrote', out, 'entries', entries.length);
