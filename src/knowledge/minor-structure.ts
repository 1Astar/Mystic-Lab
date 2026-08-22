/** 小阿尔克那结构学习：牌组 × 数字 */

export type SuitGroup = {
  key: 'wands' | 'cups' | 'swords' | 'pentacles';
  label: string;
  theme: string;
  hint: string;
};

export type NumberStage = {
  num: string;
  label: string;
  /** 记忆锚词：种子 / 选择 / 成长… */
  anchor: string;
  theme: string;
};

export type NumberArcChapter = {
  id: 'sprout' | 'friction' | 'harvest';
  title: string;
  range: string;
  /** 一段总括 */
  blurb: string;
  /** 箭头串：种子 → 选择 → 成长 */
  chain: string;
  nums: string[];
};

export type CombinationExample = {
  deckId: string;
  nameCn: string;
  suitLabel: string;
  suitTheme: string;
  num: string;
  numTheme: string;
  reading: string;
};

export type LiveSuitNumberBlend = {
  suitKey: SuitGroup['key'];
  suitLabel: string;
  suitShort: string;
  num: string;
  anchor: string;
  theme: string;
  /** 星币（现实）× 5（冲突）→ 物质与工作里的摩擦与挑战 */
  line: string;
  deckId: string;
  nameCn: string;
};

export const SUIT_NUMBER_INTRO = {
  title: '牌组 × 数字',
  subtitle: '用四组牌和数字规律看懂小阿卡那',
  lead: '不必逐张背。先看牌组——它在讲哪个领域；再看数字——它处在什么阶段。两张线索叠在一起，牌义就清晰很多。',
};

export const SUIT_GROUPS: SuitGroup[] = [
  {
    key: 'wands',
    label: '权杖',
    theme: '行动、热情、创造力',
    hint: '火元素：动力、冲动、项目启动、把想法做出来。',
  },
  {
    key: 'cups',
    label: '圣杯',
    theme: '情绪、关系、爱与感受',
    hint: '水元素：情感流动、亲密、直觉、心里的柔软与波动。',
  },
  {
    key: 'swords',
    label: '宝剑',
    theme: '思考、冲突、判断、语言',
    hint: '风元素：念头、沟通、理性、言语里的锋利与真相。',
  },
  {
    key: 'pentacles',
    label: '星币',
    theme: '现实、金钱、身体、工作、资源',
    hint: '土元素：物质、健康、职业、可触摸的成果与积累。',
  },
];

export const NUMBER_STAGES: NumberStage[] = [
  { num: '1', label: '王牌', anchor: '种子', theme: '开始、种子、新契机' },
  { num: '2', label: '二', anchor: '选择', theme: '选择、对照、平衡' },
  { num: '3', label: '三', anchor: '成长', theme: '发展、表达、成长' },
  { num: '4', label: '四', anchor: '稳住', theme: '稳定、结构、休息' },
  { num: '5', label: '五', anchor: '冲突', theme: '冲突、挑战、摩擦' },
  { num: '6', label: '六', anchor: '调整', theme: '调整、回馈、过渡' },
  { num: '7', label: '七', anchor: '试炼', theme: '试炼、坚持、考验' },
  { num: '8', label: '八', anchor: '加速', theme: '推进、变化、加速' },
  { num: '9', label: '九', anchor: '临门', theme: '临近完成、积累、警觉' },
  { num: '10', label: '十', anchor: '结果', theme: '阶段结果、圆满或负担' },
];

/** 数字人生弧：三段记，比十条词条更好记 */
export const NUMBER_ARCS: NumberArcChapter[] = [
  {
    id: 'sprout',
    title: '萌芽',
    range: '1–3',
    blurb: '事情刚冒头：从一粒种子，到对照选择，再到展开成长。',
    chain: '种子 → 选择 → 成长',
    nums: ['1', '2', '3'],
  },
  {
    id: 'friction',
    title: '磨合',
    range: '4–6',
    blurb: '进入现实摩擦：先稳住结构，再撞上冲突，然后调整过渡。',
    chain: '稳住 → 冲突 → 调整',
    nums: ['4', '5', '6'],
  },
  {
    id: 'harvest',
    title: '冲刺收成',
    range: '7–10',
    blurb: '后半段加压收口：试炼坚持、加速推进、临门积累，落到结果。',
    chain: '试炼 → 加速 → 临门 → 结果',
    nums: ['7', '8', '9', '10'],
  },
];

/** 牌组短域 + 场景前缀，用于当场合成 */
const SUIT_BLEND: Record<
  SuitGroup['key'],
  { short: string; scene: string }
> = {
  wands: { short: '行动', scene: '动力与项目里的' },
  cups: { short: '情绪', scene: '情感与关系里的' },
  swords: { short: '思考', scene: '念头与沟通里的' },
  pentacles: { short: '现实', scene: '物质与工作里的' },
};

const ANCHOR_BLEND: Record<string, string> = {
  种子: '新契机刚冒头',
  选择: '对照与权衡',
  成长: '展开与表达',
  稳住: '结构与休息',
  冲突: '摩擦与挑战',
  调整: '回馈与过渡',
  试炼: '坚持与考验',
  加速: '变化与推进',
  临门: '积累与警觉',
  结果: '圆满或负担',
};

const NUM_TO_RANK: Record<string, string> = {
  '1': 'ace',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
};

export function buildLiveSuitNumberBlend(
  suitKey: SuitGroup['key'],
  num: string,
): LiveSuitNumberBlend | null {
  const suit = SUIT_GROUPS.find((s) => s.key === suitKey);
  const stage = NUMBER_STAGES.find((n) => n.num === num);
  const rank = NUM_TO_RANK[num];
  const blend = SUIT_BLEND[suitKey];
  if (!suit || !stage || !rank || !blend) return null;

  const tail = ANCHOR_BLEND[stage.anchor] ?? stage.theme;
  return {
    suitKey,
    suitLabel: suit.label,
    suitShort: blend.short,
    num: stage.num,
    anchor: stage.anchor,
    theme: stage.theme,
    line: `${suit.label}（${blend.short}）× ${stage.num}（${stage.anchor}）→ ${blend.scene}${tail}`,
    deckId: `${suitKey}-${rank}`,
    nameCn: `${suit.label}${stage.label === '王牌' ? '王牌' : stage.label}`,
  };
}

export const COURT_NOTE =
  '侍从 / 骑士 / 王后 / 国王代表该花色在不同阶段的人格面向——探索、行动、滋养、掌控。可在收集探索中逐张展开。';

export const COMBINATION_EXAMPLES: CombinationExample[] = [
  {
    deckId: 'swords-five',
    nameCn: '宝剑五',
    suitLabel: '宝剑',
    suitTheme: '思考、语言、冲突',
    num: '5',
    numTheme: '冲突和摩擦',
    reading:
      '宝剑代表思考、语言、冲突；5 代表冲突和摩擦。所以宝剑五常和争执、输赢、言语伤害有关——赢了场面，却可能输了关系。',
  },
  {
    deckId: 'cups-three',
    nameCn: '圣杯三',
    suitLabel: '圣杯',
    suitTheme: '情绪、关系、感受',
    num: '3',
    numTheme: '发展与表达',
    reading:
      '圣杯指向情感与联结；3 是成长与表达。圣杯三常是庆祝、友谊、小圈子的温暖——感受被分享、被看见。',
  },
  {
    deckId: 'wands-eight',
    nameCn: '权杖八',
    suitLabel: '权杖',
    suitTheme: '行动、热情',
    num: '8',
    numTheme: '推进与加速',
    reading:
      '权杖是行动力；8 是快速推进。权杖八像箭在飞——事情在加速，消息在传递，宜顺势而非硬挡。',
  },
  {
    deckId: 'pentacles-four',
    nameCn: '星币四',
    suitLabel: '星币',
    suitTheme: '现实、资源',
    num: '4',
    numTheme: '稳定与结构',
    reading:
      '星币关乎物质与资源；4 是稳定与固守。星币四常提醒：抓紧安全感的同时，别把自己困在过度防御里。',
  },
];

const RANK_TO_STAGE: Record<string, string> = {
  ace: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
};

const SUIT_DOMAIN: Record<SuitGroup['key'], string> = {
  cups: '情感连接',
  wands: '行动与热情',
  swords: '思辨与沟通',
  pentacles: '现实与资源',
};

const COURT_RANKS = new Set(['page', 'knight', 'queen', 'king']);

export type MinorSuitNumberFormula = {
  suitLabel: string;
  suitTheme: string;
  num: string;
  numTheme: string;
  /** 极简公式整句 */
  line: string;
  isCourt: boolean;
};

function compactTheme(theme: string, maxParts = 2): string {
  return theme
    .split(/[、,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxParts)
    .join('、');
}

/**
 * 小阿卡那「牌组 × 数字」一句公式；大阿卡那 / 未知 id 返回 null。
 * 例：圣杯（情感） + 6（过渡、回馈） = 在情感连接中体会「调整、回馈、过渡」
 */
export function buildMinorSuitNumberFormula(
  deckId: string,
  options?: { suit?: SuitGroup['key']; rank?: string; nameZh?: string },
): MinorSuitNumberFormula | null {
  const parts = deckId.split('-');
  const suitKey = (options?.suit ?? parts[0]) as SuitGroup['key'];
  const rankRaw = (options?.rank ?? parts.slice(1).join('-')).toLowerCase();
  const suit = SUIT_GROUPS.find((s) => s.key === suitKey);
  if (!suit) return null;

  if (COURT_RANKS.has(rankRaw)) {
    const role =
      rankRaw === 'page'
        ? '探索'
        : rankRaw === 'knight'
          ? '行动'
          : rankRaw === 'queen'
            ? '滋养'
            : '掌控';
    return {
      suitLabel: suit.label,
      suitTheme: compactTheme(suit.theme, 1),
      num: role,
      numTheme: '宫廷牌人格面向',
      line: `${suit.label}（${compactTheme(suit.theme, 1)}） + ${role} = 该花色的「${role}」面向——${COURT_NOTE.slice(0, 28)}…`,
      isCourt: true,
    };
  }

  const num = RANK_TO_STAGE[rankRaw];
  if (!num) return null;
  const stage = NUMBER_STAGES.find((n) => n.num === num);
  if (!stage) return null;

  const suitShort = compactTheme(suit.theme, 1);
  const numShort = compactTheme(stage.theme, 2);
  const domain = SUIT_DOMAIN[suit.key];
  const equals = `在${domain}中体会「${numShort}」`;

  return {
    suitLabel: suit.label,
    suitTheme: suitShort,
    num: stage.num,
    numTheme: numShort,
    line: `${suit.label}（${suitShort}） + ${stage.num}（${numShort}） = ${equals}`,
    isCourt: false,
  };
}

/** @deprecated 使用 SUIT_GROUPS / NUMBER_STAGES */
export const MINOR_ARCANA_BRIEF = {
  title: '小阿尔克那怎么看',
  lead: SUIT_NUMBER_INTRO.lead,
  suits: SUIT_GROUPS.map((s) => ({ key: s.key, label: s.label, theme: s.theme })),
  numbers: NUMBER_STAGES.map((n) => ({ num: n.num, label: n.label, theme: n.theme })),
};
