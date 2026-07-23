import type { CardReading } from '../interpretation/types.ts';
import {
  formatHotspotsForPrompt,
  topicSceneKeywords,
} from '../interpretation/structured-reading.ts';
import { splitUserQuestions } from '../interpretation/question-parts.ts';
import { loadAiSettings, type AiSettings } from './settings.ts';

export type LlmContextualRequest = {
  question: string;
  card: CardReading;
  background?: string;
  /** 追问时：用户原问题 */
  originalQuestion?: string;
  isFollowUp?: boolean;
};

function topicLockLines(topic: CardReading['topic']): string[] {
  if (topic === 'work') {
    return [
      '【主题锁定·职场】用户在问工作/离职/面试/收入。禁止展开恋爱、旧情人、原生家庭、他人是否喜欢我等无关牌意。',
      '只谈：精力状态、去留路径、风险、可执行行动、市场核实。',
    ];
  }
  if (topic === 'love') {
    return [
      '【主题锁定·感情】围绕关系信号与边界；不要硬扯升职加薪流程。',
    ];
  }
  return ['紧扣用户原问题主题，禁止跑题套话。'];
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
        ].join('\n')
      : `用户问题：${question || '（未填写）'}`;

  return [
    '你是精通心理学与职场经验的塔罗师。解读是帮用户理清头绪的心理模型，不是空洞预测。',
    `用户当前这张牌是【${card.cardName}】（${orient}），牌阵位置：${card.position || '未知'}（${card.positionMeaning || '—'}）。`,
    '开场可用一句共情（点出疲惫/纠结），但立刻进入逐条作答。',
    ...topicLockLines(card.topic),
    '',
    '必须严格按 JSON 输出（不要 markdown 代码围栏），格式：',
    JSON.stringify({
      overview: '2–4句总结论：结合本张牌与问题的整体判断（禁止恋爱套话）',
      questionAnswers: [
        {
          question: '用户原问题原文',
          insight: '牌面洞察：这张牌如何回答这一条（3–6句，具体）',
          action: '1–2条可执行行动',
        },
      ],
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
    'questionAnswers：按用户子问题顺序；每条 insight 必须点名本张牌如何回答该条；禁止复读牌义百科。',
    'actionTags：3–4个短指令，必须贴合本张牌与本题（不要永远「广撒网多面试」）。',
    'elementMappings：可选；每条须 originalMeaning + body；body 必须落在用户主题场景。',
    '',
    '硬性约束：',
    '- 用「你」称呼；先结论后原因再建议',
    '- 不问准日期定数',
    '- 不虚构用户未提供的公司名/薪资数字',
    '- 禁止输出与主题无关的恋爱/旧情人/原生家庭段落',
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

export async function fetchContextualReading(
  req: LlmContextualRequest,
  settings: AiSettings = loadAiSettings(),
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
      messages: [
        {
          role: 'system',
          content:
            '你是精通心理学与职场的塔罗师。只输出合法 JSON：overview/questionAnswers/elementMappings/advice/comfort/actionTags/followUps。必须按用户子问题逐条回答；主题锁定时禁止恋爱套话；指哪打哪，行动导向。',
        },
        {
          role: 'user',
          content: buildPrompt(req),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI 请求失败 (${res.status})${errText ? `: ${errText.slice(0, 120)}` : ''}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('AI 返回为空');
  return text;
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
