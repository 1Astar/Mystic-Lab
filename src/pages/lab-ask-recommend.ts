/** 首页占学之旅：按问题推荐体系，并给出可选话术 */

export type LabSystemKey =
  | 'tarot'
  | 'liuyao'
  | 'xiaoliuren'
  | 'meihua'
  | 'bazi'
  | 'life';

export type LabAskScene =
  | 'relation'
  | 'matter-offer'
  | 'matter-quick'
  | 'chart'
  | 'life'
  | 'mixed'
  | 'default';

export interface LabAskOption {
  key: LabSystemKey;
  path: string;
  title: string;
  /** 括号里的短定位，如「心理投射」 */
  lens: string;
}

export interface LabAskAdvice {
  scene: LabAskScene;
  /** 完整推荐句 */
  message: string;
  options: LabAskOption[];
}

const CATALOG: Record<LabSystemKey, Omit<LabAskOption, 'lens'> & { lens: string }> =
  {
    tarot: {
      key: 'tarot',
      path: '/tarot',
      title: '塔罗',
      lens: '心理投射',
    },
    liuyao: {
      key: 'liuyao',
      path: '/liuyao/reading',
      title: '六爻',
      lens: '具体事件细节',
    },
    xiaoliuren: {
      key: 'xiaoliuren',
      path: '/xiaoliuren/reading',
      title: '小六壬',
      lens: '即时吉凶',
    },
    meihua: {
      key: 'meihua',
      path: '/meihua',
      title: '梅花易数',
      lens: '关系气场',
    },
    bazi: {
      key: 'bazi',
      path: '/bazi',
      title: '八字',
      lens: '命盘结构',
    },
    life: {
      key: 'life',
      path: '/life',
      title: '人生宇宙',
      lens: '平行推演',
    },
  };

const RELATION =
  /对象|对方|感觉|感情|恋爱|喜欢|合不合|关系|缘分|他|她|暧昧|分手|复合/;
const OFFER =
  /offer|Offer|OFFER|面试|录用|发offer|拿offer|入职|谈薪|加薪|升职|官司|求财|成交/;
const QUICK = /出门|约会|今天|明天|下周|临时|马上|现在/;
const CHART = /八字|命盘|日主|十神|出生|紫微/;
const LIFE = /平行|五年|推演|分叉|人生宇宙/;

function pick(keys: LabSystemKey[], lensOverride?: Partial<Record<LabSystemKey, string>>): LabAskOption[] {
  return keys.map((key) => {
    const base = CATALOG[key];
    return {
      ...base,
      lens: lensOverride?.[key] ?? base.lens,
    };
  });
}

function formatPair(a: LabAskOption, b: LabAskOption, askWhich: boolean): string {
  const left = `【${a.title}】（${a.lens}）`;
  const right = `【${b.title}】（${b.lens}）`;
  const base = `建议你用${left}或${right}来测`;
  return askWhich ? `${base}，你想用哪个？` : `${base}。`;
}

function classifyScene(q: string): LabAskScene {
  if (CHART.test(q)) return 'chart';
  if (LIFE.test(q)) return 'life';
  if (RELATION.test(q)) return 'relation';
  if (OFFER.test(q)) return 'matter-offer';
  if (QUICK.test(q)) return 'matter-quick';
  if (/这事|这件事|工作|项目|去留|成不成|要不要/.test(q)) return 'mixed';
  return 'default';
}

/** 根据自然语言问题给出推荐话术 + 可选工具（也可上方自由选） */
export function adviseSystemsForQuestion(question: string): LabAskAdvice {
  const q = question.trim();
  if (!q) {
    const options = pick(['tarot', 'meihua'], {
      meihua: '象与气机',
    });
    return {
      scene: 'default',
      message: formatPair(options[0]!, options[1]!, true),
      options,
    };
  }

  const scene = classifyScene(q);

  if (scene === 'relation') {
    const options = pick(['tarot', 'meihua'], {
      tarot: '心理投射',
      meihua: '关系气场',
    });
    return {
      scene,
      message: formatPair(options[0]!, options[1]!, true),
      options,
    };
  }

  if (scene === 'matter-offer') {
    const options = pick(['liuyao', 'xiaoliuren'], {
      liuyao: '具体事件细节',
      xiaoliuren: '即时吉凶',
    });
    return {
      scene,
      message: formatPair(options[0]!, options[1]!, false),
      options,
    };
  }

  if (scene === 'matter-quick') {
    const options = pick(['xiaoliuren', 'liuyao'], {
      xiaoliuren: '即时吉凶',
      liuyao: '具体事件细节',
    });
    return {
      scene,
      message: formatPair(options[0]!, options[1]!, true),
      options,
    };
  }

  if (scene === 'chart') {
    const options = pick(['bazi', 'life']);
    return {
      scene,
      message: formatPair(options[0]!, options[1]!, true),
      options,
    };
  }

  if (scene === 'life') {
    const options = pick(['life', 'tarot']);
    return {
      scene,
      message: formatPair(options[0]!, options[1]!, true),
      options,
    };
  }

  if (scene === 'mixed') {
    const options = pick(['liuyao', 'tarot'], {
      liuyao: '具体事件细节',
      tarot: '局势画面',
    });
    return {
      scene,
      message: formatPair(options[0]!, options[1]!, true),
      options,
    };
  }

  const options = pick(['tarot', 'liuyao'], {
    tarot: '心理投射',
    liuyao: '具体事件细节',
  });
  return {
    scene: 'default',
    message: `${formatPair(options[0]!, options[1]!, true)} 也可以点上方入口自由选。`,
    options,
  };
}

/** @deprecated 兼容旧调用；请用 adviseSystemsForQuestion */
export function recommendSystemsForQuestion(question: string): LabAskOption[] {
  return adviseSystemsForQuestion(question).options;
}

export const LAB_ASK_PLACEHOLDERS = [
  '我想测算……',
  '我今天有个困惑……',
  '这件事该怎么走……',
  '我和他/她……',
] as const;
