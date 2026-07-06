import { drawCards, type DrawnCard } from './engine.ts';

export type SpreadType = 'single' | 'past-present-future' | 'situation-obstacle-advice';

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
};

export function drawSpread(type: SpreadType): DrawnCard[] {
  const spread = SPREADS[type];
  const cards = drawCards(spread.positions.length);
  return cards.map((card, i) => ({
    ...card,
    position: spread.positions[i].label,
    positionKey: spread.positions[i].key,
  }));
}

export function getPositionMeta(type: SpreadType, positionKey: string): SpreadPosition | undefined {
  return SPREADS[type].positions.find((p) => p.key === positionKey);
}

export function getTeachHint(type: SpreadType, cardIndex: number): string | null {
  const pos = SPREADS[type].positions[cardIndex];
  return pos?.teachBefore ?? null;
}

export function buildLearningNote(type: SpreadType, question: string): string {
  const spread = SPREADS[type];
  return `今天我学习了「${spread.name}」牌阵。${spread.description}——答案不在牌里，在我心里。${question ? ` 我问的是：${question}` : ''}`;
}
