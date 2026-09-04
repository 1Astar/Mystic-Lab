/**
 * 此刻解读 · 问题路由 + 首句直答 + 人话化（全板块共用）
 * 必须先用人话答字面问句，再展开术数结构；禁止「用神」「承载→启蒙」式 jargon 当头。
 */
import type { CastResult } from '../liuyao/engine.ts';
import type { BoardSignals } from './board-signals.ts';
import { allPhenomena, paceLabel } from './board-signals.ts';
import { isMetaUxQuestion } from './meta-ux.ts';
import type { IntentId } from './types.ts';

export type QuestionRoute =
  | 'meta_ux'
  | 'legal_after_report'
  | 'threat_harassment'
  | 'family_dispute_outcome'
  | 'outcome_trajectory'
  | 'timing'
  | 'career_decision'
  | 'love_relationship'
  | 'money_wealth'
  | 'health_body'
  | 'exam_study'
  | 'anxiety_choice'
  | 'general';

export type InstantAnswerInput = {
  question: string;
  cast?: CastResult;
  route?: QuestionRoute;
  intentId?: IntentId;
  /** 盘面偏慢 / 关键点弱 */
  paceSlow?: boolean;
  paceStop?: boolean;
  yongWeak?: boolean;
  tugOfWar?: boolean;
};

const KEYWORD_PLAIN: Record<string, string> = {
  承载: '先稳住证据、底线和受理回执',
  接纳: '按程序一步步走',
  厚德: '把该留的材料留全',
  启蒙: '后面还要把事实问清楚',
  求教: '多向承办人核对、保留书面',
  模糊: '结论还会变，别一次定死',
  困顿: '会先卡住一阵',
  决断: '到了该拍板的时候',
  愉悦: '氛围可能缓和，但仍要盯行动',
  归来: '有重启、反复打交道的可能',
  过重: '压力偏大，宜减负担、找支点',
  开创: '适合主动推进一步',
  等待: '条件未齐，先准备再动',
};

function keywordPlain(kw: string): string {
  return KEYWORD_PLAIN[kw] ?? kw;
}

/** 识别问题路由（优先于泛 intent） */
export function routeQuestion(question: string, intentId?: IntentId): QuestionRoute {
  const q = question.trim();
  if (!q) return 'general';
  if (isMetaUxQuestion(q)) return 'meta_ux';

  if (/报了?警|报警|110|立案|警察|派出所|司法机关|法院|起诉|维权|笔录|接警/.test(q)) {
    return 'legal_after_report';
  }
  if (/爸|妈|父亲|母亲|父母|家里|家人|家事|（家庭）/.test(q)) {
    if (
      /怎么|走向|发展|解决|会不会|要不要|需不需要|最终|威胁|打|暴力|做什么|会做|后果|会怎样/.test(
        q,
      )
    ) {
      return 'family_dispute_outcome';
    }
  }
  if (/威胁|恐吓|骚扰|家暴|纠缠|打人|暴力|挟持/.test(q)) {
    return 'threat_harassment';
  }
  if (
    /走向|会怎么样|如何发展|最终会|事情都|之后.*怎么|都走向|做什么|会做|会怎样|什么后果|有什么后果|后果/.test(
      q,
    )
  ) {
    return 'outcome_trajectory';
  }
  if (intentId === 'timing' || /几月|何时|什么时候|应期|哪天能/.test(q)) {
    return 'timing';
  }
  if (
    /离职|裸辞|跳槽|面试|offer|转正|老板|同事|公司|工作|职场|升职|转岗|创业/.test(q)
  ) {
    return 'career_decision';
  }
  if (/喜欢|爱|感情|复合|分手|暧昧|结婚|对象|男友|女友|前任|婚姻/.test(q)) {
    return 'love_relationship';
  }
  if (/钱|薪|收入|投资|理财|贷款|债|买.*值不值|消费/.test(q)) {
    return 'money_wealth';
  }
  if (/健康|生病|体检|手术|康复|身体|医院/.test(q)) {
    return 'health_body';
  }
  if (/考试|考研|留学|面试.*学校|学习|复习|上岸/.test(q)) {
    return 'exam_study';
  }
  if (/纠结|犹豫|要不要|该不该|能不能|选哪个/.test(q)) {
    return 'anxiety_choice';
  }
  return 'general';
}

export function isPlainAnswerRoute(route: QuestionRoute): boolean {
  return route !== 'general' && route !== 'meta_ux';
}

function hexRhythmPlain(cast: CastResult): string {
  const from = cast.primary.keywords.slice(0, 2).map(keywordPlain).join('、') || cast.primary.name;
  if (!cast.changed) {
    return `眼下节奏偏「${from}」——先把事实和底线稳住，再谈后面怎么走。`;
  }
  const to = cast.changed.keywords.slice(0, 2).map(keywordPlain).join('、') || cast.changed.name;
  return `过程会先「${from}」，再转向「${to}」——中间会有核对、反复，不是一夜定音。`;
}

function paceHint(input: InstantAnswerInput): string {
  if (input.paceStop || input.yongWeak) {
    return '主动权暂时不在你手里：先把书面回执、承办联系方式和下一次节点记牢，再催进度。';
  }
  if (input.paceSlow || input.tugOfWar) {
    return '推进会偏慢、会拉扯几次；口头安慰不算数，以书面进展为准。';
  }
  return '用一件本周能核对的小事试探（问一句、留一条回执、记一个节点），再决定加码还是等。';
}

function joinAnswer(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join('');
}

function routeCoreAnswer(route: QuestionRoute, question: string): string {
  const q = question.trim();
  switch (route) {
    case 'meta_ux':
      return '流程有一点仪式感，但不会长到劝退；下面会先给你一句结论，再展开可核对的几步——不是只剩空话。';
    case 'legal_after_report':
      return '报警之后，事情会走「受理 → 调查/调解 → 书面反馈」这条程序线，不会一夜结案。';
    case 'threat_harassment':
      return '这件事的核心是「安全 + 可留证的行动」：先护住人身与通讯记录，再谈怎么收场。';
    case 'family_dispute_outcome':
      return '家事的收场通常不会突然翻篇，也不会一夜恶化到不可控——更像先稳住安全与证据，再一点点对齐怎么处理。';
    case 'outcome_trajectory': {
      const subject = q.replace(/[？?].*$/, '').slice(0, 40);
      return subject
        ? `就「${subject}」：走势偏渐进，不会立刻给出非黑即白的终局。`
        : '就你问的走向：过程偏渐进，不会立刻给出非黑即白的终局。';
    }
    case 'timing':
      return '时机不是钉死某一天，而是「条件凑齐的窗口」。';
    case 'career_decision':
      if (/离职|裸辞|走不走|要不要走/.test(q)) {
        return '去留不是今晚就要拍板的事：先把「留下还能接受什么 / 必须走的信号 / 最晚哪天定」写清楚，再动。';
      }
      if (/面试|offer|录取|能不能进/.test(q)) {
        return '面试/录取类问题：口头好感不算数，用书面节点（回执、补材料、下一轮时间）换可核对进展。';
      }
      return '职场题宜先对齐一件可核对的事实（职责、钱、时间窗），再决定加码还是撤。';
    case 'love_relationship':
      if (/复合|回头|还能不能/.test(q)) {
        return '复合类问题：先看对方有没有主动修复的动作，别先写长篇剧本。';
      }
      return '感情题先用一次低压力的清晰互动验证，看回应质量再决定加码还是收手。';
    case 'money_wealth':
      return '钱的事先设止损/上限和核对点，再决定加码——忌凭感觉梭哈。';
    case 'health_body':
      return '健康以可核对的医疗信息为准；这里只谈节奏与心态，不替医生下结论。';
    case 'exam_study':
      return '考试/学习宜拆成本周能打完勾的一小段，用模考或作业验证，再估窗口。';
    case 'anxiety_choice':
      return '纠结宜拆成可逆的一小步：设一个决定日，到期用清单拍板，少无限内耗。';
    default:
      return '';
  }
}

function routeTailHint(route: QuestionRoute): string {
  switch (route) {
    case 'family_dispute_outcome':
      return '把底线、可接受方案、必须止损的三条信号写成清单，按节点核对对方动作。';
    case 'career_decision':
      return '本周只推一个可打勾的职场动作，用对方回应决定加码还是停。';
    case 'love_relationship':
      return '给短观察期：看配合还是含糊，再谈下一步。';
    case 'money_wealth':
      return '把数字、期限、退出条件写进备忘录，口头不算。';
    case 'exam_study':
      return '日历标一个复盘日：有进步再加码，没进步就改方法。';
    case 'anxiety_choice':
      return '写下最怕的两件事；本周只做一件可逆小实验。';
    default:
      return '';
  }
}

/** 无盘面时（塔罗/小六壬/八字提问）也能直答 */
export function buildPlainDirectAnswer(
  question: string,
  opts?: { intentId?: IntentId },
): string {
  const route = routeQuestion(question, opts?.intentId);
  const core = routeCoreAnswer(route, question);
  if (!core) return buildGeneralPlainAnswer(question, opts?.intentId);
  const tail = routeTailHint(route);
  return joinAnswer([core, tail]);
}

function buildGeneralPlainAnswer(question: string, intentId?: IntentId): string {
  const q = question.trim();
  if (!q) return '';
  if (isMetaUxQuestion(q)) {
    return routeCoreAnswer('meta_ux', q);
  }
  const route = routeQuestion(q, intentId);
  if (route !== 'general') {
    return buildPlainDirectAnswer(q, { intentId });
  }
  if (/工作|职场|公司|老板|同事/.test(q)) {
    return '先把最卡你的一件事写清（钱、职责还是节奏），本周只推一个可核对动作。';
  }
  if (/感情|关系|他|她|对象/.test(q)) {
    return '关系题先看对方动作，再看你的期待；用一次清晰互动验证，别空耗猜测。';
  }
  if (/钱|收入|投资/.test(q)) {
    return '财务先设上限与核对点，小步确认再加码。';
  }
  return '先把问题压成一句「我最想确认什么」，再用一件本周能完成的小事去验证。';
}

/** 首句直答：能路由则必返人话；general 尝试 intent 兜底 */
export function buildInstantDirectAnswer(input: InstantAnswerInput): string {
  const route = input.route ?? routeQuestion(input.question, input.intentId);
  const core = routeCoreAnswer(route, input.question);
  if (!core) {
    const general = buildGeneralPlainAnswer(input.question, input.intentId);
    if (general) return general;
    return '';
  }

  const rhythm = input.cast ? hexRhythmPlain(input.cast) : '';
  const tail = routeTailHint(route);
  const parts = [core];
  if (rhythm) parts.push(rhythm);
  if (tail && route !== 'family_dispute_outcome') {
    parts.push(tail);
  } else if (tail) {
    parts.push(tail);
  } else {
    parts.push(paceHint(input));
  }
  return joinAnswer(parts);
}

/** 分题 lean 用人话，禁止 hex 关键词套话 */
export function leanForRoute(
  route: QuestionRoute,
  questionSlice: string,
  intentId?: IntentId,
): string {
  if (route === 'general') {
    const plain = buildPlainDirectAnswer(questionSlice, { intentId });
    if (plain) {
      const first = plain.split(/[。！!]/).find((s) => s.trim());
      return first ? `${first.trim()}。` : plain;
    }
  }
  const core = routeCoreAnswer(route, questionSlice);
  if (core) {
    const first = core.split(/[。！!]/).find((s) => s.trim());
    return first ? `${first.trim()}。` : core;
  }
  return '';
}

/** 旧版 headline 是否含 jargon / 套话（用于替换） */
export function headlineLooksGeneric(text: string): boolean {
  return (
    /用神（按所问而定）|力气偏弱|先把局面拆成可核对的一小步.*偏「/.test(text) ||
    /本题核心宜用「/.test(text) ||
    /几件事绑在一起看：局面正从「/.test(text) ||
    /当前主调是「/.test(text) ||
    /对应你的问题：先把本卦主调/.test(text)
  );
}

function plainClosingLine(s: BoardSignals, route: QuestionRoute): string {
  if (route === 'legal_after_report') {
    return '所以：本周记牢承办联系方式与下一次书面节点；没有回执就不把口头当结论。';
  }
  if (route === 'threat_harassment') {
    return '所以：人身与证据优先；任何和解都要在安全前提下谈，必要时继续走正式渠道。';
  }
  if (route === 'family_dispute_outcome') {
    return '所以：先护安全与证据，再谈和解方案；到期按你写好的底线执行。';
  }
  if (route === 'outcome_trajectory' || route === 'timing') {
    return '所以：用一件本周可验证的小事探针，有回应再加码，无回应就停或改路径。';
  }
  if (route === 'career_decision') {
    return '所以：把口头变成书面节点；期限到就按 Plan B，别跟感觉耗。';
  }
  if (route === 'love_relationship') {
    return '所以：看行动不看话术；回应质量决定你是加码还是收手。';
  }
  if (s.bareQuit) {
    return '所以：更支持先写清底线与期限再决定是否裸辞——不是催你立刻交辞呈，也不是无限耗着。';
  }
  return '所以：本周只用一件低成本事去验证，有结果再加码。';
}

const PLAIN_FACT_LINES: {
  id: string;
  priority: number;
  when: import('./board-signals.ts').Phenomenon[];
  line: (s: BoardSignals) => string;
}[] = [
  {
    id: 'yong_weak',
    priority: 80,
    when: ['yong_weak'],
    line: (s) =>
      `你关心的关键点眼下偏弱（节奏 ${paceLabel(s.pace)}）：宜补条件、少硬冲，先把能留的材料留全。`,
  },
  {
    id: 'yong_strong',
    priority: 75,
    when: ['yong_strong'],
    line: () => '关键点还有气：可以用可核对的动作去兑现，别空等好兆头自己落地。',
  },
  {
    id: 'yong_kong',
    priority: 78,
    when: ['yong_kong'],
    line: () => '你盯的那一层力量偏虚，兑现可能偏慢——先别下死结论，等条件补齐再看。',
  },
  {
    id: 'has_ji',
    priority: 70,
    when: ['has_ji'],
    line: (s) => s.jiTip?.replace(/用神|忌神/g, '干扰') || '盘上有拖累层：先减干扰，再谈推进。',
  },
  {
    id: 'has_yuan',
    priority: 68,
    when: ['has_yuan'],
    line: (s) => s.yuanTip?.replace(/用神|原神/g, '助力') || '盘上有可借的资源/信息：可以用来推一小步。',
  },
  {
    id: 'tug',
    priority: 90,
    when: ['tugOfWar'],
    line: () =>
      '一边有隐蔽推力，一边流程又在拦——典型拉锯，结果会反复，不是一次定音。',
  },
  {
    id: 'andong',
    priority: 60,
    when: ['anDong'],
    line: () => '表上安静，暗处可能在推动或犹豫，别只看表面沉默。',
  },
  {
    id: 'yuepo',
    priority: 60,
    when: ['yuePo'],
    line: () => '外部环境偏脆，容易中断、拖期、难一次兑现。',
  },
  {
    id: 'moving',
    priority: 55,
    when: ['has_moving'],
    line: (s) =>
      s.changedName
        ? `有变化落在具体位置：过程会从「${s.primaryName}」走向「${s.changedName}」，宜小步核对。`
        : '有变化落在具体位置，宜小步核对，别一次求终局。',
  },
  {
    id: 'no_change',
    priority: 40,
    when: ['no_change'],
    line: (s) => `局面相对稳（${s.primaryName}）：先把现状与底线看清再加码。`,
  },
  {
    id: 'shi_ke',
    priority: 65,
    when: ['shiYing_ke'],
    line: () => '你这边的需求与外界节奏打架——冲突是信号，不是要你无底线妥协。',
  },
  {
    id: 'shi_sheng',
    priority: 50,
    when: ['shiYing_sheng'],
    line: () => '内外并非完全拧巴，但仍要靠你主动把缺口补上。',
  },
  {
    id: 'pace',
    priority: 45,
    when: ['pace_slow'],
    line: (s) => `节奏偏慢（${paceLabel(s.pace)}）：急不得也停不得时，先做可核对的一小步。`,
  },
  {
    id: 'pace_stop',
    priority: 72,
    when: ['pace_stop'],
    line: () => '走向偏停/守：该停则停时，守住边界比硬冲更重要。',
  },
];

/** 折叠区「为何这样看」：plain 路由不用用神 jargon */
export function buildHumanTruthFromFacts(
  s: BoardSignals,
  question: string,
  route?: QuestionRoute,
): string {
  const r = route ?? routeQuestion(question, s.intentId);
  if (!isPlainAnswerRoute(r)) {
    return '';
  }

  const fired = PLAIN_FACT_LINES.filter((rule) => allPhenomena(s, rule.when)).sort(
    (a, b) => b.priority - a.priority,
  );

  const board = s.changedName
    ? `从「${s.primaryName}」走向「${s.changedName}」`
    : `主调在「${s.primaryName}」`;
  const lines: string[] = [
    `${board}。下面用盘面信号说明「为什么会这样看」——用人话，不堆术语。`,
  ];

  const primary = fired[0];
  if (primary) {
    lines.push(primary.line(s).trim());
  } else {
    lines.push('关键点需要你对照现实动作去验证，别先下死结论。');
  }
  for (const rule of fired.slice(1, 3)) {
    const text = rule.line(s).trim();
    if (text && !lines.includes(text)) lines.push(text);
  }
  lines.push(plainClosingLine(s, r));
  return lines.join('\n\n');
}

/** 综合论断 outcome 人话化（plain 路由） */
export function humanizeSynthesisOutcome<T extends { lean: string; label: string; text: string }>(
  outcome: T,
  route: QuestionRoute,
): T {
  if (!isPlainAnswerRoute(route)) return outcome;
  let text = outcome.text
    .replace(/用神/g, '关键点')
    .replace(/世应/g, '你与外界')
    .replace(/原神/g, '助力')
    .replace(/忌神/g, '干扰');
  if (route === 'legal_after_report') {
    text = '程序线会拉长、会核对：倾向「能推进也有拦阻」，成败不会一夜定音。宜盯书面节点，别空等口头安慰。';
  } else if (route === 'family_dispute_outcome') {
    text = '家事收场偏渐进：先稳安全与证据，再谈对齐方案。短期硬成概率不高，但也不是无路可走。';
  } else if (route === 'threat_harassment') {
    text = '安全与留证优先：倾向「先护住再谈收场」。任何和解都要在可核对条件下进行。';
  }
  return { ...outcome, text };
}

/** mapPrimaryToQuestion 等人话映射 */
export function mapQuestionPlain(
  route: QuestionRoute,
  question: string,
  kind: 'primary' | 'changed',
): string {
  const q = question.trim();
  switch (route) {
    case 'legal_after_report':
      return kind === 'primary'
        ? '对应你的问题：报警后先走受理与留证，程序会比情绪慢——书面回执比口头可靠。'
        : '对应你的问题：后面还要把事实问清楚、材料补全；不是一夜定性，但方向是往「弄清事实」走。';
    case 'threat_harassment':
      return kind === 'primary'
        ? '对应你的问题：先把人身与通讯记录护住，再谈怎么处理对方。'
        : '对应你的问题：收场取决于你留的证据与正式渠道进展，不宜只靠私下口头。';
    case 'family_dispute_outcome':
      return kind === 'primary'
        ? '对应你的问题：家事不会突然翻篇，先稳安全与底线，再一点点对齐方案。'
        : '对应你的问题：后续走向看双方动作与外部支持；用清单核对，别空想终局。';
    case 'outcome_trajectory':
      return kind === 'primary'
        ? `对应你的问题：就「${q.slice(0, 32)}」——走势偏渐进，用小步验证。`
        : '对应你的问题：下一幕仍要核对事实，不是非黑即白的一锤定音。';
    case 'career_decision':
      return kind === 'primary'
        ? '对应你的问题：职场先对齐钱、职责、时间窗里的一件事实，再决定加码。'
        : '对应你的问题：过渡段宜留后路，用书面节点换确定性。';
    case 'love_relationship':
      return kind === 'primary'
        ? '对应你的问题：感情先看对方动作，再用一次清晰互动验证。'
        : '对应你的问题：走向取决于回应质量，不宜先写长篇剧本。';
    default:
      return '';
  }
}
