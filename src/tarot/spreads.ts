import { drawCards, type DrawnCard } from './engine.ts';

export type SpreadType =
  | 'single'
  | 'past-present-future'
  | 'situation-obstacle-advice'
  | 'five-lens'
  | 'custom';

export type SpreadPosition = {
  key: string;
  label: string;
  labelEn: string;
  meaning: string;
  teachBefore?: string;
};

export type SpreadDefinition = {
  type: SpreadType;
  name: string;
  description: string;
  bestFor: string;
  lightHint: string;
  moreHint: string;
  positions: SpreadPosition[];
};

export const CUSTOM_SPREAD_MIN = 2;
export const CUSTOM_SPREAD_MAX = 7;

export const SPREADS: Record<SpreadType, SpreadDefinition> = {
  single: {
    type: 'single',
    name: '单张牌',
    description: '今日提醒 / 当前状态',
    bestFor: '快速觉察当下',
    lightHint: '适合：想看今天的提醒，或当下最需要看清的念头。',
    moreHint: '单张牌不求预言全部，只照亮此刻。问题越具体，牌越像一面镜子。',
    positions: [
      {
        key: 'focus',
        label: '当下',
        labelEn: 'Focus',
        meaning: '这张牌代表你此刻最需要看见的状态与提醒。',
        teachBefore: '单张牌不求预言全部，只照亮当下这一瞬。',
      },
    ],
  },
  'past-present-future': {
    type: 'past-present-future',
    name: '三张牌',
    description: '过去 · 现在 · 未来',
    bestFor: '看清事情如何走到这里',
    lightHint: '适合：梳理一件事从开始到现在的脉络。',
    moreHint: '第一张看起点，第二张看当下的力量，第三张看若保持路径的可能方向——都不是定数。',
    positions: [
      {
        key: 'past',
        label: '过去',
        labelEn: 'Past',
        meaning: '事情的起点与背景，帮你理解「从哪里走来」。',
        teachBefore: '第一张不是预测过去，而是帮你看见事情的起点。',
      },
      {
        key: 'present',
        label: '现在',
        labelEn: 'Present',
        meaning: '当前正在作用的力量，以及你此刻的状态。',
        teachBefore: '这一张看的是当前卡住你的力量。',
      },
      {
        key: 'future',
        label: '未来',
        labelEn: 'Future',
        meaning: '若保持当下路径，最可能展开的方向。',
        teachBefore: '未来不是定数，而是此刻选择的延伸。',
      },
    ],
  },
  'situation-obstacle-advice': {
    type: 'situation-obstacle-advice',
    name: '情况 · 阻碍 · 建议',
    description: '工作、关系、选择',
    bestFor: '理清问题结构',
    lightHint: '适合：工作、关系或选择类问题，先看清结构再行动。',
    moreHint: '先局面、再阻碍、后建议——牌不给标准答案，只帮你看清问题结构。',
    positions: [
      {
        key: 'situation',
        label: '情况',
        labelEn: 'Situation',
        meaning: '问题的核心面貌——你现在面对的是什么。',
        teachBefore: '先看清局面，再谈对策。',
      },
      {
        key: 'obstacle',
        label: '阻碍',
        labelEn: 'Obstacle',
        meaning: '卡住你的因素，可能是外在也可能是内心。',
        teachBefore: '阻碍不一定是敌人，有时是提醒你慢下来。',
      },
      {
        key: 'advice',
        label: '建议',
        labelEn: 'Advice',
        meaning: '牌给你的行动方向，而非替你做决定。',
        teachBefore: '建议是可能性，选择权始终在你手里。',
      },
    ],
  },
  'five-lens': {
    type: 'five-lens',
    name: '五镜阵',
    description: '情况 · 阻碍 · 建议 · 外在 · 结果',
    bestFor: '看清结构后再对照环境与走向',
    lightHint: '适合：想看五层——局面、卡点、行动、外在影响与可能结果。',
    moreHint:
      '五张依次为情况、阻碍、建议、外在、结果。像一面小十字：先内后外，再看走向；结果不是定数，是当下路径的延伸。',
    positions: [
      {
        key: 'situation',
        label: '情况',
        labelEn: 'Situation',
        meaning: '问题的核心面貌——你现在面对的是什么。',
        teachBefore: '先看清局面，再谈对策。',
      },
      {
        key: 'obstacle',
        label: '阻碍',
        labelEn: 'Obstacle',
        meaning: '卡住你的因素，可能是外在也可能是内心。',
        teachBefore: '阻碍不一定是敌人，有时是提醒你慢下来。',
      },
      {
        key: 'advice',
        label: '建议',
        labelEn: 'Advice',
        meaning: '牌给你的行动方向，而非替你做决定。',
        teachBefore: '建议是可能性，选择权始终在你手里。',
      },
      {
        key: 'external',
        label: '外在',
        labelEn: 'External',
        meaning: '环境、他人或外部条件如何参与这件事。',
        teachBefore: '外在不是命运，而是你需要看见并回应的场域。',
      },
      {
        key: 'outcome',
        label: '结果',
        labelEn: 'Outcome',
        meaning: '若保持当下路径，最可能展开的走向。',
        teachBefore: '结果是倾向，不是判决；你仍可以改路径。',
      },
    ],
  },
  custom: {
    type: 'custom',
    name: '自定义牌阵',
    description: '直接抽牌，自己摆到桌面上',
    bestFor: '不想用固定阵位、想随手摆',
    lightHint: '适合：直接抽卡，自己决定摆在哪儿。',
    moreHint:
      '不用预先起名或定张数。抽一张摆一张；摆够了就能翻开解读（建议至少 2 张，最多 7 张）。',
    positions: [
      {
        key: 'custom-1',
        label: '第 1 张',
        labelEn: 'Card 1',
        meaning: '你摆放的第一张牌。',
        teachBefore: '抽出后，摆到你想要的位置。',
      },
      {
        key: 'custom-2',
        label: '第 2 张',
        labelEn: 'Card 2',
        meaning: '你摆放的第二张牌。',
        teachBefore: '继续抽一张，摆到桌面上。',
      },
      {
        key: 'custom-3',
        label: '第 3 张',
        labelEn: 'Card 3',
        meaning: '你摆放的第三张牌。',
        teachBefore: '再抽一张，自己决定落点。',
      },
    ],
  },
};

/** 列表展示顺序（自定义放最后） */
export const SPREAD_ORDER: SpreadType[] = [
  'single',
  'past-present-future',
  'situation-obstacle-advice',
  'five-lens',
  'custom',
];

export function clampCustomCount(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(CUSTOM_SPREAD_MAX, Math.max(CUSTOM_SPREAD_MIN, Math.round(n)));
}

export function buildCustomPositions(labels: string[]): SpreadPosition[] {
  const cleaned = labels
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, CUSTOM_SPREAD_MAX);
  const count = clampCustomCount(cleaned.length || 3);
  const positions: SpreadPosition[] = [];
  for (let i = 0; i < count; i += 1) {
    const label = cleaned[i] || `第 ${i + 1} 张`;
    positions.push({
      key: `custom-${i + 1}`,
      label,
      labelEn: `Card ${i + 1}`,
      meaning: `你摆放的「${label}」。`,
      teachBefore: `抽出后，摆到你想要的位置。`,
    });
  }
  return positions;
}

/** 自由摆放：预留上限张数，抽够可提前结束 */
export function freeCustomLabels(count = CUSTOM_SPREAD_MAX): string[] {
  const n = clampCustomCount(count);
  return Array.from({ length: n }, (_, i) => `第 ${i + 1} 张`);
}

export function defaultCustomLabels(count = 3): string[] {
  return freeCustomLabels(count);
}

export function resolveSpread(
  type: SpreadType,
  customPositions?: SpreadPosition[] | null,
): SpreadDefinition {
  const base = SPREADS[type] ?? SPREADS['past-present-future'];
  if (type === 'custom' && customPositions && customPositions.length > 0) {
    return {
      ...base,
      name: '自定义牌阵',
      description: `自由摆放 · ${customPositions.length} 张`,
      positions: customPositions,
    };
  }
  return base;
}

export function drawSpread(
  type: SpreadType,
  customPositions?: SpreadPosition[] | null,
): DrawnCard[] {
  const spread = resolveSpread(
    type,
    customPositions ?? (type === 'custom' ? sessionCustomPositions : null),
  );
  const cards = drawCards(spread.positions.length);
  return cards.map((card, i) => ({
    ...card,
    position: spread.positions[i]!.label,
    positionKey: spread.positions[i]!.key,
  }));
}

export function getPositionMeta(
  type: SpreadType,
  positionKey: string,
  customPositions?: SpreadPosition[] | null,
): SpreadPosition | undefined {
  return resolveSpread(
    type,
    customPositions ?? (type === 'custom' ? sessionCustomPositions : null),
  ).positions.find((p) => p.key === positionKey);
}

export function getTeachHint(
  type: SpreadType,
  cardIndex: number,
  customPositions?: SpreadPosition[] | null,
): string | null {
  const pos = resolveSpread(
    type,
    customPositions ?? (type === 'custom' ? sessionCustomPositions : null),
  ).positions[cardIndex];
  return pos?.teachBefore ?? null;
}

export function buildLearningNote(
  type: SpreadType,
  question: string,
  customPositions?: SpreadPosition[] | null,
): string {
  const spread = resolveSpread(
    type,
    customPositions ?? (type === 'custom' ? sessionCustomPositions : null),
  );
  return `今天我学习了「${spread.name}」牌阵。${spread.description}——答案不在牌里，在我心里。${question ? ` 我问的是：${question}` : ''}`;
}

export function isKnownSpreadType(value: string): value is SpreadType {
  return value in SPREADS;
}

/** 当前会话的自定义位置（抽牌/解读/教学提示共用） */
let sessionCustomPositions: SpreadPosition[] | null = null;

export function setSessionCustomPositions(
  positions: SpreadPosition[] | null,
): void {
  sessionCustomPositions = positions && positions.length > 0 ? positions : null;
}

export function getSessionCustomPositions(): SpreadPosition[] | null {
  return sessionCustomPositions;
}

export function resolveActiveSpread(type: SpreadType): SpreadDefinition {
  return resolveSpread(
    type,
    type === 'custom' ? sessionCustomPositions : null,
  );
}
