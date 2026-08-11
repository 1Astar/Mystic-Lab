/**
 * 神煞「他派差异」文案（只改图鉴，不改排盘计算表）
 */
export type ShenshaSchoolDiff = {
  /** 本产品采用的查法 */
  productMethod: string;
  /** 他派常见差异（2～4 条） */
  otherSchools: string[];
  /** 学习对照提醒 */
  note: string;
};

export const SCHOOL_DIFF_NOTE =
  '学习对照，不断语；排盘落柱以本产品计算表为准，神煞仍须合日主、格局、十神与大运。';

/** 精品 / MORE 手写差异；其余走 defaultSchoolDiff */
export const SHENSHA_SCHOOL_DIFF: Record<string, ShenshaSchoolDiff> = {
  天乙贵人: {
    productMethod: '本产品：按日干取贵人支（甲戊庚丑未、乙己子申等，与排盘 TIAN_YI 一致）。',
    otherSchools: [
      '子平通行亦多日干查；部分命书并列「年干贵人」或年日双查。',
      '有派只取一处贵人，两支并见时择一；本产品两支皆可标注。',
      '流年「见贵」：有派只认原局坐定，有派认岁运地支触发。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  文昌: {
    productMethod: '本产品：按日干取文昌支（如甲巳、乙午），落柱以排盘为准。',
    otherSchools: [
      '有派按年干取文昌，或年日各起一处。',
      '「文昌」与「词馆/学堂」在部分门派分表，名同实近；本产品分列计算。',
      '是否利考试：流派断语差异大，本产品只标文书/学习气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  禄神: {
    productMethod: '本产品：日干禄位（甲禄寅、乙禄卯等），见支则标禄神。',
    otherSchools: [
      '有派强调「临官禄」与「建禄格」绑定，不单见支即论禄。',
      '少数门派兼查年干禄，或论坐支通根才算得禄。',
      '禄是否「铁饭碗」属断语分歧；本产品只标根基气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  羊刃: {
    productMethod: '本产品：日干羊刃支（甲卯、乙寅等阳干为主表），见支则标。',
    otherSchools: [
      '阴干是否论刃、论「己劫」等，各派不一；本产品按通行阳刃表。',
      '有派重「刃用官杀」成格，不见刃即不论；本产品先标注再合格局。',
      '吉凶断语两极；本产品标刚烈气场，不作暴力判决。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  华盖: {
    productMethod: '本产品：年支、日支分别入三合局取华盖，双起可并见。',
    otherSchools: [
      '有派只按年支起华盖，或以日支为主。',
      '华盖与「孤克」「艺术星」在部分书中混称；查法锚点不同。',
      '是否主出家/孤独：断语流派差大；本产品标精神独处气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  驿马: {
    productMethod: '本产品：年支、日支入三合局取驿马，双起可并见。',
    otherSchools: [
      '有派只查年马或只查日马；流年马是否「动」各派口径不同。',
      '「天马」「四生驿马」等别名在部分门派另表；本产品另有别名映射。',
      '奔波断语宜合十神大运；本产品只标变动气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  桃花: {
    productMethod: '本产品：年支、日支入三合局取桃花（与咸池同支），双起可并见。',
    otherSchools: [
      '咸池与桃花有派同星异名，有派分用；本产品同支双标。',
      '有派只认年支桃花，或以「墙内/墙外」另断。',
      '情感吉凶断语极分派；本产品标人缘气场，不作出轨判决。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  将星: {
    productMethod: '本产品：年支、日支入三合局取将星，双起可并见。',
    otherSchools: [
      '有派将星只从年支，或改从月支。',
      '「权星」等别名有派另起；本产品以将星为主名。',
      '官贵断语须合官杀印比；本产品标扛事气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  红鸾: {
    productMethod: '本产品：按年支取红鸾对照支，落柱标注。',
    otherSchools: [
      '有派兼查日支红鸾，或流年逢红鸾才论婚恋窗口。',
      '红鸾与天喜对宫关系各派表述略异，表序大体通行。',
      '婚书式断语属流派发挥；本产品标喜庆窗口。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  天喜: {
    productMethod: '本产品：按年支取天喜（多与红鸾对冲），落柱标注。',
    otherSchools: [
      '有派强调「红鸾天喜同见」才论喜，单见从轻。',
      '流年天喜与原局天喜，是否同效，各派不一。',
      '本产品标欢喜气场，不作终身好运符。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  孤辰寡宿: {
    productMethod: '本产品：按年支取孤辰/寡宿对照支，合并标「孤辰寡宿」。',
    otherSchools: [
      '有派分标孤辰与寡宿，并按性别选用；本产品合并议题窗口。',
      '有派从日支再起一套孤寡。',
      '六亲孤独断语宜慎；本产品标独处气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  劫煞: {
    productMethod: '本产品：年支、日支入三合局取劫煞，双起可并见。',
    otherSchools: [
      '灾煞、劫煞、亡神在三合「前一/后一」表序，少数书前后对调。',
      '有派只查年支劫煞。',
      '灾难式断语属恐吓口径；本产品标突发提醒。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  天德: {
    productMethod: '本产品：按月支取天德（可为干或支），本柱干/支合则标。',
    otherSchools: [
      '天德合、月德合有派单列；本产品另有合星计算。',
      '有派论「天德贵人」须合日主喜用才吉。',
      '免灾保票式断语不取；本产品标化解气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  月德: {
    productMethod: '本产品：按月支取月德天干，本柱天干合则标。',
    otherSchools: [
      '月德与天德有派并称德秀，起法仍分月支表。',
      '有派要求透干得地才论德。',
      '本产品标柔护气场，不作人际保票。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  福星: {
    productMethod: '本产品：按日干取福星支表，见支则标。',
    otherSchools: [
      '福星表在民间抄本中略有出入；以本产品排盘表为准。',
      '有派按年干起福星。',
      '横财式断语不取；本产品标托底气场。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  咸池: {
    productMethod: '本产品：与桃花同支（年/日三合取），双标咸池与桃花。',
    otherSchools: [
      '有派咸池专用于沐浴位或另表，不与桃花等同。',
      '墙内桃花/咸池等细断属流派发挥。',
      '本产品标情感磁场，与桃花同见时对照阅读。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  金舆: {
    productMethod: '本产品：按日干取金舆支，见支则标。',
    otherSchools: [
      '金舆与禄、驿马同见时的「车马」断语，各派轻重不同。',
      '有派按年干起金舆。',
      '本产品标仪仗气场，不作豪车判决。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  天厨: {
    productMethod: '本产品：按日干取天厨支，见支则标。',
    otherSchools: [
      '天厨与食神、禄库关系，有派强调成格才论「天厨食神」。',
      '表序偶有抄本差异；以排盘为准。',
      '本产品标食禄气场，不作职业指定。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  灾煞: {
    productMethod: '本产品：年支、日支入三合局取灾煞，双起可并见。',
    otherSchools: [
      '与劫煞/亡神的相对位置，少数文献顺序不同。',
      '有派只查年支。',
      '本产品标关口提醒，不作灾祸判决。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  亡神: {
    productMethod: '本产品：年支、日支入三合局取亡神，双起可并见。',
    otherSchools: [
      '亡神与劫煞在部分书中象义对调或合并论述。',
      '有派重「亡神入墓」等细盘，本产品先标注议题。',
      '本产品标耗散提醒，不作败局宣判。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  白虎: {
    productMethod: '本产品：按年支十二神偏移取白虎（+8），见支则标。',
    otherSchools: [
      '流年十二神（青龙…白虎）有派从月建或日支起，不全从年支。',
      '白虎与「挂剑」等别名映射因派而异。',
      '本产品标锐气/血光提醒类窗口，忌恐吓重断。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  吊客: {
    productMethod: '本产品：按年支十二神偏移取吊客（-2），见支则标。',
    otherSchools: [
      '十二神起法锚点（年/月）各派不一。',
      '丧吊类星有派合并丧门吊客论述。',
      '本产品标忧思/吊慰议题，不作凶死判决。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  天哭: {
    productMethod: '本产品：按年支偏移取天哭（+6），见支则标。',
    otherSchools: [
      '天哭天虚有派归入其它神煞体系或不用。',
      '起法有从日支者。',
      '本产品标情志波动提醒，忌恐吓。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  天虚: {
    productMethod: '本产品：按年支偏移取天虚（+7），见支则标。',
    otherSchools: [
      '与天哭常成对出现；有派只用其一或不用。',
      '起法锚点见天哭条。',
      '本产品标空虚耗神提醒。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
  破碎: {
    productMethod: '本产品：按年支取破碎对照支，见支则标。',
    otherSchools: [
      '破碎表在抄本中较少统一；以本产品排盘为准。',
      '有派不论破碎，或并入其它凶煞。',
      '本产品标破耗提醒，不作碎家判决。',
    ],
    note: SCHOOL_DIFF_NOTE,
  },
};

/** 无手写时：按查法标签生成通行「本产品 + 他派」模板 */
export function defaultSchoolDiff(opts: {
  name: string;
  lookupLabel: string;
}): ShenshaSchoolDiff {
  const label = opts.lookupLabel || '通行查表';
  const productMethod = `本产品：${label}。落柱以排盘标注为准。`;
  const otherSchools: string[] = [];
  if (/日干/.test(label)) {
    otherSchools.push('他派常见：按年干取同名表，或年日双查后择一。');
    otherSchools.push('少数门派只认原局坐定，不论流年大运触发。');
  } else if (/三合|年\/日|年支、日支|年支\+日支|年日/.test(label)) {
    otherSchools.push('他派常见：只按年支起局，或只按日支起局，不作双起。');
    otherSchools.push('三合「前一后一」表序在少数文献中与通行对调。');
  } else if (/年支/.test(label)) {
    otherSchools.push('他派常见：兼查日支，或改从月支/时支起。');
    otherSchools.push('流年是否「再触发」各派口径不同。');
  } else if (/月支|月令/.test(label)) {
    otherSchools.push('他派常见：按日干或年干另表，不专依月令。');
    otherSchools.push('德秀类有派要求透干得地才论。');
  } else if (/图鉴索引|精查法/.test(label)) {
    otherSchools.push('此星以排盘计算规则为准；图鉴为查法索引级说明。');
    otherSchools.push('他派在起法锚点或是否采用本星上常有出入。');
  } else {
    otherSchools.push('他派在起法锚点（年/月/日干支）或是否双查上常有出入。');
    otherSchools.push('名同实异时，以本产品查法标签与排盘结果为准。');
  }
  otherSchools.push('吉凶断语流派差异更大；本产品只作议题窗口，不作单独判决。');
  return { productMethod, otherSchools, note: SCHOOL_DIFF_NOTE };
}

export function resolveSchoolDiff(
  name: string,
  lookupLabel: string,
): ShenshaSchoolDiff {
  return SHENSHA_SCHOOL_DIFF[name] ?? defaultSchoolDiff({ name, lookupLabel });
}

export function isSchoolDiffReady(d: ShenshaSchoolDiff | null | undefined): boolean {
  if (!d) return false;
  if (!d.productMethod?.trim()) return false;
  if (!d.otherSchools?.length) return false;
  if (!d.note?.trim()) return false;
  return true;
}
