/**
 * 问题类型库：决定 AI 解读侧重点，不做绝对预测。
 */
export type QuestionTypeId = 'emotion' | 'career' | 'wealth' | 'travel' | 'self' | 'general';

export type QuestionType = {
  id: QuestionTypeId;
  label: string;
  keywords: RegExp;
  /** AI 解读侧重点 */
  focus: string;
  /** 给模型/规则的提示 */
  aiHint: string;
};

export const QUESTION_TYPES: QuestionType[] = [
  {
    id: 'emotion',
    label: '感情',
    keywords: /感情|关系|喜欢|爱|分手|复合|约会|恋爱|对象|暧昧|朋友|心动/i,
    focus: '关系状态与安全感，而非「喜不喜欢」的一锤定音。',
    aiHint: '不要只回答结果，引导用户观察关系状态与双方节奏。',
  },
  {
    id: 'career',
    label: '工作',
    keywords: /工作|事业|项目|面试|offer|简历|职场|升职|跳槽|汇报|老板|同事/i,
    focus: '机会、准备与下一步行动。',
    aiHint: '强调机会、准备与行动建议，避免断言成败。',
  },
  {
    id: 'wealth',
    label: '财富',
    keywords: /钱|赚钱|投资|收入|财务|理财|消费|回款|报价/i,
    focus: '趋势与行动节奏，不做绝对预测。',
    aiHint: '只谈趋势与可执行动作，禁止「会发财/会亏光」式断语。',
  },
  {
    id: 'travel',
    label: '旅行',
    keywords: /旅行|出行|出门|路程|航班|高铁|出差|旅游|去哪|行程/i,
    focus: '行程顺滞、改期风险与可执行的出行安排。',
    aiHint: '谈行程节奏与核对项，不做「必平安/必出事」断语。',
  },
  {
    id: 'self',
    label: '自我',
    keywords: /我该|方向|状态|心情|焦虑|迷茫|选择自己|成长/i,
    focus: '自我节奏与可守住的下一步。',
    aiHint: '回落到自我状态与长期方向，少外部断言。',
  },
  {
    id: 'general',
    label: '综合',
    keywords: /./,
    focus: '眼前这一步的状态与可行动作。',
    aiHint: '结合六神本义给短期趋势提醒，避免算命口吻。',
  },
];

export function detectQuestionType(question: string): QuestionType {
  const q = question.trim();
  if (!q) return QUESTION_TYPES.find((t) => t.id === 'general')!;
  for (const type of QUESTION_TYPES) {
    if (type.id === 'general') continue;
    if (type.keywords.test(q)) return type;
  }
  return QUESTION_TYPES.find((t) => t.id === 'general')!;
}
