/**
 * 拆题 + 卦名/关键词 → 口语直译判词（规则模板，不用 LLM）
 * 四层：定调 → 能量拆解 → 行动 → 定心丸（厚文案对齐金样）
 */
import type { CastResult } from './engine.ts';
import { detectSceneDomain, type SceneDomain } from './scene-map.ts';
import { formatHexShortWithPinyin, formatHexWithPinyin, hexPinyin } from './hex-pinyin.ts';
import { buildWhyItems } from '../mystic-engine/why.ts';
import { toneFlags } from '../mystic-engine/tone.ts';
import { fillVoiceTemplate, getHexVoice } from './hex-voice.ts';

export type QuestionPart = {
  raw: string;
  kind: 'salary' | 'stay' | 'leave' | 'timing' | 'offer' | 'love' | 'money' | 'general';
};

export type DirectReading = {
  frame: string;
  /** 📌 核心判词 */
  verdict: string;
  /** 解析（本/变 + 现实翻译） */
  analysis: string;
  /** ⛳ 最终决策参考 */
  decision: string;
  /** 🧐 为什么（兼容旧字段；Pack 用 why items） */
  why: string;
  /** 💡 接下来三件事 */
  nextSteps: string;
  /** 第二层：能量与状态（世/动/变，现代语） */
  energy: string;
  /** 第四层：心理定心丸 */
  reassurance: string;
  /** 一句话核心隐喻 */
  coreMetaphor: string;
  partLeans: { part: string; lean: string }[];
  domain: SceneDomain;
};

function kwLine(cast: CastResult): string {
  const a = cast.primary.keywords.join('、');
  const b = cast.changed?.keywords.join('、') ?? '';
  return `${cast.primary.name}${cast.primary.fullName}${a}${b}${cast.changed?.name ?? ''}`;
}

function flags(cast: CastResult) {
  return toneFlags(cast);
}

function hexLabel(name: string, fullName: string): string {
  return formatHexWithPinyin(name, fullName);
}

function hexShort(name: string): string {
  return formatHexShortWithPinyin(name);
}

function extractHints(joined: string): {
  money: string;
  moneyLabel: string;
  deadline: string;
  company: string;
} {
  const moneyRaw =
    joined.match(/(\d+\s*[kK]|八千|[0-9]+千)/)?.[1]?.replace(/\s+/g, '') ?? '';
  const deadline =
    joined.match(/(\d+\s*月\s*\d*\s*日?|月初|月底|两周内|三个月)/)?.[0]?.replace(/\s+/g, '') ??
    '两周内';
  const company =
    joined.match(/留在([^？?，,。！!\s]{1,8})/)?.[1] ??
    joined.match(/在([^？?，,。！!\s]{2,8})(?:公司|工作)/)?.[1] ??
    '';
  return {
    money: moneyRaw,
    moneyLabel: moneyRaw || '你要的数字',
    deadline,
    company,
  };
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

  const seen = new Set<string>();
  return parts.filter((p) => {
    const key = `${p.kind}:${p.raw.slice(0, 12)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function leanForPart(part: QuestionPart, cast: CastResult, _bag: string): string {
  const soft = flags(cast).soft;
  const flow = flags(cast).flow;
  const hard = flags(cast).hard;
  const open = flags(cast).open;
  const cut = flags(cast).cut;
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

function buildVerdict(
  parts: QuestionPart[],
  cast: CastResult,
  _bag: string,
  hints: ReturnType<typeof extractHints>,
): string {
  const soft = flags(cast).soft;
  const flow = flags(cast).flow;
  const to = cast.changed?.keywords[0] ?? cast.primary.keywords[0] ?? '';
  const from = cast.primary.keywords[0] ?? cast.primary.name;

  const salary = parts.find((p) => p.kind === 'salary');
  const stay = parts.find((p) => p.kind === 'stay');
  const leave = parts.find((p) => p.kind === 'leave');

  if (salary && (stay || leave) && (soft || flow)) {
    const moneyBit = hints.money ? `你能拿到 ${hints.money}` : '钱大概率能谈到';
    return `${moneyBit}，但这个「留」的过程会让你很心累。`;
  }
  if (salary && (soft || flow)) {
    return '数字有机会落地，但你会觉得「很费劲」——不是拿不到，是拿到太耗。';
  }
  if (stay && (soft || flow)) {
    return '能留，但不值得为现状死磕；留下会反复内耗。';
  }
  if (leave && (flow || flags(cast).cut)) {
    return '走是说得通的选项；卦象更支持你把重心挪向新机会。';
  }
  if (leave && flags(cast).open) {
    return '迈出这一步说得通；过渡做好，后面有机会走向更丰盛的资源。';
  }
  if (flags(cast).cut && leave) {
    return '支持你果断行动：把离开当成真实选项，少用拖泥带水消耗自己。';
  }
  if (parts.length >= 2) {
    return `几件事绑在一起看：局面正从「${from}」滑向「${to}」——有结果，但过程磨人，宜两手准备。`;
  }
  if (cast.changed) {
    const voice = getHexVoice(cast.primary.name);
    if (voice) {
      return fillVoiceTemplate(voice.verdict, from, to);
    }
    return `事情正从「${from}」转向「${to}」：方向在变，别用旧法硬扛。`;
  }
  const voice = getHexVoice(cast.primary.name);
  if (voice) {
    return fillVoiceTemplate(voice.verdict, from, to);
  }
  return `当前主调是「${from}」：先把可核对的事实看清，再决定加码还是收手。`;
}

function primaryMeaning(cast: CastResult, _bag: string): string {
  const kw = cast.primary.keywords.slice(0, 2).join('、') || cast.primary.name;
  const voice = getHexVoice(cast.primary.name);
  if (voice) return `「${voice.frame}」（${kw}）`;
  if (flags(cast).cut) return `「决断、当机立断」（${kw}）`;
  if (flags(cast).soft || flags(cast).flow) return `「散开、流动、局面在松」（${kw}）`;
  if (flags(cast).open) return `「顺势、资源聚拢」（${kw}）`;
  if (flags(cast).hard) return `「偏紧、先过关」（${kw}）`;
  return `「${kw}」`;
}

function changedMeaning(cast: CastResult, _bag: string): string {
  if (!cast.changed) return '';
  const kw = cast.changed.keywords.slice(0, 2).join('、') || cast.changed.name;
  const voice = getHexVoice(cast.changed.name);
  if (voice) return `「${voice.asChanged}」（${kw}）`;
  if (flags(cast).open) return `「大丰收、资源在握」（${kw}）`;
  if (flags(cast).soft || flags(cast).flow) return `「柔进、反复渗透」（${kw}）`;
  if (flags(cast).cut) return `「定调后的下一局」（${kw}）`;
  if (flags(cast).hard) return `「仍须过关」（${kw}）`;
  return `「${kw}」`;
}

function mapPrimaryToQuestion(
  cast: CastResult,
  _bag: string,
  domain: SceneDomain,
  parts: QuestionPart[],
  hints: ReturnType<typeof extractHints>,
): string {
  const leave = parts.some((p) => p.kind === 'leave');
  const stay = parts.some((p) => p.kind === 'stay');
  const salary = parts.some((p) => p.kind === 'salary');
  const who = hints.company || '现在这家';

  if (flags(cast).cut && leave) {
    return hints.deadline && /月底|月初|月/.test(hints.deadline)
      ? `对应你的问题：${hints.deadline}离职这个决定本身很符合卦象。处境已经到了需要果断斩断的时候，拖泥带水对你不利。`
      : '对应你的问题：离开/定调这件事本身很符合卦象。拖泥带水对你不利，宜当机立断。';
  }
  if ((flags(cast).soft || flags(cast).flow) && (salary || stay || leave)) {
    const money = hints.money ? `${hints.money}` : '你要的条件';
    return `对应你的问题：${who}内部可能乱、职责不清；想拿到${money}，大概率要经历漫长拉扯。不是拿不到，是拿到会很费劲。`;
  }
  if (flags(cast).cut) {
    return '对应你的问题：局面到了该果断定调的时候；越拖越耗。';
  }
  const voice = getHexVoice(cast.primary.name);
  if (voice) return voice.mapAsk;
  if (domain === 'career') {
    return '对应你的问题：先把本卦主调译回岗位、钱与节奏，再决定加码还是撤。';
  }
  return '对应你的问题：先把本卦主调译回你真正卡着的那一件事。';
}

function mapChangedToQuestion(
  cast: CastResult,
  _bag: string,
  parts: QuestionPart[],
  hints: ReturnType<typeof extractHints>,
): string {
  if (!cast.changed) return '无变卦：先把现状谈清，再谈翻盘。';
  const window =
    hints.deadline && /三个月|月底|月初/.test(hints.deadline)
      ? hints.deadline
      : parts.some((p) => /三个月|求职|收入/.test(p.raw))
        ? '未来一段时间'
        : '过渡处理好之后';

  if (flags(cast).open) {
    return `对应你的问题：${window}，若能处理好眼前的过渡，最终走向偏光明——资源更有机会落到你手里。`;
  }
  if (flags(cast).soft || flags(cast).flow) {
    return `对应你的问题：走向偏柔进与反复——结果可能有，但过程磨人，宜两手准备。`;
  }
  const voice = getHexVoice(cast.changed.name);
  if (voice) return voice.mapAskChanged;
  return `对应你的问题：事情朝「${cast.changed.keywords[0] ?? cast.changed.name}」走，用小步验证，别空想终局。`;
}

function buildAnalysis(
  cast: CastResult,
  bag: string,
  domain: SceneDomain,
  parts: QuestionPart[],
  hints: ReturnType<typeof extractHints>,
): string {
  const pFull = hexLabel(cast.primary.name, cast.primary.fullName);
  const primaryBlock =
    `本卦【${pFull}】：代表${primaryMeaning(cast, bag)}。\n` +
    mapPrimaryToQuestion(cast, bag, domain, parts, hints);

  const changedBlock = cast.changed
    ? `\n\n变卦【${hexLabel(cast.changed.name, cast.changed.fullName)}】：代表${changedMeaning(cast, bag)}。\n` +
      mapChangedToQuestion(cast, bag, parts, hints)
    : `\n\n${mapChangedToQuestion(cast, bag, parts, hints)}`;

  return `${primaryBlock}${changedBlock}\n\n【核心隐喻】：${buildCoreMetaphorBody(cast, bag)}`;
}

function buildCoreMetaphorBody(cast: CastResult, _bag: string): string {
  const from = cast.primary.keywords[0] ?? cast.primary.name;
  const to = cast.changed?.keywords[0];
  const pVoice = getHexVoice(cast.primary.name);
  const cVoice = cast.changed ? getHexVoice(cast.changed.name) : undefined;

  // 金样路径：决断→丰盛 / 柔进渗透
  if (flags(cast).cut && flags(cast).open) {
    return '你需要经历一个「做出果断决定，并处理好遗留乱象」的过程，才能走向「稳定且资源丰厚」的下一阶段。';
  }
  if (flags(cast).soft || flags(cast).flow) {
    return `局面在「${from}」里散开，又要靠「${to ?? '柔进'}」一点点渗进去——过程磨人，但不是绝路。`;
  }
  if (flags(cast).cut) {
    return pVoice
      ? fillVoiceTemplate(pVoice.metaphorSolo, from, to)
      : `到了该「${from}」的时刻——果断定调，比拖着更护自己。`;
  }
  if (flags(cast).open) {
    return `资源正往「${to ?? from}」聚拢——抓住窗口，用书面把丰盛落成条件。`;
  }
  if (flags(cast).hard) {
    return pVoice
      ? fillVoiceTemplate(pVoice.metaphorSolo, from, to)
      : `先过「${from}」这一关——补最弱一环，再谈结果。`;
  }
  if (cast.changed && pVoice) {
    return fillVoiceTemplate(pVoice.metaphorTo, from, to ?? cast.changed.name);
  }
  if (pVoice) {
    return fillVoiceTemplate(pVoice.metaphorSolo, from, to);
  }
  if (cVoice && to) {
    return fillVoiceTemplate(cVoice.metaphorSolo, from, to);
  }
  return `从「${from}」${to ? `走向「${to}」` : '看清现状'}——小步验证，忌情绪梭哈。`;
}

function buildCoreMetaphor(cast: CastResult, bag: string): string {
  return `核心隐喻：${buildCoreMetaphorBody(cast, bag)}`;
}

function buildDecision(
  cast: CastResult,
  _bag: string,
  domain: SceneDomain,
  parts: QuestionPart[],
  hints: ReturnType<typeof extractHints>,
): string {
  const soft = flags(cast).soft;
  const flow = flags(cast).flow;
  const hasStaySalary =
    parts.some((p) => p.kind === 'stay' || p.kind === 'leave') &&
    parts.some((p) => p.kind === 'salary');
  const way = cast.changed?.keywords[0] ?? cast.primary.keywords[0] ?? '柔进';
  const money = hints.moneyLabel;

  if (domain === 'career' && (soft || flow) && hasStaySalary) {
    return (
      `不建议为了${money === '你要的数字' ? '这个数字' : `这个 ${money}`}死磕留下。\n` +
      `卦象建议「以柔顺方式渗入」：非要争，就准备打心理战。\n` +
      `手头有其他选择时，把重心挪到找新机会（「${cast.primary.keywords[0] ?? '涣'}」也主流动）。`
    );
  }
  if (flags(cast).cut && flags(cast).open) {
    return (
      `支持果断行动：把交接与时间表写清，少拖。\n` +
      `过渡期先保现金流与可接受底薪，弄清行情再抬期望。\n` +
      `画饼与合同条款分开核对——丰盛要落在纸上。`
    );
  }
  if (flow || soft) {
    return (
      `不宜硬刚。\n按「${way}」柔进、留后路。\n` +
      `有更好选项时，敢于放弃原盘——你熬过这段拉扯，值得更好的落点。`
    );
  }
  if (flags(cast).cut) {
    return (
      `宜尽早定调，少拖。\n该断则断，把精力留给下一局。\n` +
      `相信你的直觉：身体已经在喊累时，就别再自我说服「再忍忍」。`
    );
  }
  if (flags(cast).open) {
    return `可以推进。\n用可验证的一小步换确定性。\n别空等承诺。`;
  }
  const voice = getHexVoice(cast.primary.name);
  if (voice) return voice.decision;
  return (
    `以「${cast.primary.keywords[0]}」为底。\n` +
    `有变则朝「${cast.changed?.keywords[0] ?? '更稳的一步'}」做小实验。\n` +
    `忌情绪化梭哈。`
  );
}

function buildWhyFromItems(
  cast: CastResult,
  domain: SceneDomain,
  question: string,
): string {
  return buildWhyItems(cast, domain, question)
    .map((w) => `${w.title}\n${w.body}`)
    .join('\n\n');
}

function buildNextSteps(
  cast: CastResult,
  _bag: string,
  domain: SceneDomain,
  parts: QuestionPart[],
  hints: ReturnType<typeof extractHints>,
): string {
  const soft = flags(cast).soft || flags(cast).flow;
  const hasSalary = parts.some((p) => p.kind === 'salary');
  const careerish =
    domain === 'career' ||
    hasSalary ||
    parts.some((p) => p.kind === 'stay' || p.kind === 'leave');
  const { moneyLabel, deadline, company } = hints;
  const where = company ? `在${company}` : '';

  if (careerish && soft) {
    return (
      `【探口风】先别摊牌离职/${moneyLabel}。\n` +
      `去探领导或 HR 口风${where ? `（${where}）` : ''}。\n` +
      `含糊、拖延、只画饼 → 启动下家。\n\n` +
      `【红线期限】给${moneyLabel}设截止日期（如${deadline}前书面答复）。\n` +
      `逾期即按 Plan B，不跟情绪耗。\n` +
      `清单：底薪 / 绩效 / 补贴 / 到账时间——口头不算数。\n\n` +
      `【两手准备】边谈边铺简历与新机会。\n` +
      `有更好选择时，敢于放弃原盘数字。\n` +
      `陷阱：自我价值绑死在一家公司；信息不对等时别急着签字。`
    );
  }
  if (careerish && (flags(cast).cut || flags(cast).open)) {
    return (
      `【肯定这一步】把交接与时间表写清，少拖泥带水。\n` +
      `离职/入职日期、工作交接清单各写一页。\n\n` +
      `【务实过渡】先保现金流与可接受底薪。\n` +
      `弄清行情与意向后再抬期望；三个月窗口按周复盘投递。\n\n` +
      `【提防小雷】画饼与合同条款分开核对。\n` +
      `防信息不对等；面试拉扯时只答事实，不提前自我贬值。`
    );
  }
  if (careerish) {
    return (
      `【核对事实】对方承诺的钱、岗、时间写成清单。\n无书面不算数。\n\n` +
      `【一小步验证】本周只做一件可打勾的事。\n用结果决定加码或停。\n\n` +
      `【留后路】并行备选方案，避免单点依赖。`
    );
  }
  if (domain === 'love') {
    return (
      `【说清一件事】本周只挑一个最堵的点。\n\n` +
      `【看对方动作】给短观察期，看配合还是含糊。\n\n` +
      `【护住自己】反复内耗时，允许暂停加码。`
    );
  }

  const hasTiming = parts.some((p) => p.kind === 'timing');
  const hasAnxiety = /纠结|犹豫|要不要|该不该|能不能/.test(
    parts.map((p) => p.raw).join('') || '',
  );

  if (hasTiming) {
    const when = deadline || '你标出的那个节点';
    return (
      `【定窗口】把「何时」压成可核对时间窗（如${when}前）。\n` +
      `写清出现什么才算时机到了。\n\n` +
      `【到期只看事实】不到位就按 Plan B，不跟感觉耗。\n` +
      `日历标一个复盘日。\n\n` +
      `【并行缓冲】窗口期内留一条后路，避免单点等死。`
    );
  }

  if (hasAnxiety) {
    return (
      `【拆纠结】写出最怕的两件事；本周只做一件可逆小实验。\n\n` +
      `【设决定日】到期用成本 / 可逆性 / 三个月后样子三行拍板。\n\n` +
      `【护底线】先写不可接受的三条，少当场让步。`
    );
  }

  return (
    `【锁一问】用一句话写出：我最想确认什么。\n\n` +
    `【低成本探针】本周只推一个能打勾的试探（问一句 / 试一天 / 看一份材料）。\n\n` +
    `【复盘】对照「${cast.primary.keywords[0]}${cast.changed ? `→${cast.changed.keywords[0]}` : ''}」，决定加码、等待或撤。`
  );
}

function buildReassurance(cast: CastResult, _bag: string): string {
  const softFlow = flags(cast).soft || flags(cast).flow;
  const nameHint = cast.changed
    ? `「${hexShort(cast.primary.name)}」→「${hexShort(cast.changed.name)}」`
    : `「${hexShort(cast.primary.name)}」`;
  return (
    `卦象是动态参考，不是生死判决。${nameHint}只是在描述节奏，不替你做人生决定。\n` +
    `你非常有主见——相信你的直觉与身体感受。\n` +
    (softFlow
      ? '不要因为「涣」像散乱、「巽」像口舌拉扯，就恐惧沟通；它们只是提醒：过程会磨，你可以用清单、期限和 Plan B 把自己护住。\n'
      : flags(cast).cut
        ? '不要因为「夬」像决断就吓自己「是不是太狠」；果断也可以温柔——把边界写清，就是对自己的负责。\n'
        : '不要被单个传统词吓到；把它们翻译成「沟通成本 / 自我价值 / 物质根基」再行动。\n') +
    `深呼吸。熬过这段拉扯，你值得更清晰的落点。`
  );
}

export function buildDirectReading(cast: CastResult, question = ''): DirectReading {
  const domain = detectSceneDomain(question);
  const bag = kwLine(cast);
  const parts = splitQuestionParts(question);
  const hints = extractHints(parts.map((p) => p.raw).join(' ') || question);
  const partLeans = parts.slice(0, 4).map((p) => ({
    part: p.raw,
    lean: leanForPart(p, cast, bag),
  }));

  const primaryLabel = hexLabel(cast.primary.name, cast.primary.fullName);
  const changedLabel = cast.changed
    ? hexLabel(cast.changed.name, cast.changed.fullName)
    : '';
  const frame = cast.changed
    ? `（基于${primaryLabel}卦变${changedLabel}，结合你的问题）`
    : `（基于${primaryLabel}，结合你的问题）`;

  return {
    frame,
    verdict: buildVerdict(parts, cast, bag, hints),
    analysis: buildAnalysis(cast, bag, domain, parts, hints),
    decision: buildDecision(cast, bag, domain, parts, hints),
    why: buildWhyFromItems(cast, domain, question),
    nextSteps: buildNextSteps(cast, bag, domain, parts, hints),
    /** 与「为什么」同文，避免两套骨架；Pack 只渲染 why，不再叠 energy */
    energy: buildWhyFromItems(cast, domain, question),
    reassurance: buildReassurance(cast, bag),
    coreMetaphor: buildCoreMetaphor(cast, bag),
    partLeans,
    domain,
  };
}

export { hexPinyin, formatHexWithPinyin };
