/**
 * 拆题 + 卦名/关键词 → 口语直译判词（规则模板，不用 LLM）
 */
import type { CastResult } from './engine.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { detectSceneDomain, type SceneDomain } from './scene-map.ts';
import { LINE_ROLE } from './reading-facts.ts';

export type QuestionPart = {
  raw: string;
  kind: 'salary' | 'stay' | 'leave' | 'timing' | 'offer' | 'love' | 'money' | 'general';
};

export type DirectReading = {
  frame: string;
  /** 📌 核心判词 */
  verdict: string;
  /** 解析 */
  analysis: string;
  /** ⛳ 最终决策参考 */
  decision: string;
  /** 🧐 为什么 */
  why: string;
  /** 💡 接下来三件事 */
  nextSteps: string;
  /** 多问时的分答 */
  partLeans: { part: string; lean: string }[];
  domain: SceneDomain;
};

const SOFT = /涣|巽|渐|柔|渗|反复|沟通|协调|磨合/;
const FLOW = /涣|旅|未济|散|流动|漂|迁/;
const HARD = /困|蹇|否|剥|坎|险|阻/;
const OPEN = /泰|同人|大有|升|晋|鼎|丰|既济/;
const CUT = /夬|革|遁|退|决/;

function kwLine(cast: CastResult): string {
  const a = cast.primary.keywords.join('、');
  const b = cast.changed?.keywords.join('、') ?? '';
  return `${cast.primary.name}${cast.primary.fullName}${a}${b}${cast.changed?.name ?? ''}`;
}

export function splitQuestionParts(question: string): QuestionPart[] {
  const raw = question.trim();
  if (!raw) return [];
  const chunks = raw
    .split(/[？?！!；;\n]+|(?<=[了吗呢啊嘛])(?=[我你他她它谁哪什么怎么是否要不要能不能会不会])/)
    .map((s) => s.replace(/^[\d一二三四五六七八九十、.．]+/, '').trim())
    .filter((s) => s.length >= 2);

  const parts = (chunks.length ? chunks : [raw]).map((s): QuestionPart => {
    if (/薪|工资|月薪|\d+\s*k|涨薪|调薪|转正.*拿|拿到.*钱|收入/.test(s)) {
      return { raw: s, kind: 'salary' };
    }
    if (/离职|辞职|走人|跳槽|离开|不干|不留/.test(s)) return { raw: s, kind: 'leave' };
    if (/留|留下|要不要留|继续干|转正(?!.*拿)/.test(s)) return { raw: s, kind: 'stay' };
    if (/几月|何时|什么时候|月底|月初|年底|时机/.test(s)) return { raw: s, kind: 'timing' };
    if (/offer|录用|面试|通过|过关/.test(s)) return { raw: s, kind: 'offer' };
    if (/感情|对象|分手|复合|喜欢|恋爱|婚姻/.test(s)) return { raw: s, kind: 'love' };
    if (/钱|财|回款|投资|亏/.test(s)) return { raw: s, kind: 'money' };
    return { raw: s, kind: 'general' };
  });

  // 去重近义
  const seen = new Set<string>();
  return parts.filter((p) => {
    const key = `${p.kind}:${p.raw.slice(0, 12)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function leanForPart(part: QuestionPart, cast: CastResult, bag: string): string {
  const soft = SOFT.test(bag);
  const flow = FLOW.test(bag);
  const hard = HARD.test(bag);
  const open = OPEN.test(bag);
  const cut = CUT.test(bag);
  const to = cast.changed?.keywords[0] ?? cast.primary.keywords[0] ?? cast.primary.name;

  switch (part.kind) {
    case 'salary':
      if (hard) return '钱难痛快落地，别只盯数字；先把条件写死再谈。';
      if (open) return '数字有机会谈成，但仍要用书面确认，别只听口头。';
      if (soft || flow) return '大概率能谈到，但过程会拉扯、反复，拿到也会觉得费劲。';
      return `薪资结果跟「${to}」同向——能谈，但别一次梭哈。`;
    case 'stay':
      if (flow || soft) return '不建议为数字死磕留下；留下会心累，宜做两手准备。';
      if (cut) return '留下的理由在变弱，宜把「走」当成真实选项。';
      if (open) return '可以留，但要换条件（职责/钱/节奏），原样硬留易憋屈。';
      if (hard) return '硬留会更困，先看有没有可改的局部，再谈去留。';
      return `去留关键看你能不能接受「${to}」式的相处方式。`;
    case 'leave':
      if (flow || cut) return '走是合理选项；卦象也支持把重心挪向新机会。';
      if (soft) return '若要走，宜柔、留后路，别一次性撕破——边谈边铺 Plan B。';
      if (open) return '不是必须立刻走，但要谈清条件；谈不拢再走更干净。';
      return `离职节奏宜对准「${to}」：小步验证，忌赌气拍板。`;
    case 'timing':
      if (soft || flow) return '窗口偏「磨」不偏「冲」：给对方明确期限，逾期就按 Plan B。';
      if (cut) return '宜尽快定调，拖越久越耗。';
      return '先定一个可核对的截止日期，再用事实决定加码还是撤。';
    case 'offer':
      if (hard) return '过关不易，先补最弱的一环再冲。';
      if (open) return '有过关倾向，仍要把关键条款核对清楚。';
      if (soft) return '能推进，但靠反复沟通与补材料，不是一次定音。';
      return `录取/过关与「${to}」同向，用一次可验证动作试探。`;
    case 'love':
      if (soft) return '关系要靠反复低姿态沟通推进，硬推易反弹。';
      if (flow) return '关系偏散、不定，先看双方是否还想聚，再谈结果。';
      return `感情走向偏「${to}」，先对齐期待再表态。`;
    case 'money':
      if (hard) return '钱关偏紧，先保现金流与底线。';
      if (flow || soft) return '钱能过来，但路径绕、要追、要磨。';
      return `财务结果跟「${to}」走，小步确认再加码。`;
    default:
      return `本题核心宜用「${to}」的方式推进，少用蛮力。`;
  }
}

function buildVerdict(parts: QuestionPart[], cast: CastResult, bag: string): string {
  const soft = SOFT.test(bag);
  const flow = FLOW.test(bag);
  const to = cast.changed?.keywords[0] ?? cast.primary.keywords[0] ?? '';
  const from = cast.primary.keywords[0] ?? cast.primary.name;

  const salary = parts.find((p) => p.kind === 'salary');
  const stay = parts.find((p) => p.kind === 'stay');
  const leave = parts.find((p) => p.kind === 'leave');

  if (salary && (stay || leave) && (soft || flow)) {
    const moneyBit = /8\s*k|八千/i.test(parts.map((p) => p.raw).join(''))
      ? '你能拿到 8k'
      : '钱大概率能谈到';
    return `${moneyBit}，但这个「留」的过程会让你很心累。`;
  }
  if (salary && (soft || flow)) {
    return '数字有机会落地，但你会觉得「很费劲」——不是拿不到，是拿到太耗。';
  }
  if (stay && (soft || flow)) {
    return '能留，但不值得为现状死磕；留下会反复内耗。';
  }
  if (leave && (flow || CUT.test(bag))) {
    return '走是说得通的选项；卦象更支持你把重心挪向新机会。';
  }
  if (parts.length >= 2) {
    return `几件事绑在一起看：局面正从「${from}」滑向「${to}」——有结果，但过程磨人，宜两手准备。`;
  }
  if (cast.changed) {
    return `事情正从「${from}」转向「${to}」：方向在变，别用旧法硬扛。`;
  }
  return `当前主调是「${from}」：先把可核对的事实看清，再决定加码还是收手。`;
}

function buildAnalysis(cast: CastResult, bag: string, domain: SceneDomain): string {
  const from = cast.primary.keywords.slice(0, 3).join('、') || cast.primary.name;
  const to = cast.changed?.keywords.slice(0, 3).join('、');
  const matter =
    domain === 'career'
      ? '岗位/团队/谈条件'
      : domain === 'love'
        ? '关系与沟通'
        : domain === 'life'
          ? '资源与安排'
          : '你关心的这件事';

  const p1 =
    `本卦是「${cast.primary.name}」（${cast.primary.fullName}），代表${from}。` +
    (cast.changed
      ? `变卦是「${cast.changed.name}」（${cast.changed.fullName}），代表${to}。`
      : '本卦无动，格局偏静，关键在把现状看清而不是赌突变。');

  let p2: string;
  if (SOFT.test(bag) || FLOW.test(bag)) {
    p2 =
      domain === 'career'
        ? `这意味着：场上可能有混乱或职责不清，你想要的结果大概率要经历漫长且内耗的拉扯（反复沟通）。不是拿不到，而是拿到后你会觉得「很费劲」。`
        : `这意味着：局面在散、在磨，推进靠反复沟通，不靠一次硬推。`;
  } else if (HARD.test(bag)) {
    p2 = `这意味着：${matter}这一层偏紧、偏险，先补最弱的一环，再谈结果。`;
  } else if (OPEN.test(bag)) {
    p2 = `这意味着：有顺势窗口，但仍要把口头承诺落成可核对的条件，防空欢喜。`;
  } else {
    p2 = `这意味着：把「${from}」译回你的现实——对照${matter}，看哪里在散、哪里在聚、你该跟还是该撤。`;
  }

  return `${p1}\n\n${p2}`;
}

function buildDecision(cast: CastResult, bag: string, domain: SceneDomain, parts: QuestionPart[]): string {
  const soft = SOFT.test(bag);
  const flow = FLOW.test(bag);
  const gist = cast.changed?.gist ?? cast.primary.gist;
  const hasStaySalary = parts.some((p) => p.kind === 'stay' || p.kind === 'leave') &&
    parts.some((p) => p.kind === 'salary');

  if (domain === 'career' && (soft || flow) && hasStaySalary) {
    return (
      `不建议为了钱死磕留在这里。卦象建议「${cast.changed?.keywords[0] ?? cast.primary.keywords[0]}」式推进：` +
      `你如果非要去争取，要准备打一场心理战；如果手头有其他选择，建议把重心转移到寻找新机会` +
      `${FLOW.test(bag) ? '（因为本卦也代表流动）' : ''}。\n\n旁注：${gist}`
    );
  }
  if (flow || soft) {
    return `不宜硬刚。按「${cast.changed?.keywords[0] ?? cast.primary.keywords[0]}」来：柔进、留后路；有更好选项时，敢于放弃原盘。\n\n旁注：${gist}`;
  }
  if (CUT.test(bag)) {
    return `宜尽早定调，少拖。该断则断，把精力留给下一局。\n\n旁注：${gist}`;
  }
  if (OPEN.test(bag)) {
    return `可以推进，但用「可验证的一小步」换确定性，别空等承诺。\n\n旁注：${gist}`;
  }
  return `以「${cast.primary.keywords[0]}」为底，有变则朝「${cast.changed?.keywords[0] ?? '更稳的一步'}」做实验；忌情绪化梭哈。\n\n旁注：${gist}`;
}

function buildWhy(cast: CastResult, domain: SceneDomain): string {
  const shi = LINE_LABELS[cast.shiLine - 1]!;
  const ying = LINE_LABELS[cast.yingLine - 1]!;
  const shiRole = LINE_ROLE[cast.shiLine - 1] ?? '';
  const yingRole = LINE_ROLE[cast.yingLine - 1] ?? '';
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const env =
    domain === 'career'
      ? '公司/团队/对方'
      : domain === 'love'
        ? '对方/关系场'
        : '外界环境';

  const lines: string[] = [];
  lines.push(
    `看你的状态（世爻在${shi}${shiRole ? ` · ${shiRole}` : ''}）：你站在「自己在意的结果」这一侧，说明你很在乎这件事的落点。`,
  );
  lines.push(
    `看外在环境（应爻在${ying}${yingRole ? ` · ${yingRole}` : ''}）：${env}落在本卦「${from}」的气场里——沟通成本、默契度、节奏都要按这个调性来估。`,
  );
  if (cast.changingIndexes.length === 0) {
    lines.push('事情的变化（无动爻）：不是突变局，关键在把现状与底线看清，再决定加码还是撤。');
  } else {
    const move = cast.changingIndexes.map((i) => LINE_LABELS[i]).join('、');
    const to = cast.changed?.keywords.slice(0, 2).join('、') ?? '变化';
    lines.push(
      `事情的变化（${move}动${cast.changed ? `化${cast.changed.name}` : ''}）：趋势偏「${to}」——` +
        `${SOFT.test(kwLine(cast)) || FLOW.test(kwLine(cast)) ? '这不是强者硬推的卦，更适合随时准备撤退、做两手准备。' : '盯住动处，用小步验证代替空想。'}`,
    );
  }
  return lines.join('\n\n');
}

function buildNextSteps(cast: CastResult, bag: string, domain: SceneDomain, parts: QuestionPart[]): string {
  const soft = SOFT.test(bag) || FLOW.test(bag);
  const hasSalary = parts.some((p) => p.kind === 'salary');
  const careerish = domain === 'career' || hasSalary || parts.some((p) => p.kind === 'stay' || p.kind === 'leave');

  if (careerish && soft) {
    return (
      `【探口风】既然要「柔」，先别摊牌离职/数字。去探 HR 或领导口风：若含糊、拖延、只画饼——这就是「${cast.primary.keywords[0]}」的体现，果断启动下家。\n\n` +
      `【红线期限】给你要的条件设截止日期（例如两周内无书面答复，即视为不诚心）。逾期就按 Plan B 走，不跟情绪耗。\n\n` +
      `【两手准备】卦象主流动/反复，别把鸡蛋放一个篮子。边谈这边，边铺简历与新机会；有更好选择时，敢于放弃原盘数字。`
    );
  }
  if (careerish) {
    return (
      `【核对事实】把对方已承诺的条件（钱、岗、时间）写成清单，缺书面的一律不算数。\n\n` +
      `【一小步验证】本周只做一件可验证的事（约谈/交材料/要时间表），用结果决定加码还是停。\n\n` +
      `【留后路】并行准备备选方案，避免单点依赖把你钉死在拖字诀里。`
    );
  }
  if (domain === 'love') {
    return (
      `【说清一件事】本周只挑一个最堵的点谈开，不摊多题。\n\n` +
      `【看对方动作】给一个短观察期，看对方是配合还是含糊。\n\n` +
      `【护住自己】若反复内耗，允许暂停加码，先稳边界。`
    );
  }
  return (
    `【点名现状】用一句话写出：我最想确认的是什么。\n\n` +
    `【可验证动作】本周只推一个动作，能打勾才算数。\n\n` +
    `【复盘去留】对照卦象「${cast.primary.keywords[0]}${cast.changed ? `→${cast.changed.keywords[0]}` : ''}」，决定加码、等待还是撤。`
  );
}

export function buildDirectReading(
  cast: CastResult,
  question = '',
): DirectReading {
  const domain = detectSceneDomain(question);
  const bag = kwLine(cast);
  const parts = splitQuestionParts(question);
  const partLeans = parts.slice(0, 4).map((p) => ({
    part: p.raw,
    lean: leanForPart(p, cast, bag),
  }));

  const frame = cast.changed
    ? `（基于${cast.primary.fullName}卦变${cast.changed.fullName}，结合你的问题）`
    : `（基于${cast.primary.fullName}，结合你的问题）`;

  return {
    frame,
    verdict: buildVerdict(parts, cast, bag),
    analysis: buildAnalysis(cast, bag, domain),
    decision: buildDecision(cast, bag, domain, parts),
    why: buildWhy(cast, domain),
    nextSteps: buildNextSteps(cast, bag, domain, parts),
    partLeans,
    domain,
  };
}
