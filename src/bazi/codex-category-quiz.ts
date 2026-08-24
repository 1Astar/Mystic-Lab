/**
 * 图鉴分类小挑战：逛完一类后弹一题，巩固记忆（软话术，非恐吓）。
 */
export type CodexQuizCategory =
  | 'relation'
  | 'stem'
  | 'branch'
  | 'tengod'
  | 'shensha'
  | 'nayin'
  | 'jiazi'
  | 'luck';

export type CodexQuizOption = {
  id: string;
  label: string;
};

export type CodexQuiz = {
  id: string;
  category: CodexQuizCategory;
  /** 分类中文名，用于标题 */
  categoryLabel: string;
  prompt: string;
  options: CodexQuizOption[];
  answerId: string;
  explainCorrect: string;
  explainWrong: string;
};

export const CODEX_QUIZ_CATEGORY_LABEL: Record<CodexQuizCategory, string> = {
  relation: '生克关系',
  stem: '十天干',
  branch: '十二地支',
  tengod: '十神',
  shensha: '神煞',
  nayin: '纳音',
  jiazi: '甲子',
  luck: '运程',
};

export const CODEX_CATEGORY_QUIZZES: CodexQuiz[] = [
  {
    id: 'cq-tengod-cai-tou',
    category: 'tengod',
    categoryLabel: '十神',
    prompt:
      '某位用户的八字里，【财星】处于「天干透出」状态。你觉得他更宜怎么安排这一年的主线？',
    options: [
      { id: 'a', label: '稳扎稳打，专注主业与可交付出口' },
      { id: 'b', label: '放飞自我，全面铺开大胆创业' },
      { id: 'c', label: '完全躺平，等财星自己上门' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。财星透出像「求财议题被照亮」——可见、可谈，也更容易分心。先守一个主业出口，比四处开新线更稳。',
    explainWrong:
      '财透不等于立刻梭哈。透出是「议题显眼」，更宜把精力收束在主业与可核对的交付，而不是全面铺开或纯躺等。',
  },
  {
    id: 'cq-tengod-bijie',
    category: 'tengod',
    categoryLabel: '十神',
    prompt: '【比肩】与【劫财】同属「同气」，差别更像哪一句？',
    options: [
      { id: 'a', label: '比肩偏并肩同行；劫财偏分享与较劲同场' },
      { id: 'b', label: '两者完全一样，只是写法不同' },
      { id: 'c', label: '比肩必吉，劫财必凶' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。同气里一柔一刚：比肩更像并肩，劫财更像切分与拉扯——都是节奏，不是绝对吉凶标签。',
    explainWrong:
      '不是同义词，也不是吉凶对立。抓住「并肩 vs 分享/较劲」这一层就够复习了。',
  },
  {
    id: 'cq-stem-jia',
    category: 'stem',
    categoryLabel: '十天干',
    prompt: '【甲木】更贴哪幅画面？',
    options: [
      { id: 'a', label: '参天大树：要方向、骨力、向上生长' },
      { id: 'b', label: '藤萝花草：只靠攀附、没有主干' },
      { id: 'c', label: '正午太阳：专管曝光与舞台' },
    ],
    answerId: 'a',
    explainCorrect: '对。甲木是栋梁式生长：立方向、扛压、长期建设；藤萝是乙，太阳是丙。',
    explainWrong: '甲木不是藤萝（乙），也不是太阳（丙）。记住「大树 / 栋梁」即可。',
  },
  {
    id: 'cq-stem-tengluo',
    category: 'stem',
    categoryLabel: '十天干',
    prompt: '日主是【乙木】，流年遇到【甲木】，更宜怎么理解？',
    options: [
      { id: 'a', label: '像藤萝系甲：更易遇到可攀的支架或提携节奏' },
      { id: 'b', label: '必然破财，必须立刻隐退' },
      { id: 'c', label: '与乙木无关，可以忽略天干' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。这是「组合」复习：乙遇甲像花草找到大树——宜连结平台，也留意别过度依附。',
    explainWrong: '不是必凶退场，也不是无关。先记「藤萝系甲」这组动态即可。',
  },
  {
    id: 'cq-branch-yinshen',
    category: 'branch',
    categoryLabel: '十二地支',
    prompt: '盘上有【寅】，今年又见【申】，更宜把「寅申冲」理解成什么？',
    options: [
      { id: 'a', label: '行程 / 合同 / 场域切换的节奏窗，宜留缓冲' },
      { id: 'b', label: '今年必出大事，只能躲避' },
      { id: 'c', label: '只影响别人，与自己无关' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。冲是对撞与换轨：交通、文书、地点变动更显眼——当行程管理，勿单断吉凶。',
    explainWrong: '冲不等于宿命灾难，也不是事不关己。先按「节奏窗 + 缓冲」来用。',
  },
  {
    id: 'cq-branch-yueling',
    category: 'branch',
    categoryLabel: '十二地支',
    prompt: '看八字时，为什么【月支】常被单独强调？',
    options: [
      { id: 'a', label: '月令定当令气场，是旺衰与气候的重要锚' },
      { id: 'b', label: '月支只代表配偶，与事业无关' },
      { id: 'c', label: '月支可以忽略，只看日主就够' },
    ],
    answerId: 'a',
    explainCorrect: '对。月支是「当令」主场，很多旺衰与性格底色要从这里起读。',
    explainWrong: '月令不是可忽略项，也不只等于配偶宫叙事。先抓住「当令锚点」。',
  },
  {
    id: 'cq-relation-shengke',
    category: 'relation',
    categoryLabel: '生克关系',
    prompt: '「我生者」与「我克者」更贴哪组理解？',
    options: [
      { id: 'a', label: '我生者偏泄秀/表达出口；我克者偏财与可掌控资源' },
      { id: 'b', label: '两者都是绝对凶神' },
      { id: 'c', label: '只有相克有用，相生可以不看' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。生克是能量流向：生出去像表达与付出，克出去常对应「我能推动的资源」（财）。',
    explainWrong: '生克不是吉凶开关。先记流向：生＝出口，克＝可推动的对象。',
  },
  {
    id: 'cq-relation-chong',
    category: 'relation',
    categoryLabel: '生克关系',
    prompt: '地支【六冲】在图鉴里更宜怎么用？',
    options: [
      { id: 'a', label: '当索引：盘上出现对宫时，再展开行程与换轨说明书' },
      { id: 'b', label: '见到冲字就断人生失败' },
      { id: 'c', label: '只背口诀，永远不要对照自己的盘' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。图鉴是索引，推演是说明书——有对宫才展开，对照行程节奏而非恐吓。',
    explainWrong: '冲不是失败标签，也不该停在死记。对照自己的盘，才变成可用知识。',
  },
  {
    id: 'cq-nayin-scene',
    category: 'nayin',
    categoryLabel: '纳音',
    prompt: '纳音（如海中金）更像什么？',
    options: [
      { id: 'a', label: '干支组合的气象画面，帮助记忆与氛围，不替代旺衰' },
      { id: 'b', label: '可以单独替代日主与月令的全部判断' },
      { id: 'c', label: '只是装饰，完全没有对照价值' },
    ],
    answerId: 'a',
    explainCorrect: '对。纳音是画面层：帮你记住组合气质，仍要回到干支与月令。',
    explainWrong: '纳音不是全能替代，也不是纯装饰。当「气象标签」用最稳。',
  },
  {
    id: 'cq-jiazi-index',
    category: 'jiazi',
    categoryLabel: '甲子',
    prompt: '六十甲子在图鉴里的主要作用更像？',
    options: [
      { id: 'a', label: '完整索引：每一柱干支可点开对照纳音与大运用法' },
      { id: 'b', label: '只用来算生日礼物运势' },
      { id: 'c', label: '与排盘无关的装饰列表' },
    ],
    answerId: 'a',
    explainCorrect: '对。甲子页是索引表：点到某柱，再读组合与运程用法。',
    explainWrong: '它不是礼品运势机，也不是装饰。先当「查表入口」。',
  },
  {
    id: 'cq-luck-trigger',
    category: 'luck',
    categoryLabel: '运程',
    prompt: '大运 / 流年相对原局，更核心的用法是？',
    options: [
      { id: 'a', label: '看如何冲合刑害、透干引动，使原局某层「被点亮」' },
      { id: 'b', label: '每年单独重排一张与原局无关的新命' },
      { id: 'c', label: '只看流年天干，地支可以忽略' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。运程是「触发器」：与原局互动，才谈得上某十神/神煞/关系显化。',
    explainWrong: '不是另起炉灶的新命，也不能只看天干。抓住「触发原局」。',
  },
];

export function quizzesForCategory(category: CodexQuizCategory): CodexQuiz[] {
  return CODEX_CATEGORY_QUIZZES.filter((q) => q.category === category);
}

/** 稳定挑选：同日同类尽量同一题，避免刷题感过强 */
export function pickCategoryQuiz(
  category: CodexQuizCategory,
  dayKey: string,
): CodexQuiz | null {
  const list = quizzesForCategory(category);
  if (!list.length) return null;
  let sum = 0;
  for (const ch of `${category}:${dayKey}`) sum = (sum + ch.charCodeAt(0) * 17) % 997;
  return list[sum % list.length]!;
}

export function isCodexQuizCategory(raw: string): raw is CodexQuizCategory {
  return raw in CODEX_QUIZ_CATEGORY_LABEL;
}
