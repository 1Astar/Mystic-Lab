import type { LifeForecast, LifeProfileInput } from './types.ts';

export const FORECAST_QUESTION_PRESETS = [
  '猜猜我下一份工作在哪里？',
  '猜猜我什么时候买房？',
  '猜今天会不会发生某件关键的事？',
  '猜猜这段关系接下来会怎么走？',
] as const;

function addDays(isoDate: Date, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function detectScene(question: string): 'job' | 'house' | 'today' | 'relation' | 'generic' {
  const q = question.trim();
  if (/工作|公司|offer|入职|下一份/.test(q)) return 'job';
  if (/买房|房贷|首付|置业/.test(q)) return 'house';
  if (/今天|今晚|这周|明天/.test(q)) return 'today';
  if (/关系|恋爱|分手|复合|相亲/.test(q)) return 'relation';
  return 'generic';
}

/** 本地模板：预测假设 + 依据（探索对照，非断语） */
export function buildTemplateForecast(
  question: string,
  context: string,
  profile: LifeProfileInput,
  now = new Date(),
): Omit<LifeForecast, 'id' | 'result' | 'reflection' | 'checkedAt'> {
  const q = question.trim() || '接下来会发生什么？';
  const ctx = context.trim() || profile.confusion.trim() || '未补充更多现实细节';
  const occ = profile.occupation.trim() || '当前工作';
  const city = profile.city.trim() || '当前城市';
  const scene = detectScene(q);

  const byScene: Record<
    typeof scene,
    { prediction: string; rationale: string; days: number }
  > = {
    job: {
      prediction: `下一份更可能仍贴近「${occ}」能力圈，地点大概率落在${city}或同级城市的机会半径内，而不是突然跨到完全陌生赛道。`,
      rationale: `依据：你已填写的职业与城市构成迁移成本；困惑「${ctx}」更像在现有坐标上找更好匹配，而非一次性清空身份。可对照：投递方向是否仍以同类岗位为主。`,
      days: 60,
    },
    house: {
      prediction: `买房时点更可能落在「现金流与决策焦虑同时下降」的窗口，而不是某个神秘吉日；短期内更像继续观察与算账。`,
      rationale: `依据：置业通常受储蓄、利率与城市政策约束；结合你在${city}的现状与「${ctx}」，当前更像信息收集期。可对照：是否出现明确预算与看房节奏。`,
      days: 120,
    },
    today: {
      prediction: `今天更可能出现「小信号」而不是戏剧转折——一次对话、一条消息或一个打断日常的选择点。`,
      rationale: `依据：短窗口预测应降低期望；你提到的「${ctx}」提示注意力已在某件事上，这类关注本身常会放大微事件。可对照：晚上回顾是否真有可写进手札的一刻。`,
      days: 1,
    },
    relation: {
      prediction: `这段关系接下来更可能先经历一次「澄清边界」的对话或冷处理，而不是立刻定终身或彻底结束。`,
      rationale: `依据：关系变化通常先有节奏变化；结合现状与「${ctx}」，双方可能还缺一次把期待说清楚的机会。可对照：两周内有没有实质沟通，而不只是情绪起伏。`,
      days: 21,
    },
    generic: {
      prediction: `围绕「${q}」，更可能出现可观察的小进展/小阻碍各一次，而不是一次定论。`,
      rationale: `依据：已填信息（${occ} · ${city}）与补充「${ctx}」指向仍在进行中的局面。可对照：到复查日时，现实有没有朝假设方向滑动一点。`,
      days: 30,
    },
  };

  const pack = byScene[scene];
  return {
    question: q,
    context: ctx,
    prediction: pack.prediction,
    rationale: pack.rationale,
    checkBy: addDays(now, pack.days),
    source: 'template',
    createdAt: now.toISOString(),
  };
}

export function forecastStats(list: LifeForecast[]): {
  total: number;
  pending: number;
  hit: number;
  miss: number;
} {
  let pending = 0;
  let hit = 0;
  let miss = 0;
  for (const f of list) {
    if (f.result === 'hit') hit += 1;
    else if (f.result === 'miss') miss += 1;
    else pending += 1;
  }
  return { total: list.length, pending, hit, miss };
}
