/**
 * 生时校准 v2 · 情境细节对照
 * 把用户补充的人生大事 / 生活细节，映射成 Top2 时辰的可辨认场景差异。
 */
import { parseUserClue, type ParsedUserClue } from './rectify-user-clue.ts';
import {
  SHICHEN_TRAITS,
  type ShichenDiffProfile,
  type ShichenTraitId,
} from './rectify-shichen-diff.ts';

export type ScenarioContrastRow = {
  /** 表头：用户原话或事件标签 */
  topic: string;
  /** 用户原话（若有） */
  clue?: string;
  left: string;
  right: string;
  /** 这条线索更偏向左列时辰 */
  leanLeft?: boolean;
  /** 这条线索更偏向右列时辰 */
  leanRight?: boolean;
};

type ScenarioKind =
  | 'birth_time'
  | 'travel'
  | 'talk'
  | 'money'
  | 'study'
  | 'lead'
  | 'sensitive'
  | 'health'
  | 'charm'
  | 'temper_hot'
  | 'temper_cold'
  | 'day_birth'
  | 'night_birth'
  | 'marry'
  | 'breakup'
  | 'move'
  | 'job'
  | 'illness'
  | 'quarrel'
  | 'family'
  | 'wealth'
  | 'generic';

const LIFE_EVENT_KEYS: ReadonlyArray<{ keys: string[]; kind: ScenarioKind; label: string }> = [
  { keys: ['结婚', '婚礼', '订婚', '领证', '办酒'], kind: 'marry', label: '婚礼/结婚' },
  { keys: ['分手', '离婚', '分开', '冷战'], kind: 'breakup', label: '分手/感情破裂' },
  { keys: ['搬家', '转学', '换城市', '出国', '离家'], kind: 'move', label: '搬家/换环境' },
  { keys: ['入职', '离职', '换工作', '跳槽', '创业', '被裁'], kind: 'job', label: '工作变动' },
  { keys: ['生病', '住院', '手术', '开刀', '受伤', '意外'], kind: 'illness', label: '健康/伤病' },
  { keys: ['吵架', '摔门', '摔桌子', '翻脸', '顶嘴'], kind: 'quarrel', label: '激烈冲突' },
  { keys: ['认错', '道歉', '服软', '给台阶'], kind: 'quarrel', label: '冲突后认错' },
  { keys: ['买房', '贷款', '投资', '赔', '赚'], kind: 'wealth', label: '钱财大事' },
  { keys: ['父母', '家里', '家人', '亲戚', '过年'], kind: 'family', label: '家庭互动' },
];

function hasTrait(p: ShichenDiffProfile, id: ShichenTraitId): boolean {
  return p.behaviorTraitIds.includes(id);
}

function traitLabels(p: ShichenDiffProfile): string {
  return p.behaviorTraitIds
    .map((id) => SHICHEN_TRAITS.find((t) => t.id === id)?.label ?? id)
    .join('；');
}

function weatherHead(p: ShichenDiffProfile): string {
  return p.weatherMetaphor.split('/')[0]?.trim() || p.label;
}

function classifyClue(raw: string, parsed: ParsedUserClue): ScenarioKind[] {
  const kinds: ScenarioKind[] = [];
  const t = raw.trim();

  for (const row of LIFE_EVENT_KEYS) {
    if (row.keys.some((k) => t.includes(k))) {
      kinds.push(row.kind);
    }
  }

  if (parsed.matched.some((m) => m.includes('联播') || m.includes('钟点') || m.includes('点名'))) {
    kinds.push('birth_time');
  }
  if (parsed.matched.some((m) => m.includes('驿马') || m.includes('变动'))) kinds.push('travel');
  if (parsed.matched.some((m) => m.includes('表达') || m.includes('食伤'))) kinds.push('talk');
  if (parsed.matched.some((m) => m.includes('财') || m.includes('务实'))) kinds.push('money');
  if (parsed.matched.some((m) => m.includes('书卷') || m.includes('印'))) kinds.push('study');
  if (parsed.matched.some((m) => m.includes('比劫') || m.includes('主见'))) kinds.push('lead');
  if (parsed.matched.some((m) => m.includes('敏感') || m.includes('细腻'))) kinds.push('sensitive');
  if (parsed.matched.some((m) => m.includes('健康') || m.includes('体弱'))) kinds.push('health');
  if (parsed.matched.some((m) => m.includes('桃花') || m.includes('人缘'))) kinds.push('charm');
  if (parsed.matched.some((m) => m.includes('火气') || m.includes('爆发'))) kinds.push('temper_hot');
  if (parsed.matched.some((m) => m.includes('内收') || m.includes('沉稳'))) kinds.push('temper_cold');
  if (parsed.matched.some((m) => m.includes('白天'))) kinds.push('day_birth');
  if (parsed.matched.some((m) => m.includes('夜间'))) kinds.push('night_birth');

  if (!kinds.length) kinds.push('generic');
  return [...new Set(kinds)];
}

function topicLabel(raw: string, kinds: ScenarioKind[]): string {
  for (const row of LIFE_EVENT_KEYS) {
    if (kinds.includes(row.kind) && row.keys.some((k) => raw.includes(k))) {
      return row.label;
    }
  }
  if (kinds.includes('birth_time')) return '出生时段';
  const short = raw.trim().slice(0, 18);
  return short.length < raw.trim().length ? `${short}…` : short;
}

function afterQuarrel(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'talk') || p.tenGodCats.includes('shi_shang')) {
    return '吵完更爱把话说透，或发长消息复盘；气消得快，但嘴上不饶人';
  }
  if (hasTrait(p, 'sensitive') || p.vsDay.kind === '害') {
    return '表面停战，心里记很久；需要对方先给台阶才肯软';
  }
  if (hasTrait(p, 'lead') || p.tenGodCats.includes('bi_jie')) {
    return '很难先认错，更常等对方服软；就算和解也要保住面子';
  }
  if (hasTrait(p, 'steady') || p.tenGodCats.includes('guan_sha')) {
    return '先冷处理，隔一阵再谈规则与边界；很少当场爆发第二次';
  }
  return `在「${weatherHead(p)}」底色下，冲突后多半先各自消化，再按事论事`;
}

function apologyStyle(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'lead') || p.tenGodCats.includes('bi_jie')) {
    return '很少先开口认错；更常用行动补救，或等对方先给台阶';
  }
  if (hasTrait(p, 'sensitive')) {
    return '会道歉，但希望对方也承认一半责任；否则心里仍梗着';
  }
  if (hasTrait(p, 'talk')) {
    return '吵完很快用幽默或长解释带过；「对不起」说得出口，但不一定服气';
  }
  if (hasTrait(p, 'steady')) {
    return '认错偏正式、讲规则：先把事说清，再各自让一步';
  }
  return `${p.branch}时：认错节奏随「${weatherHead(p)}」——能服软，但不爱反复跪求`;
}

function quarrelContent(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'lead') || hasTrait(p, 'action')) {
    return '吵的内容常绕「谁说了算 / 面子 / 不服管」；声音和动作都偏大';
  }
  if (hasTrait(p, 'money') || p.tenGodCats.includes('cai')) {
    return '更容易因为钱、分工、性价比起争执，算账式拌嘴';
  }
  if (hasTrait(p, 'sensitive') || p.vsDay.kind === '害') {
    return '常因语气、态度、被忽视这类「感受」吵起来，旁人觉得小题大做';
  }
  if (hasTrait(p, 'talk')) {
    return '拌嘴像辩论：道理、措辞、谁先翻旧账；吵的是话术而非只是情绪';
  }
  return `冲突话题偏日常摩擦，${weatherHead(p)}气下${hasTrait(p, 'steady') ? '少升级、多讲边界' : '起伏看场合'}`;
}

function underPressure(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'action') || ['午', '巳', '寅'].includes(p.branch)) {
    return '压力一上来就想立刻行动或发作；闲不住，讨厌干等';
  }
  if (hasTrait(p, 'sensitive') || ['亥', '子', '酉'].includes(p.branch)) {
    return '表面还能撑，内心戏很多；容易失眠、反复想最坏结果';
  }
  if (hasTrait(p, 'steady') || p.tenGodCats.includes('guan_sha')) {
    return '先扛住场面：把该做的做完，情绪往后放；少当众崩';
  }
  if (hasTrait(p, 'talk')) {
    return '压力下更爱找人说、发消息倾诉，或用吐槽减压';
  }
  return `${p.branch}时压力反应偏中性：${traitLabels(p) || weatherHead(p)}，先求稳住再想下一步`;
}

function afterLoss(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'lead') || p.tenGodCats.includes('bi_jie')) {
    return '输了不服气，常想翻本或证明自己；很难立刻认栽';
  }
  if (hasTrait(p, 'sensitive')) {
    return '挫败后很久走不出；会把细节反复回放，需要安慰才缓';
  }
  if (hasTrait(p, 'money')) {
    return '先算损失、找补救；情绪第二，账本第一';
  }
  if (hasTrait(p, 'steady')) {
    return '认栽快，更在意「别再犯」；事后立规矩多于抱怨';
  }
  return `受挫后${hasTrait(p, 'talk') ? '爱吐槽复盘' : '偏自己消化'}，${weatherHead(p)}气下恢复节奏中等`;
}

function afterWin(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'charm') || hasTrait(p, 'talk')) {
    return '顺的时候爱分享、爱被看见；容易把好运讲成故事';
  }
  if (hasTrait(p, 'lead')) {
    return '赢了更自信、更敢拍板；也容易觉得「本来就该是我的」';
  }
  if (hasTrait(p, 'money')) {
    return '顺时更敢加码投入，但仍会算账；得意不忘留后手';
  }
  if (hasTrait(p, 'sensitive') || hasTrait(p, 'study')) {
    return '表面高兴，心里仍担心下一脚踩空；喜庆里夹着谨慎';
  }
  return `顺风时偏${hasTrait(p, 'steady') ? '低调守成' : '跟着气氛走'}，${weatherHead(p)}底色不夸张`;
}

function socialGathering(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'talk') || hasTrait(p, 'charm')) {
    return '半生不熟局里容易成话题中心，爱带动气氛';
  }
  if (hasTrait(p, 'study') || hasTrait(p, 'sensitive')) {
    return '先坐边上听，熟了才多说话；观察多于表演';
  }
  if (hasTrait(p, 'travel')) {
    return '人认识不少，但很少深聊到心里；像路过型社交';
  }
  if (hasTrait(p, 'steady')) {
    return '更想跟两三个熟人扎堆，不爱硬扩圈';
  }
  return `${p.branch}时社交：${traitLabels(p) || '看场合入戏'}，不极端外放也不极端社恐`;
}

function familyRole(p: ShichenDiffProfile): string {
  if (p.tenGodCats.includes('yin') && p.tenGodCats.includes('cai')) {
    return '家里常当和事佬，怕话重伤人，先照顾别人情绪';
  }
  if (hasTrait(p, 'lead')) {
    return '家里有主见，节日安排、大事决策不太被动';
  }
  if (hasTrait(p, 'talk')) {
    return '家庭群里话多、爱活跃气氛，也容易被点名主持';
  }
  if (hasTrait(p, 'sensitive') || hasTrait(p, 'study')) {
    return '听得多、说得少；冲突时宁可躲开，心里戏比嘴上多';
  }
  return `家庭角色偏配合者，${weatherHead(p)}气下随长辈节奏`;
}

function weddingStyle(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'charm') || hasTrait(p, 'talk')) {
    return '婚礼更偏热闹、仪式感足；喜欢有人见证，场面要体面';
  }
  if (hasTrait(p, 'money') || p.tenGodCats.includes('cai')) {
    return '更在意预算与性价比；场面从简，但会把钱花在刀刃上';
  }
  if (hasTrait(p, 'steady')) {
    return '倾向稳妥流程、家长意见权重大；不爱临时改方案';
  }
  if (hasTrait(p, 'sensitive')) {
    return '细节情绪很多，容易为一句台词或一个小环节纠结';
  }
  return `${p.branch}时：婚礼态度随「${p.stemGod || '时柱'}」气——${traitLabels(p) || '重流程、少折腾'}`;
}

function moveStyle(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'travel') || p.vsDay.kind === '冲') {
    return '环境一变就很快进入状态；到新地方先找交通、学校或办事动线';
  }
  if (hasTrait(p, 'study')) {
    return '搬家先收拾书、证书、工作资料；到新环境靠熟悉角落找安全感';
  }
  if (hasTrait(p, 'sensitive')) {
    return '更跟着家人情绪走；到新地方先观察邻居与气氛，慢热融入';
  }
  if (hasTrait(p, 'lead')) {
    return '会主动拍板怎么搬、怎么分工；不爱被动等别人安排';
  }
  return `换环境时偏${hasTrait(p, 'steady') ? '求稳' : '随机应变'}，${weatherHead(p)}气下适应节奏${hasTrait(p, 'action') ? '偏快' : '中等'}`;
}

function jobChangeStyle(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'money') || p.tenGodCats.includes('cai')) {
    return '换工作先看回报与资源；谈 offer 时算盘打得很清';
  }
  if (hasTrait(p, 'talk') || p.tenGodCats.includes('shi_shang')) {
    return '机会常来自表达、项目曝光或人脉；跳槽理由多半与「能不能施展」有关';
  }
  if (hasTrait(p, 'lead') || p.tenGodCats.includes('bi_jie')) {
    return '不服管就动；更接受「自己说了算」的路径，哪怕更累';
  }
  if (p.tenGodCats.includes('guan_sha')) {
    return '换工作常伴随责任加重；宁可扛压，也不爱无交代裸辞';
  }
  return `事业节点在${p.branch}时更像「${p.stemGod || '时柱'}」路数：${traitLabels(p) || '随势调整'}`;
}

function illnessStyle(p: ShichenDiffProfile): string {
  if (hasTrait(p, 'health') || p.vsDay.kind === '冲') {
    return '身体信号来得更明显；家人对饮食、作息格外紧张';
  }
  if (hasTrait(p, 'sensitive')) {
    return '小病也容易想多；更依赖检查与反复确认，不太能「忍忍就好」';
  }
  if (hasTrait(p, 'steady')) {
    return '倾向正规就医、按医嘱走；不爱偏方和硬扛';
  }
  if (hasTrait(p, 'action')) {
    return '病中仍闲不住，恢复后很快想回到日常节奏';
  }
  return `健康议题在${p.branch}时不算极端突出，但${weatherHead(p)}气下更${hasTrait(p, 'study') ? '重视保养与知识' : '看实际影响再行动'}`;
}

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

function branchIndex(b: string): number {
  return BRANCH_ORDER.indexOf(b as (typeof BRANCH_ORDER)[number]);
}

function birthTimeFit(p: ShichenDiffProfile, parsed: ParsedUserClue): string {
  const boosted = parsed.effect.boostBranches ?? [];
  const hit = boosted.includes(p.branch);
  const neighbor = boosted.some(
    (b) =>
      Math.abs(branchIndex(b) - branchIndex(p.branch)) === 1 ||
      (b === '子' && p.branch === '亥') ||
      (b === '亥' && p.branch === '子'),
  );
  if (hit) {
    return `与线索高度吻合：${p.branch}时（${p.clockRange}），「${weatherHead(p)}」时段感 + 时柱 ${p.hourPillar}`;
  }
  if (neighbor) {
    return `邻近候选：${p.branch}时（${p.clockRange}）也说得通，但不如正点${boosted.filter((b) => b !== p.branch).slice(0, 1).join('')}时贴`;
  }
  return `若真是${p.branch}时，家人记忆里的天色/背景音可能与线索有偏差，需再核对`;
}

function scenarioOnBranch(
  kind: ScenarioKind,
  p: ShichenDiffProfile,
  raw: string,
  parsed: ParsedUserClue,
): string {
  switch (kind) {
    case 'birth_time':
      return birthTimeFit(p, parsed);
    case 'travel':
    case 'move':
      return moveStyle(p);
    case 'talk':
      return hasTrait(p, 'talk')
        ? `「${raw.slice(0, 12)}」这类细节下，你更像外放表达型：爱说、爱写、场面话接得住`
        : `${p.branch}时：表达欲${hasTrait(p, 'study') ? '内敛，靠文字或专业说话' : '不算顶格，更靠做事让人看见'}`;
    case 'money':
    case 'wealth':
      return hasTrait(p, 'money')
        ? `钱财议题上会先算账：${raw.includes('买') ? '大件消费前反复比价' : '务实、少冲动'}`
        : `${p.branch}时：钱不是第一驱动力，${hasTrait(p, 'charm') ? '更花在人缘与体验' : '重稳定与责任'}`;
    case 'study':
      return hasTrait(p, 'study')
        ? '学习/考证线长；遇到不懂的会查资料、做笔记，不太糊弄'
        : `${p.branch}时：书卷气${p.tenGodCats.includes('yin') ? '有但不突出' : '非主轴'}，靠经验与场面成长`;
    case 'lead':
      return hasTrait(p, 'lead')
        ? '主见硬：家人/同事很难一句话说服，得给逻辑和面子'
        : `${p.branch}时：${hasTrait(p, 'steady') ? '能协商，但底线清楚' : '不算刺头，更看场合'}`;
    case 'sensitive':
      return hasTrait(p, 'sensitive')
        ? '对语气、态度极敏感；小事也会在心里过电影'
        : `${p.branch}时：情绪${p.vsDay.kind === '冲' ? '有起伏但外显不多' : '相对钝感，重结果'}`;
    case 'health':
    case 'illness':
      return illnessStyle(p);
    case 'charm':
      return hasTrait(p, 'charm')
        ? '人缘/桃花显眼；聚会里容易被点名、被介绍'
        : `${p.branch}时：不靠刷脸开路，${hasTrait(p, 'talk') ? '靠表达' : '靠靠谱'}`;
    case 'temper_hot':
      return hasTrait(p, 'action') || ['午', '巳', '寅'].includes(p.branch)
        ? '脾气来得快、去得也快；冲突时声音与动作都更大'
        : `${p.branch}时：不算火爆型，${afterQuarrel(p).slice(0, 24)}…`;
    case 'temper_cold':
      return hasTrait(p, 'sensitive') || ['酉', '亥', '子'].includes(p.branch)
        ? '真生气时反而话变少；冷战、拉黑、已读不回更常见'
        : `${p.branch}时：外热内也热，${hasTrait(p, 'talk') ? '吵完仍想解释' : '不太能长期冷战'}`;
    case 'day_birth':
      return ['子', '丑', '亥', '戌', '酉'].includes(p.branch)
        ? '与「白天生」线索冲突：此时辰偏傍晚后或夜间'
        : `与「白天生」线索一致：${p.branch}时（${p.clockRange}）在天光范围内`;
    case 'night_birth':
      return ['子', '丑', '亥', '戌', '酉'].includes(p.branch)
        ? `与「夜间生」线索一致：${p.branch}时（${p.clockRange}），${weatherHead(p)}`
        : '与「夜间生」线索冲突：此时辰偏白天';
    case 'marry':
      return weddingStyle(p);
    case 'breakup':
      return p.vsDay.kind === '冲'
        ? '感情破裂时拉扯感强：分合、反复、话没说清就断'
        : hasTrait(p, 'sensitive')
          ? '分手后很久走不出；细节、旧物、共同朋友都会触景'
          : `${p.branch}时：断得${hasTrait(p, 'steady') ? '相对干脆，但后续责任仍清' : '看现实条件，少拖泥带水'}`;
    case 'quarrel':
      return raw.includes('认错') || raw.includes('道歉')
        ? apologyStyle(p)
        : afterQuarrel(p);
    case 'job':
      return jobChangeStyle(p);
    case 'family':
      return familyRole(p);
    case 'generic':
    default:
      return parsed.weak
        ? `${p.branch}时：「${raw.slice(0, 16)}」难直接映射，但${weatherHead(p)}气下更${traitLabels(p) || '随大运显影'}`
        : `${p.branch}时（${p.hourPillar}）：${traitLabels(p) || p.stemGod + '气'}——${weatherHead(p)}`;
  }
}

function leanBranch(
  kind: ScenarioKind,
  left: ShichenDiffProfile,
  right: ShichenDiffProfile,
  parsed: ParsedUserClue,
): { leanLeft?: boolean; leanRight?: boolean } {
  if (kind === 'birth_time' && parsed.effect.boostBranches?.length) {
    const boost = new Set(parsed.effect.boostBranches);
    const l = boost.has(left.branch);
    const r = boost.has(right.branch);
    if (l && !r) return { leanLeft: true };
    if (r && !l) return { leanRight: true };
  }
  if (kind === 'day_birth') {
    const daySet = new Set(['卯', '辰', '巳', '午', '未', '申']);
    const l = daySet.has(left.branch);
    const r = daySet.has(right.branch);
    if (l && !r) return { leanLeft: true };
    if (r && !l) return { leanRight: true };
  }
  if (kind === 'night_birth') {
    const nightSet = new Set(['酉', '戌', '亥', '子', '丑']);
    const l = nightSet.has(left.branch);
    const r = nightSet.has(right.branch);
    if (l && !r) return { leanLeft: true };
    if (r && !l) return { leanRight: true };
  }
  return {};
}

/** 参考图 + 侦探性格题库压成的默认可对照情境（左右须可辨认） */
function scenarioBankRows(
  left: ShichenDiffProfile,
  right: ShichenDiffProfile,
): ScenarioContrastRow[] {
  const stamp = (p: ShichenDiffProfile, text: string) =>
    `${text}（${p.branch}时 · ${p.hourPillar} · ${weatherHead(p)}）`;

  const pair = (
    topic: string,
    pick: (p: ShichenDiffProfile) => string,
  ): ScenarioContrastRow | null => {
    let L = pick(left);
    let R = pick(right);
    if (L === R) {
      L = stamp(left, L);
      R = stamp(right, R);
    }
    if (L === R) return null;
    return { topic, left: L, right: R };
  };

  const candidates: Array<ScenarioContrastRow | null> = [
    pair('吵完架后', afterQuarrel),
    pair('是否认错', apologyStyle),
    pair('吵架常因什么', quarrelContent),
    pair('婚礼/大事态度', weddingStyle),
    pair('压力下反应', underPressure),
    pair('受挫/输了之后', afterLoss),
    pair('顺风/赢了之后', afterWin),
    pair('熟人局怎么处', socialGathering),
    pair('家里什么角色', familyRole),
    pair('搬家换环境', moveStyle),
    pair('工作节点', jobChangeStyle),
    pair('健康/伤病意象', illnessStyle),
  ];

  if (left.vsDay.kind !== right.vsDay.kind) {
    candidates.push(
      pair('亲密关系拉锯', (p) =>
        p.vsDay.kind === '冲'
          ? '亲密里易有分合感、话不投机时硬碰硬'
          : p.vsDay.kind === '合'
            ? '关系里容易黏合、互相迁就'
            : p.vsDay.kind === '害'
              ? '关系敏感点多，一句语气就能炸'
              : '关系线无极端冲合，看大运',
      ),
    );
  }

  return candidates.filter((r): r is ScenarioContrastRow => r != null);
}

function normalizeClueKey(text: string): string {
  return text.trim().replace(/[\s/·，,。、]/g, '').toLowerCase();
}

function topicKey(topic: string): string {
  // 「搬家/换环境」与「搬家换环境」视为同一题
  return normalizeClueKey(topic);
}

function dedupeRows(rows: ScenarioContrastRow[]): ScenarioContrastRow[] {
  const seen = new Set<string>();
  const out: ScenarioContrastRow[] = [];
  for (const r of rows) {
    const key = [
      topicKey(r.topic),
      normalizeClueKey(r.clue ?? ''),
      normalizeClueKey(r.left),
      normalizeClueKey(r.right),
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function rowFromClue(
  raw: string,
  left: ShichenDiffProfile,
  right: ShichenDiffProfile,
): ScenarioContrastRow | null {
  const parsed = parseUserClue(raw);
  const kinds = classifyClue(raw, parsed);
  const primary = kinds[0] ?? 'generic';
  const leftText = scenarioOnBranch(primary, left, raw, parsed);
  const rightText = scenarioOnBranch(primary, right, raw, parsed);
  if (leftText === rightText && parsed.weak) return null;
  const lean = leanBranch(primary, left, right, parsed);
  return {
    topic: topicLabel(raw, kinds),
    clue: raw,
    left: leftText,
    right: rightText,
    ...lean,
  };
}

/**
 * 用户线索优先 + 情境题库补齐。
 * - 同一条补充只显示一次（去重）
 * - 有补充时不再「只剩出生时段」：后面仍接题库可对立场景
 */
export function buildScenarioContrastRows(
  userClues: string[],
  left: ShichenDiffProfile,
  right: ShichenDiffProfile,
): ScenarioContrastRow[] {
  const uniqClues: string[] = [];
  const seenClue = new Set<string>();
  for (const raw of userClues) {
    const t = raw.trim();
    if (!t) continue;
    const key = normalizeClueKey(t);
    if (seenClue.has(key)) continue;
    seenClue.add(key);
    uniqClues.push(t);
  }

  const fromUser = uniqClues
    .map((raw) => rowFromClue(raw, left, right))
    .filter((r): r is ScenarioContrastRow => r != null);

  const bank = scenarioBankRows(left, right);
  const userTopics = new Set(fromUser.map((r) => topicKey(r.topic)));
  const bankExtra = bank.filter((r) => !userTopics.has(topicKey(r.topic)));

  return dedupeRows([...fromUser, ...bankExtra]);
}
