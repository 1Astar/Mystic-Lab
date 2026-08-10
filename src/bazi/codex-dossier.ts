import type { BaziEncyclopediaEntry, CodexDossier } from './codex-encyclopedia-types.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { jiaziPairsOfNayin, nayinId } from './codex-atlas-catalog.ts';
import { getNayinLore } from './codex-nayin-lore.ts';
import { stemBranchById } from './codex-lore.ts';
import { getStarCardByName } from './codex-tags.ts';
import {
  atlasShenshaDossierPatch,
  featuredShenshaRich,
} from './codex-shensha-schema.ts';
import { resolveSchoolDiff } from './codex-shensha-school-diff.ts';
import { nayinOf } from './pillar-meta.ts';
import {
  fuXingLookupLines,
  guChenGuaSuLookupLines,
  hongLuanLookupLines,
  jinYuLookupLines,
  luLookupLines,
  poSuiLookupLines,
  sanHeStarLookupLines,
  tianChuLookupLines,
  tianDeLookupLines,
  tianXiLookupLines,
  tianYiLookupLines,
  wenChangLookupLines,
  yangRenLookupLines,
  yearOffsetLookupLines,
  yueDeLookupLines,
} from './shensha.ts';

const SEASON_BY_WX: Record<string, string> = {
  木: '春季（寅卯月最旺）',
  火: '夏季（巳午月最旺）',
  土: '四季末（辰戌丑未）',
  金: '秋季（申酉月最旺）',
  水: '冬季（亥子月最旺）',
};

const LIKE_BY_WX: Record<string, string[]> = {
  木: ['水滋养', '火温暖（适度）', '金修剪（适度）'],
  火: ['木生发', '水调节', '土承载（适度）'],
  土: ['火生扶', '金疏通', '木疏土（适度）'],
  金: ['土生金', '水泄秀（适度）', '火炼金（适度）'],
  水: ['金生水', '木泄秀（适度）', '土堤防（适度）'],
};

const DISLIKE_BY_WX: Record<string, string[]> = {
  木: ['土过重压根', '金过强削伐', '木过旺成林无主'],
  火: ['水过重熄灭', '火过旺灼伤', '金过强夺气'],
  土: ['木过旺克土', '水过重成泥', '土过厚壅滞'],
  金: ['火过旺熔金', '木过旺耗金', '金过锐伤人'],
  水: ['土过重塞流', '火过旺蒸发', '水过泛无归'],
};

const PILLAR_DEFAULT = {
  year: '年柱：家族根底、早年环境与出身底色。',
  month: '月柱：父母/社会环境、职业底色与当令气场。',
  day: '日柱：自我与伴侣关系，日主本体所在。',
  hour: '时柱：晚年、子女、未来方向与成果出口。',
};

/** 甲木级完整档案；其余天干用同构精简版 */
const STEM_RICH: Record<string, Partial<CodexDossier>> = {
  甲: {
    whatIs: '甲木是什么：参天大树、栋梁之材。天干第一位，主骨力、方向与向上生长。',
    season: '旺季：春季（寅卯月）',
    likes: ['水滋养', '火温暖', '金修剪'],
    dislikes: ['土过重', '金过强', '木过旺'],
    personality: '有原则、重成长、抗压、目标感强；方向一立就不轻易改。',
    strength: '开创、带队、立大目标、户外开拓、长期建设。',
    imbalance: '固执、理想化、过度承担；硬碰硬易折。',
    career: '管理、教育、研究、规划、长期建设、创业开拓。',
    wealth: '靠持续积累与资源整合；忌短线投机、无根漂浮。',
    love: '重视稳定、责任与共同成长；要尊重与并肩。',
    body: '筋骨与肝气；久坐僵硬、易怒时要伸展与放慢。',
    chartRole: '在命盘中代表「向上生长的主轴」——出现则该柱带骨力与方向感。',
    combos: [
      { peer: '庚金', note: '甲木遇庚金：压力、规则、权威，也可能形成成就（金克木成器）。' },
      { peer: '壬水', note: '甲木遇壬水：学习、滋养、贵人、思维扩展（水生木）。' },
      { peer: '丁火', note: '甲木遇丁火：理想照亮、表达与被看见（木生火）。' },
      { peer: '戊土', note: '甲木遇戊土：开拓与承载的博弈；土重则压根，适度可立业。' },
    ],
    positive: '正面：正直有骨、能扛事、愿做长期建设。失衡：固执理想化、过度承担。',
    memory: '甲木 = 参天大树：要水润、要火暖、要金修剪，忌土压金伐。',
    coreKeyword: '参天大树 · 栋梁之材',
    pillarMeaning: {
      year: '出现在年柱：家族、早年环境与出身底色偏「木」——重原则、有方向感。',
      month: '出现在月柱：父母、社会环境、职业底色——当令则生长力强。',
      day: '出现在日柱：自我与伴侣关系——本人即甲木，要尊重与并肩成长。',
      hour: '出现在时柱：晚年、子女、未来方向——成果向「成林成材」收口。',
    },
  },
  乙: {
    whatIs: '乙木是什么：藤萝花草、柔韧善绕。天干阴木，主适应、迂回与攀附生长。',
    season: '旺季：春季（寅卯月）',
    likes: ['癸水细润', '丙火照暖（适度）', '庚金成合（适度）'],
    dislikes: ['土过重埋根', '金过强割藤', '无依可攀'],
    personality: '柔韧善绕，适应力强，也易优柔寡断、过度迁就。',
    strength: '协调、审美、关系经营、迂回推进、在夹缝中找路。',
    imbalance: '优柔、依附过重、绕行过头失去方向。',
    career: '协调、设计、咨询、关系经营、需要迂回推进的岗位。',
    wealth: '靠人脉与细水长流；忌硬碰硬、也忌无主见跟风投机。',
    love: '重氛围与被理解；要边界清晰，别把柔软活成讨好。',
    body: '肝气与筋络；易紧绷、易闷，宜舒展与说清楚。',
    chartRole: '在命盘中代表「柔性生长」——该柱善绕、善合，也需防无骨。',
    combos: [
      { peer: '庚金', note: '乙庚合：规则与柔韧的结盟，也可能被约束。' },
      { peer: '癸水', note: '癸水润乙：细润滋养，适合学习与审美生长。' },
      { peer: '丙火', note: '乙木见丙：被照亮、被看见；火过则焦。' },
    ],
    positive: '正面：柔韧会绕、能成全场面。失衡：优柔依附、方向模糊。',
    memory: '乙木 = 藤萝花草：要细水、要暖光、要可攀之木，忌硬砍无依。',
    coreKeyword: '藤萝花草 · 柔韧生长',
    pillarMeaning: {
      year: '年柱见乙：早年环境偏柔韧、重关系与适应。',
      month: '月柱见乙：事业场善协调迂回，忌无主见。',
      day: '日柱见乙：自我如藤——要边界，也要可依靠的支架。',
      hour: '时柱见乙：晚成与子女缘偏柔软细作。',
    },
  },
  丙: {
    whatIs: '丙火是什么：正午太阳、光明外放。天干阳火，主可见度、带动与热情。',
    season: '旺季：夏季（巳午月）',
    likes: ['甲乙木生发', '壬水调节（适度）', '土承载出口'],
    dislikes: ['水过重熄灭', '火过旺自焚', '金过强夺气'],
    personality: '热情可见、敢表达，也易急躁灼人。',
    strength: '表达、传播、带动气氛、公开场合的热度。',
    imbalance: '过热、急躁、消耗过快、只顾照别人忘休息。',
    career: '表达、传播、舞台、教学、对外业务。',
    wealth: '靠曝光与带动变现；忌只烧热情不沉淀现金流。',
    love: '大方热情；要记得给对方「不公开的亲密」。',
    body: '心血管与消耗；易上火，宜降温、睡眠、少硬撑。',
    chartRole: '在命盘中代表「照亮与外放」——该柱要被看见，也怕过曝。',
    combos: [
      { peer: '甲木', note: '甲生丙：燃料充足，表达有根。' },
      { peer: '壬水', note: '壬水见丙：既济或冲突，看水火比例。' },
      { peer: '戊土', note: '丙生戊：热情落成承载与事业。' },
    ],
    positive: '正面：光明带动、敢站前排。失衡：急躁灼人、燃尽自己。',
    memory: '丙火 = 正午太阳：要木生、要水调、忌水灭火焚。',
    coreKeyword: '正午太阳 · 光明外放',
    pillarMeaning: {
      year: '年柱见丙：出身场偏亮、早年易被看见。',
      month: '月柱见丙：事业靠表达与带动。',
      day: '日柱见丙：本人即太阳——要出口，也要降温。',
      hour: '时柱见丙：晚成与子女场偏热度与表现。',
    },
  },
  丁: {
    whatIs: '丁火是什么：烛光灯火、细腻照明。天干阴火，主洞察、精致与内在光。',
    season: '旺季：夏季（巳午月）',
    likes: ['甲乙木续焰', '庚金成器（适度）', '土收束'],
    dislikes: ['风大吹灭', '水过重浇灭', '只燃自己不照人'],
    personality: '重感受与细节，也易内耗、怕被忽视。',
    strength: '策划、精细表达、一对一照明、审美与判断。',
    imbalance: '内耗、敏感、怕被忽视、光太小不敢亮。',
    career: '策划、设计、编辑、咨询、精细服务。',
    wealth: '靠专业细活与信任变现；忌只内耗不报价。',
    love: '要被认真看见；别用猜代替说。',
    body: '血脉与睡眠；思虑过密时先熄灯休息。',
    chartRole: '在命盘中代表「小而准的光」——该柱亮在细节，不在喧哗。',
    combos: [
      { peer: '甲木', note: '甲木生丁：有燃料，烛火稳。' },
      { peer: '庚金', note: '丁火炼庚：炼成器，也可过热伤金。' },
      { peer: '壬水', note: '丁壬合：情感与智谋交织，宜防纠缠。' },
    ],
    positive: '正面：细腻照明、判断准。失衡：内耗敏感、不敢亮相。',
    memory: '丁火 = 烛光：要木续、要避狂风，忌浇灭与自焚。',
    coreKeyword: '烛光灯火 · 细腻照明',
    pillarMeaning: {
      year: '年柱见丁：早年重细节感受与「被看见」。',
      month: '月柱见丁：事业偏精细表达与策划。',
      day: '日柱见丁：自我如烛——要燃料，也要被护住。',
      hour: '时柱见丁：晚成与子女场偏细火慢功。',
    },
  },
  戊: {
    whatIs: '戊土是什么：高山厚土、承载稳重。天干阳土，主托底、边界与长期运营。',
    season: '旺季：四季末（辰戌丑未）',
    likes: ['丙火生扶', '甲木疏土（适度）', '金疏通'],
    dislikes: ['木过旺克破', '水过重成泥', '土过厚壅滞'],
    personality: '可靠能扛，也易固执沉重、拒绝变化。',
    strength: '管理、基建、资源承载、长期运营、给人安全感。',
    imbalance: '僵化、负担过重、拒绝变化、把所有重量扛自己肩上。',
    career: '管理、基建、运营、地产/实体、托底型岗位。',
    wealth: '靠稳定现金流与资产沉淀；忌死守不流通。',
    love: '重承诺与托底；要学会把话说明白，别只「扛着」。',
    body: '脾胃与沉重感；宜活动疏通，少积郁。',
    chartRole: '在命盘中代表「托底与边界」——该柱能承载，也怕壅塞。',
    combos: [
      { peer: '丙火', note: '丙生戊：热情落成事业承载。' },
      { peer: '甲木', note: '甲克戊：疏土成田，过则破堤。' },
      { peer: '辛金', note: '戊生辛：厚土生精金，资源变标准。' },
    ],
    positive: '正面：稳重可托、能成事。失衡：僵化过重、拒绝流动。',
    memory: '戊土 = 高山：要火暖、要木疏、要金通，忌壅塞成墙。',
    coreKeyword: '高山厚土 · 承载稳重',
    pillarMeaning: {
      year: '年柱见戊：出身场重稳定与责任。',
      month: '月柱见戊：事业靠托底与长期运营。',
      day: '日柱见戊：本人即山——要边界，也要出口。',
      hour: '时柱见戊：晚成偏守成与传承。',
    },
  },
  己: {
    whatIs: '己土是什么：田园湿土、滋养细作。天干阴土，主含藏、滋养与细致经营。',
    season: '旺季：四季末（辰戌丑未）',
    likes: ['丁火暖土', '甲木疏理（适度）', '水润不过涝'],
    dislikes: ['水过重成泥', '木过旺翻土', '黏滞不决'],
    personality: '能藏能容，也易黏滞、纠结、过度照顾。',
    strength: '滋养、细作、运营维护、把事情「种」出来。',
    imbalance: '纠结、黏滞、过度照顾、边界模糊。',
    career: '运营、客服、农业/内容细作、滋养型服务。',
    wealth: '靠细水耕耘；忌把所有资源都埋进人情。',
    love: '重照顾与安全感；要说清需要，别只默默付出。',
    body: '脾胃与湿滞；宜规律饮食与轻动。',
    chartRole: '在命盘中代表「可耕的田」——该柱能养人，也怕涝与黏。',
    combos: [
      { peer: '丁火', note: '丁暖己：细火养田，宜细作。' },
      { peer: '甲木', note: '甲疏己：有条理才不黏；过则翻土。' },
      { peer: '癸水', note: '癸润己：润则生，涝则泥。' },
    ],
    positive: '正面：能养能藏、细作有成。失衡：黏滞讨好、难决断。',
    memory: '己土 = 田园：要暖火、要疏木、要适度水，忌涝黏。',
    coreKeyword: '田园湿土 · 滋养细作',
    pillarMeaning: {
      year: '年柱见己：早年环境偏滋养与人情细作。',
      month: '月柱见己：事业靠运营维护与细耕。',
      day: '日柱见己：自我如田——要边界，也要被耕种。',
      hour: '时柱见己：晚成偏滋养与积累。',
    },
  },
  庚: {
    whatIs: '庚金是什么：刀剑矿石、锋利果断。天干阳金，主规则、决断与改革力。',
    season: '旺季：秋季（申酉月）',
    likes: ['土生金', '丁火炼（适度）', '水泄秀（适度）'],
    dislikes: ['火过旺熔金', '木过旺耗金', '金过锐伤人'],
    personality: '重原则、敢决断，也易伤人伤己、批判过重。',
    strength: '规则、技术、执行、改革、切开混乱立秩序。',
    imbalance: '过刚、批判过重、难以柔软、易冲突。',
    career: '技术、法务、工程、改革执行、标准制定。',
    wealth: '靠专业壁垒与决断变现；忌只砍不建。',
    love: '要尊重与清晰契约；锋利话要学会收。',
    body: '肺与筋骨刚；压力大时宜泄不宜硬扛。',
    chartRole: '在命盘中代表「切开与成器」——该柱能立规矩，也怕过刚。',
    combos: [
      { peer: '甲木', note: '庚克甲：压力与成器，规则塑造栋梁。' },
      { peer: '丁火', note: '丁火炼庚：火炼成器，也可过热伤金。' },
      { peer: '乙木', note: '乙庚合：柔韧与规则结盟。' },
    ],
    positive: '正面：果断有刃、能成器。失衡：过刚伤人、难柔软。',
    memory: '庚金 = 刀剑：要土生、要火炼、要水润口，忌熔毁与空砍。',
    coreKeyword: '刀剑矿石 · 锋利果断',
    pillarMeaning: {
      year: '年柱见庚：早年场重规则与果断。',
      month: '月柱见庚：事业靠执行与标准。',
      day: '日柱见庚：本人即刃——要收放，不要乱挥。',
      hour: '时柱见庚：晚成偏改革与成果切割。',
    },
  },
  辛: {
    whatIs: '辛金是什么：珠玉精金、精致敏锐。天干阴金，主品质、标准与细锐判断。',
    season: '旺季：秋季（申酉月）',
    likes: ['己土生金', '壬水泄秀（适度）', '丙火提纯（适度）'],
    dislikes: ['火过旺熔毁', '土过浊埋玉', '挑剔到无法出手'],
    personality: '重品质与细节，也易挑剔敏感、易碎感。',
    strength: '审美、标准、精细工艺、品质管理、洞察瑕疵。',
    imbalance: '挑剔、敏感、易碎、标准过高卡住自己。',
    career: '设计、品控、珠宝/工艺、咨询、精细专业。',
    wealth: '靠稀缺品质溢价；忌只鉴赏不交付。',
    love: '要被珍惜与尊重边界；别把挑剔当关心。',
    body: '肺与皮肤敏感；压力时宜润不宜干耗。',
    chartRole: '在命盘中代表「精致标准」——该柱亮在品质，也怕易碎。',
    combos: [
      { peer: '己土', note: '己生辛：田园育精金。' },
      { peer: '壬水', note: '辛金生水：精锐变智谋与流动。' },
      { peer: '丙火', note: '丙火见辛：提纯或熔毁，看火候。' },
    ],
    positive: '正面：精致敏锐、有标准。失衡：挑剔易碎、难出手。',
    memory: '辛金 = 珠玉：要土生、要水润、要适度火提纯，忌熔毁与埋没。',
    coreKeyword: '珠玉精金 · 精致敏锐',
    pillarMeaning: {
      year: '年柱见辛：早年重品质与被珍视。',
      month: '月柱见辛：事业靠标准与精细。',
      day: '日柱见辛：自我如玉——要护，也要敢示人。',
      hour: '时柱见辛：晚成偏精品与细节成果。',
    },
  },
  壬: {
    whatIs: '壬水是什么：江河大海、气魄流动。天干阳水，主智谋、跨界与开阔吞吐。',
    season: '旺季：冬季（亥子月）',
    likes: ['庚金生水', '甲木泄秀（适度）', '土堤防（适度）'],
    dislikes: ['土过重塞流', '火过旺蒸发', '水过泛无归'],
    personality: '智谋开阔，也易散漫、想法过多难落地。',
    strength: '跨界整合、智谋布局、流动资源、打开局面。',
    imbalance: '散漫、无归、想法过多、难收口。',
    career: '策略、贸易、媒体、流动型与跨界整合。',
    wealth: '靠信息差与流动机会；忌只流不囤。',
    love: '要自由也要锚点；别用「想开了」回避承诺。',
    body: '肾与循环；思虑过散时宜睡眠与收束。',
    chartRole: '在命盘中代表「大河吞吐」——该柱能开局，也怕无岸。',
    combos: [
      { peer: '甲木', note: '壬生甲：滋养生长，贵人与学习扩展。' },
      { peer: '丙火', note: '壬水见丙：水火既济或冲突，看比例。' },
      { peer: '庚金', note: '庚生壬：规则生智谋，源源有来。' },
    ],
    positive: '正面：开阔智谋、能开局。失衡：散漫无归、难落地。',
    memory: '壬水 = 江海：要金生、要木泄、要土岸，忌塞与蒸发。',
    coreKeyword: '江河大海 · 气魄流动',
    pillarMeaning: {
      year: '年柱见壬：早年场开阔、信息多。',
      month: '月柱见壬：事业靠流动与布局。',
      day: '日柱见壬：本人即河——要岸，也要流。',
      hour: '时柱见壬：晚成偏开阔出口与智谋收成。',
    },
  },
  癸: {
    whatIs: '癸水是什么：雨露甘泉、润物无声。天干阴水，主直觉、渗透与细润滋养。',
    season: '旺季：冬季（亥子月）',
    likes: ['辛金生水', '乙木泄秀（适度）', '适度火暖'],
    dislikes: ['土过重埋泉', '火过旺蒸干', '忧思无出口'],
    personality: '直觉细、润人，也易忧思、边界不清。',
    strength: '滋养、咨询、研究、细流渗透、感知人心。',
    imbalance: '忧思、内耗、边界不清、润别人忘自己。',
    career: '咨询、研究、心理/内容滋养、细渗透型工作。',
    wealth: '靠信任与细专业；忌情绪化决策。',
    love: '重心意与氛围；要说清边界，别只默默下雨。',
    body: '肾与情绪湿郁；宜作息稳定、少自我消耗。',
    chartRole: '在命盘中代表「无声滋养」——该柱能润人，也怕被抽干。',
    combos: [
      { peer: '乙木', note: '癸润乙：细水养花，审美与学习。' },
      { peer: '辛金', note: '辛生癸：精锐生细流。' },
      { peer: '戊土', note: '戊土见癸：堤与泉的博弈，适度成田。' },
    ],
    positive: '正面：润物细无声、感知准。失衡：忧思内耗、边界糊。',
    memory: '癸水 = 雨露：要金生、要木泄、忌土埋火蒸。',
    coreKeyword: '雨露甘泉 · 润物无声',
    pillarMeaning: {
      year: '年柱见癸：早年重感受与细润。',
      month: '月柱见癸：事业靠渗透与滋养专业。',
      day: '日柱见癸：自我如泉——要源头，也要出口。',
      hour: '时柱见癸：晚成偏细润成果与心意交付。',
    },
  },
};

function wxOf(entry: BaziEncyclopediaEntry): string {
  return entry.tags.wuxing || '';
}

function yyOf(entry: BaziEncyclopediaEntry): string {
  return entry.tags.yinyang || '';
}

function buildStemDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  const wx = wxOf(entry);
  const rich = STEM_RICH[entry.id] || {};
  const lore = stemBranchById(entry.id);
  return {
    whatIs: rich.whatIs || `${entry.title}是什么：${lore?.epithet || entry.oneLiner}`,
    wuxingLabel: wx || entry.tags.category,
    yinyangLabel: yyOf(entry) && wx ? `${yyOf(entry)}${wx}` : yyOf(entry) || '—',
    season: rich.season || (wx ? `旺季：${SEASON_BY_WX[wx] || '视月令而定'}` : '视月令与日主而定'),
    likes: rich.likes || LIKE_BY_WX[wx] || ['得令得地', '有生扶', '有出口'],
    dislikes: rich.dislikes || DISLIKE_BY_WX[wx] || ['过旺无制', '过弱无扶', '被强克'],
    personality: rich.personality || entry.dimensions.personality,
    strength: rich.strength || entry.structure.mappings.slice(0, 3).join('、') || entry.structure.keywords.join('、'),
    imbalance: rich.imbalance || `过旺或受克时，易放大「${entry.structure.keywords.slice(-2).join('、')}」一面。`,
    career: rich.career || entry.dimensions.work,
    wealth: rich.wealth || '财富节奏与该气是否得令、是否有财星流通相关；忌气滞无出口。',
    love: rich.love || entry.dimensions.love,
    body: rich.body || entry.dimensions.health,
    chartRole: rich.chartRole || entry.structure.diagram,
    combos: rich.combos || defaultCombos(entry),
    positive: rich.positive || `正面：${entry.structure.keywords.slice(0, 3).join('、')}。失衡见性格短板。`,
    memory: rich.memory || entry.oneLiner,
    pillarMeaning: rich.pillarMeaning || {
      year: `${entry.title}${PILLAR_DEFAULT.year}`,
      month: `${entry.title}${PILLAR_DEFAULT.month}`,
      day: `${entry.title}${PILLAR_DEFAULT.day}`,
      hour: `${entry.title}${PILLAR_DEFAULT.hour}`,
    },
    coreKeyword: rich.coreKeyword || entry.structure.keywords.slice(0, 2).join(' · ') || lore?.epithet || entry.title,
  };
}

function defaultCombos(entry: BaziEncyclopediaEntry): { peer: string; note: string }[] {
  const out: { peer: string; note: string }[] = [];
  for (const g of entry.relations.generates.slice(0, 2)) {
    out.push({ peer: g.label, note: `${entry.title}生${g.label}：能量外泄或成就下游。` });
  }
  for (const c of entry.relations.controls.slice(0, 2)) {
    out.push({ peer: c.label, note: `${entry.title}克${c.label}：约束、改造或压力点。` });
  }
  for (const h of entry.relations.helpedBy.slice(0, 1)) {
    out.push({ peer: h.label, note: `${h.label}生扶${entry.title}：滋养、贵人、资源。` });
  }
  return out;
}

function buildBranchDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  const wx = wxOf(entry);
  const lore = stemBranchById(entry.id);
  return {
    whatIs: `${entry.title}是什么：${lore?.epithet || ''}。地支藏气与季节场。`,
    wuxingLabel: wx ? `${yyOf(entry) || ''}${wx}` : '地支',
    yinyangLabel: yyOf(entry) || '—',
    season: SEASON_BY_WX[wx] ? `对应季节倾向：${SEASON_BY_WX[wx]}` : '视月令',
    likes: LIKE_BY_WX[wx] || ['通根得气', '有合有生'],
    dislikes: DISLIKE_BY_WX[wx] || ['冲克过重', '刑害纠结'],
    personality: entry.dimensions.personality,
    strength: entry.structure.keywords.join('、'),
    imbalance: `冲合刑害发动时，易放大「${entry.structure.keywords.slice(-1)[0] || '动荡'}」面。`,
    career: entry.dimensions.work,
    wealth: '地支主「地」与资源落点；库、墓、合局影响财源形态。',
    love: entry.dimensions.love,
    body: entry.dimensions.health,
    chartRole: '地支看藏干、六亲落点、冲合刑害与身体部位对应。',
    combos: defaultCombos(entry),
    positive: entry.oneLiner,
    memory: entry.oneLiner,
    pillarMeaning: {
      year: `年支：早年环境与家族气场落在「${entry.title}」。`,
      month: `月支：月令核心——是否得令看此柱权重最大。`,
      day: `日支：配偶宫与自我落脚处。`,
      hour: `时支：子女/晚成与未来出口。`,
    },
    coreKeyword: lore?.epithet || entry.structure.keywords[0] || entry.title,
  };
}

function buildTengodDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  return {
    whatIs: `${entry.title}是什么：${entry.oneLiner}`,
    wuxingLabel: '十神（相对日主）',
    yinyangLabel: entry.tags.yinyang || '—',
    season: '旺衰看该十神所坐干支是否得令、得地、得势。',
    likes: ['比例适中', '有制有化', '落在有用之柱'],
    dislikes: ['过旺无制', '过弱无扶', '与忌神叠加重克'],
    personality: entry.dimensions.personality,
    strength: entry.structure.keywords.join('、'),
    imbalance: `过旺过弱时，十神的正负表现都会放大。`,
    career: entry.dimensions.work,
    wealth: '财星类十神直接关联求财方式；官杀关联平台与规则。',
    love: entry.dimensions.love,
    body: entry.dimensions.health,
    chartRole: '十神连六亲与现实事件：看落柱、组合与流年触发。',
    combos: defaultCombos(entry),
    positive: `正面：${entry.structure.keywords.slice(0, 3).join('、')}。失衡见维度说明。`,
    memory: entry.oneLiner,
    pillarMeaning: {
      year: `年柱见${entry.title}：早年/家族议题带该十神色彩。`,
      month: `月柱见${entry.title}：职业底色与社会角色。`,
      day: `日柱见${entry.title}：自我或配偶议题。`,
      hour: `时柱见${entry.title}：子女/成果/晚成方向。`,
    },
    coreKeyword: entry.structure.keywords.slice(0, 2).join(' · ') || entry.title,
  };
}

function buildWuxingDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  const wx = entry.id;
  return {
    whatIs: `${entry.title}是什么：${entry.oneLiner}`,
    wuxingLabel: wx,
    yinyangLabel: '五行本气',
    season: SEASON_BY_WX[wx] || '四季流转',
    likes: LIKE_BY_WX[wx] || [],
    dislikes: DISLIKE_BY_WX[wx] || [],
    personality: entry.dimensions.personality,
    strength: entry.structure.keywords.join('、'),
    imbalance: `五行过旺或缺失，都会在性格与事件上留下印记。`,
    career: entry.dimensions.work,
    wealth: '缺则补、旺则泄；喜忌看日主与调候。',
    love: entry.dimensions.love,
    body: entry.dimensions.health,
    chartRole: '看命盘该行是否得令、是否缺失、是否为喜用。',
    combos: defaultCombos(entry),
    positive: entry.oneLiner,
    memory: entry.oneLiner,
    pillarMeaning: PILLAR_DEFAULT,
    coreKeyword: entry.structure.keywords.slice(0, 2).join(' · ') || entry.title,
  };
}

function buildShellDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  return {
    whatIs: `${entry.title}是什么：${entry.oneLiner}`,
    wuxingLabel: entry.tags.wuxing || entry.tags.category,
    yinyangLabel: entry.tags.yinyang || '—',
    season: '骨架条目 · 旺衰细则待补。',
    likes: ['对照原局', '合十神格局看', '合大运流年看'],
    dislikes: ['单独当断语', '脱离日主强弱'],
    personality: entry.dimensions.personality,
    strength: entry.structure.keywords.join('、'),
    imbalance: '信息不足时勿下重断。',
    career: entry.dimensions.work,
    wealth: '须合财星与运岁，本条仅为索引。',
    love: entry.dimensions.love,
    body: entry.dimensions.health,
    chartRole: entry.structure.diagram,
    combos: [],
    positive: entry.oneLiner,
    memory: entry.oneLiner,
    pillarMeaning: {
      year: `年柱见「${entry.title}」：早年/家族议题对照。`,
      month: `月柱见「${entry.title}」：事业与社会场对照。`,
      day: `日柱见「${entry.title}」：自我与伴侣对照。`,
      hour: `时柱见「${entry.title}」：子女与晚成对照。`,
    },
    coreKeyword: entry.structure.keywords.slice(0, 2).join(' · ') || entry.title,
  };
}

const NAYIN_BOUNDARY =
  '纳音是干支对的气象画面，只能辅助理解柱的气质；不能脱离日主强弱、格局、十神和大运单独判断贵贱吉凶。';

function buildNayinDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  const base = buildShellDossier(entry);
  const lore = getNayinLore(entry.title);
  const wx = entry.tags.wuxing || '';
  const pairs = jiaziPairsOfNayin(entry.title);
  const pairLine = pairs.length ? pairs.join('、') : '见六十甲子表';
  return {
    ...base,
    whatIs: lore
      ? `${entry.title}是什么：纳音之一，属${wx || '五行'}。${lore.scene}`
      : `${entry.title}是什么：纳音气象意象。${entry.oneLiner}`,
    wuxingLabel: wx || '纳音',
    yinyangLabel: '纳音',
    season: `对应甲子：${pairLine}。旺衰仍看月令与日主，不以纳音替代。`,
    likes: lore?.need || LIKE_BY_WX[wx] || base.likes,
    dislikes: lore?.avoid || DISLIKE_BY_WX[wx] || base.dislikes,
    personality: lore?.temperament || base.personality,
    strength: lore?.strength || base.strength,
    imbalance: lore?.imbalance || '常见误读：用纳音单独断贵贱。须回到干支十神与格局。',
    career: lore?.career || base.career,
    wealth: lore?.wealth || base.wealth,
    love: lore?.love || base.love,
    body: lore?.body || base.body,
    chartRole: `${NAYIN_BOUNDARY}落在某柱时，给该柱一个「${entry.title}」画面，不是命运标签。`,
    combos: [
      ...pairs.map((gz) => ({
        peer: gz,
        note: `${gz} → 纳音${entry.title}`,
      })),
      ...(wx
        ? [
            {
              peer: wx,
              note: `纳音五行属${wx}：合原局${wx}气与喜用看，勿只凭纳音定喜忌。`,
            },
          ]
        : []),
    ],
    positive: lore
      ? `正面：${lore.strength} 失衡：${lore.imbalance}`
      : `正面参考：${entry.oneLiner}`,
    memory: lore?.memory || `${entry.title} · ${entry.oneLiner} · 纳音补画面，勿单断。`,
    pillarMeaning: {
      year: `年柱纳音${entry.title}：早年/家族底色带此气象画面。`,
      month: `月柱纳音${entry.title}：事业与社会场的气质滤镜。`,
      day: `日柱纳音${entry.title}：自我与伴侣场的主画面；仍以日主十神为准。`,
      hour: `时柱纳音${entry.title}：子女与晚成出口的气象。`,
    },
    coreKeyword: lore?.coreKeyword || `${entry.title} · ${wx || '纳音'}`,
  };
}

function buildJiaziDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  const base = buildShellDossier(entry);
  const gz = entry.title;
  const stem = gz.charAt(0);
  const branch = gz.charAt(1);
  const ny = nayinOf(gz);
  const lore = getNayinLore(ny);
  const stemEntry = getBaziEncyclopedia(stem);
  const branchEntry = getBaziEncyclopedia(branch);
  const yy =
    stemEntry?.tags.yinyang && stemEntry?.tags.wuxing
      ? `${stemEntry.tags.yinyang}${stemEntry.tags.wuxing}`
      : stemEntry?.tags.yinyang || '—';
  return {
    ...base,
    whatIs: `${gz}是什么：六十甲子之一。天干${stem}、地支${branch}，纳音${ny}。${
      lore ? lore.scene : entry.oneLiner
    }`,
    wuxingLabel:
      stemEntry?.tags.wuxing || getBaziEncyclopedia(nayinId(ny))?.tags.wuxing || '甲子',
    yinyangLabel: yy,
    season: `纳音${ny}；天干看${stem}，地支看${branch}。甲子是索引，旺衰看月令与日主。`,
    likes: [
      `合读天干「${stem}」`,
      `合读地支「${branch}」`,
      `合读纳音「${ny}」`,
      '合十神格局与大运',
    ],
    dislikes: ['只凭甲子名断吉凶', '忽略日主强弱', '纳音与十神两套重复结论'],
    personality:
      lore?.temperament ||
      [stemEntry?.dimensions.personality, branchEntry?.dimensions.personality].filter(Boolean).join('；') ||
      base.personality,
    strength: lore?.strength || stemEntry?.structure.keywords.slice(0, 2).join('、') || base.strength,
    imbalance:
      lore?.imbalance ||
      '常见误读：把某甲子当成单独命运标签。须拆回干、支、纳音画面，再合日主格局。',
    career: lore?.career || stemEntry?.dimensions.work || base.career,
    wealth: lore?.wealth || '须合财星与运岁；甲子只提供干支纳音索引。',
    love: lore?.love || branchEntry?.dimensions.love || base.love,
    body: lore?.body || stemEntry?.dimensions.health || base.body,
    chartRole:
      '六十甲子是干支对的完整编码：点开后应落到天干、地支与纳音三层。不能脱离日主、格局、十神和大运单独判断。',
    combos: [
      { peer: stem, note: `天干${stem}：日主/十神关系的主轴之一。` },
      { peer: branch, note: `地支${branch}：藏干、刑冲合害与宫位场。` },
      { peer: ny, note: `纳音${ny}：本柱气象画面。` },
    ],
    positive: lore
      ? `正面画面：${lore.strength} 使用边界：甲子是索引不是判决书。`
      : `${gz} = ${stem}+${branch}+纳音${ny}。索引，勿单断。`,
    memory: `${gz} = ${stem}+${branch} · 纳音${ny}。先拆三层，再合原局。`,
    pillarMeaning: {
      year: `年柱见${gz}：早年/家族编码为此干支对与纳音${ny}。`,
      month: `月柱见${gz}：事业与月令场以此干支对为当令线索。`,
      day: `日柱见${gz}：日主坐${branch}，纳音${ny}为自我画面。`,
      hour: `时柱见${gz}：晚成与子女出口编码。`,
    },
    coreKeyword: `${gz} · ${ny}`,
  };
}

/** 精品/MORE 手写档案（天乙 = 神煞里的「甲木」模板；其余名录由 schema 推广） */
const SHENSHA_RICH: Record<string, Partial<CodexDossier>> = {
  'ss:天乙贵人': featuredShenshaRich({
    name: '天乙贵人',
    whatIs:
      '天乙贵人是什么：传统贵人星。像暗路里的一束光——逢凶化吉，关键时刻总有人相助；不是天上掉馅饼。',
    lookupLabel: '按日干取贵人支',
    lookupLines: tianYiLookupLines(),
    lookupPeer: '日干→贵人支',
    likes: ['先难后贵', '主动求助', '合日主强弱与格局看'],
    dislikes: ['当作单独好运断语', '因有贵人而懈怠', '恐吓式「无贵人必凶」'],
    strength: '贵人提携、逢凶化吉、关键抉择有顾问感。',
    career: '贵人型机会多；仍要自己走完难段，贵人是加速器不是代步车。',
    wealth: '宜合财星与运岁看「谁帮得上忙」；忌赌「有贵人必发财」。',
    love: '易遇帮扶型缘分；分清援助与依赖。',
    body: '大病大灾时易得援助，仍重预防与及时就医。',
    chartExtra: '天乙落柱标「可能有贵人气场」，不是保票。',
    positive: '正面：逢凶化吉、关键时刻有人相助。失衡：空等救援、或因「有贵人」而松懈。',
    memory: '天乙贵人 = 暗路一束光：先难后贵；查日干取支。辅助信息，勿单独断。',
    coreKeyword: '贵人 · 逢凶化吉',
    pillarMeaning: {
      year: '年柱见天乙：早年/家族场易得提携或长辈庇护感。',
      month: '月柱见天乙：事业与社会场贵人气较显，宜主动对接。',
      day: '日柱见天乙：自我与伴侣场「关键时有人拉一把」；别把求助活成等待。',
      hour: '时柱见天乙：晚成、子女或出口场易遇援助；仍要先走难段。',
    },
  }),
  'ss:文昌': featuredShenshaRich({
    name: '文昌',
    whatIs:
      '文昌是什么：学业才华之星。灵感如箭、文书机智常在；聪明不等于落地，要练手。',
    lookupLabel: '按日干取文昌支',
    lookupLines: wenChangLookupLines(),
    lookupPeer: '日干→文昌支',
    likes: ['练习与输出', '考试文书窗口', '合印星食伤看'],
    dislikes: ['只想不做', '当作「必过考」保票', '脱离日主强弱空谈才华'],
    strength: '学业、文书、表达、机智命中感。',
    career: '利文职、考试、内容与表达岗；仍要交付作品。',
    wealth: '靠专业表达与知识变现；忌停留在点子层。',
    love: '用表达连接；别用聪明回避亲密。',
    body: '用脑过度伤睡眠；宜作息与运动泄压。',
    chartExtra: '文昌落柱标「文书/学习气场」，不是学历证书。',
    positive: '正面：灵感准、好学善表。失衡：想得多做得少。',
    memory: '文昌 = 准箭：查日干取支；聪明要落地。辅助信息，勿单独断。',
    coreKeyword: '学业 · 文书才华',
    pillarMeaning: {
      year: '年柱见文昌：早年学习环境或家族重文。',
      month: '月柱见文昌：事业场利文书考试与表达。',
      day: '日柱见文昌：本人学习/表达欲强；要练手。',
      hour: '时柱见文昌：晚成与子女场偏学业文书成果。',
    },
  }),
  'ss:禄神': featuredShenshaRich({
    name: '禄神',
    whatIs:
      '禄神是什么：日干之禄，稳定根基与衣食底气；禄在不等于躺平，要用来积累。',
    lookupLabel: '按日干取禄支',
    lookupLines: luLookupLines(),
    lookupPeer: '日干→禄支',
    likes: ['积累与守成', '基本盘清晰', '合财官看流通'],
    dislikes: ['当作「怎么都行」', '只享禄不经营', '脱离格局空谈衣食'],
    strength: '站住、吃饭、基本盘稳定感。',
    career: '利守成与专业根基岗；宜把禄转成可复用能力。',
    wealth: '偏稳定现金流；忌挥霍「以为永远有禄」。',
    love: '能给人安全感；别用「我能养」代替沟通。',
    body: '脾胃与体力底；宜规律饮食，少硬撑。',
    chartExtra: '禄落柱标「根基气场」，不是铁饭碗保票。',
    positive: '正面：有底气能站住。失衡：躺平或死守不流通。',
    memory: '禄神 = 站住吃饭的底气：查日干取禄。辅助信息，勿单独断。',
    coreKeyword: '禄 · 稳定根基',
    pillarMeaning: {
      year: '年柱见禄：早年衣食或家族根基感。',
      month: '月柱见禄：事业场基本盘较稳。',
      day: '日柱见禄：本人自带站住感；要用来积累。',
      hour: '时柱见禄：晚成与出口场偏衣食成果。',
    },
  }),
  'ss:羊刃': featuredShenshaRich({
    name: '羊刃',
    whatIs:
      '羊刃是什么：极端刚烈之星。爆发与果决强，锋利敢冲，也易刺人；练的是收放。',
    lookupLabel: '按日干取羊刃支',
    lookupLines: yangRenLookupLines(),
    lookupPeer: '日干→羊刃支',
    likes: ['有制有泄', '关键时刻果断', '合七杀/印看收放'],
    dislikes: ['恐吓式「有刃必凶」', '硬刚全世界', '无制空冲'],
    strength: '爆发力、抗压、敢切开混乱。',
    career: '利执行、改革、高压窗口；要配协作与刹车。',
    wealth: '宜快刀斩乱麻的决策；忌冲动投机。',
    love: '热情猛；锋利话要收，尊重边界。',
    body: '血压与筋骨紧绷；压力大时宜泄不宜硬扛。',
    chartExtra: '羊刃落柱标「刚烈气场」，不是暴力判决书。',
    positive: '正面：果决有刃、能扛事。失衡：极端冲突、伤人伤己。',
    memory: '羊刃 = 出鞘之刃：查日干取支；要收放。辅助信息，勿单独断。',
    coreKeyword: '羊刃 · 刚烈果决',
    pillarMeaning: {
      year: '年柱见羊刃：早年场压力或刚烈底色。',
      month: '月柱见羊刃：事业场易高压与果断窗口。',
      day: '日柱见羊刃：本人锋利感强；练收放。',
      hour: '时柱见羊刃：晚成与子女场偏爆发或冲突提醒。',
    },
  }),
  'ss:华盖': featuredShenshaRich({
    name: '华盖',
    whatIs:
      '华盖是什么：精神独处与艺术信仰之星。站在人群里仍可能觉得孤独；独处是养分，隔绝是陷阱。',
    lookupLabel: '年/日支入三合局取华盖',
    lookupLines: sanHeStarLookupLines('hua'),
    lookupPeer: '三合局→华盖',
    likes: ['深度创作', '信仰与研究', '有连结的独处'],
    dislikes: ['自我隔绝', '当作「必孤独一生」', '脱离原局恐吓'],
    strength: '艺术、清高感、精神深度、专注力。',
    career: '利研究、艺术、专业深耕；要有输出通道。',
    wealth: '靠专业深度溢价；忌拒一切协作到无客。',
    love: '需要懂你的安静；别把冷清活成拒绝靠近。',
    body: '思虑与睡眠；独处后记得回人间。',
    chartExtra: '华盖落柱标「精神独处气场」，不是终身孤证。',
    positive: '正面：深度专注、有精神世界。失衡：自我隔绝、拒连结。',
    memory: '华盖 = 人群中的独处：三合取盖。辅助信息，勿单独断。',
    coreKeyword: '华盖 · 精神独处',
    pillarMeaning: {
      year: '年柱见华盖：早年精神气质或家族清高感。',
      month: '月柱见华盖：事业场偏研究艺术深耕。',
      day: '日柱见华盖：本人需独处充电；分清养分与隔绝。',
      hour: '时柱见华盖：晚成偏精神成果或信仰出口。',
    },
  }),
  'ss:驿马': featuredShenshaRich({
    name: '驿马',
    whatIs:
      '驿马是什么：奔波变动之星。此地留不住——出行、换场、动中求财；动不等于逃避。',
    lookupLabel: '年/日支入三合局取驿马',
    lookupLines: sanHeStarLookupLines('ma'),
    lookupPeer: '三合局→驿马',
    likes: ['有目标的流动', '出差外贸换场', '合财官看动中求'],
    dislikes: ['用奔波逃避', '当作「必漂泊无根」', '无岸狂奔'],
    strength: '开拓、出行、资源流动、打开局面。',
    career: '利出差、外贸、项目制与跨城；要有归岸。',
    wealth: '动中机会多；忌只流不囤。',
    love: '需要自由度；承诺要说清「动的边界」。',
    body: '劳顿与睡眠；长途后要恢复。',
    chartExtra: '驿马落柱标「变动气场」，不是流离判决。',
    positive: '正面：能开拓、敢换场。失衡：逃逸式奔波、难扎根。',
    memory: '驿马 = 奔波之马：三合取马；问开拓还是逃跑。辅助信息，勿单独断。',
    coreKeyword: '驿马 · 奔波变动',
    pillarMeaning: {
      year: '年柱见驿马：早年迁动或家族奔波底色。',
      month: '月柱见驿马：事业场出差换场多。',
      day: '日柱见驿马：本人喜动；要问开拓还是逃跑。',
      hour: '时柱见驿马：晚成与出口场偏远行或项目收成。',
    },
  }),
  'ss:桃花': featuredShenshaRich({
    name: '桃花',
    whatIs:
      '桃花是什么：姻缘人缘之煞。社交魅力旺，也易牵出复杂红线；分清滋养与消耗。',
    lookupLabel: '年/日支入三合局取桃花',
    lookupLines: sanHeStarLookupLines('tao'),
    lookupPeer: '三合局→桃花',
    likes: ['真诚连接', '边界清晰的魅力', '合夫妻宫/财官看'],
    dislikes: ['当作「必烂桃花」恐吓', '魅力当游戏', '脱离原局断婚'],
    strength: '人缘、吸引力、社交打开局面。',
    career: '利对外、服务、形象与关系经营。',
    wealth: '人脉可助财；忌情绪化决策与纠缠耗财。',
    love: '缘分窗口多；分清滋养与消耗，经营比偶遇重要。',
    body: '情绪与睡眠；纠缠期宜降温。',
    chartExtra: '桃花落柱标「人缘气场」，不是出轨判决书。',
    positive: '正面：魅力与连接力。失衡：牵绊消耗、边界糊。',
    memory: '桃花 = 镜中花也是缘：三合取桃。辅助信息，勿单独断。',
    coreKeyword: '桃花 · 姻缘人缘',
    pillarMeaning: {
      year: '年柱见桃花：早年人缘或家族社交场。',
      month: '月柱见桃花：事业场关系与对外魅力显。',
      day: '日柱见桃花：本人吸引力强；要边界。',
      hour: '时柱见桃花：晚成与子女/出口场偏缘分议题。',
    },
  }),
  'ss:将星': featuredShenshaRich({
    name: '将星',
    whatIs:
      '将星是什么：主心骨感。关键局里易被推到扛事位置；能扛不等于该什么都扛。',
    lookupLabel: '年/日支入三合局取将星',
    lookupLines: sanHeStarLookupLines('jiang'),
    lookupPeer: '三合局→将星',
    likes: ['授权与分工', '关键局担当', '合官杀印看权柄'],
    dislikes: ['全能自虐', '当作「必当官」', '空扛无资源'],
    strength: '权威感、担当、关键决策位。',
    career: '利管理、带队、关键项目扛事；学会授权。',
    wealth: '权责清晰才变现；忌只扛事不分润。',
    love: '能托底；别把「我来扛」变成控制。',
    body: '肩颈与压力；扛事前先睡够。',
    chartExtra: '将星落柱标「扛事气场」，不是官位保票。',
    positive: '正面：能扛能决。失衡：什么都扛、拒绝授权。',
    memory: '将星 = 主心骨：三合取将；成熟在授权。辅助信息，勿单独断。',
    coreKeyword: '将星 · 主心骨',
    pillarMeaning: {
      year: '年柱见将星：早年被期待扛事或家族权威场。',
      month: '月柱见将星：事业场易到关键决策位。',
      day: '日柱见将星：本人自带担当感；要授权。',
      hour: '时柱见将星：晚成偏成果与责任收口。',
    },
  }),
  'ss:红鸾': featuredShenshaRich({
    name: '红鸾',
    whatIs:
      '红鸾是什么：喜庆缘。容易碰到喜事、约会与被庆祝的时刻；是窗口不是终身保票。',
    lookupLabel: '按年支取红鸾',
    lookupLines: hongLuanLookupLines(),
    lookupPeer: '年支→红鸾',
    likes: ['经营关系', '把喜庆落成连接', '合桃花夫妻宫看'],
    dislikes: ['当作必结婚年份', '上头不经营', '恐吓式婚断'],
    strength: '喜庆、约会、被看见的温暖窗口。',
    career: '利喜庆活动、对外形象与关系推进。',
    wealth: '喜事窗口可助合作；忌冲动大额。',
    love: '缘分易暖；关系仍要经营。',
    body: '情绪偏高时注意作息，别透支庆祝。',
    chartExtra: '红鸾落柱标「喜庆窗口」，不是婚书。',
    positive: '正面：喜庆缘到。失衡：上头、空欢喜不经营。',
    memory: '红鸾 = 喜庆窗：按年支取。辅助信息，勿单独断。',
    coreKeyword: '红鸾 · 喜庆缘',
    pillarMeaning: {
      year: '年柱见红鸾：早年喜庆或家族热闹底色。',
      month: '月柱见红鸾：事业/社交场易遇庆祝窗口。',
      day: '日柱见红鸾：本人易触喜庆缘；仍要经营。',
      hour: '时柱见红鸾：晚成与出口场偏喜事议题。',
    },
  }),
  'ss:天喜': featuredShenshaRich({
    name: '天喜',
    whatIs:
      '天喜是什么：欢喜缘。气氛易变暖，身边多一点开心事；把快乐落成可重复的连接。',
    lookupLabel: '按年支取天喜',
    lookupLines: tianXiLookupLines(),
    lookupPeer: '年支→天喜',
    likes: ['分享快乐', '可重复的小仪式', '合红鸾桃花看'],
    dislikes: ['当作永久好运', '欢喜上头', '脱离原局空断'],
    strength: '暖场、开心事、人际松弛感。',
    career: '利团队氛围、对外亲和与合作破冰。',
    wealth: '情绪稳才助财；忌欢喜冲动消费。',
    love: '气氛易暖；要把快乐变成日常经营。',
    body: '情绪波动时护睡眠。',
    chartExtra: '天喜落柱标「欢喜气场」，不是终身好运符。',
    positive: '正面：气氛暖、开心多。失衡：上头、快乐不沉淀。',
    memory: '天喜 = 欢喜窗：按年支取。辅助信息，勿单独断。',
    coreKeyword: '天喜 · 欢喜缘',
    pillarMeaning: {
      year: '年柱见天喜：早年气氛偏暖。',
      month: '月柱见天喜：事业社交场易破冰。',
      day: '日柱见天喜：本人自带暖场；别只靠气氛。',
      hour: '时柱见天喜：晚成与出口场偏欢喜收成。',
    },
  }),
  'ss:孤辰寡宿': featuredShenshaRich({
    name: '孤辰寡宿',
    whatIs:
      '孤辰寡宿是什么：孤独独处之煞。内心孤寂、精神世界深；高纬度清冷是天赋不是惩罚。',
    lookupLabel: '按年支取孤辰/寡宿',
    lookupLines: guChenGuaSuLookupLines(),
    lookupPeer: '年支→孤辰寡宿',
    likes: ['有质量的独处', '少数深连结', '合华盖看精神世界'],
    dislikes: ['恐吓式「六亲尽绝」', '拒绝一切靠近', '脱离原局重断'],
    strength: '独立、精神深度、耐得住安静。',
    career: '利独立专业、研究创作；要主动开一扇连结门。',
    wealth: '靠专业独处产出；忌完全拒协作到无市。',
    love: '慢热深交；别把「不愿敞开」活成「谁都不配」。',
    body: '情志与睡眠；孤独时找一个可信出口。',
    chartExtra: '孤辰寡宿落柱标「独处气场」，不是六亲判决。',
    positive: '正面：独立深静。失衡：自我隔绝、缘薄感加重。',
    memory: '孤辰寡宿 = 一人棋局：按年支取。辅助信息，勿单独断。',
    coreKeyword: '孤辰寡宿 · 独处',
    pillarMeaning: {
      year: '年柱见孤辰寡宿：早年独立或六亲缘感议题。',
      month: '月柱见孤辰寡宿：事业场偏独当一面。',
      day: '日柱见孤辰寡宿：本人需独处；分清天赋与隔绝。',
      hour: '时柱见孤辰寡宿：晚成偏独立成果或清冷出口。',
    },
  }),
  'ss:劫煞': featuredShenshaRich({
    name: '劫煞',
    whatIs:
      '劫煞是什么：意外破耗之煞。事到临成易翻车；骤雨会停——留缓冲、拆步骤，比硬冲活命。',
    lookupLabel: '年/日支入三合局取劫煞',
    lookupLines: sanHeStarLookupLines('jie'),
    lookupPeer: '三合局→劫煞',
    likes: ['留缓冲', '拆步骤验证', '合原局忌神看'],
    dislikes: ['恐吓式「必破财」', '赌最后一口气', '无备份硬冲'],
    strength: '风险提醒、关键节点刹车感。',
    career: '大节点宜复盘与备份；忌临门一脚加码。',
    wealth: '防突发破耗；留应急金，别梭哈。',
    love: '冲突突发时先降温，再谈对错。',
    body: '意外与劳损提醒；高风险活动宜防护。',
    chartExtra: '劫煞落柱标「突发提醒」，不是灾难宣判。',
    positive: '正面：提醒留后手。失衡：恐吓自我、或赌气硬冲。',
    memory: '劫煞 = 临门翻车提醒：三合取劫。辅助信息，勿单独断。',
    coreKeyword: '劫煞 · 突发提醒',
    pillarMeaning: {
      year: '年柱见劫煞：早年突发变动感或家族波折提醒。',
      month: '月柱见劫煞：事业关键节点宜备份。',
      day: '日柱见劫煞：本人宜留后手，别赌最后一口气。',
      hour: '时柱见劫煞：晚成出口前多一步验证。',
    },
  }),
  'ss:天德': featuredShenshaRich({
    name: '天德',
    whatIs:
      '天德是什么：天德贵人。以月支取干或支，四柱见之主化解庇佑；是护身符感，不是免责金牌。',
    lookupLabel: '按月支取天德（见干或支）',
    lookupLines: tianDeLookupLines(),
    lookupPeer: '月支→天德',
    likes: ['合月德同看', '逢凶先求化解路径', '合日主格局看'],
    dislikes: ['当作百毒不侵', '恐吓式「无德必灾」', '脱离月令空断'],
    strength: '化解、庇佑、遇难减轻感。',
    career: '高压项目宜找缓冲与合规出口；别硬顶。',
    wealth: '防灾重于赌运；留保险与备份。',
    love: '冲突时易有转机；仍要沟通，别靠「会没事」。',
    body: '大病大灾时易得转机，仍重预防就医。',
    chartExtra: '天德落柱标「化解气场」，不是免灾保票。',
    positive: '正面：逢事多化解。失衡：松懈大意、或恐吓无德。',
    memory: '天德 = 月令护符：按月支见干/支。辅助信息，勿单独断。',
    coreKeyword: '天德 · 化解庇佑',
    pillarMeaning: {
      year: '年柱见天德：早年/家族场易得庇佑感。',
      month: '月柱见天德：当令护持，事业关口宜借势化解。',
      day: '日柱见天德：本人自带化解感；别因此大意。',
      hour: '时柱见天德：晚成出口场易逢转机。',
    },
  }),
  'ss:月德': featuredShenshaRich({
    name: '月德',
    whatIs:
      '月德是什么：月德贵人。以月支三合取阳干，四柱天干见之；偏人际与情绪托住，阴柔护持。',
    lookupLabel: '按月支取月德天干',
    lookupLines: yueDeLookupLines(),
    lookupPeer: '月支→月德干',
    likes: ['合天德同看', '人际缓冲', '合日主强弱看'],
    dislikes: ['当作永久好运', '只靠贵人不经营关系', '脱离月令'],
    strength: '柔和贵人气、人际托住、情绪缓冲。',
    career: '利协作与关系破局；关键局仍要自己交付。',
    wealth: '人脉可助周转；忌人情借贷无边界。',
    love: '气氛易被托住；经营仍靠日常。',
    body: '情志波动时宜有人陪，也要自稳作息。',
    chartExtra: '月德落柱标「柔护气场」，不是人际保票。',
    positive: '正面：人际托住、柔护。失衡：依赖讨好、或空等贵人。',
    memory: '月德 = 月令阴德：三合取阳干见柱干。辅助信息，勿单独断。',
    coreKeyword: '月德 · 柔和贵人',
    pillarMeaning: {
      year: '年柱见月德：早年人际/长辈托住感。',
      month: '月柱见月德：事业场协作缓冲显。',
      day: '日柱见月德：本人易得柔护；别只靠被托。',
      hour: '时柱见月德：晚成出口偏人际转机。',
    },
  }),
  'ss:福星': featuredShenshaRich({
    name: '福星',
    whatIs:
      '福星是什么：福星贵人。按日干取福星落支；偏「有福气托底」的稳定感，不是横财符。',
    lookupLabel: '按日干取福星支',
    lookupLines: fuXingLookupLines(),
    lookupPeer: '日干→福星',
    likes: ['积累与感恩', '合禄神财星看', '细水长流'],
    dislikes: ['当作必发财', '挥霍「有福」', '脱离格局'],
    strength: '托底感、安定、小确幸累积。',
    career: '利守成与长期岗位；把福气落成可复用能力。',
    wealth: '偏稳定积蓄；忌赌运气。',
    love: '能给人踏实感；别用「随缘」回避经营。',
    body: '脾胃与作息；福在规律。',
    chartExtra: '福星落柱标「托底气场」，不是横财判决。',
    positive: '正面：有托底、能安稳。失衡：躺平挥霍。',
    memory: '福星 = 托底福气：查日干取支。辅助信息，勿单独断。',
    coreKeyword: '福星 · 托底',
    pillarMeaning: {
      year: '年柱见福星：早年衣食/家族托底感。',
      month: '月柱见福星：事业场偏稳定福气。',
      day: '日柱见福星：本人自带托底；用来积累。',
      hour: '时柱见福星：晚成偏安稳收成。',
    },
  }),
  'ss:咸池': featuredShenshaRich({
    name: '咸池',
    whatIs:
      '咸池是什么：与桃花同族，人缘与情感/欲望磁场的另一说法；落点与桃花相同，分清滋养与消耗。',
    lookupLabel: '年/日支入三合局取咸池（同桃花）',
    lookupLines: sanHeStarLookupLines('tao'),
    lookupPeer: '三合局→咸池',
    likes: ['边界清晰', '真诚连接', '合桃花夫妻宫看'],
    dislikes: ['恐吓式「必烂桃花」', '欲望当主线', '脱离原局断婚'],
    strength: '吸引力、社交打开、情感磁场。',
    career: '利对外与形象；忌纠缠耗神。',
    wealth: '人脉可助；忌情绪化破财。',
    love: '缘分窗口多；经营比偶遇重要。',
    body: '情绪与睡眠；纠缠期降温。',
    chartExtra: '咸池落柱标「情感磁场」，不是出轨判决；常与桃花同见。',
    positive: '正面：魅力连接。失衡：牵绊消耗、边界糊。',
    memory: '咸池 = 桃花同族：三合取桃位。辅助信息，勿单独断。',
    coreKeyword: '咸池 · 情感磁场',
    pillarMeaning: {
      year: '年柱见咸池：早年人缘/情感场议题。',
      month: '月柱见咸池：事业社交吸引力显。',
      day: '日柱见咸池：本人磁场强；要边界。',
      hour: '时柱见咸池：晚成偏缘分/出口议题。',
    },
  }),
  'ss:金舆': featuredShenshaRich({
    name: '金舆',
    whatIs:
      '金舆是什么：车马仪仗之象。按日干取金舆支；常联想到体面出行、座驾与被抬举，不是必有豪车。',
    lookupLabel: '按日干取金舆支',
    lookupLines: jinYuLookupLines(),
    lookupPeer: '日干→金舆',
    likes: ['体面与仪态', '合禄马看出行', '资源被看见'],
    dislikes: ['当作必买车保票', '虚荣硬撑排场', '脱离财局'],
    strength: '体面、出行便利、被抬举感。',
    career: '利对外形象与移动办公；排场要匹配实力。',
    wealth: '出行/座驾相关开销宜量力；忌面子消费。',
    love: '重视仪式感；别只剩排场无亲密。',
    body: '奔波劳顿时护腰腿与睡眠。',
    chartExtra: '金舆落柱标「仪仗气场」，不是豪车判决书。',
    positive: '正面：体面被抬举。失衡：虚荣硬撑。',
    memory: '金舆 = 禄前仪仗：查日干取支。辅助信息，勿单独断。',
    coreKeyword: '金舆 · 仪仗体面',
    pillarMeaning: {
      year: '年柱见金舆：早年出行/家族体面议题。',
      month: '月柱见金舆：事业场形象与移动资源。',
      day: '日柱见金舆：本人重仪态；量力即可。',
      hour: '时柱见金舆：晚成偏出行/成果亮相。',
    },
  }),
  'ss:天厨': featuredShenshaRich({
    name: '天厨',
    whatIs:
      '天厨是什么：食禄之星。按日干取天厨支；与口福、供养、被养有关，不是必当厨师。',
    lookupLabel: '按日干取天厨支',
    lookupLines: tianChuLookupLines(),
    lookupPeer: '日干→天厨',
    likes: ['养生与分享', '合食伤禄看', '稳定供养节奏'],
    dislikes: ['当作口腹无度借口', '只会吃不会养', '脱离日主'],
    strength: '口福、被供养、餐饮/照顾场域。',
    career: '利餐饮、照护、内容「投喂」型工作。',
    wealth: '食禄稳定即可；忌享乐型挥霍。',
    love: '用照顾表达爱；别只剩投喂无交流。',
    body: '饮食脾胃；天厨旺也要节制。',
    chartExtra: '天厨落柱标「食禄气场」，不是职业指定。',
    positive: '正面：有口福能养人。失衡：口腹无度、或只会被养。',
    memory: '天厨 = 食禄：查日干取支。辅助信息，勿单独断。',
    coreKeyword: '天厨 · 食禄供养',
    pillarMeaning: {
      year: '年柱见天厨：早年食禄/被养议题。',
      month: '月柱见天厨：事业场与供养/餐饮场域相关。',
      day: '日柱见天厨：本人重口福与照顾；宜节制。',
      hour: '时柱见天厨：晚成偏供养成果或口碑。',
    },
  }),
  'ss:灾煞': featuredShenshaRich({
    name: '灾煞',
    whatIs:
      '灾煞是什么：关口警示之煞。年/日支入三合取灾煞落支；提醒关键节点别硬冲，不是灾难宣判。',
    lookupLabel: '年/日支入三合局取灾煞',
    lookupLines: sanHeStarLookupLines('zai'),
    lookupPeer: '三合局→灾煞',
    likes: ['减速验证', '合劫煞亡神对照', '留后手'],
    dislikes: ['恐吓式「必有灾」', '硬冲关口', '无备份'],
    strength: '关口提醒、风险意识。',
    career: '大节点宜评审与灰度；忌赌口气上线。',
    wealth: '防关口破耗；合同细看。',
    love: '冲突升级前先停。',
    body: '高风险活动宜防护；体检别拖。',
    chartExtra: '灾煞落柱标「关口提醒」，不是灾祸判决。',
    positive: '正面：提醒减速。失衡：恐吓自我、或硬刚关口。',
    memory: '灾煞 = 关口灯：三合取灾。辅助信息，勿单独断。',
    coreKeyword: '灾煞 · 关口警示',
    pillarMeaning: {
      year: '年柱见灾煞：早年关口/波折提醒。',
      month: '月柱见灾煞：事业关键节点宜谨慎。',
      day: '日柱见灾煞：本人宜留后手。',
      hour: '时柱见灾煞：出口前多一步验证。',
    },
  }),
  'ss:亡神': featuredShenshaRich({
    name: '亡神',
    whatIs:
      '亡神是什么：耗散因子。年/日支入三合取亡神；计划易散、力气被抽走的感觉——宜收束，勿恐吓。',
    lookupLabel: '年/日支入三合局取亡神',
    lookupLines: sanHeStarLookupLines('wang'),
    lookupPeer: '三合局→亡神',
    likes: ['清单化收束', '合华盖看精神耗', '小步交付'],
    dislikes: ['恐吓式「必败」', '同时开太多线', '熬夜硬扛'],
    strength: '提醒能量泄漏点、思虑过密时的刹车。',
    career: '项目忌摊子过大；先收口再扩张。',
    wealth: '防无声耗散；订阅/人情账要清。',
    love: '内耗时先睡，再谈对错。',
    body: '睡眠与肾气感；耗散期宜养。',
    chartExtra: '亡神落柱标「耗散提醒」，不是败局宣判。',
    positive: '正面：看见耗散点。失衡：恐吓、或放任泄漏。',
    memory: '亡神 = 力气被抽走：三合取亡。辅助信息，勿单独断。',
    coreKeyword: '亡神 · 耗散',
    pillarMeaning: {
      year: '年柱见亡神：早年耗散/分散议题。',
      month: '月柱见亡神：事业场易摊子过大。',
      day: '日柱见亡神：本人宜收束精力。',
      hour: '时柱见亡神：晚成前先关掉泄漏口。',
    },
  }),
  'ss:白虎': featuredShenshaRich({
    name: '白虎',
    whatIs:
      '白虎是什么：刚猛因子。以年支起流年十二神之白虎位；冲突、手术、硬碰意象提醒，不是必见血。',
    lookupLabel: '按年支偏移取白虎（+8）',
    lookupLines: yearOffsetLookupLines(8, ''),
    lookupPeer: '年支→白虎',
    likes: ['防护与冷静', '合羊刃血刃对照', '冲突降温'],
    dislikes: ['恐吓式「必有血光」', '硬碰硬', '忽视安全'],
    strength: '刚猛提醒、抗压与警戒。',
    career: '高压谈判宜有规则与证人；忌情绪对撞。',
    wealth: '防冲动大额与担保。',
    love: '争执时先离开现场再谈。',
    body: '运动/手术/尖锐物注意防护。',
    chartExtra: '白虎落柱标「刚猛提醒」，不是血光判决书。',
    positive: '正面：提高警戒。失衡：恐吓、或主动硬刚。',
    memory: '白虎 = 年支+8：刚猛提醒。辅助信息，勿单独断。',
    coreKeyword: '白虎 · 刚猛提醒',
    pillarMeaning: {
      year: '年柱见白虎：早年刚猛/冲突底色提醒。',
      month: '月柱见白虎：事业场高压冲突节点。',
      day: '日柱见白虎：本人锋利；练收。',
      hour: '时柱见白虎：出口期注意防护与冷静。',
    },
  }),
  'ss:吊客': featuredShenshaRich({
    name: '吊客',
    whatIs:
      '吊客是什么：哀感因子。岁后二位为吊客；告别、送别、情绪低潮的注脚，不是必有丧事。',
    lookupLabel: '按年支偏移取吊客（-2）',
    lookupLines: yearOffsetLookupLines(-2, ''),
    lookupPeer: '年支→吊客',
    likes: ['允许难过', '有陪伴的告别', '合天哭看情志'],
    dislikes: ['恐吓式「必有丧」', '压抑不许哭', '用神煞制造恐慌'],
    strength: '提醒情绪低潮窗口、需要告别的课题。',
    career: '变动期给团队告别与交接仪式。',
    wealth: '低潮期少做重大投资决策。',
    love: '允许哀伤；别冷暴力代替告别。',
    body: '情志与睡眠；低潮时减少刺激。',
    chartExtra: '吊客落柱标「哀感窗口」，不是丧事判决。',
    positive: '正面：看见告别课题。失衡：恐吓、或压抑哀伤。',
    memory: '吊客 = 岁后二位：哀感注脚。辅助信息，勿单独断。',
    coreKeyword: '吊客 · 哀感',
    pillarMeaning: {
      year: '年柱见吊客：早年告别/低潮底色。',
      month: '月柱见吊客：事业变动期宜交接仪式。',
      day: '日柱见吊客：本人易感告别议题；允许难过。',
      hour: '时柱见吊客：晚成前或有清场/放下。',
    },
  }),
  'ss:天哭': featuredShenshaRich({
    name: '天哭',
    whatIs:
      '天哭是什么：愁绪因子。以年支对冲为天哭；易感伤、想诉说的情绪底色，不是必哭终身。',
    lookupLabel: '按年支对冲取天哭（+6）',
    lookupLines: yearOffsetLookupLines(6, ''),
    lookupPeer: '年支→天哭',
    likes: ['有出口的倾诉', '合吊客天虚看', '艺术化表达'],
    dislikes: ['恐吓式「命苦」', '憋着不说', '沉溺悲情'],
    strength: '情绪敏感、共情、表达哀愁的能力。',
    career: '利内容/关怀型岗位；要设情绪边界。',
    wealth: '情绪消费宜有预算。',
    love: '需要被听见；别只哭不说需求。',
    body: '肺与情志；哭后补水睡眠。',
    chartExtra: '天哭落柱标「愁绪底色」，不是命苦宣判。',
    positive: '正面：能感能诉。失衡：沉溺悲情、或恐吓命苦。',
    memory: '天哭 = 年支对冲：愁绪底色。辅助信息，勿单独断。',
    coreKeyword: '天哭 · 愁绪',
    pillarMeaning: {
      year: '年柱见天哭：早年感伤底色。',
      month: '月柱见天哭：事业场情绪劳动多。',
      day: '日柱见天哭：本人易感；要出口。',
      hour: '时柱见天哭：晚成偏情志表达成果。',
    },
  }),
  'ss:天虚': featuredShenshaRich({
    name: '天虚',
    whatIs:
      '天虚是什么：空虚因子。年支对冲前一位；心里发空、抓不住实感——宜落地小事，勿恐吓。',
    lookupLabel: '按年支偏移取天虚（+7）',
    lookupLines: yearOffsetLookupLines(7, ''),
    lookupPeer: '年支→天虚',
    likes: ['具体小目标', '合亡神华盖看', '身体落地（走/睡/吃）'],
    dislikes: ['恐吓式「一场空」', '只空想不落地', '刺激麻痹空虚'],
    strength: '提醒「实感不足」窗口，催你回到身体与清单。',
    career: '项目要可验证里程碑；忌只画饼。',
    wealth: '防空转消费；买具体用得上的。',
    love: '空虚时先稳定自己，再索取陪伴。',
    body: '睡眠与血糖；发空时先吃睡走。',
    chartExtra: '天虚落柱标「空虚提醒」，不是一场空判决。',
    positive: '正面：提醒回落到实处。失衡：恐吓、或刺激麻痹。',
    memory: '天虚 = 年支+7：发空提醒。辅助信息，勿单独断。',
    coreKeyword: '天虚 · 空虚',
    pillarMeaning: {
      year: '年柱见天虚：早年实感/归属议题。',
      month: '月柱见天虚：事业场易空转，要里程碑。',
      day: '日柱见天虚：本人易发空；回身体。',
      hour: '时柱见天虚：出口期先抓一件实事。',
    },
  }),
  'ss:破碎': featuredShenshaRich({
    name: '破碎',
    whatIs:
      '破碎是什么：破损因子。按年支类取破碎落支；器物/计划易碎，宜留备份——不是事事必碎。',
    lookupLabel: '按年支类取破碎',
    lookupLines: poSuiLookupLines(),
    lookupPeer: '年支→破碎',
    likes: ['备份与冗余', '分步交付', '合灾煞看关口'],
    dislikes: ['恐吓式「必破碎」', '无备份一次梭哈', '完美主义拖到崩溃'],
    strength: '提醒易碎点、促使做备份。',
    career: '发布前备份回滚；大改拆步。',
    wealth: '大额前留应急；合同留底。',
    love: '关系摩擦时别一句话砸碎，先降温。',
    body: '易骨折扭伤提醒；运动护具。',
    chartExtra: '破碎落柱标「易碎提醒」，不是毁灭判决。',
    positive: '正面：促使备份。失衡：恐吓、或硬刚一次做完。',
    memory: '破碎 = 年支类取：易碎宜备份。辅助信息，勿单独断。',
    coreKeyword: '破碎 · 易碎备份',
    pillarMeaning: {
      year: '年柱见破碎：早年易碎/重整议题。',
      month: '月柱见破碎：事业交付宜备份。',
      day: '日柱见破碎：本人宜留后手。',
      hour: '时柱见破碎：出口前检查冗余。',
    },
  }),
};

function buildShenshaDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  const base = buildShellDossier(entry);
  const rich = SHENSHA_RICH[entry.id] || atlasShenshaDossierPatch(entry.title) || {};
  const card = getStarCardByName('shensha', entry.title);
  return {
    ...base,
    whatIs: rich.whatIs || `${entry.title}：${entry.oneLiner}`,
    season: rich.season || base.season,
    likes: rich.likes || base.likes,
    dislikes: rich.dislikes || base.dislikes,
    personality: rich.personality || card?.impression || base.personality,
    strength: rich.strength || base.strength,
    imbalance:
      rich.imbalance ||
      card?.trap ||
      '常见误读：把神煞当成单独断语。须回到日主、格局、十神与大运一起看。',
    career: rich.career || base.career,
    wealth: rich.wealth || base.wealth,
    love: rich.love || base.love,
    body: rich.body || base.body,
    chartRole:
      rich.chartRole ||
      '神煞只能作为辅助信息，不能脱离日主强弱、格局、十神和大运单独判断。',
    combos: rich.combos || base.combos,
    positive: rich.positive || `正面参考：${entry.oneLiner} 失衡时勿恐吓式断语。`,
    memory: rich.memory || `${entry.title} · ${entry.oneLiner}`,
    pillarMeaning: rich.pillarMeaning || base.pillarMeaning,
    coreKeyword: rich.coreKeyword || base.coreKeyword,
    schoolDiff:
      rich.schoolDiff ||
      resolveSchoolDiff(
        entry.title,
        /查法（([^）]+)）/.exec(rich.season || '')?.[1] ||
          /查法（([^）]+)）/.exec(base.season || '')?.[1] ||
          '通行查表',
      ),
  };
}

/** 手写精品/MORE 神煞 id 列表（其余走 atlas schema 推广） */
export function listHandwrittenShenshaRichIds(): string[] {
  return Object.keys(SHENSHA_RICH);
}

export function buildCodexDossier(id: string): CodexDossier | null {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return null;
  switch (entry.kind) {
    case 'stem':
      return buildStemDossier(entry);
    case 'branch':
      return buildBranchDossier(entry);
    case 'tengod':
      return buildTengodDossier(entry);
    case 'wuxing':
      return buildWuxingDossier(entry);
    case 'shensha':
      return buildShenshaDossier(entry);
    case 'nayin':
      return buildNayinDossier(entry);
    case 'jiazi':
      return buildJiaziDossier(entry);
    case 'relation':
    case 'luck':
      return buildShellDossier(entry);
    default:
      return buildShellDossier(entry);
  }
}

/** 卡片层五行/阴阳短标签 */
export function cardMetaLabels(entry: BaziEncyclopediaEntry): { wuxing: string; yinyang: string } {
  return {
    wuxing: entry.tags.wuxing || entry.tags.category,
    yinyang: entry.tags.yinyang || '—',
  };
}
