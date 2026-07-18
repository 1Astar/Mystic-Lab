/**
 * 掌诀系统原理（深度第三层）：
 * 为什么六个位置这样排、为什么从大安起、为什么顺时针。
 */
export type PalmSystemTopic = {
  id: 'layout' | 'origin' | 'clockwise';
  title: string;
  question: string;
  answer: string[];
};

export const PALM_SYSTEM_TOPICS: PalmSystemTopic[] = [
  {
    id: 'layout',
    title: '六个位置',
    question: '为什么六个位置这样排列？',
    answer: [
      '小六壬只用食指、中指、无名指的上节与下节，跳过中节，得到六个落点。',
      '顺时针一圈正好对应六神：大安 → 留连 → 速喜 → 赤口 → 小吉 → 空亡。',
      '这样排，是为了「一手可掐」：不看表、不翻书，用指节把六种状态走完。',
    ],
  },
  {
    id: 'origin',
    title: '起数起点',
    question: '为什么从大安开始数？',
    answer: [
      '大安在食指下节，是掌诀里最容易先摸到的起点。',
      '正月起大安：把「年之始」与「宫之始」对齐，后面月份顺时针循环。',
      '日、时不重回大安，而是从上一落点继续——过程连续，结果才可复现。',
    ],
  },
  {
    id: 'clockwise',
    title: '顺时针',
    question: '为什么要顺时针数？',
    answer: [
      '顺时针与时辰盘、月份推进同一方向，减少「正数还是倒数」的歧义。',
      '六宫成环：数到空亡后再进一格，回到大安，形成可循环的计数。',
      '统一方向后，月、日、时三步可以同一套动作衔接，适合教学与动画。',
    ],
  },
];

export const CAST_LOGIC_STEPS = [
  { id: 'month', label: '月', detail: '农历月从大安起顺数，得月落点' },
  { id: 'day', label: '日', detail: '农历日从月落点继续顺数，得日落点' },
  { id: 'hour', label: '时辰', detail: '时辰序从日落点继续顺数，得最终落位' },
  { id: 'land', label: '落位', detail: '落到六神之一，再结合问题解读' },
] as const;

/** 深度理解五层（会用 → 理解为什么 → 掌诀 → 起课 → 案例） */
export const DEPTH_LAYERS = [
  {
    id: 1,
    title: '会用',
    goal: '知道这次是什么结果',
    summary: '认得六神名字，能说出落课是哪一位。',
  },
  {
    id: 2,
    title: '理解为什么',
    goal: '知道名字与含义从哪来',
    summary: '为什么叫大安、为什么赤口连着争执。',
  },
  {
    id: 3,
    title: '掌诀系统',
    goal: '知道六个位置怎么排、怎么起',
    summary: '排列、起点、顺时针——掐指的底层约定。',
  },
  {
    id: 4,
    title: '起课逻辑',
    goal: '走通月 → 日 → 时 → 落位',
    summary: '时间如何变成宫位，宫位如何变成六神。',
  },
  {
    id: 5,
    title: '案例学习',
    goal: '同一六神，不同问题不同读法',
    summary: '例如小吉：感情、工作、旅行各读什么。',
  },
] as const;
