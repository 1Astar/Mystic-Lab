import type { CardReading } from '../interpretation/types.ts';
import {
  formatHotspotsForPrompt,
  topicSceneKeywords,
} from '../interpretation/structured-reading.ts';
import {
  assignCardsToQuestions,
  type QuestionThread,
} from '../interpretation/question-thread.ts';
import {
  classifySubQuestion,
  splitUserQuestions,
} from '../interpretation/question-parts.ts';
import { sanitizeTopicText } from '../interpretation/topic-sanitize.ts';
import { polishInsightFields, polishReadingCopy } from '../interpretation/reading-polish.ts';
import { workThreadGoldStandardLines } from '../interpretation/work-thread-gold.ts';
import { loadAiSettings, type AiSettings } from './settings.ts';

export type LlmContextualRequest = {
  question: string;
  card: CardReading;
  background?: string;
  /** 追问时：用户原问题 */
  originalQuestion?: string;
  isFollowUp?: boolean;
};

export type LlmSpreadRequest = {
  question: string;
  cards: CardReading[];
  background?: string;
};

function topicLockLines(topic: CardReading['topic']): string[] {
  if (topic === 'work') {
    return [
      '【主题锁定·职场·强裁剪】用户在问工作/离职/转正/面试/收入。',
      '严禁出现：恋爱、旧情人、单身建议、他人是否喜欢我、原生家庭、两性关系套话。',
      '只谈：精力状态、去留路径、风险、可执行行动、市场核实。',
      '结构优先级：用户问题顺序 > 行动建议 > 牌意映射。禁止长篇牌义百科。',
    ];
  }
  if (topic === 'love') {
    return ['【主题锁定·感情】围绕关系信号与边界；不要硬扯升职加薪流程。'];
  }
  return ['紧扣用户原问题主题，禁止跑题套话。'];
}

/** 正/逆位解读硬规则：逆位不得复述正位 */
function orientationLogicLines(card: CardReading): string[] {
  const k = card.selectedCard;
  const upright = k.uprightMeaning?.trim() || k.oneSentence;
  const reversed = k.reversedMeaning?.trim() || '';
  if (card.orientation !== 'reversed') {
    return [
      '【正位】按正位牌意解读：能量通畅、主题可正向展开。',
      `正位牌意参考：${upright}`,
    ];
  }
  return [
    '【逆位·强制逻辑】本张为逆位。必须按逆位解读，禁止把正位结论换皮再说一遍。',
    '逆位常见轴（择 1–2 个落地到用户问题）：阻滞/延迟、内化过度、能量失衡、抗拒或逃避、表里不一、时机未到。',
    `正位底色（仅作对照，勿当结论）：${upright}`,
    reversed
      ? `逆位牌意（主轴，必须用）：${reversed}`
      : '逆位牌意：在正位主题上出现阻滞、失衡或需要调整的一面。',
    '写作要求：insight/overview/action 都要体现「逆位差异」；可写「若正位会偏…，此刻逆位更像…」。',
  ];
}

function orientationLogicForSpread(cards: CardReading[]): string[] {
  const lines = ['【正逆位】下列每张牌必须按其正/逆位解读；逆位禁止复述正位。'];
  for (const c of cards) {
    const upright = c.selectedCard.uprightMeaning?.trim() || c.selectedCard.oneSentence;
    const rev = c.selectedCard.reversedMeaning?.trim() || '';
    if (c.orientation === 'reversed') {
      lines.push(
        `- 【${c.cardName}】逆位 → 主轴：${rev || '阻滞/失衡/需调整'}；正位仅对照：${upright.slice(0, 48)}${upright.length > 48 ? '…' : ''}`,
      );
    } else {
      lines.push(`- 【${c.cardName}】正位 → ${upright.slice(0, 64)}${upright.length > 64 ? '…' : ''}`);
    }
  }
  return lines;
}

function buildPrompt(req: LlmContextualRequest): string {
  const { question, card, background, originalQuestion, isFollowUp } = req;
  const orient = card.orientation === 'reversed' ? '逆位' : '正位';
  const sceneKw = topicSceneKeywords(card.selectedCard, card.topic);
  const bg = background?.trim() || card.readingContext.background?.trim();
  const hotspots = formatHotspotsForPrompt(card.selectedCard.deckId);
  const parts = splitUserQuestions(question);
  const partsBlock =
    parts.length > 1
      ? [
          '用户把问题拆成了多条，你必须按下列顺序逐条作答（questionAnswers 条数=下列条数）：',
          ...parts.map((p, i) => `${i + 1}. ${p}`),
          '每条 insight 只回答这一条，禁止复读其他子问。',
        ].join('\n')
      : `用户问题：${question || '（未填写）'}`;

  return [
    '你是精通心理学与职场经验的塔罗师。解读是帮用户理清头绪的心理模型，不是空洞预测。',
    '开场可用一句共情（点出疲惫/纠结），但立刻进入逐条作答。',
    `用户当前这张牌是【${card.cardName}】（${orient}），牌阵位置：${card.position || '未知'}（${card.positionMeaning || '—'}）。`,
    ...orientationLogicLines(card),
    ...topicLockLines(card.topic),
    '',
    '必须严格按 JSON 输出（不要 markdown 代码围栏），格式：',
    JSON.stringify({
      empathyLead: '一句共情开场',
      overview:
        '2–3句：只解读「本张牌 × 其所在牌阵位置」；禁止罗列/复述用户全部子问题；阻碍位须把牌意读成风险/卡点',
      questionAnswers: [
        {
          question: '用户原问题原文',
          meaningMap: '牌意映射：这张牌是「关键词」的牌（必填）',
          insight:
            '深度剖析或走势：直接回答这一条；路径问写前段/中后段；约 5–10 句',
          action: '1–3条可执行行动',
        },
      ],
      oneLiner: '一句话破局点',
      elementMappings: [
        {
          label: '牌面元素名',
          title: '现实状况：「元素」意味着什么？',
          originalMeaning: '牌面原意',
          body: '映射到用户职场/所问场景',
        },
      ],
      advice: '总行动建议（短）',
      comfort: '一句安抚',
      actionTags: ['强制休整', '核实条款'],
      followUps: ['追问1？', '追问2？'],
    }),
    '',
    '优先级：questionAnswers > overview > elementMappings。',
    'overview 硬规则：禁止出现「关于【提问1】…【提问5】」或把子问题清单抄进正文；用户问题只在 questionAnswers 里逐条答。',
    'overview 必须结合牌阵位置：若位置是「阻碍」，正位好牌也要读成卡点/风险（如理想化、情绪决策、信息核实不足），禁止写成顺风鼓励。',
    `本张位置强调：${card.position || '未知'}——${card.positionMeaning || '按该位功能解读'}。`,
    'questionAnswers：按用户子问题顺序；每条必须有 meaningMap + insight；指哪打哪；禁止复读牌义百科。',
    'reason 写深度剖析；路径问写走势预测（须分前段/中后段）；风险问须标「情况：」「阻碍：」；建议写短中长期行动。',
    '篇幅：路径/建议 insight 允许 6–12 句；其余 5–8 句。用『』标出一句最关键结论。',
    ...(card.topic === 'work' && parts.length >= 2 ? workThreadGoldStandardLines() : []),
    'action 必须具体可执行；不要空话；检查有无漏字错字（如「转化」勿写成「选择」）。',
    'elementMappings：可选；body 只写该元素落到用户主题的一句映射；禁止复述全部子问题；阻碍位元素也要写成卡点。',
    '',
    '硬性约束：',
    '- 用「你」称呼；先结论后原因再建议',
    '- 不问准日期定数',
    '- 不虚构用户未提供的公司名/薪资数字',
    '- 禁止输出与主题无关的恋爱/旧情人/原生家庭段落',
    '- 同一信息只出现一次',
    card.orientation === 'reversed'
      ? '- 逆位：禁止只复述正位；必须写出阻滞/失衡/需调整的具体落点'
      : '',
    isFollowUp ? '- 这是追问：深化，不要重复空话' : '',
    '',
    isFollowUp && originalQuestion ? `用户原问题：${originalQuestion}` : '',
    partsBlock,
    bg ? `用户补充背景：${bg}` : '用户补充背景：（无）',
    `场景关键词：${sceneKw}`,
    `标准一句话：${card.selectedCard.oneSentence}`,
    '',
    hotspots,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSpreadPrompt(req: LlmSpreadRequest): string {
  const { question, cards, background } = req;
  const topic = cards[0]?.topic ?? 'self';
  const parts = splitUserQuestions(question);
  const intents = parts.map((p) => classifySubQuestion(p));
  const assignment = assignCardsToQuestions(intents, cards.length);

  const cardBlock = cards
    .map((c, i) => {
      const orient = c.orientation === 'reversed' ? '逆位' : '正位';
      return `${i}. 【${c.cardName}】${orient} · 位置「${c.position || '—'}」· 关键词：${c.keywords.slice(0, 4).join('、')}`;
    })
    .join('\n');

  const assignBlock = parts
    .map((p, i) => {
      const idxs = assignment[i] ?? [0];
      const names = idxs.map((j) => cards[j]?.cardName ?? `牌${j}`).join(' + ');
      return `${i + 1}. ${p}  → 绑定：${names}（cardIndexes: [${idxs.join(',')}])`;
    })
    .join('\n');

  return [
    '你是精通心理学与职场经验的塔罗师。这是一次「整盘按问题串讲」，不是一张张卡分别百科。',
    '根据牌阵，先给整盘结论，再严格按用户子问题顺序作答。',
    ...topicLockLines(topic),
    ...orientationLogicForSpread(cards),
    '',
    '牌阵：',
    cardBlock,
    '',
    '子问题与牌绑定（主轴必须遵守；路径走势可引用整盘其他牌作对照，但 insight 主角仍是绑定牌/牌位）：',
    assignBlock,
    '',
    '严格输出 JSON（不要 markdown 围栏）：',
    JSON.stringify({
      empathyLead: '一句共情（想走又纠结/疲惫）',
      overview: '2–4句核心结论：内耗？阻碍偏情绪还是外部？先休息再决定',
      questionAnswers: [
        {
          question: '用户子问题原文',
          cardIndexes: [0],
          heading: '【牌名】的××',
          meaningMap: '牌意映射 + 点名情况/阻碍/建议位（1–2句）',
          insight:
            '深度剖析或走势（leave 须前期/中期/后期；stay 写温水与画饼；risk ①②③；advice 休整→初心→体面；约 6–12 句）',
          action: '2–3条可执行行动',
        },
      ],
      oneLiner: '先休息，再做决定',
      actionTags: ['强制休整', '回溯初心', '体面过渡'],
    }),
    '',
    '去重：overview 不复述各子问；各条 insight 互不复制；风险/建议只写交叉点。',
    '每条必须有 meaningMap + insight。',
    'reason → 深度剖析（心累＞任务重）；leave_path → 前期/中期/后期；stay_path → 温水煮青蛙+理想化理由；risk → 情绪化/画饼/断崖撤退；advice → 休整→初心→体面过渡。',
    'heading 示例：【宝剑四】的真相 / 【圣杯骑士】的试探与寻觅 / 【圣杯六】的温情与停滞 / 【A + B】的暗礁 / 整阵的行动策略。',
    '行动导向：用户要的是「该怎么办」，不是牌面教科书。',
    '每条 insight/action 用『』标出一句最关键结论；输出前自查漏字错字。',
    '逆位牌的 heading/insight 必须体现逆位差异，禁止写成正位套话。',
    '若牌位名含「情况」「阻碍」「建议」，在 meaningMap 或 insight 里点名该位次；阻碍位须读成卡点。',
    ...(topic === 'work' ? workThreadGoldStandardLines() : []),
    background?.trim()
      ? `用户补充背景：${background.trim()}`
      : '用户补充背景：（无）',
  ]
    .filter(Boolean)
    .join('\n');
}

async function chatCompletion(
  userContent: string,
  systemContent: string,
  settings: AiSettings,
  maxTokens = 2200,
): Promise<string> {
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.55,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `AI 请求失败 (${res.status})${errText ? `: ${errText.slice(0, 120)}` : ''}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('AI 返回为空');
  return text;
}

export async function fetchContextualReading(
  req: LlmContextualRequest,
  settings: AiSettings = loadAiSettings(),
): Promise<string> {
  return chatCompletion(
    buildPrompt(req),
    '你是精通心理学与职场的塔罗师。只输出合法 JSON。必须按用户子问题逐条回答；主题锁定时禁止恋爱套话；指哪打哪，行动导向；禁止复读牌义百科。逆位必须按逆位逻辑解读，禁止复述正位。路径问须分前段/中后段，insight 允许加长。',
    settings,
    2800,
  );
}

/** 多牌一次：整盘按问题串讲 */
export async function fetchSpreadThreadReading(
  req: LlmSpreadRequest,
  settings: AiSettings = loadAiSettings(),
): Promise<string> {
  return chatCompletion(
    buildSpreadPrompt(req),
    '你是精通心理学与职场的塔罗师。只输出合法 JSON。整盘按问题串讲；主题锁定时禁止恋爱套话；指哪打哪，行动导向。逆位牌必须按逆位逻辑，禁止复述正位。职场多子问须达到金标准深度：分阶段走势、短中长期建议、insight 允许 6–12 句。',
    settings,
    4200,
  );
}

export function parseSpreadThreadJson(
  raw: string,
  cards: CardReading[],
  question: string,
): QuestionThread | null {
  try {
    const text = raw.trim().replace(/^```(?:json)?\s*|\s*```$/gi, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonText = start >= 0 && end > start ? text.slice(start, end + 1) : text;
    const parsed = JSON.parse(jsonText) as {
      empathyLead?: unknown;
      overview?: unknown;
      oneLiner?: unknown;
      questionAnswers?: unknown;
    };
    const parts = splitUserQuestions(question);
    const topic = cards[0]?.topic ?? 'self';
    const intents = parts.map((p) => classifySubQuestion(p));
    const assignment = assignCardsToQuestions(intents, cards.length);
    const rawAnswers = Array.isArray(parsed.questionAnswers)
      ? parsed.questionAnswers
      : [];

    const answers = parts.map((part, i) => {
      const row = (rawAnswers[i] ?? {}) as {
        question?: unknown;
        insight?: unknown;
        action?: unknown;
        meaningMap?: unknown;
        heading?: unknown;
        cardIndexes?: unknown;
      };
      const indexes = Array.isArray(row.cardIndexes)
        ? row.cardIndexes
            .map((n) => Number(n))
            .filter((n) => n >= 0 && n < cards.length)
        : assignment[i]!;
      const idxs = indexes.length ? indexes : assignment[i]!;
      const names = idxs.map((j) => cards[j]?.cardName).filter(Boolean).join(' + ');
      const intent = intents[i]!;
      const insight = polishReadingCopy(
        sanitizeTopicText(
          String(row.insight ?? '').trim() || `结合【${names}】看「${part}」。`,
          topic,
        ),
      );
      return polishInsightFields({
        question: String(row.question ?? part).trim() || part,
        intent,
        cardIndexes: idxs,
        heading:
          String(row.heading ?? '').trim() ||
          `【${names}】${
            intent === 'advice' ? '的行动策略' : intent === 'risk' ? '的暗礁' : '的提示'
          }`,
        meaningMap: String(row.meaningMap ?? '').trim()
          ? polishReadingCopy(sanitizeTopicText(String(row.meaningMap).trim(), topic))
          : undefined,
        insight,
        action: String(row.action ?? '').trim()
          ? polishReadingCopy(sanitizeTopicText(String(row.action).trim(), topic))
          : undefined,
      });
    });

    if (!answers.length) return null;

    return {
      empathyLead: polishReadingCopy(
        sanitizeTopicText(
          String(parsed.empathyLead ?? '').trim() ||
            '根据你的牌阵，我先帮你把问题理清。',
          topic,
        ),
      ),
      overall: polishReadingCopy(
        sanitizeTopicText(
          String(parsed.overview ?? '').trim() || answers[0]!.insight.slice(0, 80),
          topic,
        ),
      ),
      answers,
      oneLiner: polishReadingCopy(
        sanitizeTopicText(
          String(parsed.oneLiner ?? '').trim() ||
            answers.find((a) => a.intent === 'advice')?.action ||
            '先稳住，再决定。',
          topic,
        ),
      ),
      provider: 'llm',
    };
  } catch {
    return null;
  }
}

/** 最小请求，用于配置页验证 Base URL / Key / 模型是否可用 */
export async function testAiConnection(settings: AiSettings): Promise<string> {
  const baseUrl = settings.baseUrl.trim().replace(/\/$/, '');
  const apiKey = settings.apiKey.trim();
  const model = settings.model.trim();

  if (!baseUrl) throw new Error('请先填写 API Base URL');
  if (!apiKey) throw new Error('请先填写 API Key');
  if (!model) throw new Error('请先选择或填写模型');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 20,
      temperature: 0,
      messages: [{ role: 'user', content: '请只回复两个字：成功' }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(formatApiError(res.status, errText));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('接口已连通，但返回内容为空');
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

function formatApiError(status: number, raw: string): string {
  if (!raw) return `请求失败 (${status})`;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    const msg = parsed.error?.message?.trim();
    if (msg) return `请求失败 (${status})：${msg.slice(0, 120)}`;
  } catch {
    /* ignore */
  }
  return `请求失败 (${status})：${raw.slice(0, 120)}`;
}
