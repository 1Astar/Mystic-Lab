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
  theme: string;
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
  { num: '1', label: '王牌', theme: '开始、种子、新契机' },
  { num: '2', label: '二', theme: '选择、对照、平衡' },
  { num: '3', label: '三', theme: '发展、表达、成长' },
  { num: '4', label: '四', theme: '稳定、结构、休息' },
  { num: '5', label: '五', theme: '冲突、挑战、摩擦' },
  { num: '6', label: '六', theme: '调整、回馈、过渡' },
  { num: '7', label: '七', theme: '试炼、坚持、考验' },
  { num: '8', label: '八', theme: '推进、变化、加速' },
  { num: '9', label: '九', theme: '临近完成、积累、警觉' },
  { num: '10', label: '十', theme: '阶段结果、圆满或负担' },
];

export const COURT_NOTE =
  '侍从 / 骑士 / 王后 / 国王代表该花色在不同阶段的人格面向——探索、行动、滋养、掌控。可在收集图鉴中逐张展开。';

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
