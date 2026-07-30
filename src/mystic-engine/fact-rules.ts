/**
 * 事实解释库 · 条件触发
 * 现象 ∩ 意图 → 真相句（分析步：用神 / 旺衰 / 动变 / 世应 / 原忌 / 日月）
 */
import type { IntentId } from './types.ts';
import type { BoardSignals, Phenomenon } from './board-signals.ts';
import { allPhenomena, paceLabel } from './board-signals.ts';

export type FactRule = {
  id: string;
  /** 越高越优先排在前面（同组内） */
  priority: number;
  intents?: IntentId[];
  when: Phenomenon[];
  line: (s: BoardSignals) => string;
};

function intentMatches(rule: FactRule, intentId: IntentId): boolean {
  return !rule.intents?.length || rule.intents.includes(intentId);
}

/** 通用分析事实（所有意图可触发） */
const ANALYSIS_FACTS: FactRule[] = [
  {
    id: 'yong_weak',
    priority: 80,
    when: ['yong_weak'],
    line: (s) =>
      `本题用神偏「${s.yongName}」，相对月令偏「${s.yongWang}」：你关心的那一层眼下力气不足，宜补条件、少硬冲。${s.yongWhy ? `（${s.yongWhy}）` : ''}`,
  },
  {
    id: 'yong_strong',
    priority: 75,
    when: ['yong_strong'],
    line: (s) =>
      `本题用神偏「${s.yongName}」，相对月令偏「${s.yongWang}」：关键点有气，但要用可核对的动作去兑现，别空等。`,
  },
  {
    id: 'yong_kong',
    priority: 78,
    when: ['yong_kong'],
    line: (s) =>
      `用神落空亡：你盯的「${s.yongName}」这一层力量偏虚，兑现可能偏慢——先别下死结论。`,
  },
  {
    id: 'has_ji',
    priority: 70,
    when: ['has_ji'],
    line: (s) => s.jiTip || '盘上有拖累用神的忌神层：先减干扰，再谈推进。',
  },
  {
    id: 'has_yuan',
    priority: 68,
    when: ['has_yuan'],
    line: (s) => s.yuanTip || '盘上有生扶用神的原神层：可借这一层的资源/信息推进。',
  },
  {
    id: 'tug',
    priority: 90,
    when: ['tugOfWar'],
    line: () =>
      '暗动与月破同现：一边有隐蔽推力，一边外部环境/流程又在拦——典型拉锯，结果会反复，不是一次定音。',
  },
  {
    id: 'andong',
    priority: 60,
    when: ['anDong'],
    line: () => '有暗动：表上安静，暗处可能在推动或犹豫，别只看表面沉默。',
  },
  {
    id: 'yuepo',
    priority: 60,
    when: ['yuePo'],
    line: () => '有月破：流程或外部环境偏脆，容易中断、拖期、难一次兑现。',
  },
  {
    id: 'moving',
    priority: 55,
    when: ['has_moving'],
    line: (s) =>
      s.changedName
        ? `有动爻：变化落在具体位置，不是全局翻盘；本卦「${s.primaryName}」→ 变「${s.changedName}」，宜用变卦节奏推进。`
        : `有动爻：变化落在具体位置，宜小步核对。`,
  },
  {
    id: 'no_change',
    priority: 40,
    when: ['no_change'],
    line: (s) => `本卦「${s.primaryName}」、暂无变：局面相对稳，先把现状与底线看清再加码。`,
  },
  {
    id: 'shi_ke',
    priority: 65,
    when: ['shiYing_ke'],
    line: () =>
      '世应相克：你这边的需求与外界（对方/岗位/环境）节奏打架——冲突是信号，不是要你无底线妥协。',
  },
  {
    id: 'shi_sheng',
    priority: 50,
    when: ['shiYing_sheng'],
    line: () => '世应有生扶：内外并非完全拧巴，但仍要靠你主动把缺口补上。',
  },
  {
    id: 'pace',
    priority: 45,
    when: ['pace_slow'],
    line: (s) => `卦名节奏：${paceLabel(s.pace)}——急不得也停不得时，先做可核对的一小步。`,
  },
  {
    id: 'pace_stop',
    priority: 72,
    when: ['pace_stop'],
    line: (s) =>
      `走向偏停/守（${s.changedName ? `变「${s.changedName}」` : `本卦「${s.primaryName}」`}）：该停则停时，守住边界比硬冲更重要。`,
  },
];

function closingLine(s: BoardSignals): string {
  if (s.bareQuit) {
    return `所以：更支持先写清底线与期限再决定是否裸辞——不是催你立刻交辞呈，也不是无限耗着。`;
  }
  if (s.intentId === 'offer_decide' || s.intentId === 'job_search_window') {
    return `所以：别把沉默当否决，也别把一次好感当 offer；用书面跟进/补材料换可核对的回应。`;
  }
  if (s.intentId === 'love_reunion') {
    return `所以：先用一次低压力试探核对回应质量，而不是先写复合剧本。`;
  }
  if (s.intentId === 'quit_vs_stay' || s.intentId === 'quit_now' || s.intentId === 'love_stay_leave') {
    return `所以：把留下的底线、离开的触发条件、截止日期写清楚再执行。`;
  }
  if (s.timingAsk) {
    return `所以：应期宜看动变与补条件之后的窗口，而不是猜一个死日子；本周先做一个可验证动作再估时间。`;
  }
  return `所以：本周只用一件低成本事去验证，有结果再加码。`;
}

/** 组装真相段：盘面 + 用神 + 最多 2 条加码事实 + 收束（不复读问题） */
export function buildTruthFromFacts(s: BoardSignals): string {
  const fired = ANALYSIS_FACTS.filter(
    (r) => intentMatches(r, s.intentId) && allPhenomena(s, r.when),
  ).sort((a, b) => b.priority - a.priority);

  const board = s.changedName
    ? `「${s.primaryName}」→「${s.changedName}」`
    : `「${s.primaryName}」`;
  const lines: string[] = [
    `盘面${board}。下面用卦里的信号说明「为什么会这样看」，不是百科复读卦名。`,
  ];

  const yongHit = fired.find((r) => r.id.startsWith('yong_'));
  const others = fired.filter((r) => !r.id.startsWith('yong_'));
  if (yongHit) {
    lines.push(yongHit.line(s).trim());
  } else {
    lines.push(
      `用神偏「${s.yongName}」：相对月令偏「${s.yongWang}」——先抓住你真正在问的那一层。`,
    );
  }
  const seen = new Set<string>(yongHit ? [yongHit.id] : []);
  for (const r of others.slice(0, 2)) {
    if (seen.has(r.id)) continue;
    const text = r.line(s).trim();
    if (!text) continue;
    seen.add(r.id);
    lines.push(text);
  }
  lines.push(closingLine(s));
  return lines.join('\n\n');
}

/** 供 EvidenceLine / 辅读：条件命中的短句 */
export function mapConditionEvidence(s: BoardSignals): { factKey: string; plain: string }[] {
  return ANALYSIS_FACTS.filter(
    (r) => intentMatches(r, s.intentId) && allPhenomena(s, r.when),
  )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map((r) => ({ factKey: r.id, plain: r.line(s) }));
}
