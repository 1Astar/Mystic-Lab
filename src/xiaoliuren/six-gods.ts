export type SixGodId = 'da-an' | 'liu-lian' | 'su-xi' | 'chi-kou' | 'xiao-ji' | 'kong-wang';

export type SixGodTone = 'steady' | 'slow' | 'joy' | 'sharp' | 'small-luck' | 'empty';

/** 小六壬知识库 · 六神条目（图鉴 / 解读 / 手札单源） */
export type SixGod = {
  id: SixGodId;
  name: string;
  order: number;
  /** 无图时回退字符 */
  glyph: string;
  keywords: string[];
  /** 象征 */
  symbolism: string;
  /** 一句话理解 */
  oneLiner: string;
  /** 故事象征 */
  story: string;
  positive: string[];
  warning: string[];
  emotion: string;
  career: string;
  wealth: string;
  self: string;
  /** 容易误读 */
  misread: string;
  /** 对应行动 */
  action: string;
  tone: SixGodTone;
};

export const SIX_GODS: SixGod[] = [
  {
    id: 'da-an',
    name: '大安',
    order: 1,
    glyph: '☁',
    keywords: ['稳定', '平安', '顺利', '守成'],
    symbolism: '代表稳定、安全、事情处于较平稳状态。',
    oneLiner: '事情处于稳定阶段。',
    story: '守护与安心。',
    positive: ['基础稳定', '适合规划', '适合长期事项'],
    warning: ['稳定不代表快速成功', '避免过度保守'],
    emotion: '感情偏向稳定陪伴，重视安全感。',
    career: '适合稳步推进，不宜急于求成。',
    wealth: '财富偏稳定积累。',
    self: '提醒关注长期方向。',
    misread: '把「安」当成马上成功或必须原地不动。',
    action: '稳住基本盘，把该确认的确认清楚再推进。',
    tone: 'steady',
  },
  {
    id: 'liu-lian',
    name: '留连',
    order: 2,
    glyph: '⛓',
    keywords: ['等待', '停滞', '牵绊'],
    symbolism: '事情发展受到阻碍，需要时间。',
    oneLiner: '事情有阻碍，需要时间。',
    story: '纠结与等待的绳结。',
    positive: ['适合复盘', '适合等待信息'],
    warning: ['不要急躁', '注意隐藏问题'],
    emotion: '关系可能存在犹豫或拖延。',
    career: '项目推进较慢，需要耐心。',
    wealth: '资金流动较慢。',
    self: '先处理卡住的一环，再谈推进。',
    misread: '把等待当成彻底失败。',
    action: '列出阻塞项，逐条核对后再动。',
    tone: 'slow',
  },
  {
    id: 'su-xi',
    name: '速喜',
    order: 3,
    glyph: '⚡',
    keywords: ['快速', '消息', '机会'],
    symbolism: '事情容易出现变化或消息。',
    oneLiner: '事情容易出现变化。',
    story: '消息与转机突然来临。',
    positive: ['适合行动', '适合沟通'],
    warning: ['避免冲动决定'],
    emotion: '互动节奏会加快，适合表达也适合接住回应。',
    career: '窗口期在，主动沟通与推进更有效。',
    wealth: '机会可能来得快，仍要核对再下决定。',
    self: '抓住一步就验证，别只停在兴奋上。',
    misread: '把「快」当成必然大喜或必然正确。',
    action: '发出关键一步，并保留确认环节。',
    tone: 'joy',
  },
  {
    id: 'chi-kou',
    name: '赤口',
    order: 4,
    glyph: '⚔',
    keywords: ['争执', '口舌', '冲突'],
    symbolism: '提醒注意语言和关系。',
    oneLiner: '容易产生误会与口舌。',
    story: '锋利的言辞需要收敛。',
    positive: ['适合澄清误会', '适合书面确认'],
    warning: ['少说断言', '情绪上头时先停'],
    emotion: '沟通方式会被放大，先确认对方真正听到了什么。',
    career: '汇报与协作易起摩擦，要点写清比临场硬怼更稳。',
    wealth: '谈条件时注意措辞，避免因话术损伤合作。',
    self: '先管住表达，再谈对错。',
    misread: '当成必然大吵一架或万事皆凶。',
    action: '重要沟通改成要点清单，确认无误再回应。',
    tone: 'sharp',
  },
  {
    id: 'xiao-ji',
    name: '小吉',
    order: 5,
    glyph: '🍶',
    keywords: ['小成', '帮助', '顺利'],
    symbolism: '事情有积极进展，但幅度有限。',
    oneLiner: '有小幅进展，适合轻推。',
    story: '微光与助力。',
    positive: ['适合尝试', '适合积累'],
    warning: ['积累比冒进重要', '别一次加码过度'],
    emotion: '关系可轻量推进，不必一次谈妥全部。',
    career: '先做成一个小交付，再决定是否加码。',
    wealth: '小幅进账或转机，宜稳健承接。',
    self: '接住眼前的小帮助，一步步往前。',
    misread: '把小吉当成大爆发或立刻圆满。',
    action: '只推一小步，把反馈记下来。',
    tone: 'small-luck',
  },
  {
    id: 'kong-wang',
    name: '空亡',
    order: 6,
    glyph: '○',
    keywords: ['变化', '落空', '重新观察'],
    symbolism: '事情可能偏离原计划。',
    oneLiner: '结果可能与预期不同。',
    story: '云散之后需重看方向。',
    positive: ['适合重新观察', '适合补齐信息'],
    warning: ['不要执着原计划', '暂缓不可逆大动作'],
    emotion: '回应可能落空，先观察真实态度再投入。',
    career: '目标或结果可能变空，先核对事实再决策。',
    wealth: '预期收益可能落空，保留退路更重要。',
    self: '允许剧本改写，把观察清单写出来。',
    misread: '当成永久性凶兆或彻底无解。',
    action: '对照目标与事实，补信息后再定。',
    tone: 'empty',
  },
];

export function sixGodOneLiner(god: SixGod): string {
  return god.oneLiner;
}

export function sixGodKeywordsLine(god: SixGod): string {
  return god.keywords.join('、');
}

export function getSixGodIconUrl(id: SixGodId): string {
  return `/xiaoliuren/gods/god-${id}.png`;
}

export const SIX_GODS_GRID_URL = '/xiaoliuren/gods/six-gods-grid.png';

export function renderSixGodIcon(god: SixGod, className = 'xlr-god-icon'): string {
  return `<img class="${className}" src="${getSixGodIconUrl(god.id)}" alt="${god.name}" width="72" height="72" loading="lazy" />`;
}

export function getSixGodByIndex(index: number): SixGod {
  const normalized = ((index % 6) + 6) % 6;
  return SIX_GODS[normalized];
}

export function getSixGodByName(name: string): SixGod | undefined {
  return SIX_GODS.find((g) => g.name === name);
}

export function getSixGodById(id: SixGodId): SixGod {
  return SIX_GODS.find((g) => g.id === id)!;
}
