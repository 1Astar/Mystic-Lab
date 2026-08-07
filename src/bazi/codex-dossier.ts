import type { BaziEncyclopediaEntry, CodexDossier } from './codex-encyclopedia-types.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { stemBranchById } from './codex-lore.ts';

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
    whatIs: '乙木是什么：藤萝花草，柔韧善绕。',
    coreKeyword: '藤萝花草 · 柔韧生长',
    personality: '柔韧善绕，适应力强，也易优柔寡断。',
    imbalance: '优柔、依附过重、绕行过头失去方向。',
    career: '协调、设计、咨询、关系经营、需要迂回推进的岗位。',
    combos: [
      { peer: '庚金', note: '乙庚合：规则与柔韧的结盟，也可能被约束。' },
      { peer: '癸水', note: '癸水润乙：细润滋养，适合学习与审美生长。' },
    ],
  },
  丙: {
    whatIs: '丙火是什么：正午太阳，光明外放。',
    coreKeyword: '正午太阳 · 光明外放',
    personality: '热情可见、敢表达，也易急躁灼人。',
    imbalance: '过热、急躁、消耗过快。',
    career: '表达、传播、舞台、带动气氛的岗位。',
  },
  丁: {
    whatIs: '丁火是什么：烛光灯火，细腻照明。',
    coreKeyword: '烛光灯火 · 细腻照明',
    personality: '重感受与细节，也易内耗。',
    imbalance: '内耗、敏感、怕被忽视。',
    career: '策划、设计、照明式服务、精细表达。',
  },
  戊: {
    whatIs: '戊土是什么：高山厚土，承载稳重。',
    coreKeyword: '高山厚土 · 承载稳重',
    personality: '可靠能扛，也易固执沉重。',
    imbalance: '僵化、负担过重、拒绝变化。',
    career: '管理、基建、资源承载、长期运营。',
  },
  己: {
    whatIs: '己土是什么：田园湿土，滋养细作。',
    coreKeyword: '田园湿土 · 滋养细作',
    personality: '能藏能容，也易黏滞。',
    imbalance: '纠结、黏滞、过度照顾。',
    career: '滋养型岗位、细作、运营维护。',
  },
  庚: {
    whatIs: '庚金是什么：刀剑矿石，锋利果断。',
    coreKeyword: '刀剑矿石 · 锋利果断',
    personality: '重原则、敢决断，也易伤人伤己。',
    imbalance: '过刚、批判过重、难以柔软。',
    career: '规则、技术、执行、改革型岗位。',
    combos: [
      { peer: '甲木', note: '庚克甲：压力与成器，规则塑造栋梁。' },
      { peer: '丁火', note: '丁火炼庚：火炼成器，也可过热伤金。' },
    ],
  },
  辛: {
    whatIs: '辛金是什么：珠玉精金，精致敏锐。',
    coreKeyword: '珠玉精金 · 精致敏锐',
    personality: '重品质与细节，也易挑剔敏感。',
    imbalance: '挑剔、敏感、易碎感。',
    career: '审美、标准、精细工艺、品质管理。',
  },
  壬: {
    whatIs: '壬水是什么：江河大海，气魄流动。',
    coreKeyword: '江河大海 · 气魄流动',
    personality: '智谋开阔，也易散漫。',
    imbalance: '散漫、无归、想法过多难落地。',
    career: '流动型、智谋型、跨界整合。',
    combos: [
      { peer: '甲木', note: '壬生甲：滋养生长，贵人与学习扩展。' },
      { peer: '丙火', note: '壬水见丙：水火既济或冲突，看比例。' },
    ],
  },
  癸: {
    whatIs: '癸水是什么：雨露甘泉，润物无声。',
    coreKeyword: '雨露甘泉 · 润物无声',
    personality: '直觉细、润人，也易忧思。',
    imbalance: '忧思、内耗、边界不清。',
    career: '滋养、咨询、研究、细流渗透型工作。',
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

function buildShenshaDossier(entry: BaziEncyclopediaEntry): CodexDossier {
  const base = buildShellDossier(entry);
  return {
    ...base,
    whatIs: `${entry.title}：${entry.oneLiner}`,
    chartRole:
      '神煞只能作为辅助信息，不能脱离日主强弱、格局、十神和大运单独判断。',
    positive: `正面参考：${entry.oneLiner} 失衡时勿恐吓式断语。`,
    memory: `${entry.title} · ${entry.oneLiner}`,
    imbalance:
      '常见误读：把神煞当成单独断语。须回到日主、格局、十神与大运一起看。',
  };
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
    case 'jiazi':
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
