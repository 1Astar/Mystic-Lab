import type { CastResult } from './engine.ts';
import type { Hexagram } from './hexagrams.ts';
import { upperLowerFromLines } from './hexagrams.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { composeScene, renderSceneXiangHtml } from './scene-map.ts';
import type { TrigramId } from './trigrams.ts';

export type DomainOracle = {
  label: string;
  /** 现代白话对照 */
  modern: string;
  /** 古籍风短断（放古籍原文区） */
  classic: string;
};

export type HexExpandPack = {
  primaryTitle: string;
  coreBai: string;
  /** 取象翻译：上下卦 → 工作/感情分行 */
  sceneHtml: string;
  /** 卦义 / 解释 / 特性 */
  meta: DomainOracle[];
  domains: DomainOracle[];
  changedImpact: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FIRE_IDS: TrigramId[] = ['离'];
const WATER_IDS: TrigramId[] = ['坎'];
const WOOD_IDS: TrigramId[] = ['震', '巽'];
const METAL_IDS: TrigramId[] = ['乾', '兑'];
const EARTH_IDS: TrigramId[] = ['坤', '艮'];

function toneFromKeywords(hex: Hexagram): 'rise' | 'hold' | 'hard' | 'turn' {
  const k = hex.keywords.join('');
  if (/困|险|阻滞|剥|闭塞|艰难|退避|讼|否|蹇|明夷/.test(k)) return 'hard';
  if (/通达|丰盛|晋升|上升|强盛|开创|畅通|拥有|担当|大有|泰/.test(k)) return 'rise';
  if (/归来|缓解|解开|变革|更新|重启|复|解|革/.test(k)) return 'turn';
  return 'hold';
}

function diseaseFromTrigrams(upper: TrigramId, lower: TrigramId): DomainOracle {
  const ids = [upper, lower];
  if (ids.some((id) => FIRE_IDS.includes(id))) {
    return {
      label: '疾病',
      modern: '火旺之象，易见心神不宁、目疾或炎症反复。宜清淡作息，切忌硬扛暴躁。',
      classic: '火旺当心神、目疾；宜静。',
    };
  }
  if (ids.some((id) => WATER_IDS.includes(id))) {
    return {
      label: '疾病',
      modern: '水象偏多，易见湿冷、睡眠不稳或肾系疲惫。宜规律作息，少熬夜。',
      classic: '水多主湿、惊、肾系；宜守常。',
    };
  }
  if (ids.some((id) => WOOD_IDS.includes(id))) {
    return {
      label: '疾病',
      modern: '木气发动，肝气、筋络与紧张感可能抬头。宜舒展疏气，勿久郁。',
      classic: '木动主肝胆筋络；宜疏。',
    };
  }
  if (ids.some((id) => METAL_IDS.includes(id))) {
    return {
      label: '疾病',
      modern: '金气偏重，呼吸道、皮肤或边界感议题更显眼。宜收敛保养。',
      classic: '金旺主肺系、皮毛；宜敛。',
    };
  }
  if (ids.some((id) => EARTH_IDS.includes(id))) {
    return {
      label: '疾病',
      modern: '土象主脾胃与承载。宜规律饮食、少思虑过度；旧疾或有反复之象。',
      classic: '土主脾胃；旧疾防复。',
    };
  }
  return {
    label: '疾病',
    modern: '先把睡眠与饮食稳住。身心节奏往往是卦象的第一道回声。',
    classic: '以安身为先。',
  };
}

type Tone = ReturnType<typeof toneFromKeywords>;

function pick(
  tone: Tone,
  rise: string,
  hard: string,
  turn: string,
  hold: string,
): string {
  if (tone === 'rise') return rise;
  if (tone === 'hard') return hard;
  if (tone === 'turn') return turn;
  return hold;
}

function buildMeta(hex: Hexagram, tone: Tone): DomainOracle[] {
  const kw = hex.keywords.slice(0, 3).join('、');
  return [
    {
      label: '卦义',
      modern: `「${hex.name}」主「${kw}」。${hex.gist}`,
      classic: `${hex.name}：${kw}。`,
    },
    {
      label: '解释',
      modern: pick(
        tone,
        '局面偏开，宜顺势推进，同时防满招损。',
        '局面偏紧，宜守、宜缓，先把边界与事实对齐。',
        '有回转、重启之象，旧局松动，适合小步试新。',
        '结构偏稳，宜积小成，忌无必要的大转向。',
      ),
      classic: pick(tone, '亨通可图', '阻滞宜守', '有复有转', '平稳渐进'),
    },
    {
      label: '特性',
      modern: pick(
        tone,
        '主动、外展、易被看见；适合当先锋，也要戒骄。',
        '谨慎、内收、重证据；宜作配角稳住，勿硬冲。',
        '善回看、能改道；适合复盘后重启。',
        '耐心、承载、重节奏；稳中求进。',
      ),
      classic: pick(tone, '刚健外展', '慎守为先', '能复能改', '厚载渐进'),
    },
  ];
}

/** 多领域分域：运势 / 家运 / 疾病 / 婚恋 / 财事 / 人事… */
function buildDomains(
  hex: Hexagram,
  upper: TrigramId,
  lower: TrigramId,
): DomainOracle[] {
  const tone = toneFromKeywords(hex);
  const kw = hex.keywords.slice(0, 2).join('、');

  const fortune: DomainOracle = {
    label: '运势',
    modern: pick(
      tone,
      `整体偏开（${kw}）。春夏更利推进；秋冬宜守成复盘。`,
      `整体偏紧（${kw}）。宜少动多观察，等窗口再推。`,
      `运势有回转（${kw}）。适合重启与修复，忌一次梭哈。`,
      `运势以稳为主（${kw}）。按部就班，积小成大。`,
    ),
    classic: pick(tone, '运开可进', '运滞宜守', '运有复机', '运平宜稳'),
  };

  const family: DomainOracle = {
    label: '家运',
    modern: pick(
      tone,
      '家庭气场偏和，适合协商与共担；也防因顺利而疏忽沟通。',
      '家中易有磨合或意见不合，先降温对齐事实，再谈决定。',
      '家运有缓和、重聚之象，适合把旧怨说开、重定边界。',
      '家运平稳，宜维系日常节奏，勿轻易掀桌。',
    ),
    classic: pick(tone, '家运渐亨', '家有龃龉', '家运可复', '家运平顺'),
  };

  const love: DomainOracle = {
    label: '感情',
    modern: pick(
      tone,
      '热度与条件较匹配，关系偏热烈稳定；好过了头也易碰触，宜多包容。',
      '内外期待有落差，易见冷淡、拉扯。先对齐边界，再谈升温。',
      '关系有回暖、重谈之机，适合一次真诚对话验证。',
      '宜渐进沟通，把没说清的话说清，勿制造戏剧转折。',
    ),
    classic: pick(tone, '情热而稳', '情路不顺', '情可复温', '情宜缓语'),
  };

  const marriage: DomainOracle = {
    label: '婚恋',
    modern: pick(
      tone,
      '谈婚论嫁窗口较明，男测偏利；女测宜看官鬼是否得位，忌仓促定终身。',
      '婚事易生波折或拖延，宜缓议、先对齐现实条件。',
      '旧缘有回转可能，新缘宜小步确认，勿一口答应。',
      '婚恋宜循序，适合先稳关系再谈名分。',
    ),
    classic: pick(tone, '婚事可成', '婚事阻滞', '旧缘可复', '婚宜渐进'),
  };

  const pregnancy: DomainOracle = {
    label: '胎孕',
    modern: pick(
      tone,
      '有喜之象偏明，仍需规律检查与休息，勿过度劳累。',
      '求嗣或孕程易有惊吓、反复，宜静养、少奔波。',
      '有转机与希望，仍以稳养为先，忌急躁求验。',
      '以保养与等待为主，勿过度焦虑检测结果。',
    ),
    classic: pick(tone, '孕象偏吉', '孕防惊扰', '孕有转机', '孕宜静养'),
  };

  const children: DomainOracle = {
    label: '子女',
    modern: pick(
      tone,
      '子女运偏开，学业或成长易见进步；宜鼓励自主，少高压。',
      '亲子易有顶牛或沟通不畅，先听再说，忌硬压。',
      '关系可修复，适合把话说开、重定规则。',
      '子女运平稳，重日常陪伴与节奏。',
    ),
    classic: pick(tone, '子女运开', '子女有拗', '可复可调', '子女平顺'),
  };

  const cashflow: DomainOracle = {
    label: '周转',
    modern: pick(
      tone,
      '周转较顺，借款或回款窗口偏明；仍要写清条件，防口头空诺。',
      '周转偏紧，求人易拖。宜备预案，勿押单一来源。',
      '旧账或回款有松动，适合再谈一轮，忌硬逼。',
      '周转以稳为主，小额可试，大额宜缓。',
    ),
    classic: pick(tone, '周转可成', '周转迟滞', '旧款可复', '周转宜缓'),
  };

  const trade: DomainOracle = {
    label: '买卖',
    modern: pick(
      tone,
      '买卖偏利，宜速决但核对条款；防因顺利而疏忽细节。',
      '买卖易生口舌或拖延，宜缓、宜书面确认。',
      '谈不拢的旧单或可重开，适合改条件再谈。',
      '买卖宜小步试单，忌一次重仓。',
    ),
    classic: pick(tone, '买卖可成', '买卖有争', '可复议价', '买卖宜稳'),
  };

  const career: DomainOracle = {
    label: '事业',
    modern: pick(
      tone,
      `运势偏上升（${kw}）。多能遇见提携或被看见；脚踏实地、戒骄。`,
      `局面偏紧（${kw}）。宜守边界与证据，减无效消耗，再等窗口。`,
      `转机露头（${kw}）。旧法可能失效，适合小步试新路径。`,
      `结构偏稳（${kw}）。把节奏与职责对齐，积小成，忌大转向。`,
    ),
    classic: pick(tone, '事业渐开', '事业宜守', '事业有转', '事业稳进'),
  };

  const jobSeek: DomainOracle = {
    label: '求事',
    modern: pick(
      tone,
      '求职、求项目较易有回音；准备证据与作品，比空谈态度更关键。',
      '求事多阻或拖延，宜广撒网、少死磕一处。',
      '旧机会或可重启，适合再跟一轮。',
      '求事宜稳扎稳打，一次只推进一个可验证动作。',
    ),
    classic: pick(tone, '求事可成', '求事迟滞', '旧事可复', '求事宜稳'),
  };

  const careerChange: DomainOracle = {
    label: '改行',
    modern: pick(
      tone,
      '改行窗口偏开，仍需试跑再全押，防一步踏空。',
      '改行阻力大，宜先副业试水，勿骤断旧路。',
      '有转向之机，适合小范围试点后再扩。',
      '改行宜缓议，先把现职边界守稳。',
    ),
    classic: pick(tone, '改行可图', '改行不宜', '改行可试', '改行宜缓'),
  };

  const openShop: DomainOracle = {
    label: '开业',
    modern: pick(
      tone,
      '开业偏利，选址与合规先做清，再放量。',
      '开业易遇阻或手续拖延，宜缓、宜备足现金流。',
      '可重开或调整业态后再启，忌原样硬冲。',
      '开业宜小规模试运营，验证再扩。',
    ),
    classic: pick(tone, '开业可成', '开业阻滞', '可复再开', '开业宜试'),
  };

  const exam: DomainOracle = {
    label: '考试',
    modern: pick(
      tone,
      '考试运偏开，成绩有上扬之象；仍靠复习密度，勿裸考赌运气。',
      '考试易紧张或发挥不稳，宜保基础题、减冒险。',
      '复读/补考有转机，适合调整方法再战。',
      '考试以稳为主，把能拿的分拿满。',
    ),
    classic: pick(tone, '考运渐升', '考防失常', '复考可图', '考宜求稳'),
  };

  const lawsuit: DomainOracle = {
    label: '诉讼',
    modern: pick(
      tone,
      '理据较明时偏有利，仍宜和解优先，留证据。',
      '诉讼缠讼、拖延之象，宜调解，忌意气硬刚。',
      '旧案或可重议，适合再谈一轮和解。',
      '诉讼宜缓，先把事实与文书对齐。',
    ),
    classic: pick(tone, '讼有理可争', '讼宜和解', '旧讼可复议', '讼宜缓图'),
  };

  const waitPerson: DomainOracle = {
    label: '等人',
    modern: pick(
      tone,
      '所等之人多能到，或消息会来；可主动确认时间点。',
      '等人易迟到、爽约或音讯稀，宜备预案。',
      '久无音讯者或有回音，适合再联系一次。',
      '等人以稳等为主，设截止时间，勿无限空耗。',
    ),
    classic: pick(tone, '人可至', '人多迟', '人可复来', '人宜候'),
  };

  const findPerson: DomainOracle = {
    label: '寻人',
    modern: pick(
      tone,
      '寻人较易有线索，近处或熟人圈优先问。',
      '寻人费力，线索易断，宜广布眼线、勿单点死磕。',
      '失踪或失联者有回转可能，持续跟进有效。',
      '寻人宜稳查，从最近联系人与常去处入手。',
    ),
    classic: pick(tone, '人可寻', '寻人费力', '人可复见', '寻宜近查'),
  };

  const lost: DomainOracle = {
    label: '失物',
    modern: pick(
      tone,
      '失物偏能找回，多在常放处或近处；尽快回溯路径。',
      '失物难归或已转移，宜报备止损，勿空耗。',
      '旧失之物或有音讯，适合再找一轮。',
      '失物先查近处与近期动线，再扩范围。',
    ),
    classic: pick(tone, '物可复得', '物难复', '物或可复', '物宜近寻'),
  };

  const travel: DomainOracle = {
    label: '外出',
    modern: pick(
      tone,
      '外出偏利，行程可推进；仍注意交通与证件细节。',
      '外出易阻滞或变故，宜缓行、备预案。',
      '可改期再出，或出行目的宜调整后更顺。',
      '外出宜常规路线，少临时加戏。',
    ),
    classic: pick(tone, '出行有利', '出行阻滞', '可复再出', '出行宜稳'),
  };

  return [
    fortune,
    family,
    diseaseFromTrigrams(upper, lower),
    love,
    marriage,
    pregnancy,
    children,
    cashflow,
    trade,
    career,
    jobSeek,
    careerChange,
    openShop,
    exam,
    lawsuit,
    waitPerson,
    findPerson,
    lost,
    travel,
  ];
}

function buildCoreBai(
  hex: Hexagram,
  upperId: string,
  lowerId: string,
  upperNature: string,
  lowerNature: string,
): string {
  const corpus = getClassicCorpus(hex.name);
  const judgment = corpus?.judgment?.trim();
  const judgmentBit = judgment
    ? `古辞说：「${hex.name}，${judgment.slice(0, 28)}${judgment.length > 28 ? '…' : ''}」。`
    : `主题落在「${hex.keywords.join('、')}」。`;
  return `「${upperNature}在上、${lowerNature}在下」（上${upperId}下${lowerId}）。${judgmentBit}意思是：${hex.gist}无论你问什么，先认清这是怎样的场，再顺势做一小步，往往比硬扛更有效。`;
}

function buildChangedImpact(primary: Hexagram, changed: Hexagram): string {
  return `本卦给你的主调是「${primary.keywords.slice(0, 2).join('、')}」（${primary.fullName}），变卦提醒你：事情可能滑向「${changed.keywords.slice(0, 2).join('、')}」（${changed.fullName}）。${changed.gist}——变卦是方向感，不是一口吃成胖子的判决；先按变卦做可验证的一小步。`;
}

/** 本卦释义 + 多领域分域 + 变卦影响（笔记拓展） */
export function buildHexExpandPack(cast: CastResult): HexExpandPack {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const primary = cast.primary;
  const scene = composeScene(upper, lower, primary);
  const tone = toneFromKeywords(primary);

  return {
    primaryTitle: `本卦【${primary.fullName}】`,
    coreBai: buildCoreBai(primary, upper.id, lower.id, upper.nature, lower.nature),
    meta: buildMeta(primary, tone),
    domains: buildDomains(primary, upper.id, lower.id),
    changedImpact: cast.changed ? buildChangedImpact(primary, cast.changed) : null,
    sceneHtml: renderSceneXiangHtml(scene, { domain: 'general', showFormula: false }),
  };
}

function renderDomainRows(items: DomainOracle[]): string {
  return items
    .map(
      (d) => `
      <div class="ly-hex-expand-domain">
        <p class="ly-hex-expand-domain-line">
          <strong class="ly-hex-expand-domain-label">${escapeHtml(d.label)}：</strong>
          <span class="ly-hex-expand-domain-body">${escapeHtml(d.modern)}</span>
        </p>
      </div>`,
    )
    .join('');
}

function renderDomainChipTabs(items: DomainOracle[]): string {
  if (!items.length) return '';
  const tabs = items
    .map(
      (d, i) =>
        `<button type="button" class="ly-note-mini-tab${i === 0 ? ' is-active' : ''}" data-expand-domain="${i}" role="tab" aria-selected="${i === 0}">${escapeHtml(d.label)}</button>`,
    )
    .join('');
  const panes = items
    .map(
      (d, i) => `
      <div class="ly-hex-expand-domain-pane${i === 0 ? ' is-active' : ''}" data-expand-domain-pane="${i}" ${i === 0 ? '' : 'hidden'}>
        <p class="ly-hex-expand-domain-body">${escapeHtml(d.modern)}</p>
      </div>`,
    )
    .join('');
  return `
    <div class="ly-hex-expand-domains" data-expand-domains>
      <div class="ly-note-mini-tabs" role="tablist" aria-label="分域解说">${tabs}</div>
      ${panes}
    </div>
  `;
}

export function renderHexExpandHtml(pack: HexExpandPack): string {
  const changedBody = pack.changedImpact
    ? `<p class="ly-hex-expand-body">${escapeHtml(pack.changedImpact)}</p>`
    : `<p class="ly-guide-tip">无动则无变：时间轴停在本卦，先把当下结构看清。</p>`;

  return `
    <article class="ly-hex-expand" data-hex-expand>
      <h4 class="ly-hex-expand-title">📜 · ${escapeHtml(pack.primaryTitle)}</h4>
      <div class="ly-note-mini-tabs" role="tablist" aria-label="本卦拓展">
        <button type="button" class="ly-note-mini-tab is-active" data-expand-tab="core" role="tab" aria-selected="true">卦象核心释义</button>
        <button type="button" class="ly-note-mini-tab" data-expand-tab="domains" role="tab" aria-selected="false">分域解说</button>
        <button type="button" class="ly-note-mini-tab" data-expand-tab="changed" role="tab" aria-selected="false">变卦</button>
      </div>
      <div class="ly-hex-expand-pane is-active" data-expand-pane="core">
        <section class="ly-hex-expand-sec">
          <p class="ly-hex-expand-body">${escapeHtml(pack.coreBai)}</p>
          ${pack.sceneHtml}
          <div class="ly-hex-expand-meta">${renderDomainRows(pack.meta)}</div>
        </section>
      </div>
      <div class="ly-hex-expand-pane" data-expand-pane="domains" hidden>
        <section class="ly-hex-expand-sec">
          <p class="ly-guide-tip">按所问点选领域；断语仅供参考。</p>
          ${renderDomainChipTabs(pack.domains)}
        </section>
      </div>
      <div class="ly-hex-expand-pane" data-expand-pane="changed" hidden>
        <section class="ly-hex-expand-sec">${changedBody}</section>
      </div>
    </article>
  `;
}

/** 古籍区：传统分类短断 */
export function renderClassicDomainOraclesHtml(pack: HexExpandPack): string {
  const metaTabs = pack.meta
    .map(
      (d, i) =>
        `<button type="button" class="ly-note-mini-tab${i === 0 ? ' is-active' : ''}" data-oracle-tab="m${i}" role="tab" aria-selected="${i === 0}">${escapeHtml(d.label)}</button>`,
    )
    .join('');
  const domainTabs = pack.domains
    .map(
      (d, i) =>
        `<button type="button" class="ly-note-mini-tab" data-oracle-tab="d${i}" role="tab" aria-selected="false">${escapeHtml(d.label)}</button>`,
    )
    .join('');
  const metaPanes = pack.meta
    .map(
      (d, i) =>
        `<div class="ly-classic-oracle-pane${i === 0 ? ' is-active' : ''}" data-oracle-pane="m${i}" ${i === 0 ? '' : 'hidden'}><p><strong>${escapeHtml(d.label)}</strong>：${escapeHtml(d.classic)}</p></div>`,
    )
    .join('');
  const domainPanes = pack.domains
    .map(
      (d, i) =>
        `<div class="ly-classic-oracle-pane" data-oracle-pane="d${i}" hidden><p><strong>${escapeHtml(d.label)}</strong>：${escapeHtml(d.classic)}</p></div>`,
    )
    .join('');

  return `
    <div class="ly-classic-oracles" data-classic-oracles>
      <p class="ly-layer-guide">传统断语（教学整理 · 仅供对照）</p>
      <div class="ly-note-mini-tabs" role="tablist" aria-label="传统断语">${metaTabs}${domainTabs}</div>
      ${metaPanes}
      ${domainPanes}
      <p class="ly-guide-tip">断语仅供参考，吉凶请结合具体所测人事与动变细断。</p>
    </div>
  `;
}
