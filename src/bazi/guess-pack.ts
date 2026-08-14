/**
 * 猜命盘题库：学习对照用（影视/历史意象），非真实排盘鉴定。
 */
export type GuessOption = {
  id: string;
  label: string;
};

export type GuessCard = {
  id: string;
  /** 揭晓后的名字 */
  name: string;
  kind: '影视角色' | '历史意象' | '对照人物';
  /** 盲盒未揭晓时的称呼 */
  sealedLabel: string;
  clues: string[];
  question: string;
  options: GuessOption[];
  answerId: string;
  explainCorrect: string;
  explainWrong: string;
};

export const GUESS_CARDS: GuessCard[] = [
  {
    id: 'gq-gao',
    name: '高启强（《狂飙》）',
    kind: '影视角色',
    sealedLabel: '今日盲盒 · 某位「泥潭里往上爬」的角色',
    clues: [
      '天性里「生长/扩张」感很强，像一直要破局',
      '根不稳时仍硬冲，容易把创造力用成空转',
      '宜忌画像：忌多线梭哈，宜先稳住一个可交付出口',
    ],
    question: '以你学过的特质，他更像哪种「运气轨迹」？',
    options: [
      { id: 'a', label: '先活、再扩张：一个出口做深，再谈版图' },
      { id: 'b', label: '天生贵人局：躺着也有人托，不必自己扛' },
      { id: 'c', label: '纯印星学究：只适合书房，不适合江湖' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。食伤式表达/谋略旺、根不稳时，最忌全网开播式扩张——先一个出口交付，才接得住「财」。这是「我克者为财」的复习。',
    explainWrong:
      '更贴近「先活再扩张」。他不是躺赢贵人局，也不是纯书房印星；泥潭向上靠的是谋略出口，但地基不稳就会晃。',
  },
  {
    id: 'gq-lin',
    name: '林黛玉（意象）',
    kind: '历史意象',
    sealedLabel: '今日盲盒 · 一位「细雨式敏感」的人物意象',
    clues: [
      '流动与感受力强，环境一变情绪先动',
      '不缺「看见」，缺的是稳定承载',
      '调频方向常是：补土式落地，少空耗在比较里',
    ],
    question: '她的「能量短板」更像哪一句？',
    options: [
      { id: 'a', label: '火太旺：只会燃烧别人，自己从不敏感' },
      { id: 'b', label: '水偏多而土偏弱：感受深，但落地与边界易晃' },
      { id: 'c', label: '金太利：凡事一刀切，毫无柔情' },
    ],
    answerId: 'b',
    explainCorrect:
      '对。细雨意象常对应「水」的流动与敏感；土弱则包容/落地不足——复习能量天平：抬高水，土会被克弱。',
    explainWrong:
      '更贴「水多土弱」。不是无感的火旺，也不是纯金冷刀；是感受过深而根基托不住。',
  },
  {
    id: 'gq-yuefei',
    name: '岳飞（意象）',
    kind: '历史意象',
    sealedLabel: '今日盲盒 · 一位「责任压肩」的人物意象',
    clues: [
      '气候偏「扛压推进」：评价与规则很显眼',
      '宜：把权责拆成可核对小步',
      '忌：硬顶所有压力、一次梭哈',
    ],
    question: '若他在「官杀气候」年硬刚所有压力，最可能怎样？',
    options: [
      { id: 'a', label: '越刚越旺，完全无耗' },
      { id: 'b', label: '短期能扛，中期易耗空，窗口因无备份失手' },
      { id: 'c', label: '立刻变成食伤全网开播局' },
    ],
    answerId: 'b',
    explainCorrect:
      '对。这是运势【如果】的复习：官杀年主调是责任与评价，硬刚会把「考」变成「耗」。',
    explainWrong:
      '不是无耗神话，也不是突然变成食伤开播；硬刚压力的典型反噬是中期耗空。',
  },
  {
    id: 'gq-shu',
    name: '一位「书房型创业者」对照',
    kind: '对照人物',
    sealedLabel: '今日盲盒 · 一位「弄懂再上场」的人',
    clues: [
      '年度天气偏蓄力：学习、求助比硬冲有用',
      '印星气候：信息与贵人感更关键',
      '忌拒绝求援、在雾里空耗',
    ],
    question: '他今年更该选哪条「宜」？',
    options: [
      { id: 'a', label: '先补一门立刻用得上的规则/技能，再出手' },
      { id: 'b', label: '同时开十条赛道，靠热度碰运气' },
      { id: 'c', label: '拒绝一切求助，证明自己能硬刚' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。印星年的底层逻辑是「弄懂再上场」——先借势补信息，再谈扩张。',
    explainWrong:
      '多线热度与拒绝求援都是逆气候；蓄力年要先弄懂规则。',
  },
  {
    id: 'gq-bi',
    name: '一位「同温层打拼」对照',
    kind: '对照人物',
    sealedLabel: '今日盲盒 · 一位身边总有并肩者的人',
    clues: [
      '比劫气候：同侪有力，也易争锋',
      '宜分清队友与赛道',
      '忌跟所有人硬杠比较',
    ],
    question: '如果他「跟所有人并肩赛跑」，更可能？',
    options: [
      { id: 'a', label: '精力散在比较与内耗，真伙伴走远' },
      { id: 'b', label: '自动升为推演大师，无需练习' },
      { id: 'c', label: '财星永旺，止损无用' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。【如果】复习：比劫年要把「同」用成助力，而不是内耗战场。',
    explainWrong:
      '不是躺赢称号，也不是财星神话；并肩失控时，最先伤的是精力与伙伴。',
  },
  {
    id: 'gq-cai',
    name: '一位「窗口型操盘手」对照',
    kind: '对照人物',
    sealedLabel: '今日盲盒 · 一位常碰到「交易窗口」的人',
    clues: [
      '财星气候：机会与结果更显眼',
      '宜：止损、报价、小单试窗口',
      '忌：只谈机会不谈交付',
    ],
    question: '如果他「见机会就冲、不设止损」，会怎样？',
    options: [
      { id: 'a', label: '账面上可能很多，信任与现金对不上，一次失手脏窗口' },
      { id: 'b', label: '永远只赚不亏' },
      { id: 'c', label: '自动变成印星书房局' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。财星要结果也要锚：止损与交付。机会是风，没有锚就会漂。',
    explainWrong:
      '不是永赚神话，也不会突然变书房印星；无止损的窗口最容易脏。',
  },
  {
    id: 'gq-mu',
    name: '一位「初春破土」对照',
    kind: '对照人物',
    sealedLabel: '今日盲盒 · 一位被说成「初春破土」的人',
    clues: [
      '定调像初春大树：向上生长、不甘平庸',
      '需要阳光雨水——节奏对了才长得稳',
      '能量上木多时，拖高木会削弱土的落地',
    ],
    question: '能量天平上，若他把「木」拖得更高，最先被削弱的是？',
    options: [
      { id: 'a', label: '土（包容/落地）' },
      { id: 'b', label: '水（他生我，只会更强）' },
      { id: 'c', label: '什么都不会变' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。杠杆复习：木克土。生长感变强时，落地与包容先晃——所以要先感到杠杆再加码。',
    explainWrong:
      '不是不变，也不是水被抬高；木抬高时，土（落地）先被削弱。',
  },
  {
    id: 'gq-fake-chart',
    name: '匿名对照盘 · 寅申换轨型',
    kind: '对照人物',
    sealedLabel: '今日盲盒 · 一张半真半假的匿名盘',
    clues: [
      '日主乙木 · 月支见寅 · 流年支申',
      '偏财透干：求财议题被照亮',
      '像「藤萝遇到换轨年」——动与窗口同场',
    ],
    question: '这张匿名盘今年更宜哪句？',
    options: [
      { id: 'a', label: '当行程与合同窗：留缓冲，主业守一个可交付出口' },
      { id: 'b', label: '必有灾祸，只能全年躲避' },
      { id: 'c', label: '财透即可梭哈，不必看地支冲合' },
    ],
    answerId: 'a',
    explainCorrect:
      '对。半真半假盘用来练「组合」：寅申冲是换轨节奏，财透是议题显眼——合在一起更要缓冲与主线。',
    explainWrong:
      '不是灾祸恐吓，也不能只看财透。先练：冲＝窗，透＝照亮。',
  },
];

export function guessDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 按日稳定抽题 */
export function pickDailyGuessCard(dayKey = guessDayKey()): GuessCard {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) h = (h * 31 + dayKey.charCodeAt(i)) | 0;
  const i = Math.abs(h) % GUESS_CARDS.length;
  return GUESS_CARDS[i]!;
}
